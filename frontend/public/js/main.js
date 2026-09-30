// Весь интерактив отдельно от HTML и оформления.
const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let config, selectedEstimate = null, visibleCount = 4, filter = 'all';
let analyticsAllowed = localStorage.getItem('avela-analytics') === 'yes';
const params = new URLSearchParams(location.search);
const attribution = {ref: params.get('ref') || '', source: params.get('utm_source') || '', medium:params.get('utm_medium') || '', campaign:params.get('utm_campaign') || '', term:params.get('utm_term') || '', content:params.get('utm_content') || '', referrer:document.referrer};
if (attribution.ref || attribution.source || !sessionStorage.getItem('avela-source')) sessionStorage.setItem('avela-source', JSON.stringify(attribution));
const source = JSON.parse(sessionStorage.getItem('avela-source') || '{}');
let visitor = localStorage.getItem('avela-visitor');
let visit = sessionStorage.getItem('avela-visit');
const lastActivity = Number(sessionStorage.getItem('avela-last') || 0);
if (!visit || Date.now() - lastActivity > 30 * 60 * 1000) {visit = crypto.randomUUID(); sessionStorage.setItem('avela-visit', visit);}
function ids() {return analyticsAllowed ? {visitor, visit} : {visitor:'', visit:''};}
async function track(event, detail = '') {
  if (!analyticsAllowed) return;
  sessionStorage.setItem('avela-last', Date.now());
  try { await fetch('/api/event', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({event, detail, ...ids(), ...source})}); } catch { /* Аналитика не должна блокировать сайт. */ }
  if (window.ym && config?.metrika) window.ym(config.metrika, 'reachGoal', event);
}
function enableAnalytics() {
  analyticsAllowed = true;
  if (!visitor) {visitor = crypto.randomUUID(); localStorage.setItem('avela-visitor', visitor);}
  if (config?.metrika && !window.ym) {
    window.ym = function(){(window.ym.a = window.ym.a || []).push(arguments);}; window.ym.l = Date.now();
    const script = document.createElement('script'); script.async = true; script.src = 'https://mc.yandex.ru/metrika/tag.js'; document.head.append(script);
    window.ym(config.metrika, 'init', {clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false});
  }
  track('pageview');
}
$('.menu-toggle').onclick = () => {const open = $('#nav').classList.toggle('open'); $('.menu-toggle').setAttribute('aria-expanded', String(open));};
$('#nav').onclick = e => {if(e.target.closest('a')){$('#nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}};
document.addEventListener('click', e => {const a = e.target.closest('[data-cta],[data-event]'); if(a) track(a.dataset.event || 'cta', a.dataset.cta || '');});
$('#accept-analytics').onclick = () => {localStorage.setItem('avela-analytics','yes');$('#analytics-banner').hidden = true;enableAnalytics();};
$('#decline-analytics').onclick = () => {localStorage.setItem('avela-analytics','no');$('#analytics-banner').hidden = true;};
function renderProjects() {
  const list = config.projects.filter(p => filter === 'all' || p.category === filter);
  $('#project-grid').innerHTML = list.slice(0, visibleCount).map(p => `<button class="project-card" data-project="${p.id}" aria-label="Открыть проект ${escape(p.name)}"><div class="image-wrap"><img src="${p.image}" alt="${escape(p.name)} — архитектурный референс" loading="lazy"></div><div class="project-meta"><div><h3>${escape(p.name)}</h3><p>${p.area} м² · ${p.floors} эт. · ${escape(p.region)}</p></div><span class="project-arrow">↗</span></div></button>`).join('');
  $('#more-projects').hidden = list.length <= visibleCount;
}
$('.filters').onclick = e => {const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;visibleCount=4;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderProjects();};
$('#more-projects').onclick = () => {visibleCount=12;renderProjects();};
$('#project-grid').onclick = e => {
  const button=e.target.closest('[data-project]'); if(!button)return;
  const p=config.projects.find(x=>String(x.id)===button.dataset.project);
  $('#project-detail').innerHTML=`<div class="project-detail-copy"><p class="section-number">КОНЦЕПЦИЯ / ${String(p.id).padStart(2,'0')}</p><h2>${escape(p.name)}</h2><p>${p.area} м² · ${p.floors} эт. · ${escape(p.region)}</p><p class="muted">${escape(p.description)}</p><p class="caption">Демонстрационный проект. Галерея — подборка независимых визуальных референсов, а не съёмка одного объекта.</p><h3>В этом проекте выполнено</h3><p class="caption">Условный состав демонстрационного проекта:</p><p>${p.works.map(escape).join(' · ')}</p><button class="button" id="project-request">Хочу обсудить похожий проект ↗</button></div><div class="gallery">${p.gallery.map(x=>`<figure><img src="${x.src}" alt="${escape(x.title)}" loading="lazy"><figcaption>${escape(x.title)}</figcaption></figure>`).join('')}</div>`;
  $('#project-dialog').showModal(); document.body.style.overflow='hidden'; track('project',p.name);
  $('#project-request').onclick=()=>{closeProject();$('#lead-form [name=comment]').value=`Интересует проект «${p.name}». `;$('#lead-form [name=area]').value=p.area;document.querySelector('#lead-services input').checked=true;location.hash='contact';};
};
function closeProject() {$('#project-dialog').close();document.body.style.overflow='';}
$('.dialog-close').onclick=closeProject;
$('#project-dialog').addEventListener('close',()=>document.body.style.overflow='');
$('#project-dialog').onclick=e=>{if(e.target===$('#project-dialog'))closeProject();};
// калькулятор
function getCalculation() {
  const f=new FormData($('#calculator-form'));
  return {area:Number(f.get('area')),floors:Number(f.get('floors')),material:f.get('material'),package:f.get('package'),extras:f.getAll('extras'),lawn_area:Number(f.get('lawn_area')),terrace_area:Number(f.get('terrace_area')),greenery:f.has('greenery'),engineering:f.has('engineering')};
}
function previewCalc(c) {
  const lines=[{name:'Дом · '+config.packages[c.package],price:Math.round(c.area*config.rates[c.package]*config.materials[c.material][1]*({1:1,2:1.05,3:1.1,4: 1.15}[c.floors]))}];
  c.extras.forEach(key=>{const [name,rate,unit]=config.extras[key];lines.push({name,price:Math.round(rate*({area:c.area,fixed:1,lawn_area:c.lawn_area,terrace_area:c.terrace_area}[unit]))});});
  return {...c,lines,total:lines.reduce((sum,x)=>sum+x.price,0)};
}
function updateCalculator() {
  const valid=$('#calculator-form').checkValidity(); $('#apply-estimate').disabled=!valid;
  if(!valid){$('#estimate-total').textContent='Проверьте параметры';return;}
  const c=previewCalc(getCalculation());$('#estimate-total').textContent=money(c.total);
  $('#estimate-lines').innerHTML=c.lines.map(x=>`<div class="estimate-line"><span>${escape(x.name)}</span><span>${money(x.price)}</span></div>`).join('');
  $('#estimate-notes').textContent=(c.greenery||c.engineering||c.material==='other')?'Выбранные индивидуальные работы / технология уточняются отдельно и не включены в итог.':'';
  if(selectedEstimate){selectedEstimate=getCalculation();$('#attached-estimate p').textContent=`К заявке приложен расчёт: ${money(c.total)}. Параметры обновлены.`;$('#lead-form [name=area]').value=c.area;}
}
$('#calculator-form').onsubmit=e=>e.preventDefault();
$('#calculator-form').oninput=()=>{if(config)updateCalculator();};
$('#apply-estimate').onclick=()=>{selectedEstimate=getCalculation();$('#attached-estimate').hidden=false;$('#lead-form [name=area]').value=selectedEstimate.area;document.querySelector('#lead-services input').checked=true;updateCalculator();track('calculator');location.hash='contact';};
$('#remove-estimate').onclick=()=>{selectedEstimate=null;$('#attached-estimate').hidden=true;};
$('#lead-form [name=files]').onchange=e=>{
  const files=[...e.target.files];e.target.setCustomValidity(files.length>5?'Выберите не больше 5 файлов.':files.some(f=>f.size>10*1024*1024)?'Каждый файл должен быть не больше 10 МБ.':'');
  $('#file-list').replaceChildren(...files.map(f=>{const li=document.createElement('li');li.textContent=`${f.name} · ${(f.size/1024/1024).toFixed(1)} МБ`;return li;}));e.target.reportValidity();
};
$('#lead-form').onsubmit=async e=>{
  e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);const status=$('#form-status');status.className='';
  if(!fd.getAll('services').length){status.textContent='Выберите хотя бы одну услугу.';return;}
  fd.set('calculator',selectedEstimate?JSON.stringify(selectedEstimate):'');fd.set('attribution',JSON.stringify({...source,...ids()}));
  const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='Сохраняем заявку…';
  try{const response=await fetch('/api/leads',{method:'POST',body:fd});const data=await response.json();if(!response.ok)throw Error(data.error||'Не удалось отправить заявку.');status.className='success';status.textContent=`Заявка №${data.id} сохранена. Спасибо!`;track('lead');form.reset();$('#file-list').replaceChildren();selectedEstimate=null;$('#attached-estimate').hidden=true;}
  catch(error){status.className='error';status.textContent=error.message+' Данные оставлены в форме — попробуйте ещё раз.';}finally{button.disabled=false;}
};
async function init(){
  try{const response=await fetch('/api/config');if(!response.ok)throw Error();config=await response.json();renderProjects();
    $('#extras').innerHTML=Object.entries(config.extras).map(([key,[title,rate,unit]])=>`<label class="check"><input type="checkbox" name="extras" value="${key}"><span>${escape(title)}<br><small class="muted">от ${money(rate)}${unit==='fixed'?'':'/м²'}</small></span></label>`).join('');
    $('#lead-services').innerHTML=config.services.map((s,i)=>`<label class="check"><input type="checkbox" name="services" value="${escape(s)}"><span>${escape(s)}</span></label>`).join('');
    const serviceImages=['house-06','house-03','interior','detail','house-07'];
    $('#service-grid').innerHTML=config.services.map((s,i)=>`<a class="service-card" href="#contact" data-service="${i}"><img src="/images/${serviceImages[i]}.jpg" loading="lazy" alt="${escape(s)}"><div><small>0${i+1}</small><h3>${escape(s)}</h3></div><span class="project-arrow">↗</span></a>`).join('');
    $('#service-grid').onclick=e=>{const a=e.target.closest('[data-service]');if(a){$('#lead-services').querySelectorAll('input')[Number(a.dataset.service)].checked=true;track('cta','service_'+a.dataset.service);}};
    $('#reviews-grid').innerHTML=config.reviews.map(r=>`<article class="review"><span class="quote-mark">“</span><blockquote>${escape(r.text)}</blockquote><p>${escape(r.name)}</p><small>${escape(r.project)}</small></article>`).join('');
    updateCalculator();if(analyticsAllowed)enableAnalytics();else if(!localStorage.getItem('avela-analytics'))$('#analytics-banner').hidden=false;
  }catch{$('#project-grid').innerHTML='<p>Не удалось получить данные. Запустите python app.py и откройте http://localhost:8000.</p>';}
}
init();
