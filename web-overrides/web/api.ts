import AsyncStorage from '@react-native-async-storage/async-storage';
export const API_BASE='https://gold-app-api-u8dl.onrender.com';
const ACCESS='dhahabi_access_token',REFRESH='dhahabi_refresh_token';
let epoch=0,refreshFlight:Promise<string>|null=null;
const listeners=new Set<()=>void>();
export class ApiError extends Error{constructor(message:string,public status=0){super(message);}}
export function onSessionEnded(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
export async function clearSession(){epoch++;await AsyncStorage.multiRemove([ACCESS,REFRESH,'dhahabi_user']);listeners.forEach(fn=>fn());}
export async function hasSession(){return !!(await AsyncStorage.getItem(REFRESH));}
export async function saveSession(tokens:any){
 if(!tokens?.accessToken||!tokens?.refreshToken)throw new ApiError('استجابة الدخول غير مكتملة.');
 epoch++;await AsyncStorage.multiSet([[ACCESS,tokens.accessToken],[REFRESH,tokens.refreshToken]]);
}
export function errorMessage(e:unknown){
 if(!(e instanceof ApiError))return 'تعذر إكمال العملية. حاول مرة أخرى.';
 const messages:Record<string,string>={'Invalid credentials':'البريد الإلكتروني أو كلمة المرور غير صحيحة.','Email already exists':'هذا البريد مسجل بالفعل. استخدم تسجيل الدخول.','Cannot delete a portfolio that has purchases':'احذف سجلات المشتريات المرتبطة أولًا، ثم احذف المحفظة.'};
 return messages[e.message]||(e.status===401?'انتهت الجلسة. سجّل الدخول مجددًا.':e.status===403?'ليست لديك صلاحية لهذه العملية.':e.status>=500?'الخادم غير متاح حاليًا. حاول لاحقًا.':e.message);
}
async function raw(path:string,options:RequestInit={},token?:string){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
 try{
  const headers=new Headers(options.headers);if(options.body)headers.set('Content-Type','application/json');if(token)headers.set('Authorization','Bearer '+token);
  const response=await fetch(API_BASE+path,{...options,headers,signal:controller.signal,cache:'no-store'});
  const body=await response.text();let data:any=null;try{data=body?JSON.parse(body):null;}catch{if(response.ok)throw new ApiError('استجابة الخادم غير صالحة.');}
  if(!response.ok){const message=data?.error?.message??data?.message;throw new ApiError(Array.isArray(message)?message.join('، '):message||'تعذر تنفيذ الطلب.',response.status);}
  return data;
 }catch(e){if(e instanceof ApiError)throw e;if(controller.signal.aborted)throw new ApiError('تأخر الخادم في الاستجابة. انتظر قليلًا ثم حاول مجددًا.');if(typeof navigator!=='undefined'&&navigator.onLine===false)throw new ApiError('الجهاز غير متصل بالإنترنت. أعد الاتصال ثم حاول مجددًا.');throw new ApiError('تعذر الوصول إلى الخادم. قد تكون المشكلة مؤقتة في الخادم أو الاتصال. حاول مجددًا.');}finally{clearTimeout(timer);}
}
export async function authenticate(path:'/auth/login'|'/auth/register',data:object){await saveSession(await raw(path,{method:'POST',body:JSON.stringify(data)}));}
async function refreshAccess(expiredToken:string|null):Promise<string>{
 if(!refreshFlight){const started=epoch;
  const refresh=async()=>{
   const current=await AsyncStorage.getItem(ACCESS);if(current&&current!==expiredToken)return current;
   const refreshToken=await AsyncStorage.getItem(REFRESH);if(!refreshToken)throw new ApiError('انتهت الجلسة.',401);
   const tokens=await raw('/auth/refresh',{method:'POST',body:JSON.stringify({refreshToken})});
   if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);
   if(!tokens?.accessToken||!tokens?.refreshToken)throw new ApiError('استجابة الجلسة غير صالحة.');
   await AsyncStorage.multiSet([[ACCESS,tokens.accessToken],[REFRESH,tokens.refreshToken]]);return tokens.accessToken as string;
  };
  const flight:Promise<string>=(async()=>{if(typeof navigator!=='undefined'&&navigator.locks)return await navigator.locks.request('dhahabi-full-refresh',refresh);return await refresh();})();
  refreshFlight=flight.catch(async e=>{if(started===epoch&&e instanceof ApiError&&e.status===401)await clearSession();throw e;}).finally(()=>{refreshFlight=null;});
 }return refreshFlight!;
}
export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{
 const started=epoch,token=await AsyncStorage.getItem(ACCESS);
 try{const result=await raw(path,options,token||undefined);if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);return result;}
 catch(e){
  if(!(e instanceof ApiError)||e.status!==401||started!==epoch)throw e;
  const current=await AsyncStorage.getItem(ACCESS),next=current&&current!==token?current:await refreshAccess(token);
  try{const result=await raw(path,options,next);if(started!==epoch)throw new ApiError('تغيرت الجلسة.',401);return result;}
  catch(retry){if(retry instanceof ApiError&&retry.status===401&&started===epoch)await clearSession();throw retry;}
 }
}
export const jsonRequest=(method:string,data?:object):RequestInit=>({method,...(data?{body:JSON.stringify(data)}:{})});
