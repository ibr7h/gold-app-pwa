
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
