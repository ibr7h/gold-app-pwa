import React,{useState,useEffect,useRef,useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import AuthForm from './AuthForm';
import {api,jsonRequest,errorMessage} from './api';
import {Portfolio,Purchase,PriceAlert,Feed,KARATS,CURRENCIES,validFeed,indicativePrice,totals,purchasePayload,localDate} from './model';
import './user.css';
type Page='home'|'prices'|'calculator'|'portfolio'|'settings'|'purchases'|'alerts'|'map'|'account'|'help';
const pages:{id:Page;label:string;icon:string}[]=[
 {id:'home',label:'الرئيسية',icon:'home'},
 {id:'prices',label:'الأسعار',icon:'chart'},
 {id:'calculator',label:'الحاسبة',icon:'calculator'},
 {id:'portfolio',label:'المحفظة',icon:'wallet'},
 {id:'settings',label:'المزيد',icon:'menu'},
 {id:'purchases',label:'المشتريات',icon:'receipt'},
 {id:'alerts',label:'التنبيهات',icon:'bell'},
 {id:'map',label:'التجار',icon:'map'},
 {id:'account',label:'الملف الشخصي',icon:'user'},
 {id:'help',label:'المساعدة',icon:'help'}
];
const mobilePages=pages.filter(p=>['home','prices','calculator','portfolio','settings'].includes(p.id));
function Icon({name}:{name:string}){
 const paths:Record<string,string>={home:'m3 10 9-7 9 7v10H3Z M9 20v-7h6v7',chart:'M4 4v16h16 M7 14l4-5 4 3 5-7',wallet:'M3 6h17v14H3Z M3 6V4h14 M15 11h6v5h-6Z',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2Z M8 8h8 M8 12h8',bell:'M5 16h14l-2-3V9a5 5 0 0 0-10 0v4Z M10 20h4',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',help:'M12 17v1 M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',menu:'M4 6h16 M4 12h16 M4 18h16',close:'m6 6 12 12 M6 18 18 6',refresh:'M20 8a9 9 0 1 0 1 8 M20 3v6h-6',plus:'M12 5v14 M5 12h14',logout:'M9 3H4v18h5 M9 12h12 m-4-4 4 4-4 4',calculator:'M5 2h14v20H5Z M8 6h8 M8 10h2 M12 10h2 M16 10h1 M8 14h2 M12 14h2 M16 14h1 M8 18h2 M12 18h5',map:'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z M9 3v15 M15 6v15'};
 return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.home}/></svg>;
}
const number=(n:number)=>new Intl.NumberFormat('ar-SA',{maximumFractionDigits:4}).format(n);
const money=(n:number|null,c:string)=>n===null?'غير متاح':number(n)+' '+c;
const dateTime=(s:string)=>new Date(s).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});
function Empty({children}:{children:React.ReactNode}){return <div className="empty"><Icon name="wallet"/><p>{children}</p></div>;}
function CurrencySelect({value='SAR'}:{value?:string}){return <select name="currency" defaultValue={value}>{(CURRENCIES.includes(value)?CURRENCIES:[value,...CURRENCIES]).map(c=><option key={c}>{c}</option>)}</select>;}
function KaratSelect({value=24}:{value?:number}){return <select name="karat" defaultValue={value}>{(KARATS.includes(value)?KARATS:[value,...KARATS]).map(k=><option key={k} value={k}>عيار {k}</option>)}</select>;}
interface PriceHistoryRow{id:string;source:string;currency:string;karat:number;buyPrice:string;sellPrice:string;timestamp:string;createdAt:string}
function PriceHistoryChart({rows,currency,karat}:{rows:PriceHistoryRow[];currency:string;karat:number}){
 const data=[...rows].filter(r=>Number.isFinite(Number(r.buyPrice))&&Number.isFinite(Date.parse(r.createdAt||r.timestamp))).sort((a,b)=>Date.parse(a.createdAt||a.timestamp)-Date.parse(b.createdAt||b.timestamp));
 if(data.length<2)return <div className="chart-empty">نحتاج تحديثين محفوظين على الأقل لرسم حركة السعر.</div>;
 const values=data.map(r=>Number(r.buyPrice)),min=Math.min(...values),max=Math.max(...values),span=Math.max(max-min,Math.max(max,1)*0.002);
 const left=28,right=572,top=22,bottom=142;
 const pts=data.map((r,i)=>{const x=left+(right-left)*(i/Math.max(1,data.length-1));const y=bottom-(bottom-top)*((Number(r.buyPrice)-(min-span*.12))/(span*1.24));return{x,y,row:r};});
 const path=pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
 const labels=[0,Math.floor((data.length-1)/2),data.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>data[i]);
 return <div className="history-chart" role="img" aria-label={`رسم سعر الذهب عيار ${karat} حسب وقت التحديث`}>
  <div className="chart-legend"><span><i className="legend-gold"/>سعر الجرام · عيار {karat}</span><strong>{currency}</strong></div>
  <svg viewBox="0 0 600 170" preserveAspectRatio="none" aria-hidden="true">
   <line x1="28" y1="42" x2="572" y2="42" className="chart-grid"/><line x1="28" y1="82" x2="572" y2="82" className="chart-grid"/><line x1="28" y1="122" x2="572" y2="122" className="chart-grid"/>
   <path d={path} className="chart-line"/>
   {pts.map((p,i)=><circle key={p.row.id||i} cx={p.x} cy={p.y} r="3.8" className="chart-dot"><title>{dateTime(p.row.createdAt||p.row.timestamp)} · {money(Number(p.row.buyPrice),currency)}</title></circle>)}
  </svg>
  <div className="chart-axis">{labels.map((r,i)=><span key={i}>{new Date(r.createdAt||r.timestamp).toLocaleTimeString('ar-SA',{hour:'numeric',minute:'2-digit'})}</span>)}</div>
  <p className="chart-caption">كل نقطة تمثل تحديثًا محفوظًا فعليًا في النظام، ويُستخدم وقت الحفظ <code>createdAt</code> للمحور الزمني.</p>
 </div>;
}
function BootScreen(){
 const [slow,setSlow]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setSlow(true),6500);return()=>clearTimeout(timer);},[]);
 return <div className="gold-web boot" dir="rtl" role="status" aria-live="polite">
  <div className="boot-shell">
   <span className="boot-mark" aria-hidden="true">ذ</span>
   <div className="boot-copy"><h1>ذهبي</h1><p>نجهّز ذهبي لك…</p></div>
   <span className="boot-loader" aria-hidden="true"><i/><i/><i/></span>
   {slow&&<p className="boot-slow">قد يستغرق التشغيل الأول بضع ثوانٍ.</p>}
  </div>
 </div>;
}
export default function UserWorkspace(){
 const {user,isLoading,logout}=useAuth();
 if(isLoading&&!user)return <BootScreen/>;
 if(!user)return <AuthForm/>;
 return <Workspace key={String(user.id)} email={user.email} role={user.role} logout={logout}/>;
}
export function Workspace({email,role,logout}:{email:string;role:string;logout:()=>void}){
 const [page,setPage]=useState<Page>('home'),[menu,setMenu]=useState(false);
 const [portfolios,setPortfolios]=useState<Portfolio[]>([]),[purchases,setPurchases]=useState<Purchase[]>([]),[alerts,setAlerts]=useState<PriceAlert[]>([]);
 const [feed,setFeed]=useState<Feed|null>(null),[feedError,setFeedError]=useState(''),[priceCurrency,setPriceCurrency]=useState('SAR');
 const [history,setHistory]=useState<PriceHistoryRow[]>([]),[marketRows,setMarketRows]=useState<PriceHistoryRow[]>([]),[historyError,setHistoryError]=useState(''),[chartKarat,setChartKarat]=useState(24);
 const [calcKarat,setCalcKarat]=useState(24),[calcWeight,setCalcWeight]=useState(10),[calcFee,setCalcFee]=useState(0),[calcVat,setCalcVat]=useState(false);
 const [loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [dialog,setDialog]=useState<{type:'portfolio'|'purchase'|'alert';purchase?:Purchase}|null>(null),[confirm,setConfirm]=useState<{path:string;label:string}|null>(null),[formError,setFormError]=useState('');
 const [clock,setClock]=useState(Date.now());const active=useRef(true),loadSequence=useRef(0),writeLock=useRef(false),modalRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
 const loadData=useCallback(async()=>{
  const seq=++loadSequence.current;setLoading(true);setError('');
  try{
   const [ps,buys,first]=await Promise.all([api<Portfolio[]>('/portfolio'),api<Purchase[]>('/portfolio/purchase'),api<{items:PriceAlert[];total:number}>('/alerts?limit=100&page=1')]);
   if(!Array.isArray(ps)||!Array.isArray(buys)||!Array.isArray(first.items)||!Number.isFinite(first.total))throw new Error('Invalid response');
   const all=[...first.items];for(let p=2;all.length<first.total;p++){const next=await api<{items:PriceAlert[]}>('/alerts?limit=100&page='+p);if(!next.items.length)break;all.push(...next.items);}
   if(active.current&&seq===loadSequence.current){setPortfolios(ps);setPurchases(buys);setAlerts(all);setLoaded(true);}
  }catch(e){if(active.current&&seq===loadSequence.current)setError(errorMessage(e));}
  finally{if(active.current&&seq===loadSequence.current)setLoading(false);}
 },[]);
 const loadPrice=useCallback(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch('https://raw.githubusercontent.com/ibr7h/gold-app-pwa/main/prices-live.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});if(!r.ok)throw new Error();const d=validFeed(await r.json());if(active.current){setFeed(d);setFeedError('');}}
  catch{if(active.current)setFeedError('تعذر جلب تحديث السعر. تأكد من وقت آخر تحديث قبل استخدامه.');}finally{clearTimeout(timer);}
 },[]);
 const loadMarket=useCallback(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const r=await fetch('https://raw.githubusercontent.com/ibr7h/gold-app-pwa/main/prices-history.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});
   if(!r.ok)throw new Error('history unavailable');
   const doc=await r.json() as {points?:Array<{source?:string;spotUsdPerOunce:number;usdSar:number;updatedAt:string;generatedAt:string;pricesSarPerGram:Record<string,number>}>};
   const points=Array.isArray(doc.points)?doc.points:[];
   const gram=31.1034768;
   const rows:PriceHistoryRow[]=points.map((p,i)=>{
    const sar=Number(p.pricesSarPerGram?.[String(chartKarat)]);
    const usd24=Number(p.spotUsdPerOunce)/gram;
    const value=priceCurrency==='SAR'?sar:usd24*(chartKarat/24);
    return {id:'hist-'+i,source:p.source||'api.gold-api.com',currency:priceCurrency,karat:chartKarat,buyPrice:String(value),sellPrice:String(value),timestamp:p.updatedAt,createdAt:p.generatedAt||p.updatedAt};
   }).filter(x=>Number.isFinite(Number(x.buyPrice)));
   const last=points[points.length-1];
   const latest:PriceHistoryRow[]=last?[24,22,21,18].map(k=>{
    const sar=Number(last.pricesSarPerGram?.[String(k)]);
    const usd24=Number(last.spotUsdPerOunce)/gram;
    const value=priceCurrency==='SAR'?sar:usd24*(k/24);
    return {id:'latest-'+k,source:last.source||'api.gold-api.com',currency:priceCurrency,karat:k,buyPrice:String(value),sellPrice:String(value),timestamp:last.updatedAt,createdAt:last.generatedAt||last.updatedAt};
   }).filter(x=>Number.isFinite(Number(x.buyPrice))):[];
   if(active.current){setHistory(rows);setMarketRows(latest);setHistoryError('');}
  }catch{if(active.current){setHistory([]);setMarketRows([]);setHistoryError('تعذر تحميل سجل الأسعار المحفوظ.');}}
  finally{clearTimeout(timer);}
 },[priceCurrency,chartKarat]);
 useEffect(()=>{active.current=true;void loadData();void loadPrice();void loadMarket();const timer=setInterval(()=>{setClock(Date.now());if(document.visibilityState==='visible'){void loadPrice();void loadMarket();}},60000);
  const focus=()=>{if(document.visibilityState==='visible'){void loadData();void loadPrice();void loadMarket();}};document.addEventListener('visibilitychange',focus);
  return()=>{active.current=false;loadSequence.current++;clearInterval(timer);document.removeEventListener('visibilitychange',focus);};},[loadData,loadPrice,loadMarket]);
 useEffect(()=>{const read=()=>{const id=location.hash.slice(1);if(pages.some(p=>p.id===id))setPage(id as Page);};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[]);
 const navigate=(p:Page)=>{setPage(p);setMenu(false);location.hash=p;requestAnimationFrame(()=>headingRef.current?.focus());};
 useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),6000);return()=>clearTimeout(timer);},[message]);
 useEffect(()=>{if(!dialog&&!confirm&&!menu)return;const previous=document.activeElement as HTMLElement,el=modalRef.current;
  const controls=()=>el?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]');controls()?.[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!writeLock.current){setDialog(null);setConfirm(null);setMenu(false);}if(e.key==='Tab'&&el){const c=controls();if(!c?.length)return;if(e.shiftKey&&document.activeElement===c[0]){e.preventDefault();c[c.length-1].focus();}else if(!e.shiftKey&&document.activeElement===c[c.length-1]){e.preventDefault();c[0].focus();}}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[dialog,confirm,menu]);
 const mutate=async(path:string,method:string,data?:object)=>{
  if(writeLock.current)return;writeLock.current=true;setBusy(true);setError('');setFormError('');setMessage('');
  try{await api(path,jsonRequest(method,data));if(!active.current)return;setDialog(null);setConfirm(null);setMessage('تم حفظ التغيير على الخادم.');await loadData();}
  catch(e){if(active.current){const msg=errorMessage(e);setFormError(msg);setError(msg);}}
  finally{writeLock.current=false;if(active.current)setBusy(false);}
 };
 const openDialog=(type:'portfolio'|'purchase'|'alert',purchase?:Purchase)=>{setFormError('');setDialog({type,purchase});};
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const data=new FormData(e.currentTarget);if(!dialog)return;
  try{
   if(dialog.type==='portfolio'){const name=String(data.get('name')||'').trim();if(!name)throw new Error('أدخل اسم المحفظة.');await mutate('/portfolio','POST',{name});}
   if(dialog.type==='purchase'){const payload=purchasePayload(data);await mutate(dialog.purchase?'/portfolio/purchase/'+dialog.purchase.id:'/portfolio/purchase',dialog.purchase?'PATCH':'POST',payload);}
   if(dialog.type==='alert'){const targetPrice=Number(data.get('targetPrice'));if(!Number.isFinite(targetPrice)||targetPrice<=0||targetPrice>=100000000)throw new Error('أدخل سعرًا موجبًا أقل من 100 مليون.');await mutate('/alerts','POST',{currency:String(data.get('currency')),karat:Number(data.get('karat')),targetPrice,direction:String(data.get('direction'))});}
  }catch(e){setFormError(e instanceof Error?e.message:'تحقق من القيم.');}
 };
 const stale=!feed||clock-Date.parse(feed.updatedAt)>30*60000||Date.parse(feed.updatedAt)>clock+5*60000;
 const summary=totals(purchases,feed),statusLabels={active:'نشط',paused:'متوقف',triggered:'تحقق الشرط'};
 const sortedHistory=[...history].sort((a,b)=>Date.parse(a.createdAt||a.timestamp)-Date.parse(b.createdAt||b.timestamp));
 const currentMarket=marketRows.find(r=>r.karat===chartKarat)||sortedHistory[sortedHistory.length-1]||null;
 const homeMarket=marketRows.find(r=>r.karat===24)||null;
 const calcRow=marketRows.find(r=>r.karat===calcKarat)||null;
 const calcBase=calcRow?Number(calcRow.buyPrice):indicativePrice(feed,'SAR',calcKarat);
 const calcRaw=calcBase===null?null:calcWeight*calcBase;
 const calcMaking=Math.max(0,calcWeight)*Math.max(0,calcFee);
 const calcTax=calcVat?calcMaking*.15:0;
 const calcTotal=calcRaw===null?null:calcRaw+calcMaking+calcTax;
  const historyValues=sortedHistory.map(r=>Number(r.buyPrice)).filter(Number.isFinite);
 const historyHigh=historyValues.length?Math.max(...historyValues):null,historyLow=historyValues.length?Math.min(...historyValues):null,historyOpen=historyValues.length?historyValues[0]:null;
 const priceNote=<p className="fine">أسعار الخادم مرجعية للجرام ولا تشمل المصنعية أو الضريبة أو هامش المتجر. الرسم يعتمد على الأسعار السابقة المحفوظة تلقائيًا مع كل تحديث فعلي.</p>;
 const marketTime=(row:PriceHistoryRow|null)=>row?dateTime(row.createdAt||row.timestamp):'لا يوجد تحديث محفوظ';
 const priceBlock=<section className="market-price-card">
  <div className="row"><div><p className="mock-supporting">سعر الذهب الآن</p><strong className="mock-gold-number">{money(homeMarket?Number(homeMarket.buyPrice):indicativePrice(feed,'SAR',24),'SAR')}</strong><p className="mock-supporting">عيار 24 · سعر الجرام</p></div><span className={'pill '+(homeMarket?'good':'warn')}>{homeMarket?'محدّث':'مرجعي'}</span></div>
  <p className="market-update">آخر تحديث: {marketTime(homeMarket)}</p>
 </section>;
 const nav=<><div className="nav-brand"><span className="brand-mark small">ذ</span><div><strong>ذهبي</strong><small>مساحتك الشخصية</small></div></div><nav aria-label="القائمة الرئيسية">{pages.map(p=><button key={p.id} className={'nav-item '+(p.id===page?'selected':'')} aria-current={p.id===page?'page':undefined} onClick={()=>navigate(p.id)}><Icon name={p.icon}/><span>{p.label}</span></button>)}</nav><div className="nav-account"><span className="avatar">{email[0].toUpperCase()}</span><span className="email" dir="ltr">{email}</span><button className="icon-button" title="تسجيل الخروج" aria-label="تسجيل الخروج" onClick={logout}><Icon name="logout"/></button></div></>;
 const content=()=>{
  if(page==='home')return <><div className="mock-welcome"><h2>مرحبًا بعودتك</h2><p>نظرة يومية على الذهب مع السعر الحالي ومقتنياتك وخدماتك السريعة.</p></div>
   {priceBlock}
   <section className="mock-section-block"><p className="mock-field-label">الخدمات السريعة</p><div className="mock-service-grid">{[
    ['calculator','حاسبة الذهب','calculator'],['prices','أسعار اليوم','chart'],['portfolio','المحفظة','wallet'],['map','أقرب تاجر','map']
   ].map(([id,label,icon])=><button key={id} className="mock-service-tile" onClick={()=>navigate(id as Page)}><Icon name={icon}/><span>{label}</span></button>)}</div></section>
   <section className="mock-chart-card"><div className="section-heading compact"><div><h3>حركة السوق</h3><p className="muted">حسب وقت تحديث النظام</p></div><span className="pill gold">عيار {chartKarat}</span></div>{historyError?<p className="notice warning">{historyError}</p>:<PriceHistoryChart rows={history} currency={priceCurrency} karat={chartKarat}/>}</section>
   <section className="panel mock-light-card"><div className="section-heading"><div><h2>ملخص مقتنياتك</h2><p className="muted">القيم مفصولة حسب العملة.</p></div><button className="primary" disabled={!loaded||busy} onClick={()=>openDialog(portfolios.length?'purchase':'portfolio')}><Icon name="plus"/>{portfolios.length?'تسجيل شراء':'إنشاء محفظة'}</button></div>{!loaded?<p className="muted">لم يتم تحميل بيانات الحساب.</p>:!summary.length?<Empty>سجّل أول عملية شراء لعرض ملخص مقتنياتك.</Empty>:<div className="summary-grid">{summary.map(x=><div className="summary-card" key={x.currency}><span className="pill">{x.currency}</span><dl><dt>تكلفة الشراء</dt><dd>{money(x.cost,x.currency)}</dd><dt>الوزن</dt><dd>{number(x.weight)} جم</dd><dt>القيمة المرجعية {stale?'(سعر قديم)':''}</dt><dd>{money(x.value,x.currency)}</dd><dt>الفرق</dt><dd className={x.value===null?'':x.value>=x.cost?'positive':'negative'}>{money(x.value===null?null:x.value-x.cost,x.currency)}</dd></dl></div>)}</div>}{priceNote}</section></>;

  if(page==='prices')return <><section className="panel mock-light-card market-overview">
   <div className="section-heading"><div><span className={'pill '+(currentMarket?'good':'warn')}>{currentMarket?'من سجل الأسعار المحفوظ':'غير متاح'}</span><h2>السعر الحالي · عيار {chartKarat}</h2></div><label className="compact-label">العملة<select value={priceCurrency} onChange={e=>setPriceCurrency(e.target.value)}>{['SAR','USD'].map(c=><option key={c}>{c}</option>)}</select></label></div>
   <div className="mock-gold-number">{money(currentMarket?Number(currentMarket.buyPrice):null,priceCurrency)}</div>
   <p className="price-time">{marketTime(currentMarket)}</p>
   <div className="mock-triple"><div className="mock-mini-stat"><strong>{money(historyHigh,priceCurrency)}</strong><span>الأعلى</span></div><div className="mock-mini-stat"><strong>{money(historyLow,priceCurrency)}</strong><span>الأدنى</span></div><div className="mock-mini-stat"><strong>{money(historyOpen,priceCurrency)}</strong><span>أول تحديث</span></div></div>
  </section>
  <div className="market-buy-sell"><div className="mock-stat-card"><span>سعر البيع</span><strong>{money(currentMarket?Number(currentMarket.sellPrice):null,priceCurrency)}</strong></div><div className="mock-stat-card"><span>سعر الشراء</span><strong>{money(currentMarket?Number(currentMarket.buyPrice):null,priceCurrency)}</strong></div></div>
  <section className="mock-chart-card"><div className="section-heading"><div><h2>الرسم الزمني للأسعار</h2><p className="muted">كل نقطة سعر محفوظة من تحديث سابق.</p></div><label className="compact-label">العيار<select value={chartKarat} onChange={e=>setChartKarat(Number(e.target.value))}>{[24,22,21,18].map(k=><option key={k} value={k}>عيار {k}</option>)}</select></label></div>{historyError?<p className="notice warning">{historyError}</p>:<PriceHistoryChart rows={history} currency={priceCurrency} karat={chartKarat}/>}</section>
  <section className="panel mock-light-card"><h2>جدول الأسعار</h2><div className="market-table"><div className="market-table-row head"><span>البيع</span><span>الشراء</span><span>العيار</span></div>{[24,22,21,18].map(k=>{const row=marketRows.find(r=>r.karat===k);return <div className="market-table-row" key={k}><span>{money(row?Number(row.sellPrice):null,priceCurrency)}</span><strong>{money(row?Number(row.buyPrice):null,priceCurrency)}</strong><span>عيار {k}</span></div>;})}</div>{priceNote}</section></>;

  if(page==='calculator')return <>
   <section className="gold-card calculator-summary">
    <p className="calc-kicker">السعر الإجمالي التقريبي</p>
    <strong className="calc-total">{money(calcTotal,'SAR')}</strong>
    <p className="calc-base">سعر الجرام الأساسي: {money(calcBase,'SAR')} · عيار {calcKarat}</p>
   </section>
   <section className="gold-card calculator-form">
    <div className="form-group">
     <p className="form-label">1. اختر عيار الذهب</p>
     <div className="karat-choice-grid">{[24,22,21,18].map(k=><button type="button" key={k} className={'karat-choice '+(calcKarat===k?'active':'')} onClick={()=>setCalcKarat(k)}>{k}K</button>)}</div>
    </div>
    <div className="form-group">
     <label className="form-label" htmlFor="calc-weight">2. الوزن بالجرام (g)</label>
     <input id="calc-weight" type="number" min="0" step="0.1" value={calcWeight} onChange={e=>setCalcWeight(Math.max(0,Number(e.target.value)||0))}/>
     <div className="weight-chips">{[5,10,20,31.1,50].map(w=><button type="button" key={w} onClick={()=>setCalcWeight(w)}>{w===31.1?'أونصة (31.1g)':w+' جرام'}</button>)}</div>
    </div>
    <div className="form-group">
     <label className="form-label" htmlFor="calc-fee">3. أجرة المصنعية لكل جرام (اختياري)</label>
     <input id="calc-fee" type="number" min="0" step="1" value={calcFee} placeholder="مثال: 15 SAR" onChange={e=>setCalcFee(Math.max(0,Number(e.target.value)||0))}/>
    </div>
    <label className="calc-vat-row">
     <span><strong>ضريبة القيمة المضافة (15%)</strong><small>تُحسب هنا على المصنعية فقط كما في النموذج المرجعي.</small></span>
     <input type="checkbox" checked={calcVat} onChange={e=>setCalcVat(e.target.checked)}/>
    </label>
   </section>
   <section className="gold-card calc-breakdown">
    <h2 className="gold-card-title">تفاصيل الفاتورة المقدرة</h2>
    <dl>
     <div><dt>قيمة الذهب الخام:</dt><dd>{money(calcRaw,'SAR')}</dd></div>
     <div><dt>إجمالي المصنعية:</dt><dd>{money(calcMaking,'SAR')}</dd></div>
     <div><dt>قيمة الضريبة (15%):</dt><dd>{money(calcTax,'SAR')}</dd></div>
     <div className="calc-final"><dt>الإجمالي النهائي:</dt><dd>{money(calcTotal,'SAR')}</dd></div>
    </dl>
    <p className="fine">النتيجة تقديرية، وتعتمد على السعر الحالي المتاح في التطبيق والمصنعية التي تدخلها يدويًا.</p>
   </section>
  </>;

  if(page==='portfolio')return <section className="panel mock-light-card"><div className="section-heading"><div><h2>محافظك</h2><p className="muted">اجمع المشتريات حسب هدفك. تُحفظ البيانات في حسابك.</p></div><button className="primary" disabled={busy||!loaded} onClick={()=>openDialog('portfolio')}><Icon name="plus"/>محفظة جديدة</button></div>{!loaded?<Empty>لم يتم تحميل المحافظ بعد.</Empty>:!portfolios.length?<Empty>لا توجد محافظ بعد. أنشئ محفظتك الأولى.</Empty>:<div className="portfolio-grid">{portfolios.map(p=>{const rows=purchases.filter(b=>b.portfolioId===p.id);return <article className="portfolio-card" key={p.id}><span className="card-icon"><Icon name="wallet"/></span><h3>{p.name}</h3><p className="muted">{rows.length} سجلات شراء</p>{totals(rows,feed).map(x=><p key={x.currency}>تكلفة {x.currency}: <strong>{money(x.cost,x.currency)}</strong></p>)}<button className="danger text-button" disabled={busy||rows.length>0} onClick={()=>{setFormError('');setConfirm({path:'/portfolio/'+p.id,label:p.name});}}>حذف المحفظة الفارغة</button></article>;})}</div>}</section>;

  if(page==='settings')return <>
   <section className="gold-card more-profile" onClick={()=>navigate('account')} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')navigate('account');}}>
    <div className="profile-head"><span className="avatar">{email[0].toUpperCase()}</span><div><strong>{email}</strong><small>{role==='admin'?'ADMIN':role==='trader'?'TRADER':'USER'}</small></div><span className="more-chevron">‹</span></div>
   </section>
   <section className="gold-card">
    <h2 className="gold-card-title">اللغة (Language)</h2>
    <div className="settings-choice-grid three"><button className="active">العربية</button><button disabled>English</button><button disabled>Français</button></div>
   </section>
   <section className="gold-card">
    <h2 className="gold-card-title">العملة الافتراضية للأسعار</h2>
    <div className="settings-choice-grid four">{['SAR','USD'].map(c=><button key={c} className={priceCurrency===c?'active':''} onClick={()=>setPriceCurrency(c)}>{c}</button>)}<button disabled>AED</button><button disabled>EUR</button></div>
    <p className="fine">النسخة الحالية تدعم SAR وUSD فقط في مصدر السعر التاريخي.</p>
   </section>
   <section className="gold-card more-links">
    {[
     ['purchases','سجل الفواتير والمشتريات','receipt'],
     ['alerts','تنبيهات الأسعار','bell'],
     ['map','التجار والمحلات القريبة','map'],
     ['account','الملف الشخصي','user'],
     ['help','المساعدة','help']
    ].map(([id,label,icon])=><button key={id} onClick={()=>navigate(id as Page)}><span className="more-link-icon"><Icon name={icon}/></span><span>{label}</span><span className="more-chevron">‹</span></button>)}
   </section>
   <section className="gold-card">
    <h2 className="gold-card-title">الإشعارات والتنبيهات</h2>
    <div className="settings-row"><div><strong>تنبيهات الأسعار</strong><p className="muted">إدارة قواعد التنبيه المحفوظة على الخادم.</p></div><button className="secondary" onClick={()=>navigate('alerts')}>إدارة</button></div>
    <div className="settings-row"><div><strong>إشعارات التطبيق المغلق</strong><p className="muted">Web Push لم يُفعّل بعد.</p></div><span className="pill">لاحقًا</span></div>
   </section>
  </>;

  if(page==='purchases')return <section className="panel mock-light-card"><div className="section-heading"><div><h2>سجل المشتريات</h2><p className="muted">الوزن والسعر والتاريخ كما في سجلات حسابك.</p></div><button className="primary" disabled={busy||!loaded} onClick={()=>openDialog(portfolios.length?'purchase':'portfolio')}><Icon name="plus"/>{portfolios.length?'تسجيل شراء':'إنشاء محفظة أولًا'}</button></div>{!loaded?<Empty>لم يتم تحميل المشتريات بعد.</Empty>:!purchases.length?<Empty>لا توجد مشتريات مسجلة.</Empty>:<div className="records">{purchases.map(p=><article className="record" key={p.id}><div className="record-title"><span className="card-icon"><Icon name="receipt"/></span><div><h3>ذهب عيار {p.karat}</h3><p className="muted">{portfolios.find(x=>x.id===p.portfolioId)?.name||'محفظة'} · {p.purchasedAt.slice(0,10)}</p></div><strong className="record-total">{money(Number(p.totalPrice),p.currency)}</strong></div><dl className="record-details"><div><dt>الوزن</dt><dd>{number(Number(p.weightGrams))} جم</dd></div><div><dt>سعر الجرام</dt><dd>{money(Number(p.unitPrice),p.currency)}</dd></div><div className="actions"><button className="secondary" disabled={busy} onClick={()=>openDialog('purchase',p)}>تعديل</button><button className="danger text-button" disabled={busy} onClick={()=>{setFormError('');setConfirm({path:'/portfolio/purchase/'+p.id,label:'سجل الشراء'});}}>حذف</button></div></dl></article>)}</div>}</section>;

  if(page==='alerts')return <section className="panel mock-light-card"><div className="section-heading"><div><h2>تنبيهات الأسعار</h2><p className="muted">راقب بلوغ السعر حدًا تحدده.</p></div><button className="primary" disabled={busy||!loaded} onClick={()=>openDialog('alert')}><Icon name="plus"/>تنبيه جديد</button></div><p className="notice info">الخادم يفحص قواعد التنبيه. Push عند إغلاق التطبيق لم يُفعّل بعد.</p>{!loaded?<Empty>لم يتم تحميل التنبيهات بعد.</Empty>:!alerts.length?<Empty>لا توجد تنبيهات. أضف السعر الذي تريد متابعته.</Empty>:<div className="portfolio-grid">{alerts.map(a=><article className="portfolio-card" key={a.id}><div className="section-heading"><span className="card-icon"><Icon name="bell"/></span><span className={'pill '+(a.status==='active'?'good':a.status==='triggered'?'warn':'')}>{statusLabels[a.status]}</span></div><h3>عيار {a.karat} · {a.currency}</h3><p>{a.direction==='above'?'عند وصول السعر إلى أو أعلى من':'عند وصول السعر إلى أو أقل من'}</p><strong className="alert-price">{money(Number(a.targetPrice),a.currency)}</strong><p className="fine">آخر تغيير: {dateTime(a.updatedAt)}</p><div className="actions"><button className="secondary" disabled={busy} onClick={()=>void mutate('/alerts/'+a.id+(a.status==='active'?'/pause':'/activate'),'POST')}>{a.status==='active'?'إيقاف مؤقت':a.status==='triggered'?'إعادة التفعيل':'تفعيل'}</button><button className="danger text-button" disabled={busy} onClick={()=>{setFormError('');setConfirm({path:'/alerts/'+a.id,label:'التنبيه'});}}>حذف</button></div></article>)}</div>}</section>;

  if(page==='map')return <><section className="mock-soft-panel"><div className="section-heading compact"><div><h2>التجار القريبون</h2><p>هذه الشاشة جزء من تصميم الـMockup الأصلي.</p></div><span className="pill gold">قريبًا</span></div><p>لن نعرض مواقع أو تجارًا وهميين. ستُفعّل الخريطة عندما تكتمل بيانات التاجر والموقع في الـBackend.</p></section><div className="mock-map-preview" aria-label="معاينة مكان الخريطة"><span/><span/><span/><strong>معاينة التصميم فقط</strong></div><section className="panel mock-light-card"><h3>ما الذي سيظهر هنا؟</h3><p className="muted">نطاق البحث، الخريطة، المسافة، أوقات العمل، ثم إجراءات الاتجاهات والاتصال عند ربط بيانات التجار الحقيقية.</p></section></>;

  if(page==='account')return <><section className="panel mock-light-card profile-card"><div className="profile-head"><span className="avatar large">{email[0].toUpperCase()}</span><div><h2>{email}</h2><span className="pill gold">{role==='admin'?'ADMIN':role==='trader'?'TRADER':'USER'}</span></div></div></section>
   <section className="panel mock-light-card"><h3>اللغة</h3><div className="settings-row"><span>العربية</span><span className="pill gold">المحددة</span></div><div className="settings-row"><span>English</span><span className="muted">لاحقًا</span></div><div className="settings-row"><span>Français</span><span className="muted">لاحقًا</span></div></section>
   <section className="panel mock-light-card"><div className="settings-row"><div><strong>تغيير كلمة المرور</strong><p className="muted">تحتاج Endpoint مخصصًا في الخادم.</p></div><span className="pill">قريبًا</span></div><div className="settings-row"><div><strong>فتح بالبصمة</strong><p className="muted">غير متاح في نسخة الويب الحالية.</p></div><span className="pill">قريبًا</span></div></section>
   <button className="danger-button profile-logout" onClick={logout}><Icon name="logout"/>تسجيل الخروج</button></>;
  return <section className="panel help-panel mock-light-card"><h2>المساعدة</h2><p className="muted">يمكن الوصول إلى هذه الصفحة من قائمة البرغر دون ازدحام شريط التنقل السفلي.</p>{[
   ['كيف أبدأ؟','أنشئ محفظة ثم أضف مشترياتك الفعلية.'],
   ['كيف تُحسب القيمة؟','تعرض العملات منفصلة، ولا تُضاف مصنعية أو ضرائب تلقائيًا.'],
   ['كيف أقرأ الرسم البياني؟','كل نقطة في الرسم تمثل تحديث سعر محفوظًا فعليًا على الخادم حسب وقت الحفظ.'],
   ['هل التنبيهات تعمل والتطبيق مغلق؟','حالة التنبيه محفوظة على الخادم، لكن Web Push لم يفعّل بعد.'],
   ['لماذا صفحة التجار لا تعرض متاجر؟','لم نضع بيانات وهمية؛ ستظهر المتاجر عندما تكتمل بيانات التاجر والموقع في الـBackend.'],
   ['كيف أحدث التطبيق؟','استخدم زر التحديث عند ظهوره، أو افتح النسخة من Safari ثم أعد فتح التطبيق المثبت.']
  ].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>;
 };
 return <div className="gold-web workspace" dir="rtl" lang="ar"><aside className="desktop-nav">{nav}</aside><div className="workspace-main"><header className="topbar"><button className="icon-button menu-trigger" aria-label="فتح القائمة" aria-expanded={menu} onClick={()=>setMenu(true)}><Icon name="menu"/></button><div><p className="eyebrow"><span className="role-dot"/>ذهبي · حساب المستخدم</p><h1 tabIndex={-1} ref={headingRef}>{pages.find(p=>p.id===page)?.label}</h1></div><button className="secondary refresh-button" disabled={loading||busy} onClick={()=>{void loadData();void loadPrice();void loadMarket();}}><Icon name="refresh"/><span>{loading?'جارٍ التحميل…':'تحديث'}</span></button></header><main className="workspace-content" aria-busy={loading}>{error&&<div className="notice error" role="alert">{error} <button className="text-button" disabled={loading} onClick={()=>void loadData()}>إعادة المحاولة</button></div>}{message&&<p className="notice success" role="status">{message}</p>}{loading&&!loaded&&<p className="notice info" role="status">جارٍ تحميل بيانات حسابك…</p>}{content()}<footer>© 2026 Ibrahim Alneami — All Rights Reserved · User Web 1.3.3</footer></main><nav className="mobile-bottom-nav" aria-label="التنقل السريع">{mobilePages.map(p=><button key={p.id} className={'mobile-tab '+(p.id===page?'selected':'')} aria-current={p.id===page?'page':undefined} onClick={()=>navigate(p.id)}><Icon name={p.icon}/><span>{p.label}</span></button>)}</nav></div>
 {menu&&<div className="mobile-nav-backdrop" onClick={()=>setMenu(false)}><div className="mobile-nav" ref={modalRef} role="dialog" aria-modal="true" aria-label="قائمة التنقل" onClick={e=>e.stopPropagation()}><button className="icon-button close-menu" aria-label="إغلاق القائمة" onClick={()=>setMenu(false)}><Icon name="close"/></button>{nav}</div></div>}
 {(dialog||confirm)&&<div className="dialog-backdrop"><div className="dialog" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="section-heading"><h2 id="dialog-title">{confirm?'تأكيد الحذف':dialog?.type==='portfolio'?'محفظة جديدة':dialog?.type==='alert'?'تنبيه جديد':dialog?.purchase?'تعديل سجل الشراء':'تسجيل شراء'}</h2><button className="icon-button" aria-label="إغلاق" disabled={busy} onClick={()=>{setDialog(null);setConfirm(null);}}><Icon name="close"/></button></div>
 {confirm?<><p>هل تريد حذف {confirm.label}؟ لا يمكن التراجع عن الحذف من التطبيق.</p><div className="actions"><button className="secondary" disabled={busy} onClick={()=>setConfirm(null)}>إلغاء</button><button className="danger-button" disabled={busy} onClick={()=>void mutate(confirm.path,'DELETE')}>{busy?'جارٍ الحذف…':'حذف'}</button></div></>:<form onSubmit={submit}>
 {dialog?.type==='portfolio'&&<label>اسم المحفظة<input name="name" required maxLength={80} placeholder="مثال: ادخار الأسرة"/></label>}
 {dialog?.type==='purchase'&&<><label>المحفظة<select name="portfolioId" defaultValue={dialog.purchase?.portfolioId||portfolios[0]?.id} required>{portfolios.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="form-grid"><label>العيار<KaratSelect value={dialog.purchase?.karat}/></label><label>العملة<CurrencySelect value={dialog.purchase?.currency}/></label><label>الوزن بالجرام<input name="weightGrams" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required defaultValue={dialog.purchase?.weightGrams}/></label><label>سعر الجرام عند الشراء<input name="unitPrice" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required defaultValue={dialog.purchase?.unitPrice}/></label></div><label>تاريخ الشراء<input name="purchasedAt" type="date" required max={localDate()} defaultValue={dialog.purchase?.purchasedAt.slice(0,10)||localDate()}/></label><p className="fine">الإجمالي = الوزن بالجرام × سعر الجرام. أدخل بيانات الشراء الفعلية.</p></>}
 {dialog?.type==='alert'&&<><div className="form-grid"><label>العيار<KaratSelect/></label><label>العملة<CurrencySelect/></label></div><label>السعر المستهدف لكل جرام<input name="targetPrice" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required/></label><label>الشرط<select name="direction"><option value="above">السعر يساوي أو يتجاوز الهدف</option><option value="below">السعر يساوي أو يقل عن الهدف</option></select></label></>}
 {formError&&<p className="notice error" role="alert">{formError}</p>}<div className="actions"><button className="primary" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ'}</button><button type="button" className="secondary" disabled={busy} onClick={()=>setDialog(null)}>إلغاء</button></div></form>}{confirm&&formError&&<p className="notice error" role="alert">{formError}</p>}
 </div></div>}</div>;
}
