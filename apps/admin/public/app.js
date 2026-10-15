(()=>{
  'use strict';
  const API='https://gold-app-api-u8dl.onrender.com';
  // Session isolation is intentionally memory-only for privileged accounts.
  const SESSION_NAMESPACE='dhahabi_admin_';
  document.body.dataset.sessionNamespace=SESSION_NAMESPACE;
  const byId=id=>document.getElementById(id);
  const loginView=byId('login-view'),dash=byId('dash-view');
  const form=byId('login-form'),notice=byId('notice'),submit=byId('submit');
  const email=byId('email'),password=byId('password');
  const otpView=byId('otp-view'),otpForm=byId('otp-form'),otpCode=byId('otp-code');
  const otpNotice=byId('otp-notice'),otpSubmit=byId('otp-submit'),otpMessage=byId('otp-message');
  let challengeId='';
  let accessToken='',refreshToken='',page=1,pages=0,activePanel='overview';
  let busyUsers=false,busyAudit=false,auditPage=1,auditPages=0,statusTarget=null;
  const statusDialog=byId('status-dialog'),statusForm=byId('status-form');
  const formatNumber=n=>new Intl.NumberFormat('ar-SA',{maximumFractionDigits:0}).format(n);
  const formatDate=s=>{
    if(!s)return '—';
    const d=new Date(s);
    return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{dateStyle:'medium',timeStyle:'short'}).format(d):'—';
  };
  function msg(text,type='error'){
    notice.textContent=text;
    notice.className=text?'notice '+type:'notice';
    notice.setAttribute('aria-live',text?'assertive':'off');
  }
  function setStatus(text){byId('connection-state').textContent=text;}
  function otpAlert(text){otpNotice.textContent=text;otpNotice.className=text?'notice error':'notice';}
  function clearAuth(){
    if(statusDialog.open)statusDialog.close();
    statusTarget=null;
    byId('status-admin-password').value='';
    byId('status-reason').value='';
    accessToken='';refreshToken='';challengeId='';
    otpView.hidden=true;otpCode.value='';otpAlert('');
    byId('session-email').textContent='';
    dash.classList.remove('active');
    document.body.classList.remove('admin-authenticated');
    loginView.classList.remove('hidden');
    password.value='';
  }
  async function request(path,{method='GET',body,authorized=false}={}){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(API+path,{
        method,cache:'no-store',signal:controller.signal,
        headers:{...(body?{'Content-Type':'application/json'}:{}),
          ...(authorized?{Authorization:'Bearer '+accessToken}:{})},
        ...(body?{body:JSON.stringify(body)}:{}),
      });
      const result=await r.json().catch(()=>null);
      if(!r.ok){
        // Nest's error envelope is {success:false,error:{code,message,details}}.
        // Avoid hiding a validation, expired-code, or server failure behind a generic error.
        const payload=result?.error || result;
        const detail=Array.isArray(payload?.details)?payload.details.join('، '):
          Array.isArray(payload?.message)?payload.message.join('، '):payload?.message;
        const safeDetail=typeof detail==='string'&&detail.length<=500?detail:'';
        const errorText=r.status===404&&authorized?
          'هذه الوظيفة لم تُنشر على الخادم بعد.':
          r.status===401?'انتهت صلاحية الجلسة. سجّل الدخول مجددًا.':
          r.status===403?'ليس لهذا الحساب صلاحية الإدارة.':
          r.status>=500?'تعذر تنفيذ التحقق على الخادم حاليًا (رمز الحالة '+r.status+').':
          safeDetail||'تعذر إكمال الطلب (رمز الحالة '+r.status+').';
        const err=new Error(errorText);
        err.status=r.status;
        throw err;
      }
      return result;
    }catch(e){
      if(e.name==='AbortError')throw new Error('انتهت مهلة الاتصال بالخادم.');
      if(e instanceof TypeError)throw new Error('تعذر الاتصال بالخادم. تحقق من الشبكة.');
      throw e;
    }finally{clearTimeout(timeout);}
  }
  async function secure(path){
    try{return await request(path,{authorized:true});}
    catch(e){
      if(e.status===401||e.status===403){clearAuth();msg(e.message);}
      throw e;
    }
  }
  function showOtp(challenge){
    if(!challenge?.requiresVerification||!challenge?.challengeId||challenge?.accessToken)
      throw new Error('تعذر بدء التحقق بالبريد الإلكتروني.');
    challengeId=challenge.challengeId;
    otpView.hidden=false;
    loginView.classList.add('hidden');
    password.value='';
    otpCode.value='';otpAlert('');
    otpMessage.textContent='الرمز صالح لمدة 10 دقائق، ويُستخدم مرة واحدة.';
    otpCode.focus();
  }
  function selectPanel(panel){
    activePanel=panel;
    document.querySelectorAll('[data-panel]').forEach(b=>{
      const selected=b.dataset.panel===panel;
      b.classList.toggle('selected',selected);
      b.setAttribute('aria-current',selected?'page':'false');
    });
    document.querySelectorAll('[data-view]').forEach(el=>{
      el.hidden=el.dataset.view!==panel;
    });
    if(panel==='users'){page=1;auditPage=1;loadUsers();loadAudit();}
    window.scrollTo({top:0,behavior:'instant'});
    if(panel==='overview')loadPrice();
  }
  async function loadSummary(){
    ['users','merchants','admins','suspended'].forEach(k=>byId('count-'+k).textContent='—');
    byId('summary-note').textContent='جارٍ تحميل الإحصاءات...';
    try{
      const result=await secure('/admin/summary');
      if(!accessToken)return;
      ['users','merchants','admins','suspended'].forEach(k=>{
        byId('count-'+k).textContent=Number.isInteger(result?.[k])&&result[k]>=0?formatNumber(result[k]):'—';
      });
      byId('summary-note').textContent='الإحصاءات مستمدة من الحسابات المسجلة في النظام.';
      setStatus('متصل');
    }catch(e){if(accessToken){byId('summary-note').textContent=e.message;setStatus('الخدمات الإدارية غير متاحة');}}
  }
  async function loadPrice(){
    byId('market-price').textContent='—';
    byId('market-updated').textContent='جارٍ التحقق من آخر سعر محفوظ';
    byId('market-source').textContent='—';
    try{
      const row=await request('/prices/latest?currency=SAR&karat=24');
      if(!accessToken)return;
      const n=Number(row?.buyPrice);
      byId('market-price').textContent=row&&Number.isFinite(n)&&n>0?
        new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' ر.س':'لا توجد أسعار محفوظة';
      byId('market-updated').textContent=row?.timestamp?'تاريخ الرصد: '+formatDate(row.timestamp):'لا يتوفر وقت رصد';
      byId('market-source').textContent=row?.source||'غير متاح';
    }catch(e){if(accessToken)byId('market-updated').textContent=e.message;}
  }
  const roles={user:'مستخدم',merchant:'تاجر',admin:'مدير'};
  const statuses={active:'نشط',suspended:'موقوف',deleted:'محذوف'};
  function cell(tr,value){
    const td=document.createElement('td');
    td.textContent=value==null?'—':String(value);
    tr.appendChild(td);
  }
  async function loadUsers(){
    if(busyUsers||!accessToken)return;
    busyUsers=true;
    const body=byId('users-body'), cards=byId('users-cards');
    body.replaceChildren();cards.replaceChildren();
    byId('users-note').textContent='جارٍ تحميل المستخدمين...';
    body.setAttribute('aria-busy','true');cards.setAttribute('aria-busy','true');
    byId('users-prev').disabled=true;byId('users-next').disabled=true;
    const q=new URLSearchParams({page:String(page),limit:'20'});
    for(const id of ['role','status','search']){
      const value=byId('users-'+id).value.trim();
      if(value)q.set(id,value);
    }
    try{
      const result=await secure('/admin/users?'+q.toString());
      if(!accessToken)return;
      const items=Array.isArray(result?.items)?result.items:[];
      pages=Number.isInteger(result?.pages)?result.pages:0;
      for(const item of items){
        // UI.zip / 19_admin_users: white gold-card user entries, populated only from real API data.
        const card=document.createElement('article');card.className='gold-card user-card';
        const top=document.createElement('div');top.className='user-top';
        const info=document.createElement('div');
        const name=document.createElement('div');name.className='user-name';name.textContent=item.fullName||'—';
        const mail=document.createElement('div');mail.className='user-email';mail.textContent=item.email||'—';
        const role=document.createElement('span');role.className='role-pill '+(item.role||'');role.textContent=roles[item.role]||item.role||'—';
        info.append(name,mail);top.append(info,role);
        const meta=document.createElement('div');meta.className='user-meta';
        const state=document.createElement('span');state.textContent='الحالة: '+(statuses[item.status]||item.status||'—');
        const date=document.createElement('span');date.textContent=formatDate(item.createdAt);
        meta.append(state,date);card.append(top,meta);
        if(['user','merchant'].includes(item.role)&&['active','suspended'].includes(item.status)){
          const control=document.createElement('button');
          control.type='button';
          control.className=item.status==='active'?'account-action suspend-action':'account-action activate-action';
          control.textContent=item.status==='active'?'إيقاف الحساب':'إعادة تنشيط الحساب';
          control.setAttribute('aria-label',control.textContent+' '+(item.fullName||item.email));
          control.addEventListener('click',()=>openStatusDialog(item));
          card.appendChild(control);
        }
        cards.appendChild(card);
        const tr=document.createElement('tr');
        cell(tr,item.fullName||'—');
        cell(tr,item.email||'—');
        cell(tr,roles[item.role]||item.role);
        cell(tr,statuses[item.status]||item.status);
        cell(tr,formatDate(item.createdAt));
        body.appendChild(tr);
      }
      byId('users-note').textContent=items.length?
        'الإجمالي: '+formatNumber(Number(result.total)||0)+' | الصفحة '+formatNumber(page)+' من '+formatNumber(pages):
        'لا توجد حسابات مطابقة.';
      byId('users-prev').disabled=page<=1;
      byId('users-next').disabled=page>=pages;
    }catch(e){if(accessToken)byId('users-note').textContent=e.message;}
    finally{busyUsers=false;body.setAttribute('aria-busy','false');cards.setAttribute('aria-busy','false');}
  }
  function openStatusDialog(item){
    if(!accessToken||!item?.id||!['user','merchant'].includes(item.role)||
       !['active','suspended'].includes(item.status))return;
    statusTarget={id:item.id,email:item.email,role:item.role,status:item.status};
    const suspension=item.status==='active';
    byId('status-title').textContent=suspension?'إيقاف حساب':'إعادة تنشيط حساب';
    byId('status-description').textContent=suspension?
      'سيُمنع هذا الحساب من الدخول وتُلغى جلساته الحالية، مع الاحتفاظ ببياناته.':
      'سيعود الحساب إلى الحالة النشطة، لكنه سيحتاج إلى تسجيل دخول جديد.';
    byId('status-target').textContent=(item.fullName||'—')+' — '+item.email;
    byId('status-submit').textContent=suspension?'تأكيد إيقاف الحساب':'تأكيد إعادة التنشيط';
    byId('status-submit').classList.toggle('danger-action',suspension);
    byId('status-reason').value='';
    byId('status-admin-password').value='';
    byId('status-confirm').checked=false;
    byId('status-feedback').textContent='';
    statusDialog.showModal();
    byId('status-reason').focus();
  }
  async function loadAudit(){
    if(busyAudit||!accessToken)return;
    busyAudit=true;
    const list=byId('audit-list');
    list.replaceChildren();
    byId('audit-note').textContent='جارٍ تحميل سجل الإجراءات...';
    byId('audit-prev').disabled=true;byId('audit-next').disabled=true;
    try{
      const result=await secure('/admin/audit?page='+auditPage+'&limit=20');
      if(!accessToken)return;
      const items=Array.isArray(result?.items)?result.items:[];
      auditPages=Number.isInteger(result?.pages)?result.pages:0;
      for(const item of items){
        const entry=document.createElement('article');entry.className='audit-entry';
        const heading=document.createElement('strong');
        heading.textContent=item.action==='account.suspend'?'إيقاف حساب':'إعادة تنشيط حساب';
        const target=document.createElement('span');target.className='audit-target';
        target.textContent=item.targetEmail||item.targetUserId||'—';
        const reason=document.createElement('p');reason.textContent='السبب: '+(item.reason||'—');
        const time=document.createElement('small');time.textContent=formatDate(item.createdAt);
        entry.append(heading,target,reason,time);list.appendChild(entry);
      }
      byId('audit-note').textContent=items.length?
        'إجمالي الإجراءات: '+formatNumber(Number(result.total)||0)+' — الصفحة '+auditPage+' من '+auditPages:
        'لم تُسجّل إجراءات إدارية حتى الآن.';
      byId('audit-prev').disabled=auditPage<=1;
      byId('audit-next').disabled=auditPage>=auditPages;
    }catch(e){if(accessToken)byId('audit-note').textContent=e.message;}
    finally{busyAudit=false;}
  }
  statusForm.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!statusTarget||!accessToken||byId('status-submit').disabled)return;
    const target=statusTarget;
    const reason=byId('status-reason').value.trim();
    if(reason.length<12||reason.length>300||!byId('status-confirm').checked){
      byId('status-feedback').textContent='اكتب سببًا واضحًا وأكّد فهمك للإجراء.';return;
    }
    const submitAction=byId('status-submit');submitAction.disabled=true;
    byId('status-feedback').textContent='جارٍ تطبيق الإجراء وتسجيله...';
    try{
      const next=target.status==='active'?'suspended':'active';
      const pending=request('/admin/users/'+encodeURIComponent(target.id)+'/status',{
        method:'PATCH',authorized:true,
        body:{expectedStatus:target.status,status:next,reason,
          adminPassword:byId('status-admin-password').value},
      });
      byId('status-admin-password').value='';
      const result=await pending;
      if(result?.status!==next)throw new Error('لم يؤكد الخادم تغيير حالة الحساب.');
      statusDialog.close();statusTarget=null;
      byId('users-note').textContent='تم تحديث حالة الحساب وتسجيل الإجراء بنجاح.';
      auditPage=1;
      await Promise.all([loadUsers(),loadAudit(),loadSummary()]);
    }catch(e){
      byId('status-admin-password').value='';
      if(e.status===401||e.status===403){clearAuth();msg(e.message);return;}
      byId('status-feedback').textContent=e.message||'تعذر تنفيذ الإجراء.';
    }finally{submitAction.disabled=false;}
  });
  byId('status-cancel').addEventListener('click',()=>statusDialog.close());
  statusDialog.addEventListener('close',()=>{
    byId('status-admin-password').value='';
    byId('status-reason').value='';
    byId('status-confirm').checked=false;
    statusTarget=null;
  });
  byId('audit-retry').addEventListener('click',loadAudit);
  byId('audit-prev').addEventListener('click',()=>{if(auditPage>1){auditPage--;loadAudit();}});
  byId('audit-next').addEventListener('click',()=>{if(auditPage<auditPages){auditPage++;loadAudit();}});

  async function enter(user){
    if(!user||user.role!=='admin')throw new Error('هذا الحساب لا يملك صلاحية الدخول إلى بوابة الإدارة.');
    byId('session-email').textContent=user.email||'';
    document.body.classList.add('admin-authenticated');
    loginView.classList.add('hidden');dash.classList.add('active');
    msg('');selectPanel('overview');setStatus('جارٍ التحقق...');
    await Promise.all([loadSummary(),loadPrice()]);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(submit.disabled)return;
    msg('');submit.disabled=true;
    submit.setAttribute('aria-busy','true');
    const old=submit.textContent;submit.textContent='جارٍ التحقق...';
    try{
      // Never call the general password-only login endpoint for Admin.
      const challenge=await request('/auth/admin/login',{method:'POST',
        body:{email:email.value.trim(),password:password.value}});
      showOtp(challenge);
    }catch(e){clearAuth();msg(e.message||'تعذر تسجيل الدخول.');}
    finally{submit.disabled=false;submit.textContent=old;submit.removeAttribute('aria-busy');}
  });
  otpForm.addEventListener('submit',async event=>{
    event.preventDefault();if(otpSubmit.disabled||!challengeId)return;
    const normalized=otpCode.value.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660))
      .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
    if(!/^\d{6}$/.test(normalized)){otpAlert('أدخل رمزًا مكونًا من ستة أرقام.');return;}
    otpSubmit.disabled=true;otpAlert('');
    const label=otpSubmit.textContent;otpSubmit.textContent='جارٍ تأكيد الرمز...';
    try{
      const tokens=await request('/auth/admin/verify',{method:'POST',
        body:{challengeId,code:normalized}});
      if(!tokens?.accessToken||!tokens?.refreshToken)
        throw new Error('تعذر تأكيد تسجيل الدخول.');
      accessToken=tokens.accessToken;refreshToken=tokens.refreshToken;
      challengeId='';
      const user=await secure('/auth/me');
      if(accessToken){otpView.hidden=true;await enter(user);}
    }catch(e){otpAlert(e.message||'رمز التحقق غير صحيح أو انتهت صلاحيته.');}
    finally{otpSubmit.disabled=false;otpSubmit.textContent=label;}
  });
  byId('otp-resend').addEventListener('click',async ()=>{
    if(!challengeId||byId('otp-resend').disabled)return;
    const button=byId('otp-resend');button.disabled=true;otpAlert('');
    try{
      const next=await request('/auth/admin/resend',{method:'POST',body:{challengeId}});
      if(!next?.requiresVerification||!next?.challengeId)throw new Error('تعذر إعادة إرسال الرمز.');
      challengeId=next.challengeId;otpCode.value='';otpCode.focus();
      otpMessage.textContent='تم إرسال رمز جديد. انتهت صلاحية الرمز السابق.';
    }catch(e){otpAlert(e.message||'تعذر إرسال الرمز.');}
    finally{button.disabled=false;}
  });
  byId('otp-cancel').addEventListener('click',()=>{clearAuth();msg('يمكنك تسجيل الدخول من جديد.','ok');email.focus();});
  byId('logout').addEventListener('click',async ()=>{
    const token=accessToken;
    try{
      if(token) await request('/auth/logout',{method:'POST',authorized:true});
      clearAuth();msg('تم تسجيل الخروج بأمان.','ok');
    }catch(e){clearAuth();msg('تم الخروج من هذا الجهاز، لكن تعذر إبطال الجلسة بالخادم.');}
    email.focus();
  });
  byId('toggle-password').addEventListener('click',()=>{
    password.type=password.type==='password'?'text':'password';
    byId('toggle-password').textContent=password.type==='password'?'إظهار كلمة المرور':'إخفاء كلمة المرور';
    byId('toggle-password').setAttribute('aria-pressed',String(password.type==='text'));
    byId('toggle-password').setAttribute('aria-label',password.type==='password'?'إظهار كلمة المرور':'إخفاء كلمة المرور');
  });
  document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>selectPanel(b.dataset.panel)));
  byId('summary-retry').addEventListener('click',loadSummary);
  byId('users-filter').addEventListener('submit',event=>{event.preventDefault();page=1;loadUsers();});
  byId('users-prev').addEventListener('click',()=>{if(page>1){page--;loadUsers();}});
  byId('users-next').addEventListener('click',()=>{if(page<pages){page++;loadUsers();}});
  byId('prices-retry').addEventListener('click',loadPrice);
  if('serviceWorker'in navigator){
    addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{}));
  }
})();
