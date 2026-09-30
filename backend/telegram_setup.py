"""Узнать chat_id нового бота после отправки ему /start."""
from pathlib import Path
from dotenv import load_dotenv
import os,requests
load_dotenv(Path(__file__).parent/'.env')
token=os.getenv('TELEGRAM_BOT_TOKEN')
if not token:raise SystemExit('Сначала добавьте TELEGRAM_BOT_TOKEN в .env.')
try:
    r=requests.get(f'https://api.telegram.org/bot{token}/getUpdates',timeout=20)
    data=r.json()
    if not data.get('ok'):raise ValueError()
    chats={}
    for update in data['result']:
        chat=update.get('message',{}).get('chat',{})
        if chat:chats[chat['id']]=chat.get('title') or chat.get('first_name','')
    if not chats:print('Напишите боту /start, затем повторите команду. Для бота с webhook этот скрипт не подходит.')
    for cid,title in chats.items():print(f'{title}: TELEGRAM_CHAT_ID={cid}')
except Exception:print('Не удалось запросить Telegram. Проверьте токен, интернет и отсутствие webhook. Токен не выводится в сообщении об ошибке.')
