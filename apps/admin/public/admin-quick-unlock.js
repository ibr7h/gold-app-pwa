/* Admin-only local quick unlock. WebAuthn PRF for device biometrics,
   PBKDF2 for optional PIN; the server remains the authority on every unlock. */
(()=>{
'use strict';
const STORAGE='dhahabk_admin_secure_v1',AAD='dhahabk-admin-session:v1';
const $=id=>document.getElementById(id);
let principal=null,tokens=null,rawKey=null,busy=false,unlocking=false;
const te=new TextEncoder(),td=new TextDecoder();
const supported=()=>!!(window.isSecureContext&&crypto?.subtle);
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const b64=x=>btoa(Array.from(x,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const bin=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));
const read=()=>{try{const v=JSON.parse(localStorage.getItem(STORAGE)||'null');return v?.v===1&&v.origin===location.origin&&typeof v.id==='string'?v:null;}catch{return null;}};
const save=v=>localStorage.setItem(STORAGE,JSON.stringify(v));
const clear=()=>{localStorage.removeItem(STORAGE);rawKey=null;};
const aad=id=>te.encode(AAD+':'+location.origin+':'+id);
const aes=raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
async function seal(key,data,id){
 const iv=random(12);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(id)},key,data);
 return {iv:b64(iv),cipher:b64(new Uint8Array(cipher))};
}
async function unseal(key,box,id){
 return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bin(box.iv),additionalData:aad(id)},key,bin(box.cipher)));
}
const notice=(message,warning=false)=>{
 const el=$('quick-notice');if(el){el.textContent=message;el.classList.toggle('warning',warning);}
};
const showQuick=()=>{
 const saved=read();
 $('admin-quick-screen').hidden=!saved;
 $('login-view').classList.toggle('hidden',!!saved);
 $('quick-use-face').hidden=!saved?.face;
 $('quick-pin-form').hidden=!saved?.pin;
 $('quick-account').textContent=saved?.email||'';
 $('quick-pin-input').value='';
 notice('');
 return !!saved;
};
const updateControls=()=>{
 const s=read(),has=s&&principal&&s.id===principal.id;
 $('quick-status').textContent=has?'تم حفظ وسيلة دخول سريع لهذا الجهاز.':'لم تُفعّل وسيلة الدخول السريع على هذا الجهاز.';
 $('quick-remove').disabled=!has;
 $('quick-enable-face').disabled=!principal||!supported();
 $('quick-enable-pin').disabled=!principal||!supported();
};
async function onAuthenticated(user,newTokens){
 if(user?.role!=='admin'||!user?.userId||!newTokens?.refreshToken)return;
 principal={id:String(user.userId),email:user.email||''};
 tokens={accessToken:newTokens.accessToken,refreshToken:newTokens.refreshToken};
 const existing=read();
 if(existing&&existing.id!==principal.id){clear();rawKey=null;}
 if(rawKey&&existing?.id===principal.id)await persist(tokens).catch(()=>notice('تعذر تحديث بيانات الدخول السريع؛ قد يلزم الدخول بالبريد لاحقًا.',true));
 $('admin-quick-screen').hidden=true;
 updateControls();
}
async function persist(next){
 if(!rawKey||!principal)return;
 const v=read();if(!v||v.id!==principal.id)return;
 const secret=await aes(rawKey);
 const payload=te.encode(JSON.stringify({refreshToken:next.refreshToken}));
 const session=await seal(secret,payload,principal.id);
 save({...v,session});
}
async function keyForEnroll(){
 if(rawKey)return rawKey;
 const existing=read();
 if(existing&&existing.id===principal?.id){
  if(existing.pin?.deviceId)await window.DhahabkAdminBridge.api(
   '/auth/admin/quick/revoke','POST',{deviceId:existing.pin.deviceId}).catch(()=>{});
  clear(); // Re-enrollment follows a successful password + email OTP login.
 }
 rawKey=random(32);
 return rawKey;
}
async function setupPin(event){
 event.preventDefault();if(busy||!principal||!tokens||!supported())return;
 const pin=$('quick-setup-pin').value,confirm=$('quick-setup-confirm').value;
 if(!/^[0-9]{6}$/.test(pin)||pin!==confirm){notice('أدخل رمزًا من 6 أرقام متطابقًا في الحقلين.',true);return;}
 if(/^(.)\1{5}$/.test(pin)||['123456','654321','012345'].includes(pin)){
  notice('اختر رمزًا أصعب من الأرقام المتتابعة أو المتكررة.',true);return;
 }
 busy=true;
 let issuedDeviceId='';
 try{
  // A server-verified Admin session is required to enroll a device.
  // The wrapping key is held by the server until PIN attempts pass its durable rate limiter.
  const enrollment=await window.DhahabkAdminBridge.api('/auth/admin/quick/register','POST',{pin});
  if(!enrollment?.deviceId||!enrollment?.unlockKey)throw Error('invalid_registration');
  issuedDeviceId=enrollment.deviceId;
  const key=await keyForEnroll();
  const box=await seal(await aes(bin(enrollment.unlockKey)),key,principal.id);
  const old=read();
  const oldDevice=old?.id===principal.id?old.pin?.deviceId:null;
  const v={v:1,origin:location.origin,id:principal.id,email:principal.email,
    ...(old?.id===principal.id?old:{}),pin:{deviceId:issuedDeviceId,box}};
  v.session=await seal(await aes(key),te.encode(JSON.stringify({refreshToken:tokens.refreshToken})),principal.id);
  save(v);
  if(oldDevice&&oldDevice!==issuedDeviceId){
   void window.DhahabkAdminBridge.api('/auth/admin/quick/revoke','POST',{deviceId:oldDevice}).catch(()=>{});
  }
  $('quick-setup-pin').value='';$('quick-setup-confirm').value='';
  notice('تم تفعيل رمز الدخول السريع مع حماية المحاولات على الخادم.');updateControls();
 }catch{
  if(issuedDeviceId)void window.DhahabkAdminBridge.api('/auth/admin/quick/revoke','POST',{deviceId:issuedDeviceId}).catch(()=>{});
  notice('تعذر تفعيل الرمز. تحقق من الاتصال وخدمة حماية المدير.',true);
 }finally{busy=false;}
}
function clientData(buffer,type,challenge){
 const data=JSON.parse(td.decode(buffer));
 return data.type===type&&data.challenge===b64(challenge)&&data.origin===location.origin&&!data.crossOrigin;
}
async function setupFace(){
 if(busy||!principal||!tokens||!supported()||!navigator.credentials?.create)return;
 // iOS Safari may not support PRF extension. Never silently store an unprotected token.
 busy=true;
 try{
  const challenge=random(32),salt=random(32);
  const credential=await navigator.credentials.create({publicKey:{
   challenge,rp:{name:'ذهبك للإدارة',id:location.hostname},
   user:{id:random(32),name:principal.email,displayName:principal.email},
   pubKeyCredParams:[{type:'public-key',alg:-7}],
   authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'discouraged',userVerification:'required'},
   timeout:60000,attestation:'none',
   extensions:{prf:{eval:{first:salt}}}
  }});
  if(!credential||!clientData(credential.response.clientDataJSON,'webauthn.create',challenge))throw Error('invalid_credential');
  const secret=credential.getClientExtensionResults?.()?.prf?.results?.first;
  if(!secret||secret.byteLength!==32){notice('هذا الجهاز لا يدعم حماية الجلسة ببصمة الجهاز. استخدم PIN أو البريد.',true);return;}
  const key=await keyForEnroll();
  const box=await seal(await aes(new Uint8Array(secret)),key,principal.id);
  const old=read();
  const v={v:1,origin:location.origin,id:principal.id,email:principal.email,
   ...(old?.id===principal.id?old:{}),
   face:{credentialId:b64(new Uint8Array(credential.rawId)),salt:b64(salt),box},
   failed:old?.failed||0,lockedUntil:old?.lockedUntil||0};
  v.session=await seal(await aes(key),te.encode(JSON.stringify({refreshToken:tokens.refreshToken})),principal.id);
  save(v);notice('تم تفعيل فتح التطبيق ببصمة الجهاز.');updateControls();
 }catch{notice('تعذر تفعيل بصمة الجهاز، أو أُلغي الطلب. استخدم PIN أو البريد.',true);}
 finally{busy=false;}
}
async function resume(key,id){
 const v=read();if(!v||v.id!==id)return;
 const payload=JSON.parse(td.decode(await unseal(await aes(key),v.session,id)));
 if(!payload?.refreshToken||typeof payload.refreshToken!=='string')throw Error('invalid_session');
 // Mandatory remote refresh checks revocation and Admin role before opening dashboard.
 const result=await window.DhahabkAdminBridge.resume(payload.refreshToken,id);
 if(!result?.refreshToken)throw Error('invalid_refresh');
 rawKey=key;principal={id,email:v.email};tokens=result;
 await persist(result);
 $('admin-quick-screen').hidden=true;notice('');
}
async function unlockPin(event){
 event.preventDefault();if(unlocking)return;
 const v=read();if(!v?.pin?.deviceId)return showQuick();
 const pin=$('quick-pin-input').value;
 if(!/^[0-9]{6}$/.test(pin)){notice('أدخل رمز PIN المكوّن من 6 أرقام.',true);return;}
 unlocking=true;
 try{
  // No local PIN-derived key exists. Offline guessing a copied vault is impossible:
  // the server releases this random device key only after a rate-limited PIN check.
  const unlocked=await window.DhahabkAdminBridge.pinVerify(v.pin.deviceId,pin);
  if(!unlocked?.unlockKey)throw Error('invalid_key');
  const key=await unseal(await aes(bin(unlocked.unlockKey)),v.pin.box,v.id);
  await resume(key,v.id);
 }catch(e){
  notice(e?.status===429?'أُوقفت محاولات PIN مؤقتًا. استخدم البريد أو انتظر 15 دقيقة.':
    e?.status===401?'رمز PIN غير صحيح أو لم تعد الجلسة صالحة.':
    'تعذر فتح الإدارة. تأكد من الإنترنت أو استخدم البريد.',true);
 }finally{unlocking=false;$('quick-pin-input').value='';}
}
async function unlockFace(){
 if(unlocking)return;
 const v=read();if(!v?.face||!navigator.credentials?.get)return;
 unlocking=true;
 try{
  const challenge=random(32);
  const credential=await navigator.credentials.get({publicKey:{
   challenge,rpId:location.hostname,userVerification:'required',timeout:60000,
   allowCredentials:[{id:bin(v.face.credentialId),type:'public-key'}],
   extensions:{prf:{eval:{first:bin(v.face.salt)}}}
  }});
  if(!credential||!clientData(credential.response.clientDataJSON,'webauthn.get',challenge)||
    b64(new Uint8Array(credential.rawId))!==v.face.credentialId)throw Error('invalid_credential');
  const secret=credential.getClientExtensionResults?.()?.prf?.results?.first;
  if(!secret||secret.byteLength!==32)throw Error('no_prf');
  const key=await unseal(await aes(new Uint8Array(secret)),v.face.box,v.id);
  await resume(key,v.id);
 }catch{notice('تعذر فتح التطبيق ببصمة الجهاز. جرّب PIN أو الدخول بالبريد.',true);}
 finally{unlocking=false;}
}
function lock(){
 if(unlocking||!principal)return;
 rawKey=null;tokens=null;principal=null;
 window.DhahabkAdminBridge?.lock();
 showQuick();
}
async function remove(){
 if(!principal)return;
 const v=read();
 if(v?.pin?.deviceId){
  try{await window.DhahabkAdminBridge.api('/auth/admin/quick/revoke','POST',{deviceId:v.pin.deviceId});}
  catch{notice('تعذر إلغاء جهاز PIN على الخادم. تحقق من الاتصال وأعد المحاولة.',true);return;}
 }
 clear();updateControls();notice('تم إلغاء الدخول السريع من هذا الجهاز.');
}
function logout(){
 clear();principal=null;tokens=null;showQuick();updateControls();
}
$('quick-pin-form').addEventListener('submit',unlockPin);
$('quick-set-pin-form').addEventListener('submit',setupPin);
$('quick-enable-face').addEventListener('click',setupFace);
$('quick-use-face').addEventListener('click',unlockFace);
$('quick-remove').addEventListener('click',()=>{void remove();});
$('quick-use-password').addEventListener('click',()=>{
 $('admin-quick-screen').hidden=true;$('login-view').classList.remove('hidden');
 $('password').focus();
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&!busy&&!unlocking)lock();});
window.AdminQuickUnlock={onAuthenticated,logout,lock,showQuick};
if(!supported())notice('الدخول السريع يحتاج اتصال HTTPS ومتصفحًا حديثًا.',true);
showQuick();updateControls();
})();