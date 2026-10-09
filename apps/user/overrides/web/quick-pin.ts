import AsyncStorage from '@react-native-async-storage/async-storage';

/** Local convenience lock, not a substitute for the server's authenticated JWT session.
 * Only salted PBKDF2 hashes are stored. No PIN or biometric template is persisted.
 */
export const PIN_LENGTH=6;
const KEY='dhahabi_user_quick_pin_v1';
const ITERATIONS=210000;
const MAX_ATTEMPTS=5;
const LOCK_MS=15*60*1000;
interface PinRecord{
 version:1;accountId:string;origin:string;salt:string;hash:string;
 failures:number;lockedUntil:number;
}
export interface PinResult{ok:boolean;waitSeconds:number;remaining:number}
const encode=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const decode=(text:string)=>new Uint8Array((text.match(/.{2}/g)||[]).map(x=>parseInt(x,16)));
const validPin=(pin:string)=>new RegExp('^[0-9]{'+PIN_LENGTH+'}$').test(pin);
async function digest(pin:string,salt:Uint8Array):Promise<string>{
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt as BufferSource,iterations:ITERATIONS},material,256);
 return encode(new Uint8Array(bits));
}
const same=(a:string,b:string)=>{
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
};
function recordValid(value:unknown):value is PinRecord{
 const p=value as Partial<PinRecord>|null;
 return !!p&&p.version===1&&typeof p.accountId==='string'&&
  p.origin===location.origin&&typeof p.hash==='string'&&/^[a-f0-9]{64}$/.test(p.hash)&&
  typeof p.salt==='string'&&/^[a-f0-9]{32}$/.test(p.salt)&&
  Number.isInteger(p.failures)&&p.failures>=0&&Number.isFinite(p.lockedUntil);
}
async function read():Promise<PinRecord|null>{
 try{const value=await AsyncStorage.getItem(KEY);if(!value)return null;const data=JSON.parse(value);return recordValid(data)?data:null;}catch{return null;}
}
export async function hasQuickPin(accountId:string):Promise<boolean>{
 if(typeof window==='undefined'||!window.isSecureContext||!crypto?.subtle)return false;
 const p=await read();return !!p&&p.accountId===accountId;
}
export async function setQuickPin(accountId:string,pin:string):Promise<void>{
 if(!accountId||!validPin(pin))throw new Error('رمز الدخول السريع يجب أن يتكوّن من ٦ أرقام.');
 if(typeof window==='undefined'||!window.isSecureContext||!crypto?.subtle)throw new Error('الدخول السريع يحتاج اتصال HTTPS ومتصفحًا حديثًا.');
 const salt=new Uint8Array(16);crypto.getRandomValues(salt);
 const hash=await digest(pin,salt);
 const p:PinRecord={version:1,accountId,origin:location.origin,salt:encode(salt),hash,failures:0,lockedUntil:0};
 await AsyncStorage.setItem(KEY,JSON.stringify(p));
}
export async function removeQuickPin(accountId:string):Promise<void>{
 const p=await read();if(p?.accountId===accountId)await AsyncStorage.removeItem(KEY);
}
export async function checkQuickPin(accountId:string,pin:string):Promise<PinResult>{
 const p=await read();
 if(!p||p.accountId!==accountId||!validPin(pin))return {ok:false,waitSeconds:0,remaining:0};
 const now=Date.now();
 if(now<p.lockedUntil)return {ok:false,waitSeconds:Math.ceil((p.lockedUntil-now)/1000),remaining:0};
 // Persist wrong attempts before returning; after five attempts impose a stored 15m lockout.
 const hash=await digest(pin,decode(p.salt));
 if(same(hash,p.hash)){
  await AsyncStorage.setItem(KEY,JSON.stringify({...p,failures:0,lockedUntil:0}));
  return {ok:true,waitSeconds:0,remaining:MAX_ATTEMPTS};
 }
 const failures=p.failures+1,locked=failures>=MAX_ATTEMPTS;
 const lockedUntil=locked?Date.now()+LOCK_MS:0;
 await AsyncStorage.setItem(KEY,JSON.stringify({...p,failures:locked?0:failures,lockedUntil}));
 return {ok:false,waitSeconds:locked?Math.ceil(LOCK_MS/1000):0,remaining:Math.max(0,MAX_ATTEMPTS-failures)};
}
