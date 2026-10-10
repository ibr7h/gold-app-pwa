/* Dhahabi nearby markets, opt-in last location on the authenticated User API.
   One current position only, no history. Loaded only in the installed User preview. */
(function(){
 'use strict';
 const css=document.createElement('style');
 css.textContent=[
  '.dh-nearby-location{background:#fffdf7;border:1px solid #e4d4a0;border-radius:18px;padding:16px;',
  'margin-top:12px;direction:rtl;text-align:right;color:#001F3F;box-sizing:border-box}',
  '.dh-nearby-location *{box-sizing:border-box}',
  '.dh-nearby-location .dh-location-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:6px 0 12px}',
  '.dh-nearby-location .dh-location-row strong{font-size:15px}',
  '.dh-nearby-location .dh-location-switch{position:relative;width:53px;height:30px;flex:none;cursor:pointer}',
  '.dh-nearby-location input[type=checkbox]{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}',
  '.dh-nearby-location .dh-switch-track{display:block;width:53px;height:30px;border-radius:20px;background:#97a4b3;',
  'transition:background .15s ease;pointer-events:none}',
  '.dh-nearby-location .dh-switch-track:after{content:"";display:block;position:absolute;top:3px;right:3px;',
  'width:24px;height:24px;border-radius:50%;background:white;box-shadow:0 1px 4px #0003;transition:transform .15s ease}',
  '.dh-nearby-location .dh-location-switch:has(input:checked) .dh-switch-track{background:#C5A021}',
  '.dh-nearby-location .dh-location-switch:has(input:checked) .dh-switch-track:after{transform:translateX(-23px)}',
  '.dh-nearby-location input:focus-visible+.dh-switch-track{outline:3px solid #001F3F;outline-offset:3px}',
  '.dh-nearby-location .dh-location-note{font-size:13px;color:#526276;line-height:1.8;margin:8px 0 13px}',
  '.dh-nearby-location .dh-location-status{font-size:13px;color:#001F3F;line-height:1.8;min-height:22px;margin:0 0 12px}',
  '.dh-nearby-location .dh-location-status[data-error=true]{color:#a12121}',
  '.dh-nearby-location button{width:100%;min-height:46px;border:0;border-radius:12px;background:#C5A021;',
  'color:#001F3F;font-size:14px;font-weight:750;cursor:pointer;margin:4px 0 12px}',
  '.dh-nearby-location button:disabled{opacity:.55;cursor:wait}',
  '.dh-nearby-location .dh-location-map-links{display:flex;flex-wrap:wrap;gap:8px}',
  '.dh-nearby-location .dh-location-map-links a{flex:1;min-width:126px;padding:12px;text-align:center;',
  'border-radius:12px;background:#001F3F;color:white!important;text-decoration:none;font-size:13px;font-weight:650}',
  '.dh-nearby-location [hidden]{display:none!important}',
  '.gold-web.workspace.reference-home .home-identity h1[role=link]{cursor:pointer;text-decoration:underline;',
  'text-decoration-color:#C5A021;text-decoration-thickness:1px;text-underline-offset:5px}',
  '.gold-web.workspace.reference-home .home-identity h1[role=link]:focus-visible{outline:2px solid #C5A021;outline-offset:5px;border-radius:5px}',
  '.gold-web.workspace .workspace-content .settings-list.dh-more-reordered{display:flex;flex-direction:column}',
  '.gold-web.workspace .workspace-content .dh-profile-shortcuts.dh-profile-reordered{display:flex;flex-wrap:wrap}',
  '.gold-web.workspace .workspace-content .dh-profile-shortcuts.dh-profile-reordered>button{flex:1 1 135px}'
 ].join('');
 document.head.appendChild(css);
 let current=null,seq=0;
 const api=(path,body)=>{if(typeof window.__dhahabiLocationRequest!=='function')return Promise.reject(new Error('الخدمة غير جاهزة. حدّث التطبيق ثم حاول مجددًا.'));return window.__dhahabiLocationRequest(path,body);};
 const valid=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
 function activeMap(){
  const app=document.querySelector('#root .gold-web.workspace');
  if(!app)return null;
  // The mounted map section is the source of truth; URL hashes and titles
  // can lag behind React navigation and must not block the control.
  const map=app.querySelector('.workspace-main > main.workspace-content > section.map-placeholder');
  if(!map||!map.getClientRects().length||getComputedStyle(map).display==='none')return null;
  return map;
 }
 function applyPageExtras(){
  const app=document.querySelector('#root .gold-web.workspace');
  if(!app)return;
  const homeName=app.querySelector('.home-topbar .home-identity h1');
  if(homeName&&!homeName.hasAttribute('data-dh-account-link')){
   homeName.dataset.dhAccountLink='true';
   homeName.tabIndex=0;homeName.setAttribute('role','link');homeName.setAttribute('aria-label','فتح الملف الشخصي');
   const go=()=>{location.hash='account';};
   homeName.addEventListener('click',go);
   homeName.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
  }
  const more=app.querySelector('.workspace-content .settings-list');
  if(more&&app.querySelector('.workspace-content .profile-shortcut')){
   more.classList.add('dh-more-reordered');
   for(const button of more.querySelectorAll(':scope > button')){
    const t=button.textContent||'';
    button.style.order=/قريب/.test(t)?'0':/مشتريات/.test(t)?'1':/تنبيهات/.test(t)?'2':/إشعارات/.test(t)?'3':/مساعدة/.test(t)?'4':'5';
   }
  }
  const profile=app.querySelector('.workspace-content .dh-profile-shortcuts');
  if(profile&&!profile.classList.contains('dh-profile-reordered')){
   profile.classList.add('dh-profile-reordered');
   for(const button of profile.querySelectorAll(':scope > button')){
    const t=button.textContent||'';
    button.style.order=/إشعارات/.test(t)?'0':/تحديث التطبيق/.test(t)?'1':/مشتريات/.test(t)?'2':/محفظ/.test(t)?'3':/تنبيهات/.test(t)?'4':'5';
   }
  }
 }
 function status(box,text,error){
  const x=box.querySelector('.dh-location-status');
  x.textContent=text;x.dataset.error=error?'true':'false';
 }
 function build(map){
  const box=document.createElement('section');
  box.className='dh-nearby-location';box.setAttribute('aria-label','الموقع وأسواق الذهب القريبة');
  box.innerHTML='<div class="dh-location-row"><strong id="dh-location-label">تفعيل الموقع</strong>'+
   '<label class="dh-location-switch"><input class="dh-location-toggle" type="checkbox" role="switch" aria-labelledby="dh-location-label" disabled>'+
   '<span class="dh-switch-track"></span></label></div>'+
   '<p class="dh-location-note">يُحدَّث موقعك عند فتح «التجار القريبون» إذا كانت الخدمة مفعّلة.</p>'+
   '<p class="dh-location-status" role="status" aria-live="polite">جارٍ التحقق من إعدادات الموقع…</p>'+
   '<button class="dh-location-refresh" type="button" disabled>تحديث الموقع</button>'+
   '<div class="dh-location-map-links" hidden>'+
   '<a class="dh-location-google" target="_blank" rel="noopener noreferrer">خرائط Google</a>'+
   '<a class="dh-location-apple" target="_blank" rel="noopener noreferrer">خرائط Apple</a></div>';
  map.querySelectorAll('.dh-nearby-location[data-dh-injected=true]').forEach(n=>n.remove());
  box.setAttribute('data-dh-injected','true');
  map.appendChild(box);
  const toggle=box.querySelector('.dh-location-toggle');
  const button=box.querySelector('.dh-location-refresh');
  const links=box.querySelector('.dh-location-map-links');
  let enabled=false,busy=true;
  const alive=()=>current===box&&box.isConnected&&activeMap()===map;
  const controls=()=>{toggle.disabled=busy;button.disabled=busy||!enabled;toggle.checked=enabled;};
  const linkTo=(lat,lon)=>{
   if(!valid(lat,lon)){links.hidden=true;return;}
   const pair=lat.toFixed(5)+','+lon.toFixed(5);
   box.querySelector('.dh-location-google').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('محلات ذهب بالقرب من '+pair);
   box.querySelector('.dh-location-apple').href='https://maps.apple.com/?q='+encodeURIComponent('محلات ذهب')+'&ll='+encodeURIComponent(pair);
   links.hidden=false;
  };
  const locate=async()=>{
   if(!navigator.geolocation)throw Error('خدمة تحديد الموقع غير مدعومة على هذا الجهاز.');
   if(navigator.permissions&&navigator.permissions.query){
    try{const p=await navigator.permissions.query({name:'geolocation'});if(p.state==='denied')
     throw Error('إذن الموقع معطّل. فعّله من إعدادات الجهاز ليتحدّث موقعك.');}
    catch(e){if(e instanceof Error&&e.message.startsWith('إذن الموقع'))throw e;}
   }
   return await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
    p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy}),
    e=>reject(Error(e.code===1?'لم يتم السماح بالوصول إلى الموقع. فعّل الإذن من إعدادات الجهاز.':
      e.code===2?'تعذر تحديد الموقع حاليًا. تحقق من خدمات الموقع.':
      e.code===3?'انتهت مهلة تحديد الموقع. حاول مرة أخرى.':'تعذر تحديد الموقع.')),
    {enableHighAccuracy:true,maximumAge:0,timeout:20000}));
  };
  const refresh=async(pos)=>{
   busy=true;controls();status(box,'جارٍ تحديث موقعك…',false);
   try{
    const point=pos||await locate();
    if(!valid(point.latitude,point.longitude))throw Error('إحداثيات الموقع غير صالحة.');
    if(!alive())return;
    const data=await api('/auth/location/position',point);
    if(!alive())return;
    enabled=data.locationEnabled===true;
    linkTo(point.latitude,point.longitude);
    status(box,'تم تحديث الموقع وحفظه في حسابك'+
      (Number.isFinite(point.accuracyMeters)?' (دقة تقريبية '+Math.round(point.accuracyMeters)+' متر).':'.'),false);
   }catch(e){if(alive()){status(box,e.message||'تعذر تحديث الموقع.',true);}}
   finally{if(alive()){busy=false;controls();}}
  };
  toggle.addEventListener('change',async()=>{
   const next=toggle.checked;
   toggle.checked=enabled;
   if(busy)return;
   busy=true;controls();status(box,next?'جارٍ تفعيل الموقع…':'جارٍ إيقاف الموقع…',false);
   try{
    if(next){
     const p=await locate();if(!alive())return;
     await api('/auth/location/preference',{enabled:true});if(!alive())return;
     enabled=true;busy=false;controls();await refresh(p);
    }else{
     await api('/auth/location/preference',{enabled:false});if(!alive())return;
     enabled=false;links.hidden=true;status(box,'الموقع متوقف. حُذفت الإحداثيات المحفوظة.',false);
    }
   }catch(e){if(alive()){status(box,e.message||'تعذر تعديل إعداد الموقع.',true);}}
   finally{if(alive()){busy=false;controls();}}
  });
  button.addEventListener('click',()=>{if(!busy&&enabled)void refresh();});
  (async()=>{
   try{
    const data=await api('/auth/profile');if(!alive())return;
    enabled=data.locationEnabled===true;
    if(!enabled){status(box,'الموقع غير مفعل.',false);return;}
    if(data.latitude!=null&&data.longitude!=null&&valid(Number(data.latitude),Number(data.longitude)))linkTo(Number(data.latitude),Number(data.longitude));
    await refresh();
   }catch(e){if(alive())status(box,e.message||'تعذر التحقق من إعدادات الموقع.',true);}
   finally{if(alive()){busy=false;controls();}}
  })();
  controls();
  return box;
 }
 function sync(){
  applyPageExtras();
  const map=activeMap();
  if(!map){
   if(current){current.remove();current=null;seq++;}
   return;
  }
  if(current&&current.isConnected&&current.parentElement===map)return;
  if(current)current.remove();
  seq++;
  current=build(map);
 }
 let pending=false;
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;sync();});}
 function start(){
  sync();
  const root=document.getElementById('root')||document.body;
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('popstate',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
