const DEMO_PRICES={24:522.10,22:478.60,21:456.85,18:391.58};
const GOLD_SPOT_URL='https://api.gold-api.com/price/XAU/USD';
const TROY_OUNCE_GRAMS=31.1034768;
const USD_SAR=3.75;
const state={
  apiUrl:localStorage.getItem('gold_api_url')||'',
  accessToken:localStorage.getItem('gold_access_token')||'',
  refreshToken:localStorage.getItem('gold_refresh_token')||'',
  prices:{...DEMO_PRICES},portfolios:[],purchases:[],alerts:[],
  localPurchases:JSON.parse(localStorage.getItem('gold_demo_purchases')||'[]'),
  localAlerts:JSON.parse(localStorage.getItem('gold_demo_alerts')||'[]'),
  mode:'local',
  priceSource:'demo',
  priceUpdatedAt:null
};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:2}).format(Number(n||0));
const dateLabel=x=>{try{return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(x))}catch{return '—'}};

async function api(path,opts={},retry=true){
  if(!state.apiUrl) throw new Error('DEMO_MODE');
  const headers={'Content-Type':'application/json',...(opts.headers||{})};
  if(state.accessToken) headers.Authorization='Bearer '+state.accessToken;
  const res=await fetch(state.apiUrl+path,{...opts,headers});
  if(res.status===401&&retry&&state.refreshToken){
    const ok=await refreshSession();
    if(ok) return api(path,opts,false);
  }
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    const msg=Array.isArray(data?.message)?data.message.join('، '):(data?.message||('HTTP '+res.status));
    throw new Error(msg);
  }
  return data;
}
async function refreshSession(){
  try{
    const res=await fetch(state.apiUrl+'/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:state.refreshToken})});
    const d=await res.json();
    if(!res.ok) throw new Error();
    state.accessToken=d.accessToken||'';state.refreshToken=d.refreshToken||'';
    localStorage.setItem('gold_access_token',state.accessToken);
    localStorage.setItem('gold_refresh_token',state.refreshToken);
    return true;
  }catch{clearSession();return false}
}
function clearSession(){
  state.accessToken='';state.refreshToken='';
  localStorage.removeItem('gold_access_token');localStorage.removeItem('gold_refresh_token');
}
function setConnection(ok,label){
  const e=$('#connectionBadge');
  e.className='status-badge '+(ok?'online':'offline');
  e.textContent=label||(ok?'متصل':'وضع محلي');
}
function go(v){
  $$('.view').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
  $$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===v));
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

function renderPrices(){
  const rows=Object.entries(state.prices).sort((a,b)=>Number(b[0])-Number(a[0]));
  const sourceLabel=state.priceSource==='gold-api'?'Gold API · XAU/USD':state.priceSource==='backend'?'Gold App API':'وضع محلي';
  const updated=state.priceUpdatedAt?(' · '+dateLabel(state.priceUpdatedAt)):'';
  $('#priceCards').innerHTML=rows.map(([k,p])=>'<div class="price-card"><small>'+k+'K</small><b>'+Number(p).toFixed(2)+'</b><span>ر.س/جرام</span></div>').join('');
  $('#allPrices').innerHTML=rows.map(([k,p])=>'<article class="list-card"><div><b>ذهب عيار '+k+'</b><small>'+sourceLabel+updated+'</small></div><strong>'+money(p)+'</strong></article>').join('');
  $('#heroPrice').textContent=Number(state.prices[24]||0).toFixed(2);
  const heroNote=document.querySelector('.hero-card .change');
  if(heroNote) heroNote.textContent=sourceLabel+updated;
}

function pricesFromSpotUsd(usdPerOunce){
  const pureGram=(Number(usdPerOunce)*USD_SAR)/TROY_OUNCE_GRAMS;
  return {
    24:Number(pureGram.toFixed(2)),
    22:Number((pureGram*(22/24)).toFixed(2)),
    21:Number((pureGram*(21/24)).toFixed(2)),
    18:Number((pureGram*(18/24)).toFixed(2))
  };
}

async function loadSpotPrices(){
  const res=await fetch(GOLD_SPOT_URL,{cache:'no-store'});
  if(!res.ok) throw new Error('Gold API HTTP '+res.status);
  const d=await res.json();
  const spot=Number(d.price);
  if(!Number.isFinite(spot)||spot<=0) throw new Error('Invalid gold spot price');
  state.prices=pricesFromSpotUsd(spot);
  state.priceSource='gold-api';
  state.priceUpdatedAt=d.updatedAt||new Date().toISOString();
  localStorage.setItem('gold_last_prices',JSON.stringify({
    prices:state.prices,
    updatedAt:state.priceUpdatedAt,
    source:'gold-api'
  }));
}

async function loadBackendPrices(){
  if(!state.apiUrl) throw new Error('NO_BACKEND');
  const rows=await Promise.all([24,22,21,18].map(async k=>[k,await api('/prices/latest?currency=SAR&karat='+k,{},false)]));
  rows.forEach(([k,d])=>{
    const v=Number(d.sellPrice??d.buyPrice??d.pricePerGram??d.price??d.value);
    if(Number.isFinite(v)) state.prices[k]=v;
  });
  state.priceSource='backend';
  state.priceUpdatedAt=new Date().toISOString();
}

function loadCachedPrices(){
  try{
    const cached=JSON.parse(localStorage.getItem('gold_last_prices')||'null');
    if(cached?.prices){
      state.prices=cached.prices;
      state.priceSource='cached';
      state.priceUpdatedAt=cached.updatedAt||null;
      return true;
    }
  }catch{}
  return false;
}

async function loadPrices(){
  try{
    await loadSpotPrices();
    state.mode='online';
    setConnection(true,state.accessToken?'سعر حي + حساب':'سعر حي');
  }catch{
    try{
      await loadBackendPrices();
      state.mode='online';
      setConnection(true,state.accessToken?'API + حساب':'API متصل');
    }catch{
      const cached=loadCachedPrices();
      if(!cached) state.prices={...DEMO_PRICES};
      state.mode='local';
      state.priceSource=cached?'cached':'demo';
      setConnection(false,cached?'آخر سعر محفوظ':'وضع محلي');
    }
  }
  renderPrices();
  renderPortfolio();
}

async function ensureDefaultPortfolio(){
  state.portfolios=await api('/portfolio');
  if(state.portfolios.length) return state.portfolios[0];
  const p=await api('/portfolio',{method:'POST',body:JSON.stringify({name:'محفظتي الرئيسية'})});
  state.portfolios=[p];return p;
}
async function syncPortfolio(){
  if(!state.apiUrl||!state.accessToken){state.purchases=[...state.localPurchases];renderPortfolio();return}
  try{
    await ensureDefaultPortfolio();
    const [p,s]=await Promise.all([api('/portfolio/purchase'),api('/portfolio/summary')]);
    state.purchases=p||[];state.mode='online';renderPortfolio(s);setConnection(true,'API + حساب');
  }catch{state.purchases=[...state.localPurchases];renderPortfolio()}
}
function renderPortfolio(summary=null){
  const online=state.apiUrl&&state.accessToken&&state.mode==='online';
  const items=online?state.purchases:state.localPurchases;
  let cost=0,current=0,pnl=0;
  if(summary?.totalsByCurrency?.length){
    const sar=summary.totalsByCurrency.find(x=>x.currency==='SAR')||summary.totalsByCurrency[0];
    cost=Number(sar?.totalCost||0);current=Number(sar?.marketValue||0);pnl=Number(sar?.unrealizedPnl||0);
  }else{
    items.forEach(p=>{
      const g=Number(p.weightGrams??p.grams??0),u=Number(p.unitPrice??p.pricePerGram??0),k=Number(p.karat||21);
      cost+=Number(p.totalPrice??g*u);current+=g*Number(state.prices[k]||0);
    });pnl=current-cost;
  }
  $('#portfolioCost').textContent=money(cost);$('#portfolioValue').textContent=money(current);$('#portfolioPnl').textContent=(pnl>=0?'+':'')+money(pnl);
  $('#portfolioNotice').textContent=online?'المحفظة متزامنة مع الخادم'+(state.portfolios[0]?.name?' · '+state.portfolios[0].name:'')+'.':'المحفظة الحالية محفوظة محليًا على هذا الجهاز.';
  $('#purchasesList').innerHTML=items.length?items.map((p,i)=>{
    const g=Number(p.weightGrams??p.grams??0),u=Number(p.unitPrice??p.pricePerGram??0);
    const fn=p.id?"removePurchaseRemote('"+p.id+"')":'removePurchaseLocal('+i+')';
    return '<article class="list-card"><div><b>'+g+' جم · عيار '+p.karat+'</b><small>'+money(u)+' للجرام · '+(p.purchasedAt?dateLabel(p.purchasedAt):'محلي')+'</small></div><button class="small-btn" onclick="'+fn+'">حذف</button></article>';
  }).join(''):'<div class="notice">لا توجد مشتريات بعد.</div>';
}
window.removePurchaseLocal=i=>{state.localPurchases.splice(i,1);localStorage.setItem('gold_demo_purchases',JSON.stringify(state.localPurchases));renderPortfolio()};
window.removePurchaseRemote=async id=>{try{await api('/portfolio/purchase/'+id,{method:'DELETE'});await syncPortfolio()}catch(e){alert('تعذر حذف الشراء: '+e.message)}};
async function addPurchase(fd){
  const karat=Number(fd.get('karat')),weightGrams=Number(fd.get('grams')),unitPrice=Number(fd.get('pricePerGram')),totalPrice=Number((weightGrams*unitPrice).toFixed(2));
  if(state.apiUrl&&state.accessToken){
    try{
      const p=await ensureDefaultPortfolio();
      await api('/portfolio/purchase',{method:'POST',body:JSON.stringify({portfolioId:p.id,karat,weightGrams,unitPrice,totalPrice,currency:'SAR',purchasedAt:new Date().toISOString()})});
      await syncPortfolio();return;
    }catch(e){alert('تعذر الحفظ على الخادم، سيُحفظ محليًا: '+e.message)}
  }
  state.localPurchases.unshift({karat,grams:weightGrams,pricePerGram:unitPrice,purchasedAt:new Date().toISOString()});
  localStorage.setItem('gold_demo_purchases',JSON.stringify(state.localPurchases));renderPortfolio();
}

async function syncAlerts(){
  if(!state.apiUrl||!state.accessToken){state.alerts=[...state.localAlerts];renderAlerts();return}
  try{const d=await api('/alerts?limit=100');state.alerts=d.items||[];renderAlerts()}catch{state.alerts=[...state.localAlerts];renderAlerts()}
}
const alertStatus=s=>s==='active'?'نشط':s==='paused'?'موقوف':s==='triggered'?'تم التفعيل':'محلي';
function renderAlerts(){
  const online=state.apiUrl&&state.accessToken&&state.alerts.some(a=>a.id);
  const items=online?state.alerts:state.localAlerts;
  $('#alertsList').innerHTML=items.length?items.map((a,i)=>{
    const controls=a.id?'<div class="row-actions"><button class="small-btn" onclick="toggleAlert(\''+a.id+'\')">'+(a.status==='active'?'إيقاف':'تفعيل')+'</button><button class="small-btn" onclick="removeAlertRemote(\''+a.id+'\')">حذف</button></div>':'<button class="small-btn" onclick="removeAlertLocal('+i+')">حذف</button>';
    return '<article class="list-card"><div><b>عيار '+a.karat+' · '+(a.direction==='above'?'فوق ':'تحت ')+money(a.targetPrice)+'</b><small>'+alertStatus(a.status)+'</small></div>'+controls+'</article>';
  }).join(''):'<div class="notice">لا توجد تنبيهات بعد.</div>';
}
window.removeAlertLocal=i=>{state.localAlerts.splice(i,1);localStorage.setItem('gold_demo_alerts',JSON.stringify(state.localAlerts));renderAlerts()};
window.removeAlertRemote=async id=>{try{await api('/alerts/'+id,{method:'DELETE'});await syncAlerts()}catch(e){alert('تعذر حذف التنبيه: '+e.message)}};
window.toggleAlert=async id=>{try{await api('/alerts/'+id+'/toggle',{method:'POST'});await syncAlerts()}catch(e){alert('تعذر تغيير حالة التنبيه: '+e.message)}};
async function addAlert(fd){
  const payload={currency:'SAR',karat:Number(fd.get('karat')),targetPrice:Number(fd.get('targetPrice')),direction:String(fd.get('direction'))};
  if(state.apiUrl&&state.accessToken){
    try{await api('/alerts',{method:'POST',body:JSON.stringify(payload)});await syncAlerts();return}catch(e){alert('تعذر الحفظ على الخادم، سيُحفظ محليًا: '+e.message)}
  }
  state.localAlerts.unshift({...payload,status:'local'});localStorage.setItem('gold_demo_alerts',JSON.stringify(state.localAlerts));renderAlerts();
}
function renderAuth(){
  $('#authState').innerHTML=state.accessToken?'<div class="notice">جلسة دخول محفوظة. سيتم تجديد access token تلقائيًا عند الحاجة.</div>':'<div class="notice">غير مسجل الدخول. يمكنك استخدام الأسعار والوضع المحلي دون حساب.</div>';
}
async function afterLogin(){renderAuth();await Promise.allSettled([loadPrices(),syncPortfolio(),syncAlerts()])}

$('#apiUrlInput').value=state.apiUrl;
$('#saveApiBtn').addEventListener('click',async()=>{state.apiUrl=$('#apiUrlInput').value.trim().replace(/\/+$/,'');localStorage.setItem('gold_api_url',state.apiUrl);await Promise.allSettled([loadPrices(),syncPortfolio(),syncAlerts()])});
$('#demoModeBtn').addEventListener('click',()=>{state.apiUrl='';localStorage.removeItem('gold_api_url');$('#apiUrlInput').value='';state.mode='local';loadPrices();syncPortfolio();syncAlerts()});
$('#refreshPrices').addEventListener('click',loadPrices);

const loginDialog=$('#loginDialog');
$('#loginBtn').addEventListener('click',()=>loginDialog.showModal());
$('#logoutBtn').addEventListener('click',()=>{clearSession();state.portfolios=[];state.purchases=[];state.alerts=[];renderAuth();syncPortfolio();syncAlerts();setConnection(false,state.apiUrl?'API دون حساب':'وضع محلي')});
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);$('#loginError').textContent='';
  try{
    const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email:f.get('email'),password:f.get('password')})},false);
    state.accessToken=d.accessToken||'';state.refreshToken=d.refreshToken||'';
    localStorage.setItem('gold_access_token',state.accessToken);localStorage.setItem('gold_refresh_token',state.refreshToken);
    loginDialog.close();await afterLogin();
  }catch(err){$('#loginError').textContent=err.message==='DEMO_MODE'?'أدخل عنوان API أولًا من الإعدادات.':err.message}
});
$('#addPurchaseBtn').addEventListener('click',()=>$('#purchaseDialog').showModal());
$('#purchaseForm').addEventListener('submit',async e=>{e.preventDefault();await addPurchase(new FormData(e.currentTarget));$('#purchaseDialog').close();e.currentTarget.reset()});
$('#addAlertBtn').addEventListener('click',()=>$('#alertDialog').showModal());
$('#alertForm').addEventListener('submit',async e=>{e.preventDefault();await addAlert(new FormData(e.currentTarget));$('#alertDialog').close();e.currentTarget.reset()});

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false});
$('#installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').hidden=true});
if('serviceWorker'in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

renderPrices();renderPortfolio();renderAlerts();renderAuth();
Promise.allSettled([loadPrices(),syncPortfolio(),syncAlerts()]);