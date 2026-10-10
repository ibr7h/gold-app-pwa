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
 var releaseVersion='v1.9.8';
 function repair(){
  var auth=document.querySelector('#root .gold-auth');
  if(!auth)return;
  auth.querySelectorAll('.app-version-stamp').forEach(function(el){if(el.textContent!==releaseVersion)el.textContent=releaseVersion;});
  var walker=document.createTreeWalker(auth,NodeFilter.SHOW_TEXT);
  var node;
  while((node=walker.nextNode())){
   if(node.nodeValue&&node.nodeValue.includes(notice)){
    var host=node.parentElement;
    if(host&&host.childElementCount===0)host.style.display='none';
    else node.nodeValue='';
   }
   if(node.nodeValue&&node.parentElement?.closest('.app-version-stamp'))node.nodeValue=releaseVersion;
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
