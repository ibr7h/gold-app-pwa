/* Marketer portal: never issues codes; only claims a one-time Admin allocation. */
(()=>{
'use strict';
const API='https://gold-app-api-u8dl.onrender.com';
const $=id=>document.getElementById(id);
let access='',shownCode='',busy=false;
const tell=(message,error=false)=>{
 const el=$('portal-message');el.textContent=message;el.classList.toggle('error',error);
};
const show=authorized=>{
 $('portal-screen').hidden=!authorized;$('login-screen').hidden=authorized;
};
async function request(path,method='GET',body,token=access){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),12000);
 try{
  const response=await fetch(API+path,{method,cache:'no-store',signal:control.signal,
   headers:{...(body?{'Content-Type':'application/json'}:{}),
    ...(token?{Authorization:'Bearer '+token}:{})},
   ...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok){
   const info=data?.error||data;
   const message=Array.isArray(info?.message)?info.message.join('، '):info?.message;
   const error=new Error(typeof message==='string'&&message.length<300
    ?message:'تعذر تنفيذ الطلب لدى خدمة المسوّق.');
   error.status=response.status;throw error;
  }
  return data;
 }catch(e){
  if(e.name==='AbortError')throw new Error('انتهت مهلة الاتصال بالخادم.');
  if(e instanceof TypeError)throw new Error('تعذر الاتصال بالخادم.');
  throw e;
 }finally{clearTimeout(timer);}
}
function clearCode(){shownCode='';$('issued-code').textContent='';$('issued-panel').hidden=true;}
function clear(){
 access='';clearCode();$('marketer-password').value='';show(false);
 $('my-invites').replaceChildren();
}
function line(value){
 const p=document.createElement('p');p.className='muted';p.textContent=value;return p;
}
function showInvites(items){
 const root=$('my-invites');root.replaceChildren();
 if(!items.length){root.append(line('لم تخصص الإدارة رموزًا لحسابك بعد.'));return;}
 for(const item of items){
  const card=document.createElement('article');card.className='record';
  const title=document.createElement('strong');
  title.textContent=item.merchantName||'دعوة تاجر';
  card.append(title);
  card.append(line('البريد المستهدف: '+(item.intendedEmail||'غير محدد')));
  card.append(line('ينتهي الرمز بـ '+(item.codeTail||'—')+' · الحالة: '+(
   {active:'فعال',exhausted:'مستخدم',revoked:'ملغى',expired:'منتهي'}[item.status]||item.status||'—')));
  if(item.canClaim===true&&item.status==='active'){
   const button=document.createElement('button');button.className='secondary';
   button.type='button';button.textContent='استلام الرمز المخصص';
   button.addEventListener('click',async()=>{
    if(busy||!access)return;
    // Reveal clears the encrypted server copy. Do not call until explicitly requested.
    if(!window.confirm('سيُعرض الرمز مرة واحدة فقط؛ انسخه قبل مغادرة الصفحة. هل تؤكد الاستلام؟'))return;
    busy=true;button.disabled=true;
    try{
     const result=await request('/marketer/merchant-invites/'+encodeURIComponent(item.id)+'/claim','POST');
     if(!/^DBK-[A-Za-z0-9_-]{24}$/.test(result?.code||''))throw new Error('لم يؤكد الخادم تسليم الرمز.');
     clearCode();
     shownCode=result.code;$('issued-code').textContent=shownCode;
     $('issued-panel').hidden=false;
     tell('تم استلام رمز خصصه المدير لحسابك. انسخه الآن؛ لن يمكن طلبه مرة أخرى.');
     await load();
    }catch(e){tell(e.message||'تعذر استلام الرمز المخصص.',true);}
    finally{busy=false;button.disabled=false;}
   });
   card.append(button);
  }
  root.append(card);
 }
}
async function load(){
 if(!access)return;
 try{
  const result=await request('/marketer/merchant-invites');
  showInvites(result?.items||[]);
 }catch(e){
  if(e.status===401||e.status===403){clear();tell('انتهت الجلسة أو ألغي تفويض المسوّق.',true);}
  else tell(e.message||'تعذر تحديث قائمة الرموز.',true);
 }
}
$('login-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 const button=$('login-submit');busy=true;button.disabled=true;tell('جارٍ التحقق من حساب المسوّق...');
 try{
  const tokens=await request('/auth/login','POST',{
   email:$('marketer-email').value.trim().toLowerCase(),
   password:$('marketer-password').value
  },'');
  if(!tokens?.accessToken)throw new Error('لم يصدر الخادم جلسة آمنة.');
  const me=await request('/auth/me','GET',undefined,tokens.accessToken);
  if(me?.role!=='user')throw new Error('يتطلب المسوّق حسابًا خاصًا موثّقًا.');
  const result=await request('/marketer/merchant-invites','GET',undefined,tokens.accessToken);
  access=tokens.accessToken;$('marketer-password').value='';clearCode();
  show(true);showInvites(result?.items||[]);
  tell('هذه الرموز أصدرها المدير وخصصها لحسابك؛ لا توجد صلاحية لتوليد رموز.');
 }catch(e){clear();tell(e.message||'تعذر الدخول إلى بوابة المسوّق.',true);}
 finally{busy=false;button.disabled=false;}
});
$('issued-copy').addEventListener('click',async()=>{
 if(!shownCode)return;
 try{await navigator.clipboard.writeText(shownCode);tell('نُسخ الرمز. أرسله للتاجر المقصود عبر قناة موثوقة.');}
 catch{tell('تعذر النسخ التلقائي؛ انسخ الرمز المعروض يدويًا.',true);}
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
