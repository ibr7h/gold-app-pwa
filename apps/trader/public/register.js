/* Trader registration is always invitation-gated; no User account is created or mutated. */
(()=>{
'use strict';
const API='https://gold-app-api-u8dl.onrender.com';
const $=id=>document.getElementById(id);
const sections=['step-invite','step-details','step-otp','step-pending'];
let inviteCode='',registrationId='',busy=false;
const show=id=>sections.forEach(key=>$(key).hidden=key!==id);
const message=(text,error=false)=>{
 const el=$('registration-message');el.textContent=text;el.classList.toggle('error',error);
};
const digits=value=>value.replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660))
 .replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6f0));
async function send(path,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(API+path,{method:'POST',cache:'no-store',signal:controller.signal,
   headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json().catch(()=>null);
  if(!response.ok){
   const payload=result?.error||result;
   const detail=Array.isArray(payload?.message)?payload.message.join('، '):payload?.message;
   const reason=typeof detail==='string'&&detail.length<300?detail:
    'تعذر تنفيذ الطلب. تحقق من البيانات أو حاول لاحقًا.';
   throw new Error(reason);
  }
  return result;
 }catch(e){
  if(e.name==='AbortError')throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
  if(e instanceof TypeError)throw new Error('تعذر الاتصال بخدمة التسجيل.');
  throw e;
 }finally{clearTimeout(timer);}
}
$('invite-form').addEventListener('submit',event=>{
 event.preventDefault();
 const code=$('invite-code').value.trim();
 if(!/^DBK-[A-Za-z0-9_-]{24}$/.test(code)){
  message('أدخل رمز دعوة صحيحًا صادرًا من الإدارة أو مسوّق معتمد.',true);return;
 }
 inviteCode=code;
 $('invite-code').value='';
 message('');
 show('step-details');
});
$('change-invite').addEventListener('click',()=>{
 inviteCode='';registrationId='';$('merchant-form').reset();message('');show('step-invite');
});
$('merchant-form').addEventListener('submit',async event=>{
 event.preventDefault();
 if(busy)return;
 if(!inviteCode){show('step-invite');message('يجب تقديم رمز دعوة أولًا.',true);return;}
 const password=$('merchant-password').value;
 if(password!==$('merchant-password-confirm').value){
  message('كلمتا المرور غير متطابقتين.',true);return;
 }
 const body={
  code:inviteCode,email:$('merchant-email').value.trim().toLowerCase(),
  phone:$('merchant-phone').value.trim(),fullName:$('merchant-name').value.trim(),
  password,legalTermsVersion:'dhahabk-terms-2026-10-v1',
  legalNoticesAcknowledged:$('legal-accepted').checked
 };
 busy=true;$('merchant-submit').disabled=true;message('جارٍ التحقق من الدعوة وإرسال رمز البريد...');
 try{
  const result=await send('/merchant/onboarding/register/start',body);
  if(!result?.registrationId)throw Error('لم يؤكد الخادم إرسال رمز التحقق.');
  registrationId=result.registrationId;
  inviteCode='';
  $('merchant-password').value='';$('merchant-password-confirm').value='';
  message('أُرسل رمز التحقق إلى بريد حساب التاجر.');
  show('step-otp');
 }catch(e){message(e.message||'تعذر بدء التسجيل.',true);}
 finally{busy=false;$('merchant-submit').disabled=false;}
});
$('otp-form').addEventListener('submit',async event=>{
 event.preventDefault();
 if(busy||!registrationId)return;
 const code=digits($('merchant-otp').value.trim());
 if(!/^\d{6}$/.test(code)){message('أدخل رمز البريد المكوّن من ستة أرقام.',true);return;}
 busy=true;$('otp-submit').disabled=true;
 message('جارٍ تأكيد البريد وتقديم طلب التاجر...');
 try{
  const result=await send('/merchant/onboarding/register/verify',{registrationId,code});
  if(result?.status!=='pending')throw Error('لم يؤكد الخادم تقديم الطلب.');
  $('merchant-form').reset();$('otp-form').reset();
  registrationId='';message('تم تسجيل طلبك للمراجعة.');
  show('step-pending');
 }catch(e){message(e.message||'تعذر تأكيد رمز البريد.',true);}
 finally{busy=false;$('otp-submit').disabled=false;}
});
show('step-invite');
})();
