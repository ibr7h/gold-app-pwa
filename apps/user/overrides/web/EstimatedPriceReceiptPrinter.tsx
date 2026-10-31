import React from 'react';
import './estimated-price-receipt-printer.css';

/**
 * A presentational receipt feed for the live calculator estimate.
 * No payment, printing job, persistence, or third-party request is performed.
 * Children always contain the calculator's existing, authoritative values.
 */
type ReceiptLanguage='ar'|'en'|'fr';
type ReceiptCopy={
 brand:string;machine:string;ready:string;pending:string;
 title:string;subtitle:string;note:string;
};
const COPY:Record<ReceiptLanguage,ReceiptCopy>={
 ar:{
  brand:'ذَهَبْك',machine:'حاسبة الذهب',ready:'تفاصيل التقدير جاهزة',
  pending:'بانتظار بيانات السعر',title:'ملخص السعر المقدر',
  subtitle:'تقدير محسوب حسب المدخلات',note:'تقدير استرشادي، وليس فاتورة ضريبية.'
 },
 en:{
  brand:'DHAHABK',machine:'Gold calculator',ready:'Estimate ready',
  pending:'Waiting for price data',title:'Estimated price summary',
  subtitle:'Calculated from your inputs',note:'Indicative estimate, not a tax invoice.'
 },
 fr:{
  brand:'DHAHABK',machine:'Calculateur d’or',ready:'Estimation prête',
  pending:'En attente du prix',title:'Récapitulatif du prix estimé',
  subtitle:'Calculé selon vos données',note:'Estimation indicative, non fiscale.'
 }
};

export default function EstimatedPriceReceiptPrinter({
 language,ready,children
}:{
 language:ReceiptLanguage;ready:boolean;children:React.ReactNode
}){
 const copy=COPY[language]||COPY.ar;
 return <div className="dh-estimate-printer" data-ready={ready?'true':'false'}>
  <div className="dh-estimate-printer-machine" aria-hidden="true">
   <div className="dh-estimate-printer-machine-top">
    <span className="dh-estimate-printer-brand" dir="auto">{copy.brand}</span>
    <span className="dh-estimate-printer-machine-label">{copy.machine}</span>
   </div>
   <div className="dh-estimate-printer-display">
    <span className="dh-estimate-printer-led"/>
    <span>{ready?copy.ready:copy.pending}</span>
    <span className="dh-estimate-printer-display-mark">◆</span>
   </div>
   <div className="dh-estimate-printer-slot"/>
  </div>
  <div className="dh-estimate-printer-output">
   <div className="dh-estimate-printer-paper">
    <header className="dh-estimate-printer-paper-head">
     <strong>{copy.title}</strong>
     <small>{copy.subtitle}</small>
    </header>
    {children}
    <footer className="dh-estimate-printer-paper-foot">{copy.note}</footer>
   </div>
  </div>
 </div>;
}
