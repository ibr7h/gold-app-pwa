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
/** Official SAMA Saudi Riyal vector contours, independent of OS Unicode fonts.
 * Source: https://www.sama.gov.sa/ar-sa/Currency/Documents/Saudi_Riyal_Symbol-2.svg
 */
function SaudiRiyalGlyph(){
 return <svg className="dh-riyal-svg" xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 1124.14 1256.39" width="1em" height="1.12em"
  fill="currentColor" focusable="false" aria-hidden="true">
  <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
  <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
 </svg>;
}
/** UI-only currency mark. Keep ISO 4217 currency codes untouched in requests. */
export function CurrencyMark({currency}:{currency:string}){
 return currency==='SAR'
  ?<span className="dh-currency-symbol-svg" role="img" aria-label="ريال سعودي" title="ريال سعودي"><SaudiRiyalGlyph/></span>
  :<span>{currencySymbol(currency)}</span>;
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
  <span className={'dh-money-currency '+(currency==='SAR'?'dh-money-riyal':'')} aria-hidden="true" title={currency}>{currency==='SAR'?<SaudiRiyalGlyph/>:currencySymbol(currency)}</span>
 </span>;
}
