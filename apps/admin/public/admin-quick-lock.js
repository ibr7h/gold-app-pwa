/* Admin local quick lock: never persists JWT, refresh tokens, passwords or OTP. */
(()=>{
'use strict';
const KEY='dhahabk-admin-quick-lock-v1';
const ITERATIONS=210000, MAX_ATTEMPTS=5, COOLDOWN_MS=15*60*1000;
const byId=id=>document.getElementById(id);
const pinButton=byId('admin-pin-enable');
const faceButton=byId('admin-face-enable');
const removeButton=byId('admin-quick-remove');
const manualButton=byId('admin-lock-now');
const status=byId('admin-quick-state');
const overlay=byId('admin-lock-screen');
const pinForm=byId('admin-lock-pin-form');
const pinField=byId('admin-lock-pin');
const faceUnlock=byId('admin-face-unlock');
const passwordUnlock=byId('admin-password-unlock');
const lockStatus=byId('admin-lock-message');
let account='',revalidate=null,locked=false,pending=false,profile=null,epoch=0;
const supported=()=>window.isSecureContext&&!!crypto?.subtle;
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=hex=>Uint8Array.from((hex.match(/../g)||[]),h=>parseInt(h,16));
const random=len=>crypto.getRandomValues(new Uint8Array(len));
const enc=value=>new TextEncoder().encode(value);
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const un64=text=>Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-text.length%4)%4)),c=>c.charCodeAt(0));
const equals=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
function readProfile(){
 try{
  const p=JSON.parse(localStorage.getItem(KEY)||'null');
  return p?.version===1&&p.origin===location.origin&&p.account===account?p:null;
 }catch{return null;}
}
function saveProfile(p){
 const data={...p,version:1,origin:location.origin,account};
 localStorage.setItem(KEY,JSON.stringify(data));
 profile=data;updateControls();
}
function updateControls(){
 const pin=!!profile?.pin,face=!!profile?.face;
 const ok=supported()&&!!account;
 pinButton.disabled=!ok||pending;
 faceButton.disabled=!ok||pending||!navigator.credentials?.create||!navigator.credentials?.get;
 removeButton.disabled=!ok||pending||(!pin&&!face);
 manualButton.disabled=!ok||pending||(!pin&&!face);
 status.textContent=!supported()?'الدخول السريع يحتاج HTTPS ومتصفحًا حديثًا.':
   !account?'سجّل دخول المدير أولًا.':
   'رمز الدخول: '+(pin?'مفعّل':'غير مفعّل')+' · تحقق الجهاز: '+(face?'مفعّل':'غير مفعّل');
}
function message(text){status.textContent=text;}
function lockMessage(text){lockStatus.textContent=text;}
async function pinDigest(pin,salt){
 if(!/^[0-9]{6}$/.test(pin))throw new Error('أدخل رمزًا مكونًا من 6 أرقام.');
 const key=await crypto.subtle.importKey('raw',enc(pin),'PBKDF2',false,['deriveBits']);
 const digest=await crypto.subtle.deriveBits({
  name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'
 },key,256);
 return toHex(new Uint8Array(digest));
}
function flagsAndCount(authData){
 if(authData.length<37||(authData[32]&0x05)!==0x05)throw new Error('لم يؤكد الجهاز هوية صاحبه.');
 return new DataView(authData.buffer,authData.byteOffset+33,4).getUint32(0,false);
}
function rawSignature(der){
 let i=0;if(der[i++]!==0x30)throw new Error('توقيع الجهاز غير صالح.');
 let length=der[i++];
 if(length&0x80){
  const count=length&0x7f;if(count<1||count>2)throw new Error('توقيع الجهاز غير صالح.');
  length=0;for(let n=0;n<count;n++)length=(length<<8)|der[i++];
 }
 if(i+length!==der.length)throw new Error('توقيع الجهاز غير صالح.');
 const result=new Uint8Array(64);
 for(let part=0;part<2;part++){
  if(der[i++]!==0x02)throw new Error('توقيع الجهاز غير صالح.');
  const len=der[i++];if(len<1||len>33||i+len>der.length)throw new Error('توقيع الجهاز غير صالح.');
  let data=der.slice(i,i+len);i+=len;
  if(data[0]===0&&data.length>1)data=data.slice(1);
  if(data.length>32)throw new Error('توقيع الجهاز غير صالح.');
  result.set(data,part*32+32-data.length);
 }
 if(i!==der.length)throw new Error('توقيع الجهاز غير صالح.');
 return result;
}
function clientVerified(json,type,challenge){
 const p=JSON.parse(new TextDecoder().decode(json));
 if(p.type!==type||p.origin!==location.origin||p.challenge!==b64(challenge)||p.crossOrigin===true)
   throw new Error('استجابة الجهاز لا تطابق طلب التحقق.');
}
async function canVerifyFace(){
 if(!window.PublicKeyCredential||!navigator.credentials?.create||!navigator.credentials?.get)return false;
 try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch{return false;}
}
async function enrollFace(){
 // Called directly from a button click, before any asynchronous work.
 const challenge=random(32);
 const result=await navigator.credentials.create({publicKey:{
  challenge,rp:{id:location.hostname,name:'ذهبك للإدارة'},
  user:{id:random(32),name:account,displayName:account},
  pubKeyCredParams:[{type:'public-key',alg:-7}],
  authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},
  attestation:'none',timeout:60000
 }});
 if(!result||result.type!=='public-key')throw new Error('لم يكتمل تفعيل تحقق الجهاز.');
 const response=result.response;
 clientVerified(response.clientDataJSON,'webauthn.create',challenge);
 if(!response.getPublicKey||response.getPublicKeyAlgorithm?.()!==-7)throw new Error('لا يدعم جهازك نوع اعتماد التحقق المطلوب.');
 const spki=response.getPublicKey();
 if(!spki)throw new Error('تعذر استخراج المفتاح العام للجهاز.');
 const auth=response.getAuthenticatorData?.();
 if(auth)flagsAndCount(new Uint8Array(auth));
 await crypto.subtle.importKey('spki',spki,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 return {credentialId:b64(new Uint8Array(result.rawId)),
  publicKey:b64(new Uint8Array(spki)),rpId:location.hostname,counter:0};
}
async function verifyFace(face){
 if(face.rpId!==location.hostname)throw new Error('اعتماد الجهاز لا يخص هذه النسخة.');
 // Called directly from click to retain iOS user gesture.
 const challenge=random(32);
 const result=await navigator.credentials.get({publicKey:{
  challenge,rpId:face.rpId,
  allowCredentials:[{type:'public-key',id:un64(face.credentialId)}],
  userVerification:'required',timeout:60000
 }});
 if(!result||result.type!=='public-key'||b64(new Uint8Array(result.rawId))!==face.credentialId)
   throw new Error('لم يُعتمد هذا الجهاز.');
 const response=result.response;
 clientVerified(response.clientDataJSON,'webauthn.get',challenge);
 const auth=new Uint8Array(response.authenticatorData);
 const count=flagsAndCount(auth);
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',enc(face.rpId)));
 if(!hash.every((b,i)=>auth[i]===b))throw new Error('جهة التحقق غير مطابقة.');
 if(count>0&&face.counter>0&&count<=face.counter)throw new Error('تسلسل تحقق الجهاز غير صحيح.');
 const clientHash=new Uint8Array(await crypto.subtle.digest('SHA-256',response.clientDataJSON));
 const signed=new Uint8Array(auth.length+clientHash.length);
 signed.set(auth);signed.set(clientHash,auth.length);
 const key=await crypto.subtle.importKey('spki',un64(face.publicKey),
  {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,
  rawSignature(new Uint8Array(response.signature)),signed);
 if(!ok)throw new Error('لم ينجح التحقق من توقيع الجهاز.');
 if(count>face.counter){face.counter=count;saveProfile(profile);}
}
async function verifiedUnlock(start){
 if(start!==epoch||!locked)return;
 try{
  if(!revalidate||!await revalidate())throw new Error('انتهت جلسة الإدارة. يلزم تسجيل الدخول مجددًا.');
  if(start!==epoch)return;
  locked=false;overlay.hidden=true;pinField.value='';lockMessage('');
 }catch(e){lockMessage(e.message||'تعذر التحقق من صلاحية جلسة المدير.');}
}
function lock(){
 if(!account||locked||!profile?.pin&&!profile?.face)return;
 locked=true;epoch++;
 overlay.hidden=false;lockMessage('');
 pinField.value='';
 if(!profile.pin){pinForm.hidden=true;}else{pinForm.hidden=false;}
 faceUnlock.hidden=!profile.face;
}
async function setPin(){
 const first=byId('admin-setup-pin').value,confirm=byId('admin-confirm-pin').value;
 if(!/^[0-9]{6}$/.test(first)||first!==confirm){message('أدخل رمزًا من 6 أرقام وطابق التأكيد.');return;}
 if(!supported()||!account)return;
 pending=true;updateControls();
 try{
  const salt=random(16);
  const digest=await pinDigest(first,salt);
  saveProfile({...profile,pin:{salt:toHex(salt),digest,failures:0,lockedUntil:0}});
  byId('admin-setup-pin').value='';byId('admin-confirm-pin').value='';
  message('تم تفعيل رمز القفل لهذا الجهاز. لا يُحفظ رمزك أو جلسة المدير.');
 }catch(e){message(e.message||'تعذر حفظ رمز القفل.');}
 finally{pending=false;updateControls();}
}
pinButton.addEventListener('click',()=>{void setPin();});
faceButton.addEventListener('click',()=>{
 if(!account||pending||!supported())return;
 // Credential prompt must start synchronously within user gesture.
 const attempt=enrollFace();pending=true;updateControls();
 void attempt.then(credential=>{
  if(!account)return;
  saveProfile({...profile,face:credential});
  message('تم تفعيل تحقق الجهاز. قد يستخدم بصمة الوجه أو طريقة تحقق أخرى.');
 }).catch(e=>message(e.message||'تعذر تفعيل التحقق بالجهاز.')).finally(()=>{pending=false;updateControls();});
});
removeButton.addEventListener('click',()=>{
 if(!account||pending||(!profile?.pin&&!profile?.face))return;
 if(!window.confirm('هل تريد تعطيل قفل التطبيق السريع على هذا الجهاز؟'))return;
 localStorage.removeItem(KEY);profile=null;updateControls();
 message('تم تعطيل القفل السريع. ما زال دخول المدير يتطلب رمز البريد.');
});
manualButton.addEventListener('click',lock);
pinForm.addEventListener('submit',async e=>{
 e.preventDefault();if(!locked||pending||!profile?.pin)return;
 const start=epoch,record=profile.pin,now=Date.now();
 if(now<record.lockedUntil){lockMessage('محاولات كثيرة. أعد المحاولة بعد انتهاء مهلة الحماية.');return;}
 pending=true;updateControls();
 try{
  const digest=await pinDigest(pinField.value,fromHex(record.salt));
  if(start!==epoch)return;
  if(!equals(digest,record.digest)){
   const failures=record.failures+1;
   record.failures=failures>=MAX_ATTEMPTS?0:failures;
   record.lockedUntil=failures>=MAX_ATTEMPTS?Date.now()+COOLDOWN_MS:0;
   saveProfile(profile);
   lockMessage(failures>=MAX_ATTEMPTS?'تم إيقاف محاولات الرمز لمدة 15 دقيقة.':'رمز غير صحيح. المحاولات المتبقية: '+(MAX_ATTEMPTS-failures));
   return;
  }
  record.failures=0;record.lockedUntil=0;saveProfile(profile);
  await verifiedUnlock(start);
 }catch(e){lockMessage(e.message||'تعذر التحقق من الرمز.');}
 finally{pending=false;updateControls();}
});
faceUnlock.addEventListener('click',()=>{
 if(!locked||pending||!profile?.face)return;
 const start=epoch,attempt=verifyFace(profile.face);
 pending=true;updateControls();
 void attempt.then(()=>verifiedUnlock(start)).catch(e=>lockMessage(e.message||'تعذر التحقق من بصمة الجهاز.'))
   .finally(()=>{pending=false;updateControls();});
});
passwordUnlock.addEventListener('click',()=>{
 window.dispatchEvent(new Event('dhahabk:admin-password-login'));
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')lock();});
window.addEventListener('pagehide',lock);
window.AdminQuickLock=Object.freeze({
 onAuth(email,check){account=email?.toLowerCase()||'';revalidate=check;epoch++;locked=false;overlay.hidden=true;profile=readProfile();updateControls();},
 offAuth(){account='';revalidate=null;profile=null;epoch++;locked=false;overlay.hidden=true;updateControls();},
 lock,
});
updateControls();
})();