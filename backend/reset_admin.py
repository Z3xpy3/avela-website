"""Задать свой логин и пароль: python reset_admin.py"""
from getpass import getpass
from werkzeug.security import generate_password_hash
from app import db, DATA
name=input('Логин администратора: ').strip()
password=getpass('Новый пароль (не менее 12 символов): ')
confirm=getpass('Повторите пароль: ')
if not name or len(name)>100 or len(password)<12 or password!=confirm:
    raise SystemExit('Проверьте логин, длину и совпадение паролей.')
with db() as c: c.execute('UPDATE admin SET username=?,password=? WHERE id=1',(name,generate_password_hash(password)))
# Новый ключ завершает ранее открытые сессии после перезапуска сервера.
import secrets
(DATA/'session.key').write_text(secrets.token_hex(48),encoding='utf-8')
(DATA/'first-login.txt').unlink(missing_ok=True)
print('Пароль изменён. Перезапустите app.py. Старые сессии завершатся.')
