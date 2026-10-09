import AsyncStorage from '@react-native-async-storage/async-storage';
import {getSessionKey} from './device-key';
const VAULT='dhahabi_user_session_vault_v1';
const ACCESS='dhahabi_user_access_token',REFRESH='dhahabi_user_refresh_token';
export interface SessionTokens{accessToken:string;refreshToken:string}
let volatile:SessionTokens|null=null;
let persisted=false;
let lastCipher:string|null=null;
let queue:Promise<unknown>=Promise.resolve();
export function sessionTransaction<T>(fn:()=>Promise<T>):Promise<T>{
 const next=queue.then(fn,fn);queue=next.catch(()=>{});return next;
}
const encode=(b:Uint8Array)=>btoa(Array.from(b,x=>String.fromCharCode(x)).join(''));
const decode=(s:string)=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
const aad=()=>new TextEncoder().encode(location.origin+'|dhahabi-user-session-v1');
function valid(t:unknown):t is SessionTokens{
 const p=t as SessionTokens|null;
 return !!p&&typeof p.accessToken==='string'&&!!p.accessToken&&typeof p.refreshToken==='string'&&!!p.refreshToken;
}
export async function writeSessionTokens(tokens:SessionTokens):Promise<void>{
 if(!valid(tokens))throw new Error('استجابة الجلسة غير صالحة.');
 volatile={...tokens};
 try{
  const key=await getSessionKey(true),iv=crypto.getRandomValues(new Uint8Array(12));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad()},key,new TextEncoder().encode(JSON.stringify(tokens)));
  lastCipher=JSON.stringify({version:1,iv:encode(iv),data:encode(new Uint8Array(data))});
  await AsyncStorage.setItem(VAULT,lastCipher);
  persisted=true;
 }catch{
  // Fail to a tab-only session, never to plaintext token persistence.
  await AsyncStorage.removeItem(VAULT);
  persisted=false;
 }
 await AsyncStorage.multiRemove([ACCESS,REFRESH]);
}
export async function readSessionTokens():Promise<SessionTokens|null>{
 if(volatile&&!persisted)return {...volatile};
 const raw=await AsyncStorage.getItem(VAULT);
 if(volatile&&raw===lastCipher)return {...volatile};
 if(raw){
  const p=JSON.parse(raw);
  if(p?.version!==1||typeof p.iv!=='string'||typeof p.data!=='string')throw new Error('الجلسة المحفوظة غير صالحة.');
  const iv=decode(p.iv);if(iv.length!==12)throw new Error('الجلسة المحفوظة غير صالحة.');
  const key=await getSessionKey(false);
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad()},key,decode(p.data));
  const tokens:unknown=JSON.parse(new TextDecoder().decode(clear));
  if(!valid(tokens))throw new Error('الجلسة المحفوظة غير صالحة.');
  volatile=tokens;
  persisted=true;
  lastCipher=raw;
  // A previous interrupted migration must never leave legacy bearer tokens behind.
  await AsyncStorage.multiRemove([ACCESS,REFRESH]);
  return {...tokens};
 }
 // One-time migration, with the same tokens and account; no data or subscription deletion.
 const [accessToken,refreshToken]=await Promise.all([AsyncStorage.getItem(ACCESS),AsyncStorage.getItem(REFRESH)]);
 if(!refreshToken)return null;
 const tokens={accessToken:accessToken||'',refreshToken};
 if(!accessToken){await AsyncStorage.multiRemove([ACCESS,REFRESH]);return null;}
 await writeSessionTokens(tokens);return tokens;
}
export async function storedSessionExists():Promise<boolean>{
 // Protect legacy tokens before displaying even the locked account hint.
 if(await AsyncStorage.getItem(REFRESH)){await readSessionTokens();sealSessionMemory();}
 return !!(volatile||await AsyncStorage.getItem(VAULT));
}
export async function eraseSessionTokens():Promise<void>{
 volatile=null;persisted=false;lastCipher=null;await AsyncStorage.multiRemove([VAULT,ACCESS,REFRESH]);
}
/** Clear decrypted cache on locking/reload; memory-only sessions retain their tab-local tokens. */
export function sealSessionMemory():void{if(persisted)volatile=null;}
export async function sessionIsPersistent():Promise<boolean>{
 try{return !!await AsyncStorage.getItem(VAULT);}catch{return false;}
}
