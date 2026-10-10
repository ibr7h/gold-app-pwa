/* Gold App iPhone Render preview only. Keeps Safari's document static while
 * preserving deliberate scrolling inside views, menus and form panels.
 * Installed separately from the production / GitHub Pages application. */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  if (!/iPhone|iPod/i.test(ua)) return;
  if (!window.matchMedia('(pointer: coarse)').matches && !('ontouchstart' in window)) return;

  var root = document.documentElement;
  root.classList.add('dh-iphone-page-lock');
  var lastTap = 0;
  var frame = 0;
  var vv = window.visualViewport;

  function editableFocused() {
    var e = document.activeElement;
    return !!e && e.matches('input,textarea,select,[contenteditable="true"],[role="textbox"]');
  }
  function keepAuthFieldVisible() {
    var input = document.activeElement;
    var auth = document.querySelector('#root .gold-auth');
    if (!auth || !input || !input.matches('input,textarea,select')) return;
    // Scroll the actual inner auth panel, not the fixed Safari document. This
    // remains reliable when the QuickType/password toolbar changes its height.
    var rect = input.closest('.form-group')?.getBoundingClientRect() || input.getBoundingClientRect();
    var top = vv ? Math.max(0, vv.offsetTop) : 0;
    var bottom = top + (vv ? vv.height : window.innerHeight);
    var adjustment = 0;
    if (rect.bottom > bottom - 24) adjustment = rect.bottom - bottom + 24;
    else if (rect.top < top + 15) adjustment = rect.top - top - 15;
    if (Math.abs(adjustment) > 3) auth.scrollTop += adjustment;
  }
  function updateKeyboard() {
    frame = 0;
    if (!vv) return;
    var authEditing = editableFocused() && !!document.querySelector('#root .gold-auth');
    root.classList.toggle('dh-iphone-auth-editing', authEditing);
    var diff = Math.max(0, window.innerHeight - vv.height - Math.max(vv.offsetTop, 0));
    if (authEditing) {
      // Safari needs a full fixed canvas for its password manager and keyboard.
      // Shrinking the fixed body to visualViewport.height used to hide the input
      // behind the accessory bar and could paint a large blank region.
      root.style.removeProperty('--dh-preview-height');
      root.style.setProperty('--dh-auth-keyboard-inset', Math.round(diff) + 'px');
      keepAuthFieldVisible();
    } else {
      root.style.removeProperty('--dh-auth-keyboard-inset');
      if (editableFocused() && vv.scale <= 1.05 && diff > Math.max(130, window.innerHeight * .18)) {
        // Workspace forms keep their existing fixed-viewport behavior.
        root.style.setProperty('--dh-preview-height', Math.max(1, vv.height) + 'px');
      } else {
        root.style.removeProperty('--dh-preview-height');
      }
    }
  }
  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(updateKeyboard);
  }

  // The viewport meta does not reliably block pinch in modern iOS Safari.
  // These cancel the page-level gesture without swallowing one-finger scrolling.
  function blockGesture(event) {
    if (event.cancelable) event.preventDefault();
  }
  function blockMultitouch(event) {
    if (event.touches && event.touches.length > 1 && event.cancelable) event.preventDefault();
  }
  function blockDoubleTap(event) {
    if (event.touches && event.touches.length > 0) return;
    var target = event.target;
    if (target && target.closest &&
        target.closest('button,a,input,textarea,select,[role="button"],[contenteditable]')) {
      lastTap = 0;
      return;
    }
    var now = Date.now();
    if (now - lastTap < 300 && event.cancelable) event.preventDefault();
    lastTap = now;
  }
  function preventDocumentScroll(event) {
    // Never cancel an actual scrollable view: CSS locks the document itself.
    if (event.target === document.documentElement || event.target === document.body) {
      if (event.cancelable) event.preventDefault();
    }
  }
  document.addEventListener('gesturestart', blockGesture, {passive: false});
  document.addEventListener('gesturechange', blockGesture, {passive: false});
  document.addEventListener('touchmove', blockMultitouch, {passive: false});
  document.addEventListener('touchend', blockDoubleTap, {passive: false});
  window.addEventListener('scroll', function () { if (window.scrollY) window.scrollTo(0, 0); }, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  document.addEventListener('focusin', function () {
    schedule();
    // Keyboard changes height asynchronously on iOS; align after the animation
    // as well as on visualViewport resize events.
    window.setTimeout(schedule, 150);
    window.setTimeout(schedule, 380);
  }, true);
  document.addEventListener('focusout', schedule, true);
  if (vv) {
    vv.addEventListener('resize', schedule, {passive: true});
    vv.addEventListener('scroll', schedule, {passive: true});
  }
  schedule();
})();

/* Registration hotfix for the isolated iPhone preview build. */
(function(){
 'use strict';
 var notice='يُحفظ الرقم الدولي بصيغة E.164';
 function repair(){
  var auth=document.querySelector('#root .gold-auth');
  if(!auth)return;
  auth.querySelectorAll('.app-version-stamp').forEach(function(el){el.remove();});
  var walker=document.createTreeWalker(auth,NodeFilter.SHOW_TEXT);
  var node;
  while((node=walker.nextNode())){
   if(node.nodeValue&&node.nodeValue.includes(notice)){
    var host=node.parentElement;
    if(host&&host.childElementCount===0)host.style.display='none';
    else node.nodeValue='';
   }
  }
 }
 var queued=false;
 var observer=new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;repair();});});
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
 document.addEventListener('focusin',function(e){
  if(!e.target.matches?.('.gold-auth input'))return;
  [100,300,550].forEach(function(ms){setTimeout(function(){
   var input=e.target,auth=input.closest('.gold-auth');if(!auth||document.activeElement!==input)return;
   var vv=window.visualViewport,rect=input.getBoundingClientRect();
   var bottom=(vv?vv.offsetTop+vv.height:innerHeight)-24;
   if(rect.bottom>bottom)auth.scrollTop+=rect.bottom-bottom;
  },ms);});
 },true);
 repair();
})();

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
  box.innerHTML='<p class="dh-location-status" role="status" aria-live="polite">جارٍ تحديد موقعك…</p>'+
    '<div class="dh-location-map-links" hidden>'+
    '<a class="dh-location-google" target="_blank" rel="noopener noreferrer">خرائط Google</a>'+
    '<a class="dh-location-apple" target="_blank" rel="noopener noreferrer">خرائط Apple</a></div>';
  map.querySelectorAll('.dh-nearby-location[data-dh-injected="true"]').forEach(n=>n.remove());
  map.appendChild(box);
  const links=box.querySelector('.dh-location-map-links');
  const google=box.querySelector('.dh-location-google');
  const apple=box.querySelector('.dh-location-apple');
  const isApple=/(iPhone|iPad|iPod|Macintosh|Mac OS X)/i.test(navigator.userAgent||'')||
    /^Mac/i.test(navigator.platform||'');
  apple.hidden=!isApple;
  const alive=()=>current===box&&box.isConnected&&activeMap()===map;
  const linkTo=(lat,lon)=>{
    if(!valid(lat,lon)){links.hidden=true;return;}
    const pair=lat.toFixed(5)+','+lon.toFixed(5);
    google.href='https://www.google.com/maps/search/?api=1&query='+
      encodeURIComponent('محلات ذهب بالقرب من '+pair);
    apple.href='https://maps.apple.com/?q='+encodeURIComponent('محلات ذهب')+
      '&ll='+encodeURIComponent(pair);
    links.hidden=false;
  };
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
