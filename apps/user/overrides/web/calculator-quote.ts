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
