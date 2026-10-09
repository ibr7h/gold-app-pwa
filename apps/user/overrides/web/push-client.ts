import {api,jsonRequest,ApiError} from './api';
import {classifyPush,PushConditions,PushHealth} from './push-status';

export const PUSH_SCOPE='/gold-app-pwa/full/';
export interface PushConfig{configured:boolean;publicKey:string|null}
export interface ServerPushStatus{configured:boolean;registered:boolean;lastTestAt:string|null;lastAcceptedAt:string|null;lastFailureAt:string|null}
export interface BrowserPushSnapshot{
 health:PushHealth; conditions:PushConditions;ios:boolean;standalone:boolean;
 endpoint:string|null;lastTestAt:string|null;lastAcceptedAt:string|null;lastFailureAt:string|null;
 config:PushConfig|null;message:string;
}
export function platform(){
 const ua=typeof navigator!=='undefined'?navigator.userAgent:'';
 const ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&typeof navigator!=='undefined'&&navigator.maxTouchPoints>1);
 const standalone=typeof window!=='undefined'&&(
  window.matchMedia?.('(display-mode: standalone)').matches||
  (navigator as Navigator&{standalone?:boolean}).standalone===true
 );
 return {ios,standalone};
}
export function browserSupport(){
 return typeof window!=='undefined'&&window.isSecureContext&&
  'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
}
export function permissionStatus():'granted'|'default'|'denied'|'unavailable'{
 return typeof Notification==='undefined'?'unavailable':Notification.permission;
}
function convertKey(base64url:string):Uint8Array<ArrayBuffer>{
 const base64=base64url.replace(/-/g,'+').replace(/_/g,'/');
 const bytes=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));
 const out=new Uint8Array(new ArrayBuffer(bytes.length));
 for(let i=0;i<bytes.length;i++)out[i]=bytes.charCodeAt(i);
 return out;
}
async function registration(create:boolean){
 if(!browserSupport())return null;
 const existing=await navigator.serviceWorker.getRegistration(PUSH_SCOPE);
 if(existing||!create)return existing||null;
 await navigator.serviceWorker.register(PUSH_SCOPE+'sw.js',{scope:PUSH_SCOPE,updateViaCache:'none'});
 return navigator.serviceWorker.ready;
}
async function currentSubscription(create:boolean){
 const reg=await registration(create);
 if(!reg)return null;
 return reg.pushManager.getSubscription();
}
export async function inspectPush():Promise<BrowserPushSnapshot>{
 const {ios,standalone}=platform();
 const supported=browserSupport();
 const permission=permissionStatus();
 let config:PushConfig|null=null,endpoint:string|null=null,server:ServerPushStatus|null=null;
 let serverReachable=false,message='';
 try{
  config=await api<PushConfig>('/push/config');
  serverReachable=true;
 }catch(e){message='تعذر التواصل مع خدمة الإشعارات في الخادم.';}
 if(supported&&(!ios||standalone)){
  try{
   const sub=await currentSubscription(false);
   endpoint=sub?.endpoint||null;
   if(endpoint&&serverReachable){
    server=await api<ServerPushStatus>('/push/subscriptions/status',jsonRequest('POST',{endpoint}));
   }
  }catch(e){message='تعذر فحص اشتراك هذا الجهاز.';serverReachable=false;}
 }
 const conditions:PushConditions={
  supported,iosInstallRequired:ios&&!standalone,permission,serverReachable,
  serverConfigured:!!config?.configured,localSubscribed:!!endpoint,serverRegistered:!!server?.registered
 };
 return {health:classifyPush(conditions),conditions,ios,standalone,endpoint,
  lastTestAt:server?.lastTestAt||null,lastAcceptedAt:server?.lastAcceptedAt||null,
  lastFailureAt:server?.lastFailureAt||null,config,message};
}
export async function enablePush(config:PushConfig|null,renew=false):Promise<void>{
 const {ios,standalone}=platform();
 if(ios&&!standalone)throw new Error('أضف ذهبي إلى الشاشة الرئيسية على iPhone أولًا، ثم افتحه من الأيقونة.');
 if(!browserSupport())throw new Error('هذا المتصفح لا يدعم إشعارات الويب المطلوبة.');
 if(!config?.configured||!config.publicKey)throw new Error('خدمة الإرسال غير مهيأة على الخادم.');
 // Request within the original button tap, before awaiting network or worker operations.
 const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
 if(permission!=='granted')throw new Error(permission==='denied'?'الإشعارات محظورة. فعّلها من إعدادات الجهاز أو المتصفح.':'لم يُمنح إذن الإشعارات.');
 const reg=await registration(true);
 if(!reg)throw new Error('تعذر تسجيل خدمة الإشعارات.');
 let sub=await reg.pushManager.getSubscription();
 if(renew&&sub){await sub.unsubscribe();sub=null;}
 if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:convertKey(config.publicKey)});
 const serial=sub.toJSON();
 if(!serial.endpoint||!serial.keys?.p256dh||!serial.keys?.auth)throw new Error('اشتراك المتصفح لا يحتوي بيانات مفاتيح كاملة.');
 try{
  await api('/push/subscriptions',jsonRequest('POST',{endpoint:sub.endpoint,keys:{p256dh:serial.keys.p256dh,auth:serial.keys.auth}}));
 }catch(e){
  // Origin-wide subscriptions may have belonged to a previously signed-out account.
  // Never move a subscription between accounts on the server; rotate it on this device.
  if(!(e instanceof ApiError)||e.status!==409)throw e;
  await sub.unsubscribe();
  sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:convertKey(config.publicKey)});
  const renewed=sub.toJSON();
  if(!renewed.keys?.p256dh||!renewed.keys?.auth)throw new Error('تعذر تجديد اشتراك هذا الجهاز.');
  await api('/push/subscriptions',jsonRequest('POST',{endpoint:sub.endpoint,keys:{p256dh:renewed.keys.p256dh,auth:renewed.keys.auth}}));
 }
}
export async function disablePush():Promise<void>{
 const sub=await currentSubscription(false);
 if(!sub)return;
 await api('/push/subscriptions',jsonRequest('DELETE',{endpoint:sub.endpoint}));
 await sub.unsubscribe();
}
export async function testPush(endpoint:string){
 return api<{accepted:boolean;providerStatus:string;acceptedAt:string|null;detail:string}>('/push/test',jsonRequest('POST',{endpoint}));
}
/** Revokes the local subscription before logout, so a shared device cannot receive another account's alerts. */
export async function revokePushBeforeLogout(){
 if(!browserSupport())return;
 const sub=await currentSubscription(false).catch(()=>null);
 if(!sub)return;
 const endpoint=sub.endpoint;
 const serverRemove=api('/push/subscriptions',jsonRequest('DELETE',{endpoint})).catch(()=>null);
 await sub.unsubscribe().catch(()=>false);
 await Promise.race([serverRemove,new Promise(resolve=>setTimeout(resolve,3000))]);
}
