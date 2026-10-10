import React,{useState,useEffect,useRef,useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import AuthForm from './AuthForm';
import {QuickLockScreen,QuickPinSetup} from './QuickLockScreen';
import PurchaseFormFields from './PurchaseFormFields';
import PriceHistoryChart from './PriceHistoryChart';
import {Money,formatTwo,CurrencyMark} from './price-display';
import NotificationSettings from './NotificationSettings';
import {revokePushBeforeLogout} from './push-client';
import {api,jsonRequest,errorMessage} from './api';
import {Portfolio,Purchase,PriceAlert,MarketPrice,KARATS,CURRENCIES,totals,purchasePerformance,purchasePayload,alertPayload,localDate} from './model';
import {priceFreshness} from './price-status';
import {goldSpotSession,latestQuoteLabel,marketStatusText} from './gold-market-session';
import './user.css';
import './iphone.css';
import {installIphoneViewportObserver} from './iphone-viewport';
import {APP_DISPLAY_VERSION} from './app-version';
import {canShowBiometricLogin} from './biometric-visibility';
import {calculatorQuote} from './calculator-quote';
import {homeMarketMovement,homePortfolioSummary} from './home-data';
/** Build-time type bridge for the extracted native app's older AuthContext.
 * The Web bundle uses the specialized contexts/AuthContext.web provider.
 */
type UserLockAuth=ReturnType<typeof useAuth> & {
 lockedAccount:{id?:number|string;email:string;role:'user'|'admin'|'trader';name?:string}|null;
 quickPinEnabled:boolean;
 unlockWithPin:(pin:string)=>Promise<{ok:boolean;waitSeconds:number;remaining:number}>;
 enableQuickPin:(pin:string,currentPin?:string)=>Promise<void>;
 disableQuickPin:(currentPin:string)=>Promise<void>;
 lockWithBiometric:()=>Promise<boolean>;
};
const useUserLockAuth=()=>useAuth() as UserLockAuth;
type Page='home'|'prices'|'calculator'|'portfolio'|'more'|'purchases'|'alerts'|'notification-settings'|'map'|'account'|'help';
const pages:{id:Page;label:string;icon:string;navLabel?:string}[]=[
 {id:'home',label:'الرئيسية',icon:'home'},
 {id:'prices',label:'الأسعار',icon:'chart'},
 {id:'calculator',label:'الحاسبة',icon:'calculator'},
 {id:'portfolio',label:'المحفظة',icon:'wallet'},
 {id:'more',label:'المزيد',icon:'menu'},
 {id:'purchases',label:'المشتريات',icon:'receipt'},
 {id:'alerts',label:'التنبيهات',icon:'bell'},
 {id:'notification-settings',label:'إعدادات الإشعارات',icon:'bell'},
 {id:'map',label:'التجار القريبون',navLabel:'التجار',icon:'map'},
 {id:'account',label:'الملف الشخصي',navLabel:'الملف',icon:'user'},
 {id:'help',label:'المساعدة',icon:'help'}
];
const primaryPages=pages.filter(p=>['home','prices','portfolio','purchases','alerts','map','account'].includes(p.id));
const mobilePages=pages.filter(p=>['home','prices','calculator','portfolio','more'].includes(p.id));
function Icon({name}:{name:string}){
 if(name==='gem')return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="m3 8 4-5h10l4 5-9 12Z"/><path fill="none" stroke="#D4AF37" strokeWidth="1.1" d="M3 8h18M7 3l5 5 5-5"/></svg>;
 if(name==='store')return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M5 3h14l3 6H2ZM3 11h5v10H3Zm7 0h4v10h-4Zm6 0h5v10h-5Z"/></svg>;
 const paths:Record<string,string>={home:'m3 10 9-7 9 7v10H3Z M9 20v-7h6v7',chart:'M4 4v16h16 M7 14l4-5 4 3 5-7',wallet:'M3 6h17v14H3Z M3 6V4h14 M15 11h6v5h-6Z',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2Z M8 8h8 M8 12h8',bell:'M5 16h14l-2-3V9a5 5 0 0 0-10 0v4Z M10 20h4',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',help:'M12 17v1 M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',menu:'M4 6h16 M4 12h16 M4 18h16',close:'m6 6 12 12 M6 18 18 6',refresh:'M20 8a9 9 0 1 0 1 8 M20 3v6h-6',plus:'M12 5v14 M5 12h14',logout:'M9 3H4v18h5 M9 12h12 m-4-4 4 4-4 4',calculator:'M5 3h14v18H5Z M8 7h8 M8 11h2 M12 11h2 M16 11h1 M8 15h2 M12 15h2 M16 15h1 M8 18h2 M12 18h5',chevron:'m9 18 6-6-6-6',settings:'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 3.67-.08-.02a1.7 1.7 0 0 0-1.8-.35l-.1.04a1.7 1.7 0 0 0-1.1 1.55V22h-4.24v-.17a1.7 1.7 0 0 0-1.1-1.55l-.1-.04a1.7 1.7 0 0 0-1.8.35l-.08.02-2.12-3.67.06-.06A1.7 1.7 0 0 0 5.56 15l-.02-.1A1.7 1.7 0 0 0 4 13.8H3.8V9.56H4a1.7 1.7 0 0 0 1.54-1.1l.02-.1a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-3.67.08.02a1.7 1.7 0 0 0 1.8.35l.1-.04a1.7 1.7 0 0 0 1.1-1.55V1.4h4.24v.17a1.7 1.7 0 0 0 1.1 1.55l.1.04a1.7 1.7 0 0 0 1.8-.35l.08-.02 2.12 3.67-.06.06a1.7 1.7 0 0 0-.34 1.88l.02.1A1.7 1.7 0 0 0 21 9.56h.2v4.24H21a1.7 1.7 0 0 0-1.54 1.1Z',map:'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z M9 3v15 M15 6v15'};
 return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.home}/></svg>;
}
const number=(n:number)=>formatTwo(n);
const money=(n:number|null,c:string)=><Money amount={n} currency={c}/>;
const dateTime=(s:string)=>new Date(s).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});
function Empty({children}:{children:React.ReactNode}){return <div className="empty"><Icon name="wallet"/><p>{children}</p></div>;}
function CurrencySelect({value='SAR'}:{value?:string}){return <select name="currency" defaultValue={value}>{(CURRENCIES.includes(value)?CURRENCIES:[value,...CURRENCIES]).map(c=><option key={c}>{c}</option>)}</select>;}
function KaratSelect({value=24}:{value?:number}){return <select name="karat" defaultValue={value}>{(KARATS.includes(value)?KARATS:[value,...KARATS]).map(k=><option key={k} value={k}>عيار {k}</option>)}</select>;}
interface PriceHistoryRow{id:string;source:string;currency:string;karat:number;buyPrice:string;sellPrice:string;timestamp:string;createdAt:string}
function BootScreen(){
 const [slow,setSlow]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setSlow(true),6500);return()=>clearTimeout(timer);},[]);
 return <div className="gold-web boot" dir="rtl" role="status" aria-live="polite">
  <div className="boot-shell">
   <img className="boot-photo-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt="" aria-hidden="true"/>
   <div className="boot-copy"><h1>ذهبي</h1><p>نجهّز ذهبي لك…</p></div>
   <span className="boot-loader" aria-hidden="true"><i/><i/><i/></span>
    <p className="app-version-stamp" dir="ltr" style={{color:"#D4AF37",fontSize:12,textAlign:"center",margin:"6px auto 0"}}>{APP_DISPLAY_VERSION}</p>
   {slow&&<p className="boot-slow">قد يستغرق التشغيل الأول بضع ثوانٍ.</p>}
  </div>
 </div>;
}
export default function UserWorkspace(){
 const {user,lockedAccount,isLoading,error,logout,quickPinEnabled,biometricEnabled,unlockWithPin,loginWithBiometric}=useUserLockAuth();
 if(isLoading&&!user&&!lockedAccount)return <BootScreen/>;
 if(lockedAccount)return <QuickLockScreen key={String(lockedAccount.id)}
  account={lockedAccount} quickPinEnabled={quickPinEnabled} biometricEnabled={biometricEnabled}
  loading={isLoading} error={error} onPin={unlockWithPin}
  onBiometric={loginWithBiometric} onForgot={logout}/>;
 if(!user)return <AuthForm/>;
 return <Workspace key={String(user.id)} email={user.email} role={user.role} logout={logout}/>;
}
export function Workspace({email,role,logout}:{email:string;role:string;logout:()=>void}){
 const {user,biometricAvailable,biometricEnabled,biometricEnrolled,enableBiometric,disableBiometric,lockWithBiometric,quickPinEnabled,enableQuickPin,disableQuickPin}=useUserLockAuth();
 const [biometricNotice,setBiometricNotice]=useState('');
 const [pinSetup,setPinSetup]=useState<'enable'|'change'|'disable'|null>(null);
 const biometricActive=canShowBiometricLogin({biometricAvailable,biometricEnabled,biometricEnrolled});
 const [page,setPage]=useState<Page>('home'),[menu,setMenu]=useState(false),[expandedPortfolioId,setExpandedPortfolioId]=useState<string|null>(null);
 const [portfolios,setPortfolios]=useState<Portfolio[]>([]),[purchases,setPurchases]=useState<Purchase[]>([]),[alerts,setAlerts]=useState<PriceAlert[]>([]);
 const [priceCurrency,setPriceCurrency]=useState('SAR');
 const [homeHistory,setHomeHistory]=useState<PriceHistoryRow[]>([]);
 const [history,setHistory]=useState<PriceHistoryRow[]>([]),[historyQuery,setHistoryQuery]=useState(''),[marketRows,setMarketRows]=useState<PriceHistoryRow[]>([]),[allMarketRows,setAllMarketRows]=useState<MarketPrice[]>([]),[historyError,setHistoryError]=useState(''),[chartKarat,setChartKarat]=useState(24);
 const [calcKarat,setCalcKarat]=useState(24),[calcWeight,setCalcWeight]=useState('10'),[calcFee,setCalcFee]=useState('0'),[calcVat,setCalcVat]=useState(false);
 const [loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [marketLoading,setMarketLoading]=useState(false),[marketError,setMarketError]=useState('');
 const [dialog,setDialog]=useState<{type:'portfolio'|'purchase'|'alert';purchase?:Purchase;alert?:PriceAlert}|null>(null),[confirm,setConfirm]=useState<{path:string;label:string}|null>(null),[formError,setFormError]=useState('');
 const [clock,setClock]=useState(Date.now());const pageScrollRef=useRef<HTMLElement>(null);const shellRef=useRef<HTMLDivElement>(null);const active=useRef(true),loadSequence=useRef(0),marketLoadSequence=useRef(0),writeLock=useRef(false),modalRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
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
   const selectedHistory=api<PriceHistoryRow[]>('/prices/history?currency='+encodeURIComponent(priceCurrency)+'&karat='+chartKarat+'&limit=200');
   const [historyRows,homeHistoryRows,...latest]=await Promise.all([
    selectedHistory,
    priceCurrency==='SAR'&&chartKarat===24?selectedHistory:api<PriceHistoryRow[]>('/prices/history?currency=SAR&karat=24&limit=200'),
    ...latestRequests
   ]);
   if(!Array.isArray(historyRows)||!Array.isArray(homeHistoryRows))throw new Error('Invalid history response');
   const cleanLatest=latest.filter((row):row is PriceHistoryRow=>!!row&&Number.isFinite(Number(row.buyPrice))&&Number(row.buyPrice)>0);
   if(active.current&&seq===marketLoadSequence.current){
    setHistory(historyRows);
    setHomeHistory(homeHistoryRows);
    setHistoryQuery(priceCurrency+':'+chartKarat);
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
  const marketTimer=setInterval(()=>{if(document.visibilityState==='visible'&&goldSpotSession(Date.now())==='open')void loadMarket();},5*60000);
  const focus=()=>{if(document.visibilityState==='visible'){setClock(Date.now());void loadData();if(goldSpotSession(Date.now())==='open')void loadMarket();}};
  document.addEventListener('visibilitychange',focus);
  return()=>{active.current=false;loadSequence.current++;marketLoadSequence.current++;clearInterval(clockTimer);clearInterval(marketTimer);document.removeEventListener('visibilitychange',focus);};},[loadData,loadMarket]);
 useEffect(()=>{const read=()=>{const id=location.hash.slice(1);if(pages.some(p=>p.id===id))setPage(id as Page);};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[]);
 const navigate=(p:Page)=>{setPage(p);setMenu(false);location.hash=p;requestAnimationFrame(()=>headingRef.current?.focus());};
 // Keep iPhone keyboard changes from shifting the bottom navigation or forms.
 useEffect(()=>shellRef.current?installIphoneViewportObserver(shellRef.current):undefined,[]);
 // Keep iPhone navigation independent of the prior page's scroll position.
 useEffect(()=>{pageScrollRef.current?.scrollTo({top:0,behavior:'auto'});},[page]);
 const signOut=()=>{void (async()=>{try{await revokePushBeforeLogout();}finally{logout();}})();};
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
 const openAlertDialog=(alert?:PriceAlert)=>{setFormError('');setDialog({type:'alert',alert});};
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const data=new FormData(e.currentTarget);if(!dialog)return;
  try{
   if(dialog.type==='portfolio'){const name=String(data.get('name')||'').trim();if(!name)throw new Error('أدخل اسم المحفظة.');await mutate('/portfolio','POST',{name});}
   if(dialog.type==='purchase'){const payload=purchasePayload(data);await mutate(dialog.purchase?'/portfolio/purchase/'+dialog.purchase.id:'/portfolio/purchase',dialog.purchase?'PATCH':'POST',payload);}
   if(dialog.type==='alert'){
    const payload=alertPayload(data);
    await mutate(dialog.alert?'/alerts/'+dialog.alert.id:'/alerts',dialog.alert?'PATCH':'POST',payload);
   }
  }catch(e){setFormError(e instanceof Error?e.message:'تحقق من القيم.');}
 };
 const sortedHistory=[...history].sort((a,b)=>Date.parse(a.createdAt||a.timestamp)-Date.parse(b.createdAt||b.timestamp));
 const currentMarket=marketRows.find(r=>r.karat===chartKarat)||sortedHistory[sortedHistory.length-1]||null;
 const homeMarket=allMarketRows.find(r=>r.currency==='SAR'&&r.karat===24) as PriceHistoryRow|undefined;
 const session=goldSpotSession(clock);
 const marketClosed=session==='closed';
 const freshness=priceFreshness(homeMarket,clock);
 const stale=marketClosed||freshness!=='fresh'||!!marketError;
 const marketLabel=marketStatusText(session,freshness,!!marketError);
 const summary=totals(purchases,allMarketRows),statusLabels={active:'نشط',paused:'متوقف',triggered:'تحقق الشرط'};
 const visibleHistory=historyQuery===priceCurrency+':'+chartKarat?history:[];
 const priceNote=<p className="fine">جميع الأسعار في هذه النسخة تأتي من Backend ذهبي نفسه؛ وتشترك البطاقات والمحفظة والتنبيهات والرسم البياني في المصدر ذاته. لا تشمل الأسعار المصنعية أو الضريبة أو هامش المتجر.</p>;
 const marketTime=(row:PriceHistoryRow|null|undefined)=>row&&Number.isFinite(Date.parse(row.timestamp))?dateTime(row.timestamp):'لا يوجد تحديث موثوق';
 const priceBlock=<section className="market-price-card">
  <div className="row"><div><p className="mock-supporting">سعر الذهب الآن</p><strong className="mock-gold-number">{money(homeMarket?Number(homeMarket.buyPrice):null,'SAR')}</strong><p className="mock-supporting">عيار 24 · سعر الجرام</p></div><span className={'pill '+(!stale?'good':'warn')}>{marketLabel}</span></div>
  <p className="market-update">{latestQuoteLabel(homeMarket?.timestamp,session)}</p>
 </section>;
 const nav=<><div className="nav-brand"><span className="brand-mark small">ذ</span><div><strong>ذهبي</strong><small>حساب المستخدم</small></div></div><nav aria-label="القائمة الرئيسية">{primaryPages.map(p=><button key={p.id} className={'nav-item '+(p.id===page?'selected':'')} aria-current={p.id===page?'page':undefined} onClick={()=>navigate(p.id)}><Icon name={p.icon}/><span>{p.navLabel||p.label}</span></button>)}</nav><div className="nav-account"><span className="avatar">{email[0].toUpperCase()}</span><span className="email" dir="ltr">{email}</span><button className="icon-button" title="تسجيل الخروج" aria-label="تسجيل الخروج" onClick={signOut}><Icon name="logout"/></button></div></>;
 const calcMarket=allMarketRows.find(r=>r.currency==='SAR'&&r.karat===calcKarat);
 const calcUnit=calcMarket?Number(calcMarket.buyPrice):null;
 const calcWeightN=Math.max(0,Number(calcWeight)||0),calcFeeN=Math.max(0,Number(calcFee)||0);
 const {raw:calcRaw,fees:calcFeeTotal,tax:calcTax,total:calcTotal}=calculatorQuote(calcUnit,calcWeightN,calcFeeN,calcVat);
 const totalWeight=purchases.reduce((sum,p)=>sum+(Number(p.weightGrams)||0),0);
 const homePortfolio=homePortfolioSummary(purchases,allMarketRows,loaded);
 const homeMovement=marketClosed?null:homeMarketMovement(homeHistory,homeMarket,clock);
 const accountName=user?.name?.trim()||email;
 const mobilePage=mobilePages.some(p=>p.id===page)?page:'more';
 const content=()=>{
  if(page==='home')return <>
   <section className="approved-card live-price-card" aria-label="سعر الذهب الآن عيار 24">
    <div className="live-card-top"><span className={!stale?'live-badge':'pill warn'}>{!stale&&<i/>}{marketLabel}</span><strong>سعر الذهب الآن - عيار 24</strong></div>
    <div className="live-price-main"><div className="home-quote"><div className="price-tag-large">{money(homeMarket?Number(homeMarket.buyPrice):null,'SAR')}<small>/جرام</small></div>
     <p className={'home-market-change '+(homeMovement===null?'neutral':homeMovement.difference>=0?'positive':'negative')} title="مقارنة بأول تحديث متاح اليوم بتوقيت السعودية">
      {homeMovement?<><Icon name="chart"/><span dir="ltr">{homeMovement.difference>=0?'+':'−'}{money(Math.abs(homeMovement.difference),'SAR')} ({homeMovement.percent>=0?'+':'−'}{number(Math.abs(homeMovement.percent))}%)</span> اليوم</>:(marketClosed?'لا تداول حاليًا':'لا توجد مقارنة كافية اليوم')}
     </p></div><div className="buy-sell-mini"><span>سعر الشراء: <b>{money(homeMarket?Number(homeMarket.buyPrice):null,'SAR')}</b></span><span>سعر البيع: <b>{money(homeMarket?Number(homeMarket.sellPrice):null,'SAR')}</b></span></div></div>
    <div className="live-card-footer"><span>السعر العالمي الاسترشادي</span><span title={marketTime(homeMarket)}>{latestQuoteLabel(homeMarket?.timestamp,session)}</span>{!marketClosed&&<button className="home-price-refresh" aria-label="تحديث أسعار الذهب من خادم ذهبي" disabled={marketLoading} onClick={()=>void loadMarket()}>{marketLoading?'جارٍ التحقق…':'تحديث الأسعار'}</button>}</div>
   </section>
   <div className="approved-section-title"><h3>الخدمات السريعة</h3></div>
   <section className="approved-services-grid">{[
    ['calculator','حاسبة الذهب','calculator'],['prices','أسعار اليوم','chart'],['portfolio','المحفظة','wallet'],['map','أقرب تاجر','store']
   ].map(([id,label,icon])=><button key={id} className="approved-service-item" onClick={()=>navigate(id as Page)}><span className="approved-service-icon"><Icon name={icon}/></span><span>{label}</span></button>)}</section>
   <section className="approved-card portfolio-mini" aria-label="ملخص المحفظة بالريال السعودي"><div className="approved-card-title"><span><Icon name="wallet"/>محفظتي الذهبية</span><button className="text-button" onClick={()=>navigate('portfolio')}>التفاصيل ←</button></div>
    <div className="portfolio-mini-body"><div><strong>{money(homePortfolio.value,'SAR')}</strong><span>إجمالي الوزن: {homePortfolio.weight===null?'غير متاح':number(homePortfolio.weight)+' جرام'}</span></div>{homePortfolio.difference!==null&&homePortfolio.percent!==null&&<div className={'portfolio-delta '+(homePortfolio.difference>=0?'positive':'negative')} title="الفرق عن تكلفة الشراء"><b><span>{homePortfolio.difference>=0?'+':'−'}</span>{money(Math.abs(homePortfolio.difference),'SAR')}</b><small dir="ltr">{homePortfolio.percent>=0?'+':'−'}{number(Math.abs(homePortfolio.percent))}%</small></div>}</div>
    {homePortfolio.hasOtherCurrencies&&<p className="home-currency-note">المعروض مشتريات الريال السعودي؛ بقية العملات في التفاصيل.</p>}
   </section>
   <section className="approved-card home-chart-card"><PriceHistoryChart rows={homeHistory} currency="SAR" karat={24} compact marketClosed={marketClosed}/></section>
  </>;

  if(page==='prices')return <>
   <section className="approved-card prices-header-card"><span className={!stale?'live-badge':'pill warn'}>{!stale&&<i/>}{marketLabel}</span><p>سعر الأونصة المشتق من عيار 24</p><strong className="ounce-price">{currentMarket&&currentMarket.karat===24?money(Number(currentMarket.buyPrice)*31.1034768,priceCurrency):money((marketRows.find(r=>r.karat===24)?Number(marketRows.find(r=>r.karat===24)!.buyPrice):NaN)*31.1034768||null,priceCurrency)}</strong><small>{latestQuoteLabel(marketRows.find(r=>r.karat===24)?.timestamp,session)}</small></section>
   <section className="approved-card"><div className="approved-card-title"><span>أسعار الجرام بحسب العيار</span><label className="inline-select">العملة<select value={priceCurrency} onChange={e=>setPriceCurrency(e.target.value)}><option>SAR</option><option>USD</option></select></label></div>
    <div className="approved-price-table"><div className="price-row head"><span>العيار</span><span>الشراء</span><span>البيع</span></div>{[24,22,21,18].map(k=>{const row=marketRows.find(r=>r.karat===k);return <div className="price-row" key={k}><span><b className="karat-badge">عيار {k}</b></span><strong>{money(row?Number(row.buyPrice):null,priceCurrency)}</strong><span>{money(row?Number(row.sellPrice):null,priceCurrency)}</span></div>;})}</div>
   </section>
   <section className="approved-card"><div className="approved-card-title"><span>الرسم الزمني للأسعار</span><label className="inline-select">العيار<select value={chartKarat} onChange={e=>setChartKarat(Number(e.target.value))}>{[24,22,21,18].map(k=><option key={k} value={k}>{k}K</option>)}</select></label></div>{historyError?<p className="notice warning">{historyError}</p>:<PriceHistoryChart rows={visibleHistory} currency={priceCurrency} karat={chartKarat} marketClosed={marketClosed}/>}</section>
   {priceNote}
  </>;

  if(page==='calculator')return <>
   <section className="approved-card calc-total-card"><span>السعر الإجمالي التقريبي</span><strong>{money(calcTotal,'SAR')}</strong><small>سعر الجرام الأساسي: {money(calcUnit,'SAR')} · عيار {calcKarat}</small></section>
   <section className="approved-card calculator-form">
    <label>1. اختر عيار الذهب<div className="karat-switch">{[24,22,21,18].map(k=><button type="button" key={k} className={calcKarat===k?'active':''} onClick={()=>setCalcKarat(k)}>{k}K</button>)}</div></label>
    <label>2. الوزن بالجرام<input type="number" inputMode="decimal" min="0" step="0.1" value={calcWeight} onChange={e=>setCalcWeight(e.target.value)}/><div className="weight-presets">{[5,10,20,31.1,50].map(w=><button type="button" key={w} onClick={()=>setCalcWeight(String(w))}>{w===31.1?'أونصة 31.1g':w+' جرام'}</button>)}</div></label>
    <label>3. أجرة المصنعية لكل جرام (اختياري)<input type="number" inputMode="decimal" min="0" step="0.01" value={calcFee} onChange={e=>setCalcFee(e.target.value)}/></label>
    <div className="calc-toggle"><div><strong>احتساب ضريبة 15% على قيمة الذهب والمصنعية</strong><small>الضريبة = (قيمة الذهب + إجمالي المصنعية) × 15%.</small></div><input type="checkbox" checked={calcVat} onChange={e=>setCalcVat(e.target.checked)}/></div>
   </section>
   <section className="approved-card"><div className="approved-card-title">تفاصيل السعر المقدر</div><dl className="calc-breakdown"><div><dt>قيمة الذهب الخام</dt><dd>{money(calcRaw,'SAR')}</dd></div><div><dt>إجمالي المصنعية</dt><dd>{money(calcFeeTotal,'SAR')}</dd></div><div><dt>الضريبة التقديرية</dt><dd>{money(calcTax,'SAR')}</dd></div><div className="final"><dt>الإجمالي النهائي</dt><dd>{money(calcTotal,'SAR')}</dd></div></dl></section>
  </>;

  if(page==='portfolio')return <>
   <section className="approved-card portfolio-summary-card"><div><span>إجمالي الوزن المسجل</span><strong>{number(totalWeight)} جرام</strong></div><button className="primary" disabled={busy||!loaded} onClick={()=>openDialog('portfolio')}><Icon name="plus"/>محفظة جديدة</button></section>
   <section className="approved-card">
    <div className="approved-card-title"><span>محافظك</span><button className="text-button" disabled={busy||!loaded||!portfolios.length} onClick={()=>openDialog(portfolios.length?'purchase':'portfolio')}>{portfolios.length?'تسجيل شراء':'إنشاء محفظة'}</button></div>
    {!loaded?<Empty>لم يتم تحميل المحافظ بعد.</Empty>:!portfolios.length?<Empty>لا توجد محافظ بعد. أنشئ محفظتك الأولى.</Empty>:
    <div className="approved-portfolio-list">{portfolios.map((portfolio,index)=>{
     const rows=purchases.filter(p=>p.portfolioId===portfolio.id);
     const summary=totals(rows,allMarketRows);
     const expanded=expandedPortfolioId===portfolio.id;
     const detailsId='portfolio-purchases-'+index;
     return <article className={'portfolio-entry '+(expanded?'is-expanded':'')} key={portfolio.id}>
      <div className="portfolio-entry-header">
       <button type="button" className="portfolio-expand-trigger" aria-expanded={expanded} aria-controls={detailsId}
        onClick={()=>setExpandedPortfolioId(expanded?null:portfolio.id)}>
        <span className="approved-service-icon"><Icon name="wallet"/></span>
        <span className="portfolio-list-copy">
         <strong className="portfolio-name">{portfolio.name}</strong>
         <span className="portfolio-subtitle">{rows.length} سجلات شراء</span>
         {summary.map(item=><span className="portfolio-currency-value" key={item.currency}>
          {item.currency}: {money(item.value,item.currency)}
          {item.value!==null&&<small className={item.value-item.cost>=0?'delta-positive':'delta-negative'}>
           {' · الفرق: '}{item.value-item.cost>0?'+':''}{money(item.value-item.cost,item.currency)}
          </small>}
         </span>)}
        </span>
        <span className={'portfolio-chevron '+(expanded?'rotated':'')} aria-hidden="true"><Icon name="chevron"/></span>
       </button>
       <button type="button" className="text-button portfolio-delete" disabled={busy||rows.length>0}
        onClick={()=>{setFormError('');setConfirm({path:'/portfolio/'+portfolio.id,label:portfolio.name});}}>حذف</button>
      </div>
      {expanded&&<div className="portfolio-purchases" id={detailsId} aria-label={'محتويات محفظة '+portfolio.name}>
       <p className="portfolio-purchases-caption">القيمة تقديرية بحسب آخر سعر متاح للعيار والعملة. الفرق مبني على كامل تكلفة الفاتورة المسجلة ويقارنها بالقيمة السوقية الخام؛ لا يشمل رسوم أو فروقات إعادة البيع.</p>
       {!rows.length?<p className="portfolio-empty">لا توجد مشتريات في هذه المحفظة حتى الآن.</p>:
       <div className="portfolio-purchases-list">{rows.map(purchase=>{
        const position=purchasePerformance(purchase,allMarketRows);
        return <div className="portfolio-purchase-row" key={purchase.id}>
         <div className="portfolio-purchase-identity"><strong>ذهب عيار {purchase.karat}</strong>
          <span>{number(Number(purchase.weightGrams))} جرام · {purchase.purchasedAt.slice(0,10)}</span>
         </div>
         <dl className="portfolio-purchase-metrics">
          <div><dt>{purchase.invoiceDetails?.goldUnitPrice!==undefined?'سعر جرام الذهب دون إضافات':'سعر الجرام المسجل (شامل)'}</dt><dd>{money(purchase.invoiceDetails?.goldUnitPrice??Number(purchase.unitPrice),purchase.currency)}</dd></div>
          <div><dt>التكلفة الفعلية للجرام</dt><dd>{money(Number(purchase.totalPrice)/Number(purchase.weightGrams),purchase.currency)}</dd></div>
          <div><dt>تكلفة الشراء الإجمالية</dt><dd>{money(position.cost,purchase.currency)}</dd></div>
          <div><dt>القيمة السوقية التقديرية</dt><dd>{money(position.value,purchase.currency)}</dd></div>
         </dl>
         <div className={'portfolio-purchase-difference '+(position.difference===null?'delta-unavailable':position.difference>=0?'delta-positive':'delta-negative')}>
          <span>الفرق عن تكلفة الشراء</span>
          <strong>{position.difference===null?'غير متاح':<>{position.difference>0?'+':''}{money(position.difference,purchase.currency)}</>}
           {position.cost&&position.difference!==null&&<small className="portfolio-return-percent">{' ('}{position.difference>0?'+':''}{number(100*position.difference/position.cost)}%{')'}</small>}
          </strong>
         </div>
        </div>;
       })}</div>}
      </div>}
     </article>;
    })}</div>}
   </section>
  </>;

  if(page==='purchases')return <section className="approved-card"><div className="approved-card-title"><span>سجل المشتريات</span><button className="primary compact-primary" disabled={busy||!loaded} onClick={()=>openDialog(portfolios.length?'purchase':'portfolio')}><Icon name="plus"/>{portfolios.length?'تسجيل شراء':'إنشاء محفظة'}</button></div>{!loaded?<Empty>لم يتم تحميل المشتريات بعد.</Empty>:!purchases.length?<Empty>لا توجد مشتريات مسجلة.</Empty>:<div className="records">{purchases.map(p=><article className="record" key={p.id}><div className="record-title"><span className="card-icon"><Icon name="receipt"/></span><div><h3>ذهب عيار {p.karat}</h3><p className="approved-muted">{portfolios.find(x=>x.id===p.portfolioId)?.name||'محفظة'} · {p.purchasedAt.slice(0,10)}</p></div><strong className="record-total">{money(Number(p.totalPrice),p.currency)}</strong></div><dl className="record-details"><div><dt>الوزن</dt><dd>{number(Number(p.weightGrams))} جم</dd></div><div><dt>{p.invoiceDetails?.goldUnitPrice!==undefined?'سعر جرام الذهب دون إضافات':'سعر الجرام المسجل (شامل)'}</dt><dd>{money(p.invoiceDetails?.goldUnitPrice??Number(p.unitPrice),p.currency)}</dd></div>
 <div><dt>التكلفة الفعلية للجرام</dt><dd>{money(Number(p.totalPrice)/Number(p.weightGrams),p.currency)}</dd></div>
 {p.invoiceDetails?.pricingMode==='itemized'&&<div><dt>المصنعية والضريبة والأحجار</dt><dd>{money((p.invoiceDetails.makingCharge||0)+(p.invoiceDetails.vatAmount||0)+(p.invoiceDetails.stonePrice||0),p.currency)}</dd></div>}
 {p.invoiceDetails?.invoiceNumber&&<div><dt>الفاتورة</dt><dd>{p.invoiceDetails.invoiceNumber}</dd></div>}
 {p.invoiceDetails?.sellerName&&<div><dt>التاجر</dt><dd>{p.invoiceDetails.sellerName}</dd></div>}<div className="actions"><button className="secondary" disabled={busy} onClick={()=>openDialog('purchase',p)}>تعديل</button><button className="danger text-button" disabled={busy} onClick={()=>{setFormError('');setConfirm({path:'/portfolio/purchase/'+p.id,label:'سجل الشراء'});}}>حذف</button></div></dl></article>)}</div>}</section>;

  if(page==='notification-settings')return <NotificationSettings/>;
  if(page==='alerts')return <section className="approved-card"><div className="approved-card-title"><span>تنبيهات الأسعار</span><button className="primary compact-primary" disabled={busy||!loaded} onClick={()=>openAlertDialog()}><Icon name="plus"/>تنبيه جديد</button></div><div className="dh-push-alert-entry"><p>عندما يصل السعر إلى هدفك، يرسل ذهبي إشعار Push إلى أجهزتك المسجلة، حتى إن كانت الصفحة مغلقة وفق دعم الجهاز.</p><button type="button" className="secondary" onClick={()=>navigate('notification-settings')}><Icon name="bell"/>إعدادات إشعارات الجهاز</button></div>{!loaded?<Empty>لم يتم تحميل التنبيهات بعد.</Empty>:!alerts.length?<Empty>لا توجد تنبيهات. أضف السعر الذي تريد متابعته.</Empty>:<div className="approved-alert-list">{alerts.map(a=><article key={a.id}><div><span className={'pill '+(a.status==='active'?'good':a.status==='triggered'?'warn':'')}>{statusLabels[a.status]}</span><h3>عيار {a.karat} · <span className="dh-currency-label"><CurrencyMark currency={a.currency}/></span></h3><p>{a.direction==='above'?'عند وصول السعر إلى أو أعلى من':'عند وصول السعر إلى أو أقل من'} <b>{money(Number(a.targetPrice),a.currency)}</b></p></div><div className="actions"><button className="secondary" disabled={busy} onClick={()=>void mutate('/alerts/'+a.id+(a.status==='active'?'/pause':'/activate'),'POST')}>{a.status==='active'?'إيقاف':a.status==='triggered'?'إعادة تفعيل':'تفعيل'}</button><button className="secondary" disabled={busy} onClick={()=>openAlertDialog(a)}>تعديل</button><button className="danger text-button" disabled={busy} onClick={()=>{setFormError('');setConfirm({path:'/alerts/'+a.id,label:'التنبيه'});}}>حذف</button></div></article>)}</div>}</section>;

  if(page==='map')return <><section className="approved-card map-placeholder"><div className="map-surface"><span/><span/><span/><div><Icon name="map"/><strong>التجار القريبون</strong><small>بانتظار ربط بيانات المواقع الحقيقية</small></div></div><div className="approved-card-title"><span>نطاق البحث</span><b className="pill gold">قريبًا</b></div><p className="approved-muted">لن نعرض أسماء متاجر أو مواقع وهمية. ستُفعّل هذه الشاشة عند اكتمال Merchant Location في الـBackend.</p></section></>;

  if(page==='account')return <><section className="approved-card profile-approved"><span className="avatar large">{email[0].toUpperCase()}</span><h2 dir="ltr">{email}</h2><span className="pill gold">{role==='admin'?'ADMIN':role==='trader'?'TRADER':'USER'}</span><small className="app-version-account" dir="ltr" style={{display:"block",marginTop:10,color:"#C5A021",fontSize:12}}>{APP_DISPLAY_VERSION}</small></section><section className="approved-card settings-list"><button onClick={()=>navigate('portfolio')}><span><Icon name="wallet"/>محفظتي الذهبية</span><Icon name="chevron"/></button><button onClick={()=>navigate('purchases')}><span><Icon name="receipt"/>سجل المشتريات</span><Icon name="chevron"/></button><button onClick={()=>navigate('alerts')}><span><Icon name="bell"/>تنبيهات الأسعار</span><Icon name="chevron"/></button><button onClick={()=>navigate('notification-settings')}><span><Icon name="bell"/>إعدادات الإشعارات</span><Icon name="chevron"/></button><button onClick={()=>window.dispatchEvent(new Event('dhahabi:user-check-update'))}><span><Icon name="refresh"/>التحقق من تحديث التطبيق</span><Icon name="chevron"/></button><button className="danger-row" onClick={signOut}><span><Icon name="logout"/>تسجيل الخروج</span><Icon name="chevron"/></button></section><section className="approved-card dh-quick-settings">
 <div className="approved-card-title">الدخول السريع والأمان</div>
 <p className="fine">أضف رمزًا من ٦ أرقام لفتح ذهبي من شاشة قفل داخلية. تُحفظ الجلسة مشفرة وتجزئة الرمز محليًا؛ لا تُخزن الأرقام أو بيانات بصمتك. بدون دخول سريع، يلزم استخدام كلمة المرور بعد إعادة فتح التطبيق.</p>
 <div className="dh-quick-setting-row">
  <span><strong>رمز الدخول السريع</strong><small>شاشة قفل ولوحة أرقام على هذا الجهاز</small></span>
  <button type="button" role="switch" aria-label="تفعيل رمز الدخول السريع" aria-checked={quickPinEnabled}
   className={'dh-quick-toggle '+(quickPinEnabled?'on':'')}
   onClick={()=>void (async()=>{
    setBiometricNotice('');
    if(quickPinEnabled){
     setPinSetup('disable');
    }else setPinSetup('enable');
   })()}><span/></button>
 </div>
 {quickPinEnabled&&<div className="dh-quick-row-actions">
  <button type="button" className="secondary" onClick={()=>setPinSetup('change')}>تغيير رمز الدخول السريع</button>
 </div>}
 <div className="dh-quick-setting-row">
  <span><strong>خدمة بصمة الوجه/الإصبع</strong><small>{biometricAvailable?'عند الضغط على زر البصمة؛ حسب دعم المتصفح':'غير مدعومة في هذا المتصفح'}</small></span>
  <button type="button" role="switch" aria-label="خدمة بصمة الوجه والإصبع"
   aria-checked={biometricActive} disabled={!biometricAvailable}
   className={'dh-quick-toggle '+(biometricActive?'on':'')}
   onClick={()=>void (async()=>{
    setBiometricNotice('');
    try{
     if(biometricActive){await disableBiometric();setBiometricNotice('أُوقفت بصمة الجهاز في ذهبي.');}
     else{await enableBiometric();setBiometricNotice('تم تفعيل تحقق الجهاز. قد يطلب النظام بصمة أو رمز الجهاز؛ بعض المتصفحات تحتاج رمز ذهبي أو كلمة المرور بعد إعادة فتح التطبيق.');}
    }catch(e){setBiometricNotice(e instanceof Error?e.message:'تعذر تغيير إعداد بصمة الجهاز.');}
   })()}><span/></button>
 </div>
 {biometricNotice&&<p className="notice info" role="status">{biometricNotice}</p>}
 <div className="dh-quick-row-actions">
  {(quickPinEnabled||biometricActive)&&<button type="button" className="primary" onClick={()=>void (async()=>{
   if(!await lockWithBiometric())setBiometricNotice('تعذر قفل التطبيق. تحقق من جلسة الدخول.');
  })()}>قفل ذهبي الآن</button>}
 </div>
 <p className="fine">يظهر قفل ذهبي عند فتحه بجلسة محفوظة، أو عند العودة بعد دقيقة من الخلفية. بصمة Face ID/Touch ID في المتصفح قد تعرض نافذة تحقق خاصة بالنظام ولا يمكن تغيير شكلها؛ لذلك لا تُفتح تلقائيًا.</p>
 <p className="fine">إذا نسيت الرمز، استخدم كلمة مرور حسابك لاستعادة الوصول ثم أعد تفعيل الدخول السريع. تسجيل الدخول بكلمة المرور يعيد إعداد عوامل الدخول المحلية. الجلسات المنتهية تحتاج تسجيل دخول كامل.</p>
 </section></>;

  if(page==='help')return <section className="approved-card help-panel"><div className="approved-card-title">المساعدة</div>{[['كيف أبدأ؟','أنشئ محفظة ثم أضف مشترياتك الفعلية.'],['كيف تُحسب قيمة المحفظة؟','تعتمد على أسعار Backend ذهبي الحالية، مع إبقاء العملات منفصلة.'],['كيف أقرأ الرسم؟','كل نقطة سعر تمثل تحديثًا محفوظًا فعليًا في قاعدة البيانات.'],['لماذا التجار غير ظاهرين؟','لأن بيانات Merchant Location لم تُنفذ في الـBackend بعد؛ لا نعرض بيانات وهمية.']].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>;

  return <><section className="approved-card profile-shortcut"><span className="avatar">{email[0].toUpperCase()}</span><div><strong dir="ltr">{email}</strong><span>حساب مستخدم</span></div><button className="text-button" onClick={()=>navigate('account')}>الملف الشخصي</button></section>
   <section className="approved-card settings-list"><button onClick={()=>navigate('purchases')}><span><Icon name="receipt"/>المشتريات والفواتير</span><Icon name="chevron"/></button><button onClick={()=>navigate('alerts')}><span><Icon name="bell"/>تنبيهات الأسعار</span><Icon name="chevron"/></button><button onClick={()=>navigate('notification-settings')}><span><Icon name="bell"/>إعدادات الإشعارات</span><Icon name="chevron"/></button><button onClick={()=>navigate('map')}><span><Icon name="map"/>التجار القريبون</span><Icon name="chevron"/></button><button onClick={()=>navigate('help')}><span><Icon name="help"/>المساعدة</span><Icon name="chevron"/></button></section>
   <section className="approved-card"><div className="approved-card-title">التفضيلات</div><div className="settings-choice"><span>اللغة</span><b className="pill gold">العربية</b><span className="disabled-choice">English · قريبًا</span><span className="disabled-choice">Français · قريبًا</span></div><div className="settings-choice"><span>عملات الأسعار المتاحة</span><b className="pill gold">SAR</b><b className="pill">USD</b></div></section>
   <button className="danger-button approved-logout" onClick={signOut}><Icon name="logout"/>تسجيل الخروج</button>
  </>;
 };
 return <div ref={shellRef} className={'gold-web workspace '+(page==='home'?'reference-home':'')} dir="rtl" lang="ar"><aside className="desktop-nav">{nav}</aside><div className="workspace-main">{page==='home'?<header className="topbar home-topbar">
  <div className="home-identity"><span className="home-brand-emblem" aria-label="ذهبي"><Icon name="gem"/></span><div><p>مرحبًا بعودتك</p><h1 tabIndex={-1} ref={headingRef} title={accountName}><span dir="auto">{accountName}</span><span aria-hidden="true">👋</span></h1></div></div>
  <div className="home-head-actions"><button className="icon-button" aria-label="فتح التنبيهات" onClick={()=>navigate('alerts')}><Icon name="bell"/>{alerts.some(a=>a.status==='active')&&<i className="notification-dot"/>}</button><button className="icon-button home-menu-button" aria-label="فتح قائمة التنقل" onClick={()=>setMenu(true)}><Icon name="menu"/></button></div>
 </header>:<header className="topbar"><button className="icon-button menu-trigger" aria-label="العودة للرئيسية" onClick={()=>navigate('home')}><Icon name="chevron"/></button><div><p className="eyebrow"><span className="role-dot"/>ذهبي · حساب المستخدم</p><h1 tabIndex={-1} ref={headingRef}>{pages.find(p=>p.id===page)?.label}</h1></div>{page==='prices'&&<button className="secondary refresh-button" aria-label="تحديث أسعار الذهب من خادم ذهبي" disabled={marketLoading} onClick={()=>void loadMarket()}><Icon name="refresh"/><span>{marketLoading?'جارٍ التحديث…':'تحديث الأسعار'}</span></button>}</header>}<main ref={pageScrollRef} className="workspace-content" aria-busy={loading}>{error&&<div className="notice error" role="alert">{error} <button className="text-button" disabled={loading} onClick={()=>void loadData()}>إعادة المحاولة</button></div>}{(page==='home'||page==='prices')&&marketError&&<p className="notice warning" role="status">{marketError}</p>}{message&&<p className="notice success" role="status">{message}</p>}{loading&&!loaded&&<p className="notice info" role="status">جارٍ تحميل بيانات حسابك…</p>}{content()}<footer>© 2026 Ibrahim Alneami — All Rights Reserved · الإصدار {APP_DISPLAY_VERSION}</footer></main><nav className="mobile-bottom-nav" aria-label="التنقل السريع">{mobilePages.map(p=><button key={p.id} className={'mobile-tab '+(p.id===mobilePage?'selected':'')} aria-current={p.id===mobilePage?'page':undefined} onClick={()=>navigate(p.id)}><Icon name={p.icon}/><span>{p.navLabel||p.label}</span></button>)}</nav></div>
 {menu&&<div className="mobile-nav-backdrop" onClick={()=>setMenu(false)}><div className="mobile-nav" ref={modalRef} role="dialog" aria-modal="true" aria-label="قائمة التنقل" onClick={e=>e.stopPropagation()}><button className="icon-button close-menu" aria-label="إغلاق القائمة" onClick={()=>setMenu(false)}><Icon name="close"/></button>{nav}</div></div>}
 {pinSetup&&<QuickPinSetup mode={pinSetup} onClose={()=>setPinSetup(null)}
  onSave={async(pin,currentPin)=>{
   if(pinSetup==='disable'){await disableQuickPin(currentPin||'');setBiometricNotice('أُوقف رمز الدخول السريع على هذا الجهاز.');}
   else{await enableQuickPin(pin,currentPin);setBiometricNotice('تم حفظ رمز الدخول السريع لهذا الجهاز.');}
  }}/>}
 {(dialog||confirm)&&<div className="dialog-backdrop"><div className={'dialog '+(confirm?'confirm-dialog':'')} ref={modalRef} role={confirm?'alertdialog':'dialog'} aria-modal="true" aria-labelledby="dialog-title" aria-describedby={confirm?'confirm-warning-description':undefined}><div className="section-heading"><h2 id="dialog-title">{confirm?'تأكيد الحذف':dialog?.type==='portfolio'?'محفظة جديدة':dialog?.type==='alert'?(dialog.alert?'تعديل التنبيه':'تنبيه جديد'):dialog?.purchase?'تعديل سجل الشراء':'تسجيل شراء'}</h2><button className="icon-button" aria-label="إغلاق" disabled={busy} onClick={()=>{setDialog(null);setConfirm(null);}}><Icon name="close"/></button></div>
 {confirm?<><div className="confirm-warning" id="confirm-warning-description"><strong>هل تريد حذف {confirm.label}؟</strong><p>هذا الإجراء نهائي، ولا يمكن التراجع عن الحذف من التطبيق.</p></div><div className="actions"><button className="secondary" disabled={busy} onClick={()=>setConfirm(null)}>إلغاء</button><button className="danger-button" disabled={busy} onClick={()=>void mutate(confirm.path,'DELETE')}>{busy?'جارٍ الحذف…':'حذف'}</button></div></>:<form onSubmit={submit}>
 {dialog?.type==='portfolio'&&<label>اسم المحفظة<input name="name" required maxLength={80} placeholder="مثال: ادخار الأسرة"/></label>}
 {dialog?.type==='purchase'&&<PurchaseFormFields key={dialog.purchase?.id||'new'} purchase={dialog.purchase} portfolios={portfolios}/>}
 {dialog?.type==='alert'&&<><div className="form-grid"><label>العيار<KaratSelect value={dialog.alert?.karat||24}/></label><label>العملة<CurrencySelect value={dialog.alert?.currency||'SAR'}/></label></div><label>السعر المستهدف لكل جرام<input name="targetPrice" type="number" inputMode="decimal" min="0.0001" max="99999999" step="0.0001" required defaultValue={dialog.alert?.targetPrice||''}/></label><label>الشرط<select name="direction" defaultValue={dialog.alert?.direction||'above'}><option value="above">السعر يساوي أو يتجاوز الهدف</option><option value="below">السعر يساوي أو يقل عن الهدف</option></select></label>{dialog.alert&&<p className="fine alert-edit-guidance" role="note">{dialog.alert.status==='active'?'سيُطبّق الشرط الجديد عند الفحص القادم. إذا كان السعر يحقق الشرط الآن، فقد يصلك إشعار.':dialog.alert.status==='paused'?'سيبقى التنبيه متوقفًا بعد حفظ التعديل حتى تفعّله بنفسك.':'هذا التنبيه تحقق شرطه سابقًا، وسيظل كذلك بعد التعديل حتى تضغط «إعادة تفعيل».'}</p>}</>}
 {formError&&<p className="notice error" role="alert">{formError}</p>}<div className="actions"><button className="primary" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ'}</button><button type="button" className="secondary" disabled={busy} onClick={()=>setDialog(null)}>إلغاء</button></div></form>}{confirm&&formError&&<p className="notice error" role="alert">{formError}</p>}
 </div></div>}</div>;
}
