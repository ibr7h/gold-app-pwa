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


/* Preview-only, on-demand geolocation for the nearby gold-market page.
   Nothing is sent to Dhahabi's API or stored in the database. */
(function(){
 'use strict';
 var style=document.createElement('style');
 style.textContent=[
 'html:not(.dh-nearby-page-active) .dh-nearby-location[data-dh-injected="true"]{display:none!important}',
 '.dh-nearby-location{margin-top:14px;padding:18px;border-radius:18px;background:#fbfaf5;',
 'border:1px solid #e5d7a3;color:#001F3F;direction:rtl;text-align:right}',
 '.dh-nearby-location h3{margin:0 0 8px;font-size:17px}',
 '.dh-nearby-location p{margin:6px 0 13px;line-height:1.75;font-size:13px;color:#475569}',
 '.dh-nearby-location button{min-height:48px;padding:10px 18px;border:0;border-radius:12px;',
 'background:#C5A021;color:#001F3F;font-weight:800;font-size:15px;cursor:pointer;width:100%}',
 '.dh-nearby-location button:disabled{opacity:.7;cursor:wait}',
 '.dh-nearby-location .dh-nearby-result{margin:14px 0 0;border-radius:12px;',
 'padding:11px 12px;background:white;border:1px solid #e0ddcf;line-height:1.85;font-size:13px}',
 '.dh-nearby-location .dh-nearby-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}',
 '.dh-nearby-location a{flex:1;min-width:140px;padding:12px;text-align:center;border-radius:12px;',
 'background:#001F3F;color:white!important;text-decoration:none;font-weight:700;font-size:13px}',
 '.dh-nearby-location [hidden]{display:none!important}'
 ].join('');
 document.head.appendChild(style);
 function activeNearbyPage(){ return location.hash.slice(1).split(/[?\/]/,1)[0]==='map'; }
 function cleanupInjected(){ document.querySelectorAll('.dh-nearby-location[data-dh-injected="true"]').forEach(function(node){node.remove();}); }
 function attach(){
  document.documentElement.classList.toggle('dh-nearby-page-active',activeNearbyPage());
  if(!activeNearbyPage()){cleanupInjected();return;}
  var map=document.querySelector('#root .map-placeholder');
  if(!map){cleanupInjected();return;}
  document.querySelectorAll('.dh-nearby-location[data-dh-injected="true"]').forEach(function(node){if(!map.contains(node))node.remove();});
  if(map.querySelector('.dh-nearby-location'))return;
  var box=document.createElement('section');
  box.className='dh-nearby-location';
  box.setAttribute('data-dh-injected','true');
  box.setAttribute('aria-label','البحث عن أسواق الذهب حسب موقعي');
  box.innerHTML='<h3>أسواق الذهب القريبة من موقعك</h3>'+
   '<p>نطلب إذن الموقع عند الضغط فقط. لن نخزّن إحداثياتك في قاعدة بيانات ذهبي. '+
   'بيانات التجار المعتمدين غير متاحة حاليًا؛ يمكنك البحث في خرائط خارجية بدلًا منها.</p>'+
   '<button type="button" class="dh-nearby-find">تحديد موقعي والبحث بالقرب مني</button>'+
   '<div class="dh-nearby-result" role="status" aria-live="polite" hidden></div>'+
   '<div class="dh-nearby-links" hidden>'+
   '<a class="dh-nearby-google" target="_blank" rel="noopener noreferrer">البحث في خرائط Google</a>'+
   '<a class="dh-nearby-apple" target="_blank" rel="noopener noreferrer">البحث في خرائط Apple</a></div>'+
   '<p class="dh-nearby-disclosure" hidden>عند فتح إحدى الخرائط، يُرسل موقعك إلى مزود الخرائط الخارجي لإجراء البحث. '+
   'لا تعني نتائج الخرائط أن المتاجر مسجلة أو معتمدة لدى ذهبي.</p>';
  map.appendChild(box);
  var button=box.querySelector('button'),result=box.querySelector('.dh-nearby-result');
  var links=box.querySelector('.dh-nearby-links'),disclosure=box.querySelector('.dh-nearby-disclosure');
  function info(t){result.hidden=false;result.textContent=t;}
  button.addEventListener('click',function(){
   if(!navigator.geolocation){info('خدمة تحديد الموقع غير مدعومة في هذا المتصفح.');return;}
   button.disabled=true;button.textContent='جارٍ تحديد الموقع…';
   links.hidden=true;disclosure.hidden=true;
   navigator.geolocation.getCurrentPosition(function(pos){
    if(!activeNearbyPage()||!box.isConnected)return;
    button.disabled=false;button.textContent='تحديث موقعي';
    var lat=pos.coords.latitude,lon=pos.coords.longitude;
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){
     info('تعذر الحصول على إحداثيات صحيحة. أعد المحاولة.');return;
    }
    var readable=lat.toFixed(5)+', '+lon.toFixed(5);
    var acc=Number.isFinite(pos.coords.accuracy)?' (الدقة التقريبية: '+Math.round(pos.coords.accuracy)+' متر)':'';
    info('تم تحديد موقعك: '+readable+acc+'. اختر خدمة الخرائط للبحث عن أسواق الذهب القريبة.');
    var query=encodeURIComponent('محلات ذهب بالقرب من '+lat.toFixed(5)+','+lon.toFixed(5));
    box.querySelector('.dh-nearby-google').href='https://www.google.com/maps/search/?api=1&query='+query;
    box.querySelector('.dh-nearby-apple').href='https://maps.apple.com/?q='+encodeURIComponent('محلات ذهب')+'&ll='+encodeURIComponent(lat.toFixed(5)+','+lon.toFixed(5));
    links.hidden=false;disclosure.hidden=false;
   },function(e){
    if(!activeNearbyPage()||!box.isConnected)return;
    button.disabled=false;button.textContent='إعادة محاولة تحديد الموقع';
    var msg=e.code===1?'تم رفض إذن الموقع. فعّله من إعدادات المتصفح أو الجهاز ثم أعد المحاولة.':
      e.code===2?'الموقع غير متاح حاليًا. تحقق من إعدادات GPS والاتصال.':
      e.code===3?'انتهت مهلة تحديد الموقع. جرّب مرة أخرى في مكان مكشوف.':'تعذر تحديد الموقع. أعد المحاولة.';
    info(msg);
   },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  });
 }
 function ready(){
  attach();
  var host=document.getElementById('root')||document.body;
  var queued=false;
  var observer=new MutationObserver(function(){
   if(queued)return;
   queued=true;
   requestAnimationFrame(function(){queued=false;attach();});
  });
  observer.observe(host,{childList:true,subtree:true});
  window.addEventListener('hashchange',function(){attach();requestAnimationFrame(attach);});
  window.addEventListener('popstate',attach);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
})();
