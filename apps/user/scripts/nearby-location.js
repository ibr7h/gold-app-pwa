/* A fresh location per entry, stored in the user's authenticated account. */
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
  box.className='dh-nearby-location';box.setAttribute('data-dh-injected','true');
  box.setAttribute('aria-label','الموقع ومحلات الذهب القريبة');
  box.innerHTML='<p class="dh-location-status" role="status" aria-live="polite">جارٍ تحديد التجار القريبون…</p>'+
    '<div class="dh-location-radius"><label for="dh-search-radius">نطاق البحث التقريبي</label>'+
    '<select class="dh-search-radius" id="dh-search-radius" aria-label="نطاق البحث بالكيلومتر">'+
    '<option value="5">5 كم</option><option value="10">10 كم</option>'+
    '<option value="25" selected>25 كم</option><option value="50">50 كم</option></select></div>'+
    '<p class="dh-location-radius-hint">النطاق استرشادي؛ قد تظهر محلات أبعد في الخرائط.</p>'+
    '<div class="dh-location-map-links" hidden>'+
    '<a class="dh-location-google" target="_blank" rel="noopener noreferrer">خرائط Google</a>'+
    '<a class="dh-location-apple" target="_blank" rel="noopener noreferrer">خرائط Apple</a></div>';
  map.querySelectorAll('.dh-nearby-location[data-dh-injected="true"]').forEach(n=>n.remove());
  map.appendChild(box);
  const links=box.querySelector('.dh-location-map-links');
  const google=box.querySelector('.dh-location-google');
  const apple=box.querySelector('.dh-location-apple');
  const radius=box.querySelector('.dh-search-radius');
  let lastCoordinates=null;
  const isApple=/(iPhone|iPad|iPod|Macintosh|Mac OS X)/i.test(navigator.userAgent||'')||
    /^Mac/i.test(navigator.platform||'');
  apple.hidden=!isApple;
  const alive=()=>current===box&&box.isConnected&&activeMap()===map;
  const linkTo=(lat,lon)=>{
    if(!valid(lat,lon)){links.hidden=true;return;}
    const pair=lat.toFixed(5)+','+lon.toFixed(5);
    const km=Number(radius.value)||25;
    lastCoordinates={lat,lon};
    // Google Maps website deep link: zoom approximates the requested area.
    // It is NOT an API-enforced radius; the map application may adjust the viewport.
    const zoom=({5:12,10:11,25:10,50:9})[km]||10;
    google.href='https://www.google.com/maps/search/'+encodeURIComponent('محلات ذهب')+
      '/@'+pair+','+zoom+'z';
    // Apple Maps officially supports center and span on unified /search URLs.
    const latSpan=(2*km/111.32).toFixed(5);
    const lonSpan=(2*km/(111.32*Math.cos(lat*Math.PI/180))).toFixed(5);
    apple.href='https://maps.apple.com/search?query='+encodeURIComponent('محلات ذهب')+
      '&center='+encodeURIComponent(pair)+'&span='+encodeURIComponent(latSpan+','+lonSpan);
    links.hidden=false;
  };
  radius.addEventListener('change',()=>{
    if(lastCoordinates)linkTo(lastCoordinates.lat,lastCoordinates.lon);
  });
  const locate=async()=>{
    if(!navigator.geolocation)throw Error('خدمة الموقع غير متاحة على هذا الجهاز.');
    if(navigator.permissions&&navigator.permissions.query){
      try{
        const p=await navigator.permissions.query({name:'geolocation'});
        if(p.state==='denied')throw Error('إذن الموقع معطّل؛ فعّله من إعدادات الجهاز.');
      }catch(e){if(e instanceof Error&&e.message.startsWith('إذن الموقع'))throw e;}
    }
    return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
      p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy}),
      e=>reject(Error(e.code===1?'لم يُسمح بتحديد الموقع. فعّل الإذن من إعدادات الجهاز.':
        e.code===2?'تعذر تحديد موقعك. تحقق من خدمة الموقع.':
        e.code===3?'انتهت مهلة تحديد الموقع. ادخل الشاشة مرة أخرى.':'تعذر تحديد الموقع.')),
      {enableHighAccuracy:true,maximumAge:0,timeout:20000}
    ));
  };
  // A fresh position on each screen entry. No continuous background tracking.
  (async()=>{
    try{
      const point=await locate();
      if(!valid(point.latitude,point.longitude))throw Error('إحداثيات الموقع غير صالحة.');
      if(!alive())return;
      const profile=await api('/auth/profile');
      if(!alive())return;
      if(profile.locationEnabled!==true){
        await api('/auth/location/preference',{enabled:true});
        if(!alive())return;
      }
      const stored=await api('/auth/location/position',point);
      if(!alive())return;
      if(stored.locationEnabled!==true)throw Error('تعذر حفظ موقعك.');
      linkTo(point.latitude,point.longitude);
      status(box,'تم تحديث موقعك.',false);
    }catch(e){
      if(alive()){links.hidden=true;status(box,e instanceof Error?e.message:'تعذر تحديد الموقع أو حفظه.',true);}
    }
  })();
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
