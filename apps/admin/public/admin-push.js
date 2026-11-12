/* Admin Push; access tokens remain inside the Admin app closure. */
(()=>{
'use strict';
const BASE='/gold-app-pwa/admin/';
const $=id=>document.getElementById(id);
let config=null,sub=null,busy=false;
const ios=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
const installed=()=>!!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true);
const supported=()=>window.isSecureContext&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
const message=(text,problem=false)=>{
 const el=$('admin-push-message');if(el){el.textContent=text;el.classList.toggle('push-error',problem);}
};
const auth=(path,method='GET',body)=>window.DhahabkAdminBridge?.api(path,method,body);
const subscription=async()=>{const reg=await navigator.serviceWorker.getRegistration(BASE);return reg?.pushManager.getSubscription()||null;};
const base64ToBytes=value=>{
 const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
 return Uint8Array.from(binary,x=>x.charCodeAt(0));
};
const btns=flag=>{for(const id of ['admin-push-enable','admin-push-test','admin-push-disable','admin-push-refresh'])$(id).disabled=flag;};
async function inspect(){
 if(!supported()){message('هذا الجهاز أو المتصفح لا يدعم إشعارات Push.',true);return;}
 if(ios()&&!installed()){message('على الآيفون أضف تطبيق إدارة ذهبك إلى الشاشة الرئيسية وافتحه من الأيقونة.',true);return;}
 const permission=Notification.permission;
 if(permission==='denied'){message('الإشعارات محظورة. اسمح بها من إعدادات الجهاز.',true);return;}
 try{
  config=await auth('/admin/push/config');
  if(!config?.configured||!config?.publicKey){message('خدمة الإشعارات غير مهيأة على الخادم.',true);return;}
  sub=await subscription();
  if(permission==='default'){message('اسمح بالإشعارات عند الضغط على تفعيل.',false);return;}
  if(!sub){message('الإشعارات مسموحة لكن هذا الجهاز غير مشترك.',true);return;}
  const result=await auth('/admin/push/subscriptions/status','POST',{endpoint:sub.endpoint});
  message(result?.registered?'الإشعارات مفعّلة لهذا الحساب والجهاز.':'يلزم إعادة ربط اشتراك الجهاز بجلسة الإدارة الحالية.',!result?.registered);
 }catch{message('تعذر الاتصال بخدمة إشعارات المدير. تحقق من نشر الخادم.',true);}
}
async function registerExisting(){
 if(!supported()||(ios()&&!installed())||Notification.permission!=='granted')return;
 try{
  config=await auth('/admin/push/config');
  if(!config?.configured)return;
  sub=await subscription();
  if(sub)await submitSubscription(sub);
  await inspect();
 }catch{ /* Manual refresh remains available. */ }
}
async function submitSubscription(current){
 const j=current.toJSON();
 if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth)throw Error('Incomplete subscription');
 return auth('/admin/push/subscriptions','POST',{
  endpoint:current.endpoint,
  keys:{p256dh:j.keys.p256dh,auth:j.keys.auth},
  userAgent:navigator.userAgent.slice(0,240),preferredLanguage:'ar'
 });
}
async function enable(){
 if(busy)return;
 if(!supported()){message('هذا الجهاز لا يدعم إشعارات Push.',true);return;}
 if(ios()&&!installed()){message('ثبّت تطبيق الإدارة على شاشة الآيفون الرئيسية أولًا.',true);return;}
 busy=true;btns(true);
 try{
  // Permission must be requested as the first awaited action after an actual user tap.
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission!=='granted')throw Error('permission');
  config=await auth('/admin/push/config');
  if(!config?.configured||!config?.publicKey)throw Error('unconfigured');
  let reg=await navigator.serviceWorker.getRegistration(BASE);
  if(!reg)reg=await navigator.serviceWorker.register(BASE+'sw.js',{scope:BASE,updateViaCache:'none'});
  let current=await reg.pushManager.getSubscription();
  if(!current)current=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToBytes(config.publicKey)});
  try{await submitSubscription(current);}catch(e){
   if(e?.status!==409)throw e;
   await current.unsubscribe();
   current=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToBytes(config.publicKey)});
   await submitSubscription(current);
  }
  sub=current;message('تم تفعيل إشعارات الإدارة على هذا الجهاز. يمكنك اختبارها بعد إغلاق التطبيق.');
 }catch(e){message(e?.message==='permission'?'لم يُسمح بالإشعارات.':e?.message==='unconfigured'?'الخادم غير مهيأ للإشعارات.':'تعذر تفعيل الإشعارات. تحقق من الاتصال والخادم.',true);}
 finally{busy=false;btns(false);}
}
async function test(){
 if(busy)return;busy=true;btns(true);
 try{
  sub=await subscription();
  if(!sub)throw Error('missing');
  const result=await auth('/admin/push/test','POST',{endpoint:sub.endpoint});
  message(result?.accepted?'قَبِل مزود Push إشعار الاختبار. اقفل الجهاز للتحقق من وصوله.':'لم يقبل مزود Push إشعار الاختبار.',!result?.accepted);
 }catch{message('تعذر اختبار الإشعارات. تأكد من الاشتراك أو انتظر دقيقة بين الاختبارات.',true);}
 finally{busy=false;btns(false);}
}
async function disable(){
 if(busy)return;busy=true;btns(true);
 try{
  const current=await subscription();
  if(current){
   await auth('/admin/push/subscriptions','DELETE',{endpoint:current.endpoint});
   await current.unsubscribe();
  }
  sub=null;message('تم إيقاف استقبال الإشعارات على هذا الجهاز.');
 }catch{message('تعذر إيقاف الاشتراك؛ حاول مرة أخرى.',true);}
 finally{busy=false;btns(false);}
}
async function logout(){
 // Admin Push is tied to a verified session. Explicit logout removes the local endpoint.
 try{
  const current=await subscription();
  if(!current)return;
  await Promise.race([auth('/admin/push/subscriptions','DELETE',{endpoint:current.endpoint}),new Promise(resolve=>setTimeout(resolve,2500))]);
  await current.unsubscribe();
 }catch{/* The backend session revocation remains authoritative. */}
}
$('admin-push-enable').addEventListener('click',()=>{void enable();});
$('admin-push-test').addEventListener('click',()=>{void test();});
$('admin-push-disable').addEventListener('click',()=>{void disable();});
$('admin-push-refresh').addEventListener('click',()=>{void inspect();});
window.AdminPush={onAuthenticated:()=>{void registerExisting();},logout};
})();