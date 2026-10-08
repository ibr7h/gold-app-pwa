import React,{useState,useEffect,useRef,useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import AuthForm from './AuthForm';
import {api,jsonRequest,errorMessage} from './api';
import {Portfolio,Purchase,PriceAlert,MarketPrice,KARATS,CURRENCIES,totals,purchasePayload,localDate} from './model';
import {priceFreshness} from './price-status';
import './user.css';
type Page='home'|'prices'|'calculator'|'portfolio'|'more'|'purchases'|'alerts'|'map'|'account'|'help';
const pages:{id:Page;label:string;icon:string;navLabel?:string}[]=[
 {id:'home',label:'الرئيسية',icon:'home'},
 {id:'prices',label:'الأسعار',icon:'chart'},
 {id:'calculator',label:'الحاسبة',icon:'calculator'},
 {id:'portfolio',label:'المحفظة',icon:'wallet'},
 {id:'more',label:'المزيد',icon:'menu'},
 {id:'purchases',label:'المشتريات',icon:'receipt'},
 {id:'alerts',label:'التنبيهات',icon:'bell'},
 {id:'map',label:'التجار القريبون',navLabel:'التجار',icon:'map'},
 {id:'account',label:'الملف الشخصي',navLabel:'الملف',icon:'user'},
 {id:'help',label:'المساعدة',icon:'help'}
];
const primaryPages=pages.filter(p=>['home','prices','portfolio','purchases','alerts','map','account'].includes(p.id));
const mobilePages=primaryPages;
function Icon({name}:{name:string}){
 const paths:Record<string,string>={home:'m3 10 9-7 9 7v10H3Z M9 20v-7h6v7',chart:'M4 4v16h16 M7 14l4-5 4 3 5-7',wallet:'M3 6h17v14H3Z M3 6V4h14 M15 11h6v5h-6Z',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2Z M8 8h8 M8 12h8',bell:'M5 16h14l-2-3V9a5 5 0 0 0-10 0v4Z M10 20h4',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',help:'M12 17v1 M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',menu:'M4 6h16 M4 12h16 M4 18h16',close:'m6 6 12 12 M6 18 18 6',refresh:'M20 8a9 9 0 1 0 1 8 M20 3v6h-6',plus:'M12 5v14 M5 12h14',logout:'M9 3H4v18h5 M9 12h12 m-4-4 4 4-4 4',calculator:'M5 3h14v18H5Z M8 7h8 M8 11h2 M12 11h2 M16 11h1 M8 15h2 M12 15h2 M16 15h1 M8 18h2 M12 18h5',chevron:'m9 18 6-6-6-6',settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 3.67-.08-.02a1.7 1.7 0 0 0-1.8-.35l-.1.04a1.7 1.7 0 0 0-1.1 1.55V22h-4.24v-.17a1.7 1.7 0 0 0-1.1-1.55l-.1-.04a1.7 1.7 0 0 0-1.8.35l-.08.02-2.12-3.67.06-.06A1.7 1.7 0 0 0 5.56 15l-.02-.1A1.7 1.7 0 0 0 4 13.8H3.8V9.56H4a1.7 1.7 0 0 0 1.54-1.1l.02-.1a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-3.67.08.02a1.7 1.7 0 0 0 1.8.35l.1-.04a1.7 1.7 0 0 0 1.1-1.55V1.4h4.24v.17a1.7 1.7 0 0 0 1.1 1.55l.1.04a1.7 1.7 0 0 0 1.8-.35l.08-.02 2.12 3.67-.06.06a1.7 1.7 0 0 0-.34 1.88l.02.1A1.7 1.7 0 0 0 21 9.56h.2v4.24H21a1.7 1.7 0 0 0-1.54 1.1Z',map:'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z M9 3v15 M15 6v15'};
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
   <img className="boot-photo-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt="" aria-hidden="true"/>
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
 const [priceCurrency,setPriceCurrency]=useState('SAR');
 const [history,setHistory]=useState<PriceHistoryRow[]>([]),[marketRows,setMarketRows]=useState<PriceHistoryRow[]>([]),[allMarketRows,setAllMarketRows]=useState<MarketPrice[]>([]),[historyError,setHistoryError]=useState(''),[chartKarat,setChartKarat]=useState(24);
 const [calcKarat,setCalcKarat]=useState(24),[calcWeight,setCalcWeight]=useState('10'),[calcFee,setCalcFee]=useState('0'),[calcVat,setCalcVat]=useState(false);
 const [loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [marketLoading,setMarketLoading]=useState(false),[marketError,setMarketError]=useState('');
 const [dialog,setDialog]=useState<{type:'portfolio'|'purchase'|'alert';purchase?:Purchase}|null>(null),[confirm,setConfirm]=useState<{path:string;label:string}|null>(null),[formError,setFormError]=useState('');
 const [clock,setClock]=useState(Date.now());const active=useRef(true),loadSequence=useRef(0),marketLoadSequence=useRef(0),writeLock=useRef(false),modalRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
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
 const loadMarket=useCallback(async()=>{
  const seq=++marketLoadSequence.current;
  if(active.current)setMarketLoading(true);
  try{
   const currencies=['SAR','USD'];
   const latestRequests=currencies.flatMap(currency=>[24,22,21,18].map(karat=>api<PriceHistoryRow|null>('/prices/latest?currency='+currency+'&karat='+karat)));
   const [historyRows,...latest]=await Promise.all([
    api<PriceHistoryRow[]>('/prices/history?currency='+encodeURIComponent(priceCurrency)+'&karat='+chartKarat+'&limit=200'),
    ...latestRequests
   ]);
   if(!Array.isArray(historyRows))throw new Error('Invalid history response');
   const cleanLatest=latest.filter((row):row is PriceHistoryRow=>!!row&&Number.isFinite(Number(row.buyPrice))&&Number(row.buyPrice)>0);
   if(active.current&&seq===marketLoadSequence.current){
    setHistory(historyRows);
    setAllMarketRows(cleanLatest);
    setMarketRows(cleanLatest.filter(row=>row.currency===priceCurrency));
    setMarketError('');
    setHistoryError('');
   }
  }catch{
   // Retain the last real stored prices when offline; never replace them with fabricated data.
   if(active.current&&seq===marketLoadSequence.current)setMarketError('تعذر تحديث الأسعار من الخادم. المعروض آخر سعر محفوظ، وليس سعرًا مباشرًا.');
  }finally{
   if(active.current&&seq===marketLoadSequence.current)setMarketLoading(false);
  }
 },[priceCurrency,chartKarat]);
 useEffect(()=>{active.current=true;void loadData();void loadMarket();
  const clockTimer=setInterval(()=>setClock(Date.now()),60000);
  const marketTimer=setInterval(()=>{if(document.visibilityState==='visible')void loadMarket();},5*60000);
  const focus=()=>{if(document.visibilityState==='visible'){setClock(Date.now());void loadData();void loadMarket();}};
  document.addEventListener('visibilitychange',focus);
  return()=>{active.current=false;loadSequence.current++;marketLoadSequence.current++;clearInterval(clockTimer);clearInterval(marketTimer);document.removeEventListener('visibilitychange',focus);};},[loadData,loadMarket]);
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
 const sortedHistory=[...history].sort((a,b)=>Date.parse(a.createdAt||a.timestamp)-Date.parse(b.createdAt||b.timestamp));
 const currentMarket=marketRows.find(r=>r.karat===chartKarat)||sortedHistory[sortedHistory.length-1]||null;
 const homeMarket=allMarketRows.find(r=>r.currency==='SAR'&&r.karat===24) as PriceHistoryRow|undefined;
 const freshness=priceFreshness(homeMarket,clock);
 const stale=freshness!=='fresh'||!!marketError;
 const marketLabel=freshness==='fresh'&&!marketError?'مباشر':freshness==='missing'?'غير متاح':'آخر سعر محفوظ';
 const summary=totals(purchases,allMarketRows),statusLabels={active:'نشط',paused:'متوقف',triggered:'تحقق الشرط'};
 const historyValues=sortedHistory.map(r=>Number(r.buyPrice)).filter(Number.isFinite);
 const historyHigh=historyValues.length?Math.max(...historyValues):null,historyLow=historyValues.length?Math.min(...historyValues):null,historyOpen=historyValues.length?historyValues[0]:null;
 const priceNote=<p className="fine">جميع الأسعار في هذه النسخة تأتي من Backend ذهبي نفسه؛ وتشترك البطاقات والمحفظة والتنبيهات والرسم البياني في المصدر ذاته. لا تشمل الأسعار المصنعية أو الضريبة أو هامش المتجر.</p>;
 const marketTime=(row:PriceHistoryRow|null|undefined)=>row&&Number.isFinite(Date.parse(row.timestamp))?dateTime(row.timestamp):'لا يوجد تحديث موثوق';
 const priceBlock=<section className="market-price-card">
  <div className="row"><div><p className="mock-supporting">سعر الذهب الآن</p><strong className="mock-gold-number">{money(homeMarket?Number(homeMarket.buyPrice):null,'SAR')}</strong><p className="mock-supporting">عيار 24 · سعر الجرام</p></div><span className={'pill '+(!stale?'good':'warn')}>{marketLabel}</span></div>
  <p className="market-update">آخر تحديث: {marketTime(homeMarket)}</p>
 </section>;
 const nav=<><div className="nav-brand"><span className="brand-mark small">ذ</span><div><strong>ذهبي</strong><small>حساب المستخدم</small></div></div><nav aria-label="القائمة الرئيسية">{primaryPages.map(p=><button key={p.id} className={'nav-item '+(p.id===page?'selected':'')} aria-current={p.id===page?'page':undefined} onClick={()=>navigate(p.id)}><Icon name={p.icon}/><span>{p.navLabel||p.label}</span></button>)}</nav><div className="nav-account"><span className="avatar">{email[0].toUpperCase()}</span><span className="email" dir="ltr">{email}</span><button className="icon-button" title="تسجيل الخروج" aria-label="تسجيل الخروج" onClick={logout}><Icon name="logout"/></button></div></>;
 const calcMarket=allMarketRows.find(r=>r.currency==='SAR'&&r.karat===calcKarat);
 const calcUnit=calcMarket?Number(calcMarket.buyPrice):null;
 const calcWeightN=Math.max(0,Number(calcWeight)||0),calcFeeN=Math.max(0,Number(calcFee)||0);
 const calcRaw=calcUnit===null?null:calcWeightN*calcUnit,calcFeeTotal=calcWeightN*calcFeeN,calcTax=calcVat?calcFeeTotal*.15:0,calcTotal=calcRaw===null?null:calcRaw+calcFeeTotal+calcTax;
 const totalWeight=purchases.reduce((sum,p)=>sum+(Number(p.weightGrams)||0),0);
 const sarSummary=summary.find(x=>x.currency==='SAR');
 const content=()=>{
  if(page==='home')return <>
   <section className="mock-welcome"><div><h2>مرحبًا بعودتك</h2><p className="mock-supporting" dir="ltr">{email}</p></div></section>
   <section className="approved-card live-price-card">
    <div className="live-card-top"><span className={!stale?'live-badge':'pill warn'}>{!stale&&<i/>}{marketLabel}</span><strong>سعر الذهب الآن - عيار 24</strong></div>
    <div className="live-price-main"><div><div className="price-tag-large">{money(homeMarket?Number(homeMarket.buyPrice):null,'SAR')}<small>/جرام</small></div><p className="approved-muted">آخر تحديث: {marketTime(homeMarket)}</p></div><div className="buy-sell-mini"><span>الشراء <b>{money(homeMarket?Number(homeMarket.buyPrice):null,'SAR')}</b></span><span>البيع <b>{money(homeMarket?Number(homeMarket.sellPrice):null,'SAR')}</b></span></div></div>
    <div className="live-card-footer"><span>المصدر: {homeMarket?.source||'Dhahabi Backend'}</span><span className={stale?'stale-text':'fresh-text'}>{stale?'ليس سعرًا مباشرًا':'السعر محدّث'}</span></div>
   </section>
   <div className="approved-section-title"><h3>الخدمات السريعة</h3></div>
   <section className="approved-services-grid">{[
    ['calculator','حاسبة الذهب','calculator'],['prices','أسعار اليوم','chart'],['portfolio','المحفظة','wallet'],['map','أقرب تاجر','map']
   ].map(([id,label,icon])=><button key={id} className="approved-service-item" onClick={()=>navigate(id as Page)}><span className="approved-service-icon"><Icon name={icon}/></span><span>{label}</span></button>)}</section>
   <section className="approved-card portfolio-mini"><div className="approved-card-title"><span><Icon name="wallet"/>محفظتي الذهبية</span><button className="text-button" onClick={()=>navigate('portfolio')}>التفاصيل</button></div>
    <div className="portfolio-mini-body"><div><strong>{sarSummary?money(sarSummary.value,'SAR'):'غير متاح'}</strong><span>إجمالي الوزن: {number(totalWeight)} جرام</span></div>{sarSummary&&sarSummary.value!==null&&<div className={'portfolio-delta '+(sarSummary.value>=sarSummary.cost?'positive':'negative')}><b>{money(sarSummary.value-sarSummary.cost,'SAR')}</b><small>الفرق عن تكلفة الشراء</small></div>}</div>
   </section>
   <section className="approved-card"><div className="approved-card-title"><span>حركة السوق (عيار {chartKarat})</span><button className="text-button" onClick={()=>navigate('prices')}>التفاصيل</button></div>{historyError?<p className="notice warning">{historyError}</p>:<PriceHistoryChart rows={history} currency={priceCurrency} karat={chartKarat}/>}</section>
  </>;

  if(page==='prices')return <>
   <section className="approved-card prices-header-card"><span className={!stale?'live-badge':'pill warn'}>{!stale&&<i/>}{!stale?'سعر محدّث من الخادم':marketLabel}</span><p>سعر الأونصة المشتق من عيار 24</p><strong className="ounce-price">{currentMarket&&currentMarket.karat===24?money(Number(currentMarket.buyPrice)*31.1034768,priceCurrency):money((marketRows.find(r=>r.karat===24)?Number(marketRows.find(r=>r.karat===24)!.buyPrice):NaN)*31.1034768||null,priceCurrency)}</strong><small>آخر فحص: {marketTime(marketRows.find(r=>r.karat===24))}</small></section>
   <section className="approved-card"><div className="approved-card-title"><span>أسعار الجرام بحسب العيار</span><label className="inline-select">العملة<select value={priceCurrency} onChange={e=>setPriceCurrency(e.target.value)}><option>SAR</option><option>USD</option></select></label></div>
    <div className="approved-price-table"><div className="price-row head"><span>العيار</span><span>الشراء</span><span>البيع</span></div>{[24,22,21,18].map(k=>{const row=marketRows.find(r=>r.karat===k);return <div className="price-row" key={k}><span><b className="karat-badge">عيار {k}</b></span><strong>{money(row?Number(row.buyPrice):null,priceCurrency)}</strong><span>{money(row?Number(row.sellPrice):null,priceCurrency)}</span></div>;})}</div>
   </section>
   <section className="approved-card"><div className="approved-card-title"><span>الرسم الزمني للأسعار</span><label className="inline-select">العيار<select value={chartKarat} onChange={e=>setChartKarat(Number(e.target.value))}>{[24,22,21,18].map(k=><option key={k} value={k}>{k}K</option>)}</select></label></div>{historyError?<p className="notice warning">{historyError}</p>:<PriceHistoryChart rows={history} currency={priceCurrency} karat={chartKarat}/>}<div className="three-stats"><div><span>الأعلى</span><b>{money(historyHigh,priceCurrency)}</b></div><div><span>الأدنى</span><b>{money(historyLow,priceCurrency)}</b></div><div><span>أول تحديث</span><b>{money(historyOpen,priceCurrency)}</b></div></div></section>
   {priceNote}
  </>;

  if(page==='calculator')return <>
   <section className="approved-card calc-total-card"><span>السعر الإجمالي التقريبي</span><strong>{money(calcTotal,'SAR')}</strong><small>سعر الجرام الأساسي: {money(calcUnit,'SAR')} · عيار {calcKarat}</small></section>
   <section className="approved-card calculator-form">
    <label>1. اختر عيار الذهب<div className="karat-switch">{[24,22,21,18].map(k=><button type="button" key={k} className={calcKarat===k?'active':''} onClick={()=>setCalcKarat(k)}>{k}K</button>)}</div></label>
    <label>2. الوزن بالجرام<input type="number" inputMode="decimal" min="0" step="0.1" value={calcWeight} onChange={e=>setCalcWeight(e.target.value)}/><div className="weight-presets">{[5,10,20,31.1,50].map(w=><button type="button" key={w} onClick={()=>setCalcWeight(String(w))}>{w===31.1?'أونصة 31.1g':w+' جرام'}</button>)}</div></label>
    <label>3. أجرة المصنعية لكل جرام (اختياري)<input type="number" inputMode="decimal" min="0" step="0.01" value={calcFee} onChange={e=>setCalcFee(e.target.value)}/></label>
    <div className="calc-toggle"><div><strong>احتساب ضريبة 15% على المصنعية</strong><small>حساب تقديري فقط ولا يُعد معالجة ضريبية نهائية.</small></div><input type="checkbox" checked={calcVat} onChange={e=>setCalcVat(e.target.checked)}/></div>
   </section>
   <section className="approved-card"><div className="approved-card-title">تفاصيل السعر المقدر</div><dl className="calc-breakdown"><div><dt>قيمة الذهب الخام</dt><dd>{money(calcRaw,'SAR')}</dd></div><div><dt>إجمالي المصنعية</dt><dd>{money(calcFeeTotal,'SAR')}</dd></div><div><dt>الضريبة التقديرية</dt><dd>{money(calcTax,'SAR')}</dd></div><div className="final"><dt>الإجمالي النهائي</dt><dd>{money(calcTotal,'SAR')}</dd></div></dl></section>
  </>;

  if(page==='portfolio')return <>
   <section className="approved-card portfolio-summary-card"><div><span>إجمالي الوزن المسجل</span><strong>{number(totalWeight)} جرام</strong></div><button className="primary" disabled={busy||!loaded} onClick={()=>openDialog('portfolio')}><Icon name="plus"/>محفظة جديدة</button></section>
   <section className="approved-card"><div className="approved-card-title"><span>محافظك</span><button className="text-button" disabled={busy||!loaded||!portfolios.length} onClick={()=>openDialog(portfolios.length?'purchase':'portfolio')}>{portfolios.length?'تسجيل شراء':'إنشاء محفظة'}</button></div>{!loaded?<Empty>لم يتم تحميل المحافظ بعد.</Empty>:!portfolios.length?<Empty>لا توجد محافظ بعد. أنشئ محفظتك الأولى.</Empty>:<div className="approved-portfolio-list">{portfolios.map(p=>{const rows=purchases.filter(b=>b.portfolioId===p.id);const sums=totals(rows,allMarketRows);return <article key={p.id}><span className="approved-service-icon"><Icon name="wallet"/></span><div className="portfolio-list-copy"><h3>{p.name}</h3><p>{rows.length} سجلات شراء</p>{sums.map(x=><small key={x.currency}>{x.currency}: {money(x.value,x.currency)}</small>)}</div><button className="text-button" disabled={busy||rows.length>0} onClick={()=>{setFormError('');setConfirm({path:'/portfolio/'+p.id,label:p.name});}}>حذف</button></article>;})}</div>}</section>
  </>;

  if(page==='purchases')return <section className="approved-card"><div className="approved-card-title"><span>سجل المشتريات</span><button className="primary compact-primary" disabled={busy||!loaded} onClick={()=>openDialog(portfolios.length?'purchase':'portfolio')}><Icon name="plus"/>{portfolios.length?'تسجيل شراء':'إنشاء محفظة'}</button></div>{!loaded?<Empty>لم يتم تحميل المشتريات بعد.</Empty>:!purchases.length?<Empty>لا توجد مشتريات مسجلة.</Empty>:<div className="records">{purchases.map(p=><article className="record" key={p.id}><div className="record-title"><span className="card-icon"><Icon name="receipt"/></span><div><h3>ذهب عيار {p.karat}</h3><p className="approved-muted">{portfolios.find(x=>x.id===p.portfolioId)?.name||'محفظة'} · {p.purchasedAt.slice(0,10)}</p></div><strong className="record-total">{money(Number(p.totalPrice),p.currency)}</strong></div><dl className="record-details"><div><dt>الوزن</dt><dd>{number(Number(p.weightGrams))} جم</dd></div><div><dt>سعر الجرام</dt><dd>{money(Number(p.unitPrice),p.currency)}</dd></div><div className="actions"><button className="secondary" disabled={busy} onClick={()=>openDialog('purchase',p)}>تعديل</button><button className="danger text-button" disabled={busy} onClick={()=>{setFormError('');setConfirm({path:'/portfolio/purchase/'+p.id,label:'سجل الشراء'});}}>حذف</button></div></dl></article>)}</div>}</section>;

  if(page==='alerts')return <section className="approved-card"><div className="approved-card-title"><span>تنبيهات الأسعار</span><button className="primary compact-primary" disabled={busy||!loaded} onClick={()=>openDialog('alert')}><Icon name="plus"/>تنبيه جديد</button></div><p className="notice info">الخادم يفحص شروط التنبيه. Web Push عند إغلاق التطبيق لم يُفعّل بعد.</p>{!loaded?<Empty>لم يتم تحميل التنبيهات بعد.</Empty>:!alerts.length?<Empty>لا توجد تنبيهات. أضف السعر الذي تريد متابعته.</Empty>:<div className="approved-alert-list">{alerts.map(a=><article key={a.id}><div><span className={'pill '+(a.status==='active'?'good':a.status==='triggered'?'warn':'')}>{statusLabels[a.status]}</span><h3>عيار {a.karat} · {a.currency}</h3><p>{a.direction==='above'?'عند وصول السعر إلى أو أعلى من':'عند وصول السعر إلى أو أقل من'} <b>{money(Number(a.targetPrice),a.currency)}</b></p></div><div className="actions"><button className="secondary" disabled={busy} onClick={()=>void mutate('/alerts/'+a.id+(a.status==='active'?'/pause':'/activate'),'POST')}>{a.status==='active'?'إيقاف':'تفعيل'}</button><button className="danger text-button" disabled={busy} onClick={()=>{setFormError('');setConfirm({path:'/alerts/'+a.id,label:'التنبيه'});}}>حذف</button></div></article>)}</div>}</section>;

  if(page==='map')return <><section className="approved-card map-placeholder"><div className="map-surface"><span/><span/><span/><div><Icon name="map"/><strong>التجار القريبون</strong><small>بانتظار ربط بيانات المواقع الحقيقية</small></div></div><div className="approved-card-title"><span>نطاق البحث</span><b className="pill gold">قريبًا</b></div><p className="approved-muted">لن نعرض أسماء متاجر أو مواقع وهمية. ستُفعّل هذه الشاشة عند اكتمال Merchant Location في الـBackend.</p></section></>;

  if(page==='account')return <><section className="approved-card profile-approved"><span className="avatar large">{email[0].toUpperCase()}</span><h2 dir="ltr">{email}</h2><span className="pill gold">{role==='admin'?'ADMIN':role==='trader'?'TRADER':'USER'}</span></section><section className="approved-card settings-list"><button onClick={()=>navigate('portfolio')}><span><Icon name="wallet"/>محفظتي الذهبية</span><Icon name="chevron"/></button><button onClick={()=>navigate('purchases')}><span><Icon name="receipt"/>سجل المشتريات</span><Icon name="chevron"/></button><button onClick={()=>navigate('alerts')}><span><Icon name="bell"/>تنبيهات الأسعار</span><Icon name="chevron"/></button><button className="danger-row" onClick={logout}><span><Icon name="logout"/>تسجيل الخروج</span><Icon name="chevron"/></button></section></>;

  if(page==='help')return <section className="approved-card help-panel"><div className="approved-card-title">المساعدة</div>{[['كيف أبدأ؟','أنشئ محفظة ثم أضف مشترياتك الفعلية.'],['كيف تُحسب قيمة المحفظة؟','تعتمد على أسعار Backend ذهبي الحالية، مع إبقاء العملات منفصلة.'],['كيف أقرأ الرسم؟','كل نقطة سعر تمثل تحديثًا محفوظًا فعليًا في قاعدة البيانات.'],['لماذا التجار غير ظاهرين؟','لأن بيانات Merchant Location لم تُنفذ في الـBackend بعد؛ لا نعرض بيانات وهمية.']].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>;

  return <><section className="approved-card profile-shortcut"><span className="avatar">{email[0].toUpperCase()}</span><div><strong dir="ltr">{email}</strong><span>حساب مستخدم</span></div><button className="text-button" onClick={()=>navigate('account')}>الملف الشخصي</button></section>
   <section className="approved-card settings-list"><button onClick={()=>navigate('purchases')}><span><Icon name="receipt"/>المشتريات والفواتير</span><Icon name="chevron"/></button><button onClick={()=>navigate('alerts')}><span><Icon name="bell"/>تنبيهات الأسعار</span><Icon name="chevron"/></button><button onClick={()=>navigate('map')}><span><Icon name="map"/>التجار القريبون</span><Icon name="chevron"/></button><button onClick={()=>navigate('help')}><span><Icon name="help"/>المساعدة</span><Icon name="chevron"/></button></section>
   <section className="approved-card"><div className="approved-card-title">التفضيلات</div><div className="settings-choice"><span>اللغة</span><b className="pill gold">العربية</b><span className="disabled-choice">English · قريبًا</span><span className="disabled-choice">Français · قريبًا</span></div><div className="settings-choice"><span>عملات الأسعار المتاحة</span><b className="pill gold">SAR</b><b className="pill">USD</b></div></section>
   <button className="danger-button approved-logout" onClick={logout}><Icon name="logout"/>تسجيل الخروج</button>
  </>;
 };
 return <div className="gold-web workspace" dir="rtl" lang="ar"><aside className="desktop-nav">{nav}</aside><div className="workspace-main"><header className="topbar"><button className="icon-button menu-trigger" aria-label={page==='home'?'فتح التنبيهات':'العودة للرئيسية'} onClick={()=>page==='home'?navigate('alerts'):navigate('home')}><Icon name={page==='home'?'bell':'chevron'}/>{page==='home'&&alerts.some(a=>a.status==='active')&&<i className="notification-dot"/>}</button><div><p className="eyebrow"><span className="role-dot"/>ذهبي · حساب المستخدم</p><h1 tabIndex={-1} ref={headingRef}>{pages.find(p=>p.id===page)?.label}</h1></div>{(page==='home'||page==='prices')&&<button className="secondary refresh-button" aria-label="تحديث أسعار الذهب من خادم ذهبي" disabled={marketLoading} onClick={()=>void loadMarket()}><Icon name="refresh"/><span>{marketLoading?'جارٍ التحديث…':'تحديث الأسعار'}</span></button>}</header><main className="workspace-content" aria-busy={loading}>{error&&<div className="notice error" role="alert">{error} <button className="text-button" disabled={loading} onClick={()=>void loadData()}>إعادة المحاولة</button></div>}{(page==='home'||page==='prices')&&marketError&&<p className="notice warning" role="status">{marketError}</p>}{message&&<p className="notice success" role="status">{message}</p>}{loading&&!loaded&&<p className="notice info" role="status">جارٍ تحميل بيانات حسابك…</p>}{content()}<footer>© 2026 Ibrahim Alneami — All Rights Reserved · User Web 1.5.0</footer></main><nav className="mobile-bottom-nav" aria-label="التنقل السريع">{mobilePages.map(p=><button key={p.id} className={'mobile-tab '+(p.id===page?'selected':'')} aria-current={p.id===page?'page':undefined} onClick={()=>navigate(p.id)}><Icon name={p.icon}/><span>{p.navLabel||p.label}</span></button>)}</nav></div>
 {menu&&<div className="mobile-nav-backdrop" onClick={()=>setMenu(false)}><div className="mobile-nav" ref={modalRef} role="dialog" aria-modal="true" aria-label="قائمة التنقل" onClick={e=>e.stopPropagation()}><button className="icon-button close-menu" aria-label="إغلاق القائمة" onClick={()=>setMenu(false)}><Icon name="close"/></button>{nav}</div></div>}
 {(dialog||confirm)&&<div className="dialog-backdrop"><div className="dialog" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="section-heading"><h2 id="dialog-title">{confirm?'تأكيد الحذف':dialog?.type==='portfolio'?'محفظة جديدة':dialog?.type==='alert'?'تنبيه جديد':dialog?.purchase?'تعديل سجل الشراء':'تسجيل شراء'}</h2><button className="icon-button" aria-label="إغلاق" disabled={busy} onClick={()=>{setDialog(null);setConfirm(null);}}><Icon name="close"/></button></div>
 {confirm?<><p>هل تريد حذف {confirm.label}؟ لا يمكن التراجع عن الحذف من التطبيق.</p><div className="actions"><button className="secondary" disabled={busy} onClick={()=>setConfirm(null)}>إلغاء</button><button className="danger-button" disabled={busy} onClick={()=>void mutate(confirm.path,'DELETE')}>{busy?'جارٍ الحذف…':'حذف'}</button></div></>:<form onSubmit={submit}>
 {dialog?.type==='portfolio'&&<label>اسم المحفظة<input name="name" required maxLength={80} placeholder="مثال: ادخار الأسرة"/></label>}
 {dialog?.type==='purchase'&&<><label>المحفظة<select name="portfolioId" defaultValue={dialog.purchase?.portfolioId||portfolios[0]?.id} required>{portfolios.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="form-grid"><label>العيار<KaratSelect value={dialog.purchase?.karat}/></label><label>العملة<CurrencySelect value={dialog.purchase?.currency}/></label><label>الوزن بالجرام<input name="weightGrams" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required defaultValue={dialog.purchase?.weightGrams}/></label><label>سعر الجرام عند الشراء<input name="unitPrice" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required defaultValue={dialog.purchase?.unitPrice}/></label></div><label>تاريخ الشراء<input name="purchasedAt" type="date" required max={localDate()} defaultValue={dialog.purchase?.purchasedAt.slice(0,10)||localDate()}/></label><p className="fine">الإجمالي = الوزن بالجرام × سعر الجرام. أدخل بيانات الشراء الفعلية.</p></>}
 {dialog?.type==='alert'&&<><div className="form-grid"><label>العيار<KaratSelect/></label><label>العملة<CurrencySelect/></label></div><label>السعر المستهدف لكل جرام<input name="targetPrice" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required/></label><label>الشرط<select name="direction"><option value="above">السعر يساوي أو يتجاوز الهدف</option><option value="below">السعر يساوي أو يقل عن الهدف</option></select></label></>}
 {formError&&<p className="notice error" role="alert">{formError}</p>}<div className="actions"><button className="primary" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ'}</button><button type="button" className="secondary" disabled={busy} onClick={()=>setDialog(null)}>إلغاء</button></div></form>}{confirm&&formError&&<p className="notice error" role="alert">{formError}</p>}
 </div></div>}</div>;
}
