import React from 'react';

/** User presentation only: never round values before sending them to the server. */
const decimalFormatter=new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2});
const symbols:Record<string,string>={
 SAR:'\u20C1',USD:'$',EUR:'€',GBP:'£',AED:'د.إ',KWD:'د.ك',
 EGP:'ج.م',INR:'₹',TRY:'₺',JPY:'¥'
};
export function currencySymbol(currency:string):string{
 return symbols[currency]||currency;
}
export function formatTwo(value:number):string{
 return Number.isFinite(value)?decimalFormatter.format(value):'غير متاح';
}
export function formattedMoney(value:number|null|undefined,currency:string):string{
 if(value==null||!Number.isFinite(value))return 'غير متاح';
 return formatTwo(value)+' '+currencySymbol(currency);
}
/** The decimal part gets a subtle, harmonious accent; native currency glyphs stay visible. */
export function Money({amount,currency}:{amount:number|null|undefined;currency:string}){
 if(amount==null||!Number.isFinite(amount))return <>غير متاح</>;
 const parts=decimalFormatter.formatToParts(amount);
 const integer=parts.filter(p=>p.type!=='decimal'&&p.type!=='fraction').map(p=>p.value).join('');
 const decimal=parts.find(p=>p.type==='decimal')?.value||'٫';
 const fraction=parts.find(p=>p.type==='fraction')?.value||'٠٠';
 return <span className="dh-money" dir="ltr" aria-label={formattedMoney(amount,currency)}>
  <span className="dh-money-whole" aria-hidden="true">{integer}</span><span className="dh-money-fraction" aria-hidden="true">{decimal}{fraction}</span>
  <span className={'dh-money-currency '+(currency==='SAR'?'dh-money-riyal':'')} aria-hidden="true" title={currency}>{currencySymbol(currency)}</span>
 </span>;
}
