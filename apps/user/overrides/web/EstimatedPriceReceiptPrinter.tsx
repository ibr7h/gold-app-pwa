import React,{useEffect,useState} from 'react';
import './estimated-price-receipt-printer.css';

/**
 * Visual receipt feed for a calculated quote; NOT an actual payment receipt.
 * The calculator continues to own all numbers, VAT, copy, save and share.
 * All animation is local; no network call or third-party dependency.
 */
type ReceiptLanguage='ar'|'en'|'fr';
type Stage='waiting'|'processing'|'printing'|'complete';
type Copy={brand:string;machine:string;processing:string;printing:string;complete:string;waiting:string;title:string;subtitle:string;note:string;replay:string;karat:string;weight:string;grams:string;total:string};
const COPY:Record<ReceiptLanguage,Copy>={
 ar:{
  brand:'ذَهَبْك',machine:'حاسبة الذهب',processing:'جارٍ تجهيز التقدير',
  printing:'جارٍ إخراج تفاصيل السعر',complete:'اكتمل عرض التقدير',waiting:'بانتظار السعر',
  title:'تفاصيل السعر المقدر',subtitle:'ملخص الحساب',note:'تقدير استرشادي، وليس فاتورة ضريبية.',
  replay:'إعادة عرض الإيصال',karat:'العيار',weight:'الوزن',grams:'جرام',total:'الإجمالي التقديري'
 },
 en:{
  brand:'DHAHABK',machine:'Gold calculator',processing:'Preparing estimate',
  printing:'Feeding estimate details',complete:'Estimate ready',waiting:'Waiting for quote',
  title:'Estimated price details',subtitle:'Calculation summary',note:'Indicative estimate — not a tax invoice.',
  replay:'Replay receipt',karat:'Karat',weight:'Weight',grams:'g',total:'Estimated total'
 },
 fr:{
  brand:'DHAHABK',machine:'Calculateur d’or',processing:'Préparation du devis',
  printing:'Sortie du récapitulatif',complete:'Estimation prête',waiting:'En attente du prix',
  title:'Détails du prix estimé',subtitle:'Récapitulatif',note:'Estimation indicative — pas une facture fiscale.',
  replay:'Rejouer le reçu',karat:'Carats',weight:'Poids',grams:'g',total:'Total estimé'
 }
};
export default function EstimatedPriceReceiptPrinter({
 language,ready,karat,weight,total,children
}:{
 language:ReceiptLanguage;ready:boolean;karat:number;weight:number;
 total:React.ReactNode;children:React.ReactNode
}){
 const copy=COPY[language]||COPY.ar;
 const [replay,setReplay]=useState(0);
 const [stage,setStage]=useState<Stage>(ready?'processing':'waiting');
 useEffect(()=>{
  if(!ready){setStage('waiting');return;}
  if(typeof window==='undefined'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   setStage('complete');return;
  }
  setStage('processing');
  const feed=window.setTimeout(()=>setStage('printing'),180);
  const done=window.setTimeout(()=>setStage('complete'),1980);
  return ()=>{window.clearTimeout(feed);window.clearTimeout(done);};
 },[ready,replay]);
 const status=stage==='processing'?copy.processing:stage==='printing'?copy.printing:stage==='complete'?copy.complete:copy.waiting;
 return <div className="dh-estimate-printer" data-stage={stage} data-ready={ready?'true':'false'}>
  <div className="dh-estimate-printer-machine">
   <div className="dh-estimate-printer-machine-top">
    <span className="dh-estimate-printer-brand" dir="auto">{copy.brand}</span>
    <div className="dh-estimate-printer-head-actions">
     <span className="dh-estimate-printer-machine-label">{copy.machine}</span>
     {ready&&<button type="button" className="dh-estimate-printer-replay" title={copy.replay} aria-label={copy.replay} onClick={()=>setReplay(n=>n+1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v5h-5M4.9 9a7.8 7.8 0 0 1 13.7-2.2L20 12M4 17v-5h5m10.1 3a7.8 7.8 0 0 1-13.7 2.2L4 12"/></svg>
     </button>}
    </div>
   </div>
   <div className="dh-estimate-printer-screen">
    <div className="dh-estimate-printer-specs">
     <span>{copy.karat} <b dir="ltr">{karat}K</b></span>
     <span>{copy.weight} <b dir="ltr">{new Intl.NumberFormat(language==='fr'?'fr-FR':language==='en'?'en-US':'ar-SA',{maximumFractionDigits:2}).format(weight)} {copy.grams}</b></span>
    </div>
    <small className="dh-estimate-printer-total-label">{copy.total}</small>
    <strong className="dh-estimate-printer-total" dir="ltr">{total}</strong>
    <div className="dh-estimate-printer-status" role="status" aria-live="polite">
     <span className={'dh-estimate-printer-led '+(stage==='complete'?'is-complete':'')}/>
     <span>{status}</span>
    </div>
   </div>
  </div>
  {/* The exit lip is a sibling, not clipped inside the machine chassis:
      this lets the paper rise visibly over the lower housing and under the slot. */}
  <div className="dh-estimate-printer-slot" aria-hidden="true"/>
  <div className="dh-estimate-printer-output">
   <article className="dh-estimate-printer-paper">
    <header className="dh-estimate-printer-paper-head">
     <strong>{copy.title}</strong>
     <small>{copy.subtitle}</small>
    </header>
    {children}
    <footer className="dh-estimate-printer-paper-foot">{copy.note}</footer>
   </article>
  </div>
 </div>;
}
