import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearSessionVault,closeSessionVault,hasSessionVault,persistVaultSession,type SessionTokens,type DeviceGrant} from './session-vault';
export const API_BASE='https://gold-app-api-u8dl.onrender.com';
const ACCESS='dhahabi_user_access_token',REFRESH='dhahabi_user_refresh_token',PROFILE='dhahabi_user_profile';
const REPLACED='dhahabi_user_session_replaced_v1';
export const SESSION_REPLACED_MESSAGE='تم تسجيل الدخول إلى حسابك من جهاز أو تطبيق آخر. انتهت الجلسة هنا؛ سجّل الدخول بكلمة المرور لاستعادة الوصول.';
let epoch=0,refreshFlight:Promise<string>|null=null;
let session:SessionTokens|null=null;
let blocked=false;
let sessionReplaced=false;
export const wasSessionReplaced=()=>sessionReplaced;
export async function pendingSessionReplacement(){
 if(sessionReplaced)return true;
 return (await AsyncStorage.getItem(REPLACED))==='1';
}
export const isSessionReplaced=(e:unknown)=>e instanceof ApiError&&e.status===401&&
  e.message==='Session replaced by a sign-in on another device';
let legacyFlight:Promise<void>|null=null;
let cleanupFlight:Promise<void>=Promise.resolve();
const listeners=new Set<()=>void>();
export class ApiError extends Error{constructor(message:string,public status=0){super(message);}}
export function onSessionEnded(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
function announceSessionEnded(reason:'login'|'logout'|'replaced'='logout'){
 if(typeof window==='undefined')return;
 try{window.localStorage?.setItem('dhahabi_user_session_ended',reason+':'+Date.now()+':'+Math.random());}catch{}
}
export function clearSession(announce=true,preserveFactors=false):Promise<void>{
 epoch++;session=null;blocked=false;sessionReplaced=preserveFactors;
 closeSessionVault();listeners.forEach(fn=>fn());
 // Other tabs invalidate their memory without erasing a newly authenticated tab's vault.
 if(!announce)return cleanupFlight;
 announceSessionEnded(preserveFactors?'replaced':'logout');
 const cleanup=async()=>{
  if(preserveFactors){
   // Preserve local PIN verifier, public WebAuthn credential and encrypted vault;
   // its old JWTs are not authoritative after server-side revocation.
   await AsyncStorage.setItem(REPLACED,'1');
   await AsyncStorage.multiRemove([ACCESS,REFRESH]);
  }else{
   await clearSessionVault();
   await AsyncStorage.multiRemove([ACCESS,REFRESH,PROFILE,REPLACED]);
  }
 };
 cleanupFlight=cleanupFlight.then(cleanup,cleanup);return cleanupFlight;
}
/** Tokens remain in memory only. Locking invalidates in-flight API operations. */
export function lockSession(){epoch++;blocked=true;refreshFlight=null;}
export function sessionGeneration(){return epoch;}
export function activeSessionTokens():SessionTokens{
 if(!session)throw new ApiError('انتهت الجلسة. سجّل الدخول بكلمة المرور.',401);
 return {...session};
}
export async function restoreLegacySession(){
 if(!legacyFlight){const started=epoch;
  legacyFlight=(async()=>{
   const accessToken=await AsyncStorage.getItem(ACCESS),refreshToken=await AsyncStorage.getItem(REFRESH);
   // One-time migration into memory. Existing purchases and Push bindings are untouched.
   await AsyncStorage.multiRemove([ACCESS,REFRESH]);
   if(started===epoch&&!session&&accessToken&&refreshToken)session={accessToken,refreshToken};
  })();
 }await legacyFlight;
}
export async function hasSession(){return !!session||await hasSessionVault();}
export interface VerifiedCachedUser{ id:string|number;email:string;role:'user';name?:string; }
export async function getVerifiedCachedUser():Promise<VerifiedCachedUser|null>{
 try{
  const value=await AsyncStorage.getItem(PROFILE);
  if(!value)return null;
  const data=JSON.parse(value);
  if(data?.role!=='user'||!(typeof data.id==='string'||typeof data.id==='number')||typeof data.email!=='string'||!data.email.includes('@'))return null;
  return {id:data.id,email:data.email,role:'user',...(typeof data.name==='string'&&data.name.trim()?{name:data.name.trim().slice(0,120)}:{})};
 }catch{return null;}
}
export async function saveVerifiedUser(user:VerifiedCachedUser){
 await AsyncStorage.setItem(PROFILE,JSON.stringify({id:user.id,email:user.email,role:'user',...(user.name?.trim()?{name:user.name.trim().slice(0,120)}:{})}));
}
export async function saveSession(tokens:any){
 if(typeof tokens?.accessToken!=='string'||!tokens.accessToken||typeof tokens?.refreshToken!=='string'||!tokens.refreshToken)throw new ApiError('استجابة الدخول غير مكتملة.');
 epoch++;blocked=false;sessionReplaced=false;session={accessToken:tokens.accessToken,refreshToken:tokens.refreshToken};
 await AsyncStorage.multiRemove([ACCESS,REFRESH,PROFILE,REPLACED]);
}
export function resumeSession(tokens:SessionTokens){session={...tokens};blocked=false;epoch++;}
export function errorMessage(e:unknown){
 if(!(e instanceof ApiError))return 'تعذر إكمال العملية. حاول مرة أخرى.';
 const messages:Record<string,string>={'Invalid credentials':'البريد الإلكتروني أو كلمة المرور غير صحيحة.','Email already exists':'هذا البريد مسجل بالفعل. استخدم تسجيل الدخول.',
 'Email or mobile number already exists':'البريد الإلكتروني أو رقم الجوال مسجل بالفعل. استخدم تسجيل الدخول.',
 'A valid mobile number is required':'أدخل رقم جوال صحيحًا.',
 'Password exceeds 72 bytes':'كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.',
 'Email verification is unavailable':'التحقق بالبريد غير متاح حاليًا. حاول لاحقًا.',
 'Verification email could not be sent':'تعذر إرسال رمز التحقق. حاول لاحقًا.',
 'Email recovery is unavailable':'استعادة كلمة المرور غير متاحة الآن. حاول لاحقًا.',
 'Invalid or expired recovery code':'رمز الاستعادة غير صحيح أو انتهت صلاحيته.',
 'Password changed. Sign in with your new password.':'تم تغيير كلمة المرور. سجّل الدخول مجددًا.',
 'Session has expired':'انتهت الجلسة. سجّل الدخول مجددًا.',
 'Session replaced by a sign-in on another device':SESSION_REPLACED_MESSAGE,
 'Invalid or expired verification code':'رمز التحقق غير صحيح أو انتهت صلاحيته.',
 'Registration has expired; start again':'انتهت جلسة التسجيل. أعد إدخال بياناتك لطلب رمز جديد.',
 'Too many verification requests; try again later':'محاولات كثيرة. انتظر قبل طلب رمز جديد.',
 'Wait before requesting another verification email':'انتظر دقيقة قبل طلب رمز تحقق آخر.','Cannot delete a portfolio that has purchases':'احذف سجلات المشتريات المرتبطة أولًا، ثم احذف المحفظة.','User app role mismatch':'هذا التطبيق مخصص لحساب المستخدم فقط.'};
 return messages[e.message]||(e.status===401?'انتهت الجلسة. سجّل الدخول مجددًا.':e.status===403?'ليست لديك صلاحية لهذه العملية.':e.status>=500?'الخادم غير متاح حاليًا. حاول لاحقًا.':e.message);
}
async function raw(path:string,options:RequestInit={},token?:string){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const headers=new Headers(options.headers);if(options.body)headers.set('Content-Type','application/json');if(token)headers.set('Authorization','Bearer '+token);
  const response=await fetch(API_BASE+path,{...options,headers,signal:controller.signal,cache:'no-store'});
  const body=await response.text();let data:any=null;try{data=body?JSON.parse(body):null;}catch{if(response.ok)throw new ApiError('استجابة الخادم غير صالحة.');}
  if(!response.ok){
   const details=data?.error?.details;
   const message=Array.isArray(data?.message)?data.message.join('، '):data?.message||
     (Array.isArray(details)?details.join('، '):data?.error?.message)||'تعذر تنفيذ الطلب.';
   throw new ApiError(message,response.status);
  }
  return data;
 }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.');}finally{clearTimeout(timer);}
}
/** Public only: no session token, refresh, or access to authenticated user endpoints. */
export async function publicRecoveryRequest(path:'/auth/password-reset/config'|'/auth/password-reset/request'|'/auth/password-reset/confirm',data?:object){
 return raw(path,data?{method:'POST',body:JSON.stringify(data)}:{});
}
export async function registrationRequest(path:'/auth/register'|'/auth/register/resend'|'/auth/registration/config',data?:object){
 return raw(path,data?{method:'POST',body:JSON.stringify(data)}:{});
}
export async function authenticate(path:'/auth/login'|'/auth/register/verify',data:object){
 const started=epoch,tokens=await raw(path,{method:'POST',body:JSON.stringify(data)});
 await cleanupFlight;
 if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
 announceSessionEnded('login');
 closeSessionVault();await saveSession(tokens);
}
/** Called ONLY after the local PIN/biometric vault is successfully opened.
 * This path deliberately does not erase encrypted factors on a recoverable 401.
 * If the server rejects both refresh and device grant, password login is required.
 */
export async function verifyQuickSessionWithRecovery(
 tokens:SessionTokens,grant:DeviceGrant|null,expectedAccountId:string
):Promise<{userId:string;email:string;role:string}> {
 resumeSession(tokens);
 const started=epoch;
 const meFor=async(accessToken:string)=>{
  const result=await raw('/auth/me',{},accessToken);
  if(result?.role!=='user'||String(result?.userId)!==expectedAccountId)
   throw new ApiError('الحساب الحالي لا يطابق الدخول السريع.',403);
  return result;
 };
 try {
  const verified=await meFor(tokens.accessToken);
  if(epoch!==started)throw new ApiError('تغيرت الجلسة.',401);
  return verified;
 }catch(err) {if(!(err instanceof ApiError)||err.status!==401)throw err;}
 let next:SessionTokens;
 try {
  const renewed=await raw('/auth/refresh',{method:'POST',
   body:JSON.stringify({refreshToken:tokens.refreshToken})});
  next={accessToken:renewed.accessToken,refreshToken:renewed.refreshToken};
 }catch(err) {
  if(!(err instanceof ApiError)||err.status!==401)throw err;
  if(!grant)throw new ApiError('انتهت الجلسة. سجّل الدخول بكلمة المرور لتوثيق هذا الجهاز.',401);
  const renewed=await raw('/auth/device/renew',{method:'POST',
   body:JSON.stringify({deviceId:grant.deviceId,secret:grant.secret})});
  next={accessToken:renewed.accessToken,refreshToken:renewed.refreshToken};
 }
 if(typeof next?.accessToken!=='string'||typeof next?.refreshToken!=='string')
  throw new ApiError('استجابة الجلسة غير صالحة.');
 if(epoch!==started)throw new ApiError('تغيرت الجلسة.',401);
 const me=await meFor(next.accessToken);
 if(epoch!==started)throw new ApiError('تغيرت الجلسة.',401);
 resumeSession(next);
 await persistVaultSession(next);
 return me;
}
export async function registerQuickDeviceGrant():Promise<DeviceGrant>{
 const result=await api<DeviceGrant>('/auth/device/register',{method:'POST'});
 if(!result||typeof result.deviceId!=='string'||typeof result.secret!=='string')
  throw new ApiError('تعذر تسجيل الجهاز الموثوق.');
 return result;
}
async function refreshAccess(expiredToken:string|null):Promise<string>{
 if(!refreshFlight){const started=epoch;
  const refresh=async()=>{
   const current=session?.accessToken;if(current&&current!==expiredToken)return current;
   const refreshToken=session?.refreshToken;if(!refreshToken)throw new ApiError('انتهت الجلسة.',401);
   const tokens=await raw('/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken})});
   if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
   if(!tokens?.accessToken||!tokens?.refreshToken)throw new ApiError('استجابة الجلسة غير صالحة.');
   await persistVaultSession(tokens);
   if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
   session={accessToken:tokens.accessToken,refreshToken:tokens.refreshToken};return tokens.accessToken as string;
  };
  const flight:Promise<string>=(async()=>{if(typeof navigator!=='undefined'&&navigator.locks)return await navigator.locks.request('dhahabi-user-refresh',refresh);return await refresh();})();
  const tracked=flight.catch(async e=>{if(started===epoch&&e instanceof ApiError&&e.status===401)await clearSession(true,isSessionReplaced(e));throw e;}).finally(()=>{if(refreshFlight===tracked)refreshFlight=null;});
  refreshFlight=tracked;
 }return refreshFlight!;
}
export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{
 const started=epoch,token=session?.accessToken||null;
 if(blocked||!token&&!path.startsWith('/prices/'))throw new ApiError('الجلسة مقفلة. استخدم رمز الدخول أو كلمة المرور.',401);
 try{const result=await raw(path,options,token||undefined);if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);return result;}
 catch(e){
  if(!(e instanceof ApiError)||e.status!==401||started!==epoch)throw e;
  if(isSessionReplaced(e)){await clearSession(true,true);throw e;}
  const current=session?.accessToken,next=current&&current!==token?current:await refreshAccess(token);
  try{const result=await raw(path,options,next);if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);return result;}
  catch(retry){if(retry instanceof ApiError&&retry.status===401&&started===epoch)await clearSession(true,isSessionReplaced(retry));throw retry;}
 }
}
/** Logout is server-side session revocation; failed network calls must not
 * prevent clearing local tokens, but are surfaced to the caller.
 */
export async function revokeServerSession(){
 if(!session?.accessToken)return;
 await raw('/auth/logout',{method:'POST'},session.accessToken);
}
export const jsonRequest=(method:string,data?:object):RequestInit=>({method,...(data?{body:JSON.stringify(data)}:{})});
