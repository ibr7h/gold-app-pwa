(()=>{
  'use strict';
  const API='https://gold-app-api-u8dl.onrender.com';
  const byId=id=>document.getElementById(id);
  const loginView=byId('login-view'),dash=byId('dash-view');
  const form=byId('login-form'),notice=byId('notice'),submit=byId('submit');
  const email=byId('email'),password=byId('password');
  let accessToken='',refreshToken='',page=1,pages=0,activePanel='overview';
  let busyUsers=false;
  const formatNumber=n=>new Intl.NumberFormat('ar-SA',{maximumFractionDigits:0}).format(n);
  const formatDate=s=>{
    if(!s)return '—';
    const d=new Date(s);
    return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(d):'—';
  };
  function msg(text,type='error'){
    notice.textContent=text;
    notice.className=text?'notice '+type:'notice';
  }
  function setStatus(text){byId('connection-state').textContent=text;}
  function clearAuth(){
    accessToken='';refreshToken='';
    byId('session-email').textContent='';
    dash.classList.remove('active');
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
        const detail=Array.isArray(result?.message)?result.message.join('، '):result?.message;
        const err=new Error(r.status===404&&authorized?
          'هذه الوظيفة لم تُنشر على الخادم بعد.':r.status===401?'انتهت صلاحية الجلسة. سجّل الدخول مجددًا.':
          r.status===403?'ليس لهذا الحساب صلاحية الإدارة.':detail||'تعذر إكمال الطلب.');
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
    if(panel==='users'){page=1;loadUsers();}
    if(panel==='prices')loadPrice();
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
    const body=byId('users-body');
    body.replaceChildren();
    byId('users-note').textContent='جارٍ تحميل المستخدمين...';
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
    finally{busyUsers=false;}
  }
  async function enter(user){
    if(!user||user.role!=='admin')throw new Error('هذا الحساب لا يملك صلاحية الدخول إلى بوابة الإدارة.');
    byId('session-email').textContent=user.email||'';
    loginView.classList.add('hidden');dash.classList.add('active');
    msg('');selectPanel('overview');setStatus('جارٍ التحقق...');
    await Promise.all([loadSummary(),loadPrice()]);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(submit.disabled)return;
    msg('');submit.disabled=true;
    const old=submit.textContent;submit.textContent='جارٍ التحقق...';
    try{
      const tokens=await request('/auth/login',{method:'POST',
        body:{email:email.value.trim(),password:password.value}});
      if(!tokens?.accessToken||!tokens?.refreshToken)throw new Error('تعذر تأكيد تسجيل الدخول.');
      accessToken=tokens.accessToken;refreshToken=tokens.refreshToken;
      const user=await secure('/auth/me');
      if(accessToken)await enter(user);
    }catch(e){clearAuth();msg(e.message||'تعذر تسجيل الدخول.');}
    finally{submit.disabled=false;submit.textContent=old;}
  });
  byId('logout').addEventListener('click',()=>{clearAuth();msg('تم تسجيل الخروج من الواجهة.','ok');});
  byId('toggle-password').addEventListener('click',()=>{
    password.type=password.type==='password'?'text':'password';
    byId('toggle-password').textContent=password.type==='password'?'إظهار':'إخفاء';
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
