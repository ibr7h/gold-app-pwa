/* User Preview: installed standalone PWA only. A browser tab never loads the app. */
(function(){
 'use strict';
 var current=document.currentScript;
 var entry=current&&current.getAttribute('data-entry');
 var installed=(window.matchMedia&&(
   window.matchMedia('(display-mode: standalone)').matches||
   window.matchMedia('(display-mode: window-controls-overlay)').matches
 ))||navigator.standalone===true;
 if(installed){
   if(!entry||!/^\/gold-app-pwa\/full\/_expo\/static\/js\/web\/entry-[A-Za-z0-9._-]+\.js\?v=[a-f0-9]+$/.test(entry)){
     document.body.textContent='تعذر تشغيل ذهبي. أعد فتح التطبيق بعد تحديثه.';return;
   }
   var script=document.createElement('script');
   script.src=entry;script.async=false;
   script.onerror=function(){var root=document.getElementById('root');if(root)root.textContent='تعذر تحميل التطبيق. تحقق من الاتصال ثم أعد فتح ذهبي من أيقونته.';};
   document.body.appendChild(script);return;
 }
 var sheet=document.createElement('style');
 sheet.textContent=[
 'body.dh-install-browser #root{display:none!important}',
 'body.dh-install-browser #dhahabi-user-update,body.dh-install-browser #dhahabi-update-notice{display:none!important}',
 '#dh-install-required{position:fixed;inset:0;z-index:2147483600;overflow:auto;overscroll-behavior:contain;box-sizing:border-box;',
 'display:flex;align-items:center;justify-content:center;direction:rtl;',
 'background:linear-gradient(155deg,#001F3F,#123755 55%,#00182f);padding:24px 18px;',
 'color:#001F3F;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
 '#dh-install-required *{box-sizing:border-box}',
 '#dh-install-required .dh-gate-card{width:min(100%,440px);background:#fffdf8;border:1px solid #C5A021;',
 'border-radius:24px;padding:28px 23px;box-shadow:0 25px 60px #0005;text-align:center}',
 '#dh-install-required img{width:88px;height:88px;object-fit:cover;border-radius:22px;display:block;margin:0 auto 14px}',
 '#dh-install-required h1{font-size:23px;line-height:1.5;margin:4px 0 10px;font-weight:800}',
 '#dh-install-required p{font-size:14px;line-height:1.9;color:#475569;margin:8px 0 16px}',
 '#dh-install-required .dh-gate-instructions{background:#f6f3e8;border:1px solid #e6dec3;border-radius:15px;',
 'padding:13px 17px;text-align:right;color:#001F3F;font-size:14px;line-height:1.9;margin-bottom:16px}',
 '#dh-install-required .dh-gate-instructions strong{display:block;margin-bottom:4px}',
 '#dh-install-required ol{margin:0;padding:0 20px 0 0}',
 '#dh-install-required button{display:block;width:100%;border:0;border-radius:12px;min-height:49px;',
 'background:#C5A021;color:#001F3F;font-size:15px;font-weight:800;cursor:pointer;margin:0 0 12px}',
 '#dh-install-required button[hidden]{display:none!important}',
 '#dh-install-required .dh-gate-footnote{color:#64748b;font-size:12px;margin-bottom:0}',
 '@media(max-width:380px){#dh-install-required .dh-gate-card{padding:23px 17px}}'
 ].join('');
 document.head.appendChild(sheet);
 document.body.classList.add('dh-install-browser');
 var screen=document.createElement('main');
 screen.id='dh-install-required';screen.setAttribute('role','main');
 screen.setAttribute('aria-labelledby','dh-gate-title');
 screen.innerHTML='<section class="dh-gate-card">'+
 '<img alt="أيقونة ذهبي" src="/gold-app-pwa/full/pwa-icon-af89c21a.png">'+
 '<h1 id="dh-gate-title">ثبّت ذهبي أولًا</h1>'+
 '<p>لا يعمل ذهبي داخل المتصفح. ثبّته على الهاتف أو الكمبيوتر ثم افتحه من أيقونته.</p>'+
 '<div class="dh-gate-instructions"><strong>طريقة التثبيت</strong><ol id="dh-gate-steps"></ol></div>'+
 '<button id="dh-gate-install" type="button" hidden>تثبيت تطبيق ذهبي</button>'+
 '<p class="dh-gate-footnote" id="dh-gate-note">بعد التثبيت، أغلق هذا التبويب وافتح ذهبي من أيقونته على جهازك.</p>'+
 '</section>';
 document.body.appendChild(screen);
 var ua=navigator.userAgent||'';
 var ios=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
 var macSafari=/Macintosh/i.test(ua)&&/Safari/i.test(ua)&&!/(Chrome|Chromium|CriOS|Edg|OPR)/i.test(ua);
 var how=ios?[
  'اضغط على زر مشاركة في المتصفح.',
  'اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».',
  'شغّل ذهبي من الأيقونة على الشاشة الرئيسية.'
 ]:/Android/i.test(ua)?[
  'افتح القائمة ⋮ في Chrome.',
  'اختر «إضافة إلى الشاشة الرئيسية» ثم «تثبيت التطبيق» إن ظهر.',
  'شغّل ذهبي من أيقونته على الهاتف.'
 ]:macSafari?[
  'في Safari على macOS Sonoma 14 أو أحدث اختر «ملف».',
  'اضغط «إضافة إلى Dock».',
  'افتح ذهبي من Dock أو التطبيقات.'
 ]:/Edg\//i.test(ua)?[
  'افتح القائمة ⋯ في Microsoft Edge.',
  'اختر «التطبيقات» ثم «تثبيت هذا الموقع كتطبيق».',
  'شغّل ذهبي من قائمة التطبيقات.'
 ]:/(Chrome|Chromium)\//i.test(ua)?[
  'افتح القائمة ⋮ في Google Chrome.',
  'اختر «البث والحفظ والمشاركة» ثم «تثبيت الصفحة كتطبيق» (قد تختلف التسمية).',
  'افتح ذهبي من قائمة التطبيقات.'
 ]:[
  'افتح الموقع في Chrome أو Edge أو Safari على نظام يدعم تثبيت تطبيقات الويب.',
  'اختر أمر التثبيت من قائمة المتصفح.',
  'افتح ذهبي من الأيقونة المثبتة وليس من التبويب.'
 ];
 var list=document.getElementById('dh-gate-steps');
 how.forEach(function(t){var li=document.createElement('li');li.textContent=t;list.appendChild(li);});
 var deferred=null;
 var install=document.getElementById('dh-gate-install');
 var note=document.getElementById('dh-gate-note');
 window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();deferred=event;install.hidden=false;});
 install.addEventListener('click',function(){
  if(!deferred)return;
  var prompt=deferred;deferred=null;install.hidden=true;
  Promise.resolve(prompt.prompt()).catch(function(){note.textContent='تعذر فتح نافذة التثبيت. استخدم أمر تثبيت التطبيق في قائمة المتصفح.';});
 });
 window.addEventListener('appinstalled',function(){
  deferred=null;install.hidden=true;
  note.textContent='تم التثبيت. افتح ذهبي من أيقونته في جهازك بدلًا من هذا التبويب.';
 });
})();