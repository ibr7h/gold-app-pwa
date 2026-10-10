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
  function updateKeyboard() {
    frame = 0;
    if (!vv) return;
    var diff = window.innerHeight - vv.height - Math.max(vv.offsetTop, 0);
    if (editableFocused() && vv.scale <= 1.05 && diff > Math.max(130, window.innerHeight * .18)) {
      // Only while the keyboard is open: allow editing without shifting document.
      root.style.setProperty('--dh-preview-height', Math.max(1, vv.height) + 'px');
    } else {
      root.style.removeProperty('--dh-preview-height');
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
  document.addEventListener('focusin', schedule, true);
  document.addEventListener('focusout', schedule, true);
  if (vv) {
    vv.addEventListener('resize', schedule, {passive: true});
    vv.addEventListener('scroll', schedule, {passive: true});
  }
  schedule();
})();
