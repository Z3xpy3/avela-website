// Секреты отсутствуют в JavaScript. Доступ проверяет сервер по HttpOnly-cookie.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s).toLocaleString('ru-RU',{timeZone:'Europe/Moscow'});
let csrf='';
async function api(path,options={}){
  const response=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,...options.headers}});
  const data=await response.json();
  if(response.status===401){$('#dashboard').hidden=true;$('#login').hidden=false;}
  if(!response.ok)throw Error(data.error||'Не удалось выполнить запрос.');return data;
}
function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="no-data">Данных пока нет.</p>';}
const counts=r=>[r.visits,r.unique,r.leads,r.conversion+'%'];
async function refresh(){
  $('#admin-status').textContent='Загрузка…';
  try{
    const [data,leads]=await Promise.all([api('admin/analytics?period='+$('#period').value),api('admin/leads')]);
    $('#stats').innerHTML=Object.entries({visits:'Посещения',unique:'Уникальные посетители',leads:'Заявки',conversion:'Конверсия',phone:'Клики по телефону',email:'Клики по email',cta:'CTA-клики',pageviews:'Просмотры'}).map(([key,label])=>`<div class="stat"><span>${label}</span><strong>${data.summary[key]}${key==='conversion'?'%':''}</strong></div>`).join('');
    $('#telegram-status').textContent=data.telegram_configured?'Telegram настроен. Статусы доставки показаны в заявках.':'Telegram не подключён: добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env и перезапустите сервер. Заявки сохранены и ожидают отправки.';
    const tg={sent:'Доставлено',pending:'В очереди',retry:'Ожидает повторной отправки'};
    $('#leads-table').innerHTML=table(['№ / дата','Клиент','Регион / услуги','Источник','Детали / файлы','Telegram'],leads.map(l=>[
      esc(l.id)+'<br>'+esc(date(l.created)),`<strong>${esc(l.name)}</strong><br>${esc(l.phone)}<br>${esc(l.email)}`,
      esc(l.region)+'<br>'+l.services.map(esc).join('<br>'),esc(l.attribution.source)+'<br>'+esc(l.attribution.ref_name)+'<br>'+esc(l.attribution.ref),
      `<details class="lead-detail"><summary>Открыть заявку</summary><p>Площадь: ${esc(l.area??'не указана')} м²</p><p>${esc(l.comment)}</p><p>Калькулятор:</p><pre>${esc(l.calculator?JSON.stringify(l.calculator,null,2):'Не приложен')}</pre><p>Источник и реферальные данные:</p><pre>${esc(JSON.stringify(l.attribution,null,2))}</pre><p>Согласие: ${esc(date(l.consent_at))} · ${esc(l.consent_version)}</p>${l.files.map(f=>`<p><a class="text-link" href="/api/admin/files/${esc(f.id)}">${esc(f.name)} ↓</a></p>`).join('')}</details>`,esc(tg[l.telegram]||l.telegram)
    ]));
    $('#ref-table').innerHTML=table(['Название / ссылка','Код','Создана','Переходы','Уникальные','Заявки','Конверсия'],data.referrals.map(r=>[esc(r.name)+`<a class="ref-link" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>`,esc(r.code),esc(date(r.created)),...counts(r)]));
    $('#sources-table').innerHTML=table(['Источник','Посещения','Уникальные','Заявки','Конверсия'],data.sources.map(r=>[esc(r.name),...counts(r)]));
    $('#weekly-table').innerHTML=table(['Неделя с','Посещения','Уникальные','Заявки','Конверсия'],data.weekly.map(r=>[esc(r.week),...counts(r)]));
    $('#cohort-table').innerHTML=table(['Первый визит: неделя с','Посетителей','Неделя 0','Неделя 1','Неделя 2','Неделя 3'],data.cohorts.map(r=>[esc(r.week),r.size,...r.retention.map(v=>v===null?'—':v+'%')]));
    $('#admin-status').textContent='';
  }catch(e){$('#admin-status').textContent=e.message;}
}
$('#login-form').onsubmit=async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;$('#login-status').textContent='';try{const data=await api('login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});csrf=data.csrf;$('#login-form').reset();$('#login').hidden=true;$('#dashboard').hidden=false;await refresh();}catch(e){$('#login-status').textContent=e.message;}finally{btn.disabled=false;}};
$('#logout').onclick=async()=>{try{await api('admin/logout',{method:'POST',body:'{}'});location.reload();}catch(e){$('#admin-status').textContent=e.message;}};
$('#refresh').onclick=refresh;$('#period').onchange=refresh;
$('#ref-form').onsubmit=async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{await api('admin/referrals',{method:'POST',body:JSON.stringify({name:e.currentTarget.elements.namedItem('name').value})});$('#ref-form').reset();await refresh();}catch(e){$('#admin-status').textContent=e.message;}finally{btn.disabled=false;}};
try{const data=await api('admin/session');csrf=data.csrf;$('#login').hidden=true;$('#dashboard').hidden=false;await refresh();}catch{/* Первое открытие: показываем форму входа. */}
