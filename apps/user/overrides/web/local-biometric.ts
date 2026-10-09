import AsyncStorage from '@react-native-async-storage/async-storage';

// Convenience gate only. The backend JWT remains authoritative for any account data or mutation.
// Only the public part of a platform credential is kept locally; no biometric templates are stored.
export interface LocalCredential {
 version:1;
 accountId:string;
 email:string;
 rpId:string;
 credentialId:string;
 publicKeySpki:string;
 counter:number;
 prfSalt?:string;
 /** Ephemeral PRF output; non-enumerable and never serialized. */
 unlockSecret?:Uint8Array;
}
type PrfInputs=AuthenticationExtensionsClientInputs&{prf:{eval:{first:ArrayBuffer}}};
function prfResult(credential:PublicKeyCredential):Uint8Array|null{
 const extensions=credential.getClientExtensionResults?.() as {prf?:{results?:{first?:ArrayBuffer}}}|undefined;
 const value=extensions?.prf?.results?.first;
 return value&&value.byteLength===32?new Uint8Array(value):null;
}
const STORAGE='dhahabi_user_local_biometric_v1';
function b64(bytes:Uint8Array):string {
 let binary='';
 for(const b of bytes)binary+=String.fromCharCode(b);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function bytes64(value:string):Uint8Array {
 if(!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('بيانات الاعتماد غير صالحة.');
 const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function freshChallenge(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return bytes;}
function assertClientData(data:ArrayBuffer,expectedType:string,challenge:Uint8Array):void{
 const client=JSON.parse(new TextDecoder().decode(data));
 if(client.type!==expectedType||client.challenge!==b64(challenge)||client.origin!==location.origin||client.crossOrigin===true)
  throw new Error('تعذر التحقق من استجابة الجهاز.');
}
function flagsVerified(authData:Uint8Array):boolean {
 return authData.length>=37&&(authData[32]&0x05)===0x05;
}
function counterOf(authData:Uint8Array):number {
 return new DataView(authData.buffer,authData.byteOffset+33,4).getUint32(0,false);
}
function toRawSignature(signature:Uint8Array):Uint8Array {
 // WebAuthn authenticators return DER ECDSA; WebCrypto expects 32-byte R || 32-byte S.
 let i=0;
 if(signature[i++]!==0x30)throw new Error('توقيع الجهاز غير صالح.');
 let length=signature[i++];
 if(length&0x80){const octets=length&0x7f;if(octets<1||octets>2||i+octets>signature.length)throw new Error('توقيع الجهاز غير صالح.');
  length=0;for(let j=0;j<octets;j++)length=(length<<8)|signature[i++];}
 if(i+length!==signature.length)throw new Error('توقيع الجهاز غير صالح.');
 const out=new Uint8Array(64);
 for(let part=0;part<2;part++){
  if(signature[i++]!==0x02)throw new Error('توقيع الجهاز غير صالح.');
  const count=signature[i++];
  if(!count||count>33||i+count>signature.length)throw new Error('توقيع الجهاز غير صالح.');
  let value=signature.slice(i,i+count);i+=count;
  if(value[0]===0&&value.length>1)value=value.slice(1);
  if(value.length>32)throw new Error('توقيع الجهاز غير صالح.');
  out.set(value,part*32+32-value.length);
 }
 if(i!==signature.length)throw new Error('توقيع الجهاز غير صالح.');
 return out;
}
export async function localBiometricSupported():Promise<boolean> {
 if(typeof window==='undefined'||!window.isSecureContext||typeof crypto==='undefined'||!crypto.subtle||
    !('PublicKeyCredential' in window)||!navigator.credentials?.create||!navigator.credentials?.get)return false;
 try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch{return false;}
}
export async function readLocalCredential():Promise<LocalCredential|null> {
 try{
  const raw=await AsyncStorage.getItem(STORAGE);if(!raw)return null;
  const c=JSON.parse(raw);
  if(c?.version!==1||typeof c.accountId!=='string'||!c.accountId||
     typeof c.email!=='string'||typeof c.credentialId!=='string'||typeof c.publicKeySpki!=='string'||
     c.rpId!==location.hostname||!Number.isInteger(c.counter)||c.counter<0)return null;
  if(bytes64(c.credentialId).length<16||bytes64(c.publicKeySpki).length<64)return null;
  return c as LocalCredential;
 }catch{return null;}
}
export async function forgetLocalCredential():Promise<void>{await AsyncStorage.removeItem(STORAGE);}
export async function enrollLocalCredential(accountId:string,email:string,signal?:AbortSignal):Promise<LocalCredential> {
 // The platform chooser must be opened directly from the user's click (transient activation).
 if(typeof window==='undefined'||!window.isSecureContext||!navigator.credentials?.create||!crypto?.subtle)
  throw new Error('التحقق الحيوي غير مدعوم على هذا الجهاز أو المتصفح.');
 const challenge=freshChallenge();
 const userId=freshChallenge();
 const prfSalt=freshChallenge();
 const credential=await navigator.credentials.create({signal,publicKey:{
  challenge,rp:{name:'ذهبي',id:location.hostname},
  user:{id:userId,name:email,displayName:email},pubKeyCredParams:[{type:'public-key',alg:-7}],
  authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'discouraged',userVerification:'required'},
  attestation:'none',timeout:60000,extensions:{prf:{eval:{first:prfSalt.buffer as ArrayBuffer}}} as PrfInputs
 }}) as PublicKeyCredential|null;
 if(!credential||credential.type!=='public-key')throw new Error('لم يكتمل تفعيل التحقق الحيوي.');
 const response=credential.response as AuthenticatorAttestationResponse & {
  getPublicKey?:()=>ArrayBuffer|null;getPublicKeyAlgorithm?:()=>number;
  getAuthenticatorData?:()=>ArrayBuffer;
 };
 assertClientData(response.clientDataJSON,'webauthn.create',challenge);
 const key=response.getPublicKey?.();
 if(!key||response.getPublicKeyAlgorithm?.()!==-7)throw new Error('هذا الجهاز لا يدعم طريقة التحقق المحلية المطلوبة.');
 await crypto.subtle.importKey('spki',key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const authData=response.getAuthenticatorData?.();
 if(authData&&!flagsVerified(new Uint8Array(authData)))throw new Error('لم يؤكد الجهاز هوية صاحبه.');
 const secret=prfResult(credential);
 const c:LocalCredential={version:1,accountId,email,rpId:location.hostname,
  credentialId:b64(new Uint8Array(credential.rawId)),publicKeySpki:b64(new Uint8Array(key)),counter:0};
 if(secret)c.prfSalt=b64(prfSalt);
 if(signal?.aborted)throw new Error('أُلغي تفعيل بصمة الجهاز.');
 await AsyncStorage.setItem(STORAGE,JSON.stringify(c));
 if(secret)Object.defineProperty(c,'unlockSecret',{value:secret,enumerable:false});
 return c;
}
export async function verifyLocalCredential(c:LocalCredential,signal?:AbortSignal):Promise<Uint8Array|null>{
 if(c.rpId!==location.hostname)throw new Error('اعتماد الجهاز لا يخص هذه النسخة.');
 const challenge=freshChallenge();
 // Keep this request as the first asynchronous operation following the real user gesture.
 const credential=await navigator.credentials.get({signal,publicKey:{
  challenge,rpId:c.rpId,allowCredentials:[{type:'public-key',id:bytes64(c.credentialId).buffer as ArrayBuffer}],
  userVerification:'required',timeout:60000,
  ...(c.prfSalt?{extensions:{prf:{eval:{first:bytes64(c.prfSalt).buffer as ArrayBuffer}}} as PrfInputs}:{})
 }}) as PublicKeyCredential|null;
 if(!credential||b64(new Uint8Array(credential.rawId))!==c.credentialId)throw new Error('لم يتم تأكيد هوية الجهاز.');
 const response=credential.response as AuthenticatorAssertionResponse;
 assertClientData(response.clientDataJSON,'webauthn.get',challenge);
 const authenticatorData=new Uint8Array(response.authenticatorData);
 if(!flagsVerified(authenticatorData))throw new Error('لم يؤكد الجهاز هويتك.');
 const expectedHash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(c.rpId)));
 if(!expectedHash.every((b,i)=>authenticatorData[i]===b))throw new Error('جهة التحقق غير مطابقة.');
 const counter=counterOf(authenticatorData);
 if(counter>0&&c.counter>0&&counter<=c.counter)throw new Error('تعذر التحقق من تسلسل الاعتماد.');
 const clientHash=new Uint8Array(await crypto.subtle.digest('SHA-256',response.clientDataJSON));
 const signed=new Uint8Array(authenticatorData.length+clientHash.length);
 signed.set(authenticatorData);signed.set(clientHash,authenticatorData.length);
 const publicKey=await crypto.subtle.importKey('spki',bytes64(c.publicKeySpki).buffer as ArrayBuffer,
  {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const valid=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,
  toRawSignature(new Uint8Array(response.signature)).buffer as ArrayBuffer,signed.buffer as ArrayBuffer);
 if(!valid)throw new Error('فشل التحقق من توقيع الجهاز.');
 if(signal?.aborted)throw new Error('أُلغي التحقق من بصمة الجهاز.');
 if(counter>c.counter){await AsyncStorage.setItem(STORAGE,JSON.stringify({...c,counter}));c.counter=counter;}
 return prfResult(credential);
}
