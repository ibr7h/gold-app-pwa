import React,{useState} from 'react';
import {useLanguage} from './i18n';
import {Money} from './price-display';
import {calculatorQuoteWithTaxRate} from './calculator-quote';
import {readPublicMarketSnapshot} from './public-market-cache';
import type {DisplayCurrency} from './display-currency';
import {APP_DISPLAY_VERSION} from './app-version';

/** Public-only tools. No AuthContext, API client, account ID or token is used. */
export default function OfflineWorkspace({online,onReturn}:{online:boolean;onReturn:()=>void}){
 const {language,direction}=useLanguage();
 const text=(ar:string,en:string,fr:string)=>language==='en'?en:language==='fr'?fr:ar;
 const [snapshot]=useState(readPublicMarketSnapshot);
 const [currency,setCurrency]=useState<DisplayCurrency>('SAR');
 const [karat,setKarat]=useState(24),[weight,setWeight]=useState('10'),[making,setMaking]=useState('0');
 const [rate,setRate]=useState('0'),[manual,setManual]=useState(''),[manualMode,setManualMode]=useState(false);
 const quote=snapshot?.rows.find(row=>row.currency===currency&&row.karat===karat);
 const unit=manualMode?(manual.trim()?Number(manual):null):quote?Number(quote.buyPrice):null;
 const result=calculatorQuoteWithTaxRate(unit,weight.trim()?Number(weight):NaN,making.trim()?Number(making):0,rate.trim()?Number(rate):0);
 return <div className="gold-web workspace" dir={direction} lang={language}><div className="workspace-main">
  <header className="topbar"><div><p className="eyebrow">{text('ذهبك · أدوات عامة','Dhahabk · Public tools','Dhahabk · Outils publics')}</p><h1>{text('وضع دون اتصال','Offline mode','Mode hors connexion')}</h1></div>
   <button type="button" className="secondary" onClick={onReturn}>{online?text('العودة لتسجيل الدخول','Back to sign in','Retour à la connexion'):text('التحقق من الاتصال','Check connection','Vérifier la connexion')}</button>
  </header>
  <main className="workspace-content">
   <p className="notice warning" role="status">{text('الحاسبة وآخر الأسعار المحفوظة فقط. الأسعار ليست مباشرة، وبيانات حسابك وعمليات الحفظ تتطلب الاتصال.','Calculator and saved public quotes only. Prices are not live. Account data and saving require a connection.','Calculatrice et cours publics enregistrés uniquement. Les cours ne sont pas en direct. Les données du compte et l’enregistrement nécessitent une connexion.')}</p>
   <section className="approved-card calculator-form">
    <div className="approved-card-title"><span>{text('الحاسبة','Calculator','Calculatrice')}</span><label className="inline-select">{text('العملة','Currency','Devise')}<select value={currency} onChange={e=>setCurrency(e.target.value as DisplayCurrency)}><option>SAR</option><option>USD</option><option>EUR</option></select></label></div>
    <label>{text('عيار الذهب','Gold purity','Carat de l’or')}<div className="karat-switch">{[24,22,21,18].map(k=><button type="button" key={k} className={karat===k?'active':''} onClick={()=>setKarat(k)}>{k}K</button>)}</div></label>
    <div className="calc-unit-price"><span className="calc-unit-label">{text('آخر سعر محفوظ للجرام','Last saved price per gram','Dernier prix enregistré par gramme')}<small>{quote?new Date(quote.timestamp).toLocaleString(language==='ar'?'ar-SA':language==='fr'?'fr-FR':'en-US',{timeZone:'Asia/Riyadh'}):text('لا يوجد سعر محفوظ؛ يمكنك إدخال السعر يدويًا.','No saved quote; you can enter a price manually.','Aucun cours enregistré ; vous pouvez saisir un prix manuellement.')}</small></span><strong dir="ltr"><Money amount={quote?Number(quote.buyPrice):null} currency={currency}/></strong></div>
    <div className="calc-price-switch"><button type="button" className={!manualMode?'active':''} onClick={()=>setManualMode(false)}>{text('السعر المحفوظ','Saved price','Prix enregistré')}</button><button type="button" className={manualMode?'active':''} onClick={()=>setManualMode(true)}>{text('إدخال سعر آخر','Enter another price','Saisir un autre prix')}</button></div>
    {manualMode&&<label>{text('سعر الجرام المعتمد في الحساب','Price per gram used','Prix par gramme utilisé')}<input type="number" inputMode="decimal" min="0.01" step="0.01" value={manual} onChange={e=>setManual(e.target.value)}/></label>}
    <label>{text('الوزن (جرام)','Weight (grams)','Poids (grammes)')}<input type="number" inputMode="decimal" min="0" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)}/></label>
    <label>{text('المصنعية / جرام','Workmanship / gram','Fabrication / gramme')}<input type="number" inputMode="decimal" min="0" step="0.01" value={making} onChange={e=>setMaking(e.target.value)}/></label>
    <label>{text('الضريبة (%) — اختيارية','Tax (%) — optional','Taxe (%) — facultative')}<input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={rate} onChange={e=>setRate(e.target.value)}/><small>{text('تُحسب النسبة على قيمة الذهب وإجمالي المصنعية.','Applied to gold value plus total workmanship.','Appliquée à la valeur de l’or et au total de fabrication.')}</small></label>
   </section>
   <section className="approved-card calc-estimate-card"><div className="approved-card-title">{text('تفاصيل السعر المقدر','Estimate breakdown','Détail de l’estimation')}</div><dl className="calc-breakdown">
    {([[text('قيمة الذهب الخام','Gold value','Valeur de l’or'),result.raw],[text('إجمالي المصنعية','Total workmanship','Total de fabrication'),result.fees],[text('مبلغ الضريبة','Tax amount','Montant de la taxe'),result.tax],[text('الإجمالي النهائي التقديري','Estimated total','Total estimatif'),result.total]] as const).map(([label,value],i)=><div key={i} className={i===3?'final':''}><dt>{label}</dt><dd dir="ltr"><Money amount={value} currency={currency}/></dd></div>)}
   </dl></section>
   <p className="fine" dir="ltr">{APP_DISPLAY_VERSION}</p>
  </main>
 </div></div>;
}
