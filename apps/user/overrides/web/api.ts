import AsyncStorage from '@react-native-async-storage/async-storage';
import {readSessionTokens,writeSessionTokens,eraseSessionTokens,storedSessionExists,sessionTransaction,sealSessionMemory} from './session-vault';
export {sessionIsPersistent} from './session-vault';
export const API_BASE='https://gold-app-api-u8dl.onrender.com';
const PROFILE='dhahabi_user_profile';
let epoch=0,locked=false,refreshFlight:Promise<string>|null=null;
const listeners=new Set<()=>void>();
export class ApiError extends Error{constructor(message:string,public status=0){super(message);}}
export class SessionLockedError extends ApiError{constructor(){super('افتح قفل ذهبي أولًا.',423);}}
export function onSessionEnded(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
export function lockSession(){epoch++;locked=true;refreshFlight=null;sealSessionMemory();}
export function openSession(){locked=false;}
export async function clearSession(){
 epoch++;locked=false;refreshFlight=null;listeners.forEach(fn=>fn());
 await sessionTransaction(async()=>{await eraseSessionTokens();await AsyncStorage.removeItem(PROFILE);});
}
export async function hasSession(){return await sessionTransaction(storedSessionExists);}
export interface VerifiedCachedUser{ id:string|number;email:string;role:'user'; }
export async function getVerifiedCachedUser():Promise<VerifiedCachedUser|null>{
 try{
  const value=await AsyncStorage.getItem(PROFILE);if(!value)return null;const data=JSON.parse(value);
  if(data?.role!=='user'||!(typeof data.id==='string'||typeof data.id==='number')||typeof data.email!=='string'||!data.email.includes('@'))return null;
  return {id:data.id,email:data.email,role:'user'};
 }catch{return null;}
}
export async function saveVerifiedUser(user:VerifiedCachedUser){
 const started=epoch;
 await sessionTransaction(async()=>{if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
  await AsyncStorage.setItem(PROFILE,JSON.stringify({id:user.id,email:user.email,role:'user'}));});
}
export async function saveSession(tokens:any){
 if(!tokens?.accessToken||!tokens?.refreshToken)throw new ApiError('استجابة الدخول غير مكتملة.');
 const started=++epoch;
 await sessionTransaction(async()=>{if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
  await writeSessionTokens(tokens);await AsyncStorage.removeItem(PROFILE);});
}
export function errorMessage(e:unknown){
 if(!(e instanceof ApiError))return 'تعذر إكمال العملية. حاول مرة أخرى.';
 const messages:Record<string,string>={'Invalid credentials':'البريد الإلكتروني أو كلمة المرور غير صحيحة.','Email already exists':'هذا البريد مسجل بالفعل. استخدم تسجيل الدخول.','Cannot delete a portfolio that has purchases':'احذف سجلات المشتريات المرتبطة أولًا، ثم احذف المحفظة.','User app role mismatch':'هذا التطبيق مخصص لحساب المستخدم فقط.'};
 return messages[e.message]||(e.status===401?'انتهت الجلسة. سجّل الدخول مجددًا.':e.status===403?'ليست لديك صلاحية لهذه العملية.':e.status>=500?'الخادم غير متاح حاليًا. حاول لاحقًا.':e.message);
}
async function raw(path:string,options:RequestInit={},token?:string){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const headers=new Headers(options.headers);if(options.body)headers.set('Content-Type','application/json');if(token)headers.set('Authorization','Bearer '+token);
  const response=await fetch(API_BASE+path,{...options,headers,signal:controller.signal,cache:'no-store'});
  const body=await response.text();let data:any=null;try{data=body?JSON.parse(body):null;}catch{if(response.ok)throw new ApiError('استجابة الخادم غير صالحة.');}
  if(!response.ok)throw new ApiError(Array.isArray(data?.message)?data.message.join('، '):data?.message||'تعذر تنفيذ الطلب.',response.status);
  return data;
 }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.');}finally{clearTimeout(timer);}
}
export async function authenticate(path:'/auth/login'|'/auth/register',data:object){
 const started=++epoch,tokens=await raw(path,{method:'POST',body:JSON.stringify(data)});
 if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
 await saveSession(tokens);
}
/** Password step-up never installs a session for a different account. */
export async function confirmAccountPassword(accountId:string,email:string,password:string){
 const started=epoch;
 const tokens=await raw('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
 const me=await raw('/auth/me',{},tokens.accessToken);
 if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
 if(me?.role!=='user'||String(me?.userId)!==accountId)throw new ApiError('تعذر تأكيد الحساب الحالي.',403);
 await saveSession(tokens);
 await saveVerifiedUser({id:me.userId,email:me.email,role:'user'});
}
async function refreshAccess(expiredToken:string|null):Promise<string>{
 if(!refreshFlight){const started=epoch;
  const refresh=async()=>{
   const tokens=await sessionTransaction(readSessionTokens);
   if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
   if(tokens?.accessToken&&tokens.accessToken!==expiredToken)return tokens.accessToken;
   if(!tokens?.refreshToken)throw new ApiError('انتهت الجلسة.',401);
   const next=await raw('/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken:tokens.refreshToken})});
   if(!next?.accessToken||!next?.refreshToken)throw new ApiError('استجابة الجلسة غير صالحة.');
   await sessionTransaction(async()=>{if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);await writeSessionTokens(next);});
   return next.accessToken as string;
  };
  const run=async()=>typeof navigator!=='undefined'&&navigator.locks?
   await navigator.locks.request('dhahabi-user-refresh',refresh):await refresh();
  const flight=run().catch(async e=>{if(started===epoch&&e instanceof ApiError&&e.status===401)await clearSession();throw e;});
  refreshFlight=flight;
  void flight.finally(()=>{if(refreshFlight===flight)refreshFlight=null;}).catch(()=>{});
 }return refreshFlight;
}
async function requestSession<T=any>(path:string,options:RequestInit={},validation=false):Promise<T>{
 if(locked&&!validation)throw new SessionLockedError();
 const started=epoch,tokens=await sessionTransaction(readSessionTokens),token=tokens?.accessToken||null;
 const check=()=>{if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);if(locked&&!validation)throw new SessionLockedError();};
 check();
 try{const result=await raw(path,options,token||undefined);check();return result;}
 catch(e){
  if(!(e instanceof ApiError)||e.status!==401||started!==epoch)throw e;
  const next=await refreshAccess(token);check();
  try{const result=await raw(path,options,next);check();return result;}
  catch(retry){if(retry instanceof ApiError&&retry.status===401&&started===epoch)await clearSession();throw retry;}
 }
}
export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{return requestSession<T>(path,options);}
/** Only /auth/me is allowed while locked, following local verification; never a financial request. */
export async function validateSession():Promise<VerifiedCachedUser>{
 const me=await requestSession('/auth/me',{},true);
 if(!me?.userId||!me?.email)throw new ApiError('استجابة هوية المستخدم غير صالحة.');
 if(me.role!=='user')throw new ApiError('User app role mismatch',403);
 return {id:me.userId,email:me.email,role:'user'};
}
export const jsonRequest=(method:string,data?:object):RequestInit=>({method,...(data?{body:JSON.stringify(data)}:{})});
