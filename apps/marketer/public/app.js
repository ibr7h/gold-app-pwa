/* Marketer-only invitation portal. All permissions enforced by Backend; tokens stay in memory. */
(()=>{
'use strict';
const API='https://gold-app-api-u8dl.onrender.com';
const $=id=>document.getElementById(id);
let access='',shownCode='',busy=false;
const tell=(message,error=false)=>{
 const el=$('portal-message');el.textContent=message;el.classList.toggle('error',error);
};
const show=(authorized)=>{
 $('portal-screen').hidden=!authorized;$('login-screen').hidden=authorized;
};
async function request(path,method='GET',body,token=access){
 const control=new AbortController(),t=setTimeout(()=>control.abort(),12000);
 try{
  const response=await fetch(API+path,{method,cache:'no-store',signal:control.signal,
   headers:{...(body?{'Content-Type':'application/json'}:{}),
    ...(token?{Authorization:'Bearer '+token}:{})},
   ...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok){
   const info=data?.error||data;
   const explanation=Array.isArray(info?.message)?info.message.join('، '):info?.message;
   const message=typeof explanation==='string'&&explanation.length<300
    ?explanation:'تعذر تنفيذ الطلب لدى خدمة المسوّق.';
   const error=new Error(message);error.status=response.status;throw error;
  }
  return data;
 }catch(e){
  if(e.name==='AbortError')throw new Error('انتهت مهلة الاتصال بالخادم.');
  if(e instanceof TypeError)throw new Error('تعذر الاتصال بالخادم.');
  throw e;
 }finally{clearTimeout(t);}
}
function clearCode(){shownCode='';$('issued-code').textContent='';$('issued-panel').hidden=true;}
function clear(){
 access='';clearCode();
 $('marketer-password').value='';$('issue-form').reset();show(false);
 $('my-invites').replaceChildren();
}
function line(label){
 const p=document.createElement('p');p.className='muted';p.textContent=label;return p;
}
function showInvites(items){
 const root=$('my-invites');root.replaceChildren();
 if(!items.length){root.append(line('لم تُصدر دعوات بعد.'));return;}
 for(const item of items){
  const card=document.createElement('article');card.className='record';
  const title=document.createElement('strong');title.textContent=item.merchantName||'متجر الذهب';
  card.append(title);
  card.append(line('البريد: '+(item.intendedEmail||'—')));
  card.append(line('الرمز ينتهي بـ '+(item.codeTail||'—')+' · الحالة: '+(
   {active:'فعال',exhausted:'مستخدم',revoked:'ملغى',expired:'منتهي'}[item.status]||item.status||'—')));
  root.append(card);
 }
}
async function load(){
 if(!access)return;
 try{
  const response=await request('/marketer/merchant-invites');
  showInvites(response?.items||[]);
 }catch(e){
  if(e.status===401||e.status===403){clear();tell('انتهت جلسة المسوّق أو ألغي التفويض.',true);}
  else tell(e.message||'تعذر تحديث الدعوات.',true);
 }
}
$('login-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 const button=$('login-submit');busy=true;button.disabled=true;tell('جارٍ التحقق من التفويض...');
 try{
  const tokens=await request('/auth/login','POST',{
   email:$('marketer-email').value.trim().toLowerCase(),
   password:$('marketer-password').value
  },'');
  if(!tokens?.accessToken)throw Error('لم يصدر الخادم جلسة آمنة.');
  const me=await request('/auth/me','GET',undefined,tokens.accessToken);
  if(me?.role!=='user')throw Error('هذا الحساب لا يملك نوع الدخول المطلوب للمسوّق.');
  // Server-authoritative marketer whitelist: signed user token alone is insufficient.
  const list=await request('/marketer/merchant-invites','GET',undefined,tokens.accessToken);
  access=tokens.accessToken;$('marketer-password').value='';shownCode='';
  show(true);showInvites(list?.items||[]);
  tell('تم التحقق من صلاحية المسوّق المعتمد.');
 }catch(e){clear();tell(e.message||'تعذر الدخول إلى بوابة المسوّق.',true);}
 finally{busy=false;button.disabled=false;}
});
$('issue-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!access)return;
 const merchantName=$('store-name').value.trim(),intendedEmail=$('store-email').value.trim().toLowerCase();
 const expiresInDays=Number($('invite-days').value);
 if(merchantName.length<2||!intendedEmail||!Number.isInteger(expiresInDays)||
    expiresInDays<1||expiresInDays>14){tell('تحقق من بيانات التاجر ومدة الدعوة.',true);return;}
 const button=$('issue-submit');busy=true;button.disabled=true;tell('جارٍ تسجيل دعوة التاجر...');
 try{
  const invite=await request('/marketer/merchant-invites','POST',
   {merchantName,intendedEmail,expiresInDays,maxUses:1});
  if(!invite?.code)throw Error('لم يؤكد الخادم إصدار رمز الدعوة.');
  shownCode=invite.code;
  $('issued-code').textContent=shownCode;
  $('issued-panel').hidden=false;
  $('issue-form').reset();
  tell('صدرت دعوة التاجر. انسخ رمزها وأرسله إلى البريد المرتبط فقط.');
  await load();
 }catch(e){tell(e.message||'تعذر إصدار الدعوة.',true);}
 finally{busy=false;button.disabled=false;}
});
$('issued-copy').addEventListener('click',async()=>{
 if(!shownCode)return;
 try{await navigator.clipboard.writeText(shownCode);tell('نُسخ الرمز إلى الحافظة.');}
 catch{tell('انسخ الرمز المعروض يدويًا.',true);}
});
$('refresh-invites').addEventListener('click',()=>void load());
$('marketer-logout').addEventListener('click',()=>{
 const token=access;clear();tell('تم تسجيل الخروج من بوابة المسوّق.');
 if(token)void request('/auth/logout','POST',undefined,token).catch(()=>{});
});
document.addEventListener?.('visibilitychange',()=>{
 if(document.visibilityState==='hidden')clearCode();
});
show(false);
})();
