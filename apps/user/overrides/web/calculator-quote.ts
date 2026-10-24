/** Retail estimate: VAT applies to the metal value plus total workmanship.
 * Keep all intermediate precision; currency formatting belongs to the view.
 */
export function calculatorQuote(unitPrice:number|null,weight:number,makingPerGram:number,includeVat:boolean){
 return calculatorQuoteWithTaxRate(unitPrice,weight,makingPerGram,includeVat?15:0);
}

/** Optional user-entered percentage. This is an estimate, not a tax-eligibility ruling. */
export function calculatorQuoteWithTaxRate(unitPrice:number|null,weight:number,makingPerGram:number,taxRate:number){
 if(!Number.isFinite(taxRate)||taxRate<0||taxRate>100)return {raw:null,fees:null,tax:null,total:null};
 if(![weight,makingPerGram].every(n=>Number.isFinite(n)&&n>=0))return {raw:null,fees:null,tax:null,total:null};
 const fees=weight*makingPerGram;
 if(unitPrice===null||!Number.isFinite(unitPrice)||unitPrice<=0)return {raw:null,fees,tax:taxRate?null:0,total:null};
 const raw=weight*unitPrice;
 const tax=(raw+fees)*taxRate/100;
 const total=raw+fees+tax;
 if(![raw,fees,tax,total].every(Number.isFinite))return {raw:null,fees:null,tax:null,total:null};
 return {raw,fees,tax,total};
}


/** Manual tax (a currency amount, not an assumed VAT percentage). Used by the new User UI. */
export function calculatorQuoteWithTaxAmount(unitPrice:number|null,weight:number,makingPerGram:number,taxAmount:number) {
 if(![weight,makingPerGram,taxAmount].every(n=>Number.isFinite(n)&&n>=0))
  return {raw:null,fees:null,tax:null,total:null};
 const fees=weight*makingPerGram;
 if(unitPrice===null||!Number.isFinite(unitPrice)||unitPrice<=0)
  return {raw:null,fees,tax:taxAmount,total:null};
 const raw=weight*unitPrice;
 const total=raw+fees+taxAmount;
 if(![raw,fees,total].every(Number.isFinite))return {raw:null,fees:null,tax:null,total:null};
 return {raw,fees,tax:taxAmount,total};
}
