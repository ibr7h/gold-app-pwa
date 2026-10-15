import AsyncStorage from '@react-native-async-storage/async-storage';

/** Browser storage contains authenticated ciphertext, never tokens or an encryption key.
 * A PIN is a convenience factor with a finite offline search space; server authorization
 * is always required after decryption. WebAuthn PRF is used where the authenticator supports it.
 */
export interface SessionTokens {accessToken:string;refreshToken:string}
interface Box {iv:string;cipher:string}
interface Vault {
 version:1;accountId:string;origin:string;session:Box;
 pin?:{salt:string;box:Box};biometric?:Box;
 biometricCredentialId?:string;
 /** Staged envelope retains the previous credential through interrupted enrollment. */
 biometricPending?:{credentialId:string;box:Box};
}
const STORAGE='dhahabi_user_session_vault_v1';
const ITERATIONS=210000;
let opened:{accountId:string;key:CryptoKey;rawKey:Uint8Array}|null=null;
let generation=0;
let writes:Promise<unknown>=Promise.resolve();
function exclusive<T>(operation:()=>Promise<T>):Promise<T>{
 const requested=generation;
 const run=async():Promise<T>=>{
  assertCurrent(requested);
  const guarded=()=>{assertCurrent(requested);return operation();};
  return typeof navigator!=='undefined'&&navigator.locks
   ?await navigator.locks.request('dhahabi-user-vault',guarded):await guarded();
 };
 const result=writes.then(run,run);writes=result.catch(()=>{});return result;
}
const hex=(value:Uint8Array)=>Array.from(value,b=>b.toString(16).padStart(2,'0')).join('');
function bytes(value:string):Uint8Array{
 if(!/^(?:[a-f0-9]{2})+$/.test(value))throw new Error('بيانات الجلسة المشفرة غير صالحة.');
 return Uint8Array.from(value.match(/../g)!,v=>parseInt(v,16));
}
const buffer=(value:Uint8Array)=>Uint8Array.from(value).buffer as ArrayBuffer;
const random=(length:number)=>crypto.getRandomValues(new Uint8Array(length));
const supported=()=>typeof window!=='undefined'&&window.isSecureContext&&typeof crypto!=='undefined'&&!!crypto.subtle;
const aad=(accountId:string)=>new TextEncoder().encode('dhahabi-user-v1:'+location.origin+':'+accountId);
async function keyOf(raw:Uint8Array){return crypto.subtle.importKey('raw',buffer(raw),'AES-GCM',false,['encrypt','decrypt']);}
async function pinKey(pin:string,salt:Uint8Array){
 if(!/^[0-9]{6}$/.test(pin))throw new Error('أدخل رمزًا من ٦ أرقام.');
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt:buffer(salt),iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(key:CryptoKey,value:Uint8Array,accountId:string):Promise<Box>{
 const iv=random(12);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:buffer(iv),additionalData:aad(accountId)},key,buffer(value));
 return {iv:hex(iv),cipher:hex(new Uint8Array(cipher))};
}
async function unseal(key:CryptoKey,box:Box,accountId:string){
 return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:buffer(bytes(box.iv)),additionalData:aad(accountId)},key,buffer(bytes(box.cipher))));
}
async function read():Promise<Vault|null>{
 try{
  const value=await AsyncStorage.getItem(STORAGE);if(!value)return null;
  const v=JSON.parse(value) as Vault;
  return v.version===1&&typeof v.accountId==='string'&&v.origin===location.origin&&v.session&&
   (v.pin||v.biometric||v.biometricPending)?v:null;
 }catch{return null;}
}
export async function hasSessionVault(accountId?:string):Promise<boolean>{
 if(!supported())return false;
 const v=await read();return !!v&&(!accountId||v.accountId===accountId);
}
export async function hasBiometricVault(accountId:string,credentialId?:string):Promise<boolean>{
 const v=await read();if(!v||v.accountId!==accountId)return false;
 if(credentialId&&v.biometricPending?.credentialId===credentialId)return true;
 return !!v.biometric&&(!credentialId||!v.biometricCredentialId||v.biometricCredentialId===credentialId);
}
export function hasOpenVault(accountId:string){return opened?.accountId===accountId;}
export function closeSessionVault(){generation++;opened=null;}
export async function clearSessionVault(){
 closeSessionVault();
 const remove=()=>AsyncStorage.removeItem(STORAGE);
 const result=writes.then(remove,remove);writes=result.catch(()=>{});await result;
}
function assertCurrent(started:number){if(started!==generation)throw new Error('تغيرت الجلسة. استخدم كلمة المرور.');}
async function prepare(accountId:string,tokens:SessionTokens):Promise<Vault>{
 if(!supported())throw new Error('حفظ الجلسة المشفرة يحتاج HTTPS ومتصفحًا حديثًا.');
 const started=generation;
 const old=await read();
 assertCurrent(started);
 let current=opened?.accountId===accountId?opened:null;
 // Never silently rotate the vault key: an old PIN or biometric envelope would
 // continue to exist but could no longer decrypt the newly sealed session.
 // Reconnect with an existing local factor before adding/changing another.
 if(old?.accountId===accountId&&!current)
  throw new Error('افتح الجلسة أولًا برمز الدخول أو البصمة المحفوظة، ثم أعد إعداد وسيلة الدخول.');
 const reused=!!current;
 if(!current){const rawKey=random(32);current={accountId,rawKey,key:await keyOf(rawKey)};}
 const session=await seal(current.key,new TextEncoder().encode(JSON.stringify(tokens)),accountId);
 assertCurrent(started);opened=current;
 return {...(reused&&old?.accountId===accountId?old:{version:1 as const,accountId,origin:location.origin}),session};
}
async function protectWithPin(accountId:string,pin:string,tokens:SessionTokens){
 const started=generation;
 const v=await prepare(accountId,tokens),salt=random(16);
 const rawKey=opened!.rawKey;
 const box=await seal(await pinKey(pin,salt),rawKey,accountId);
 assertCurrent(started);
 await AsyncStorage.setItem(STORAGE,JSON.stringify({...v,pin:{salt:hex(salt),box}}));
}
async function protectWithBiometric(accountId:string,secret:Uint8Array,tokens:SessionTokens,credentialId?:string){
 const started=generation,v=await prepare(accountId,tokens);
 const box=await seal(await keyOf(secret),opened!.rawKey,accountId);
 assertCurrent(started);
 // Stage under the new ID; never overwrite the previous biometric before
 // its replacement public credential is saved in local storage.
 const next=credentialId?{...v,biometricPending:{credentialId,box}}:{...v,biometric:box};
 await AsyncStorage.setItem(STORAGE,JSON.stringify(next));
}
/** Commit after the public credential is durable. Unlock can use pending
 * during an interrupted commit, so a second write failure is also recoverable.
 */
async function promoteBiometric(accountId:string,credentialId:string){
 const started=generation,v=await read();
 if(!v||v.accountId!==accountId||v.biometricPending?.credentialId!==credentialId)return;
 assertCurrent(started);
 const {biometricPending,...rest}=v;
 await AsyncStorage.setItem(STORAGE,JSON.stringify({...rest,
  biometric:biometricPending.box,biometricCredentialId:credentialId}));
}
async function open(accountId:string,rawKey:Uint8Array,v:Vault):Promise<SessionTokens>{
 const started=generation,key=await keyOf(rawKey);
 const tokens=JSON.parse(new TextDecoder().decode(await unseal(key,v.session,accountId))) as SessionTokens;
 if(typeof tokens.accessToken!=='string'||!tokens.accessToken||typeof tokens.refreshToken!=='string'||!tokens.refreshToken)throw new Error('الجلسة المشفرة غير صالحة.');
 assertCurrent(started);opened={accountId,rawKey,key};return tokens;
}
async function unlockWithPin(accountId:string,pin:string):Promise<SessionTokens>{
 const started=generation,v=await read();
 if(!v?.pin||v.accountId!==accountId)throw new Error('استخدم كلمة المرور لاستعادة الجلسة وإعداد رمز جديد.');
 const rawKey=await unseal(await pinKey(pin,bytes(v.pin.salt)),v.pin.box,accountId);
 assertCurrent(started);return open(accountId,rawKey,v);
}
async function unlockWithBiometric(accountId:string,secret:Uint8Array|null,credentialId?:string):Promise<SessionTokens>{
 const started=generation,v=await read();
 if(!v||v.accountId!==accountId)throw new Error('استخدم كلمة المرور لاستعادة الجلسة.');
 const staged=credentialId&&v.biometricPending?.credentialId===credentialId?v.biometricPending.box:null;
 const saved=v.biometric&&(!credentialId||!v.biometricCredentialId||v.biometricCredentialId===credentialId)
  ?v.biometric:null;
 const envelope=staged||saved;
 const rawKey=secret&&envelope?await unseal(await keyOf(secret),envelope,accountId):opened?.accountId===accountId?opened.rawKey:null;
 if(!rawKey)throw new Error('متصفحك يحتاج رمز الدخول أو كلمة المرور بعد إعادة فتح التطبيق.');
 assertCurrent(started);return open(accountId,rawKey,v);
}
async function persistSession(tokens:SessionTokens){
 if(!opened)return;
 const started=generation,v=await read(),current=opened;
 if(!current||!v||v.accountId!==current.accountId)return;
 const session=await seal(current.key,new TextEncoder().encode(JSON.stringify(tokens)),current.accountId);
 assertCurrent(started);await AsyncStorage.setItem(STORAGE,JSON.stringify({...v,session}));
}
async function removeMethod(accountId:string,method:'pin'|'biometric'){
 const v=await read();if(!v||v.accountId!==accountId)return;
 delete v[method];
 if(method==='biometric'){delete v.biometricPending;delete v.biometricCredentialId;}
 if(!v.pin&&!v.biometric&&!v.biometricPending){closeSessionVault();await AsyncStorage.removeItem(STORAGE);return;}
 await AsyncStorage.setItem(STORAGE,JSON.stringify(v));
}
export const protectSessionWithPin=(accountId:string,pin:string,tokens:SessionTokens)=>exclusive(()=>protectWithPin(accountId,pin,tokens));
export const protectSessionWithBiometric=(accountId:string,secret:Uint8Array,tokens:SessionTokens,credentialId?:string)=>exclusive(()=>protectWithBiometric(accountId,secret,tokens,credentialId));
export const promoteSessionBiometric=(accountId:string,credentialId:string)=>exclusive(()=>promoteBiometric(accountId,credentialId));
export const unlockSessionWithPin=(accountId:string,pin:string)=>exclusive(()=>unlockWithPin(accountId,pin));
export const unlockSessionWithBiometric=(accountId:string,secret:Uint8Array|null,credentialId?:string)=>exclusive(()=>unlockWithBiometric(accountId,secret,credentialId));
export const persistVaultSession=(tokens:SessionTokens)=>exclusive(()=>persistSession(tokens));
export const removeVaultMethod=(accountId:string,method:'pin'|'biometric')=>exclusive(()=>removeMethod(accountId,method));
