/** Retail estimate: VAT applies to the metal value plus total workmanship.
 * Keep all intermediate precision; currency formatting belongs to the view.
 */
export function calculatorQuote(unitPrice:number|null,weight:number,makingPerGram:number,includeVat:boolean){
 if(![weight,makingPerGram].every(n=>Number.isFinite(n)&&n>=0))return {raw:null,fees:null,tax:null,total:null};
 const fees=weight*makingPerGram;
 if(unitPrice===null||!Number.isFinite(unitPrice)||unitPrice<=0)return {raw:null,fees,tax:includeVat?null:0,total:null};
 const raw=weight*unitPrice;
 const tax=includeVat?(raw+fees)*.15:0;
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
