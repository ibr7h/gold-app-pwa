export interface Portfolio{id:string;name:string;createdAt:string}
export interface InvoiceDetails {
 pricingMode?:'inclusive'|'itemized';
 goldUnitPrice?:number; makingCharge?:number;stonePrice?:number;vatRate?:number;vatAmount?:number;
 grossWeightGrams?:number;stoneWeightGrams?:number;
 itemCondition?:'new'|'used';itemDescription?:string;hallmark?:string;manufacturerMark?:string;
 invoiceNumber?:string;sellerName?:string;sellerAddress?:string;buyerName?:string;sellerCommercialRegistration?:string;sellerPhone?:string;
 stoneName?:string;stoneKind?:string;stoneColor?:string;stoneShape?:string;stoneQuality?:string;stoneCut?:string;
 stoneDefects?:string;stoneSafety?:string;
}
export interface Purchase{id:string;portfolioId:string;karat:number;weightGrams:string;unitPrice:string;totalPrice:string;currency:string;purchasedAt:string;invoiceDetails?:InvoiceDetails|null}
export interface PriceAlert{id:string;karat:number;currency:string;targetPrice:string;direction:'above'|'below';status:'active'|'paused'|'triggered';updatedAt:string}
export interface MarketPrice{id?:string;source?:string;currency:string;karat:number;buyPrice:string|number;sellPrice:string|number;timestamp:string;createdAt?:string}
export const KARATS=[24,22,21,18,14],CURRENCIES=['SAR','USD','EUR','GBP','AED','KWD','EGP','INR','TRY','JPY'];

export function marketUnitPrice(prices:MarketPrice[],currency:string,karat:number){
 const row=prices.find(p=>p.currency===currency&&p.karat===karat);
 const value=row===undefined?NaN:Number(row.buyPrice);
 return Number.isFinite(value)&&value>0?value:null;
}

export function totals(buys:Purchase[],prices:MarketPrice[]){
 const rows=new Map<string,{currency:string;weight:number;cost:number;value:number|null}>();
 for(const b of buys){
  const r=rows.get(b.currency)||{currency:b.currency,weight:0,cost:0,value:0};
  r.weight+=Number(b.weightGrams);
  r.cost+=Number(b.totalPrice);
  const unit=marketUnitPrice(prices,b.currency,b.karat);
  r.value=unit===null||r.value===null?null:r.value+Number(b.weightGrams)*unit;
  rows.set(b.currency,r);
 }
 return Array.from(rows.values());
}

/** Estimated position for one purchase, in its own currency and karat only.
 * No invented conversions or zero-valued market prices; exclude fees and resale spread. */
export function purchasePerformance(purchase:Purchase,prices:MarketPrice[]){
 const cost=Number(purchase.totalPrice);
 const weight=Number(purchase.weightGrams);
 const validCost=Number.isFinite(cost)&&cost>0;
 const unit=marketUnitPrice(prices,purchase.currency,purchase.karat);
 if(!validCost||!Number.isFinite(weight)||weight<=0||unit===null){
  return {cost:validCost?cost:null,value:null,difference:null};
 }
 const value=weight*unit;
 if(!Number.isFinite(value))return {cost,value:null,difference:null};
 return {cost,value,difference:value-cost};
}

export function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
export type PriceEntryMode='legacy'|'inclusive'|'itemized';
const round4=(value:number)=>Number(value.toFixed(4));
function numericField(data:FormData,key:string,{positive=false,required=false}:{positive?:boolean;required?:boolean}={}):number{
 const raw=String(data.get(key)??'').trim();
 if(!raw){if(required)throw new Error('يرجى إدخال '+key+'.');return 0;}
 const n=Number(raw);
 if(!Number.isFinite(n)||n<0||(positive&&n===0)||n>=100000000)throw new Error('تأكد من قيمة '+key+'.');
 return n;
}
export function purchaseQuote(input:{mode:'inclusive'|'itemized';weight:number;invoiceTotal?:number;goldUnitPrice?:number;makingCharge?:number;stonePrice?:number;vatRate?:number;vatAmount?:number;manualVat?:boolean}){
 const {mode,weight}=input;
 if(!Number.isFinite(weight)||weight<=0)return null;
 if(mode==='inclusive'){
  const gross=input.invoiceTotal??0;
  if(!Number.isFinite(gross)||gross<=0)return null;
  return {metalSubtotal:null,fees:null,vat:null,total:round4(gross),effectiveUnitPrice:round4(gross/weight)};
 }
 const unit=input.goldUnitPrice??0,making=input.makingCharge??0,stones=input.stonePrice??0,rate=input.vatRate??0;
 if(![unit,making,stones,rate].every(x=>Number.isFinite(x)&&x>=0)||unit<=0||rate>100)return null;
 const metalSubtotal=round4(weight*unit),fees=round4(making+stones);
 const tax=round4(input.manualVat?(input.vatAmount??0):(metalSubtotal+fees)*rate/100);
 if(!Number.isFinite(tax)||tax<0)return null;
 const total=round4(metalSubtotal+fees+tax);
 if(total<=0||total>=100000000)return null;
 return {metalSubtotal,fees,vat:tax,total,effectiveUnitPrice:round4(total/weight)};
}
export function purchasePayload(data:FormData){
 const portfolioId=String(data.get('portfolioId')||''),karat=Number(data.get('karat')),weightGrams=Number(data.get('weightGrams')),currency=String(data.get('currency')),date=String(data.get('purchasedAt'));
 if(!portfolioId||!Number.isInteger(karat)||karat<1||karat>24||!/^[A-Z]{3}$/.test(currency)||
 !Number.isFinite(weightGrams)||weightGrams<=0||weightGrams>=100000000||
 !/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||
 new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>localDate())
  throw new Error('تحقق من المحفظة والعيار ووزن الذهب الصافي والتاريخ والعملة.');
 const mode=String(data.get('pricingMode')||'legacy') as PriceEntryMode;
 if(!['legacy','inclusive','itemized'].includes(mode))throw new Error('طريقة حساب السعر غير معروفة.');
 let unitPrice:number,totalPrice:number,invoiceDetails:InvoiceDetails|undefined;
 if(mode==='legacy'){
  unitPrice=numericField(data,'unitPrice',{positive:true,required:true});
  totalPrice=round4(weightGrams*unitPrice);
 }else{
  const note=<T extends keyof InvoiceDetails>(key:T,max=150)=>String(data.get(key)||'').trim().slice(0,max);
  const meta:InvoiceDetails={pricingMode:mode};
  const fields:({key:keyof InvoiceDetails;max:number})[]=[
   {key:'itemDescription',max:500},{key:'hallmark',max:120},{key:'manufacturerMark',max:120},
   {key:'invoiceNumber',max:120},{key:'sellerName',max:150},{key:'sellerAddress',max:250},{key:'buyerName',max:120},{key:'sellerCommercialRegistration',max:60},
   {key:'sellerPhone',max:40},{key:'stoneName',max:120},{key:'stoneKind',max:100},{key:'stoneColor',max:100},{key:'stoneShape',max:100},
   {key:'stoneQuality',max:150},{key:'stoneCut',max:100},{key:'stoneDefects',max:300},{key:'stoneSafety',max:300}
  ];
  for(const field of fields){const value=note(field.key,field.max);if(value)(meta as Record<string,unknown>)[field.key]=value;}
  const condition=String(data.get('itemCondition')||'');
  if(condition==='new'||condition==='used')meta.itemCondition=condition;
  const grossWeight=String(data.get('grossWeightGrams')||'').trim();
  const stoneWeight=String(data.get('stoneWeightGrams')||'').trim();
  if(grossWeight)meta.grossWeightGrams=numericField(data,'grossWeightGrams',{positive:true});
  if(stoneWeight)meta.stoneWeightGrams=numericField(data,'stoneWeightGrams');
  if(meta.grossWeightGrams!==undefined&&meta.grossWeightGrams<weightGrams)
   throw new Error('الوزن الإجمالي لا يمكن أن يقل عن الوزن الصافي للذهب.');
  if(meta.stoneWeightGrams!==undefined&&meta.grossWeightGrams!==undefined&&meta.stoneWeightGrams>meta.grossWeightGrams)
   throw new Error('وزن الأحجار لا يمكن أن يزيد على الوزن الإجمالي.');
  if(mode==='inclusive'){
   totalPrice=numericField(data,'invoiceTotal',{positive:true,required:true});
   unitPrice=totalPrice/weightGrams;
  }else{
   const goldUnitPrice=numericField(data,'goldUnitPrice',{positive:true,required:true});
   const makingCharge=numericField(data,'makingCharge');
   const stonePrice=numericField(data,'stonePrice');
   const rate=numericField(data,'vatRate');
   if(rate>100)throw new Error('نسبة الضريبة يجب ألا تتجاوز 100%.');
   const manualVat=String(data.get('vatMode'))==='manual';
   const vatAmount=manualVat?numericField(data,'vatAmount'):undefined;
   const quote=purchaseQuote({mode:'itemized',weight:weightGrams,goldUnitPrice,makingCharge,stonePrice,vatRate:rate,vatAmount,manualVat});
   if(!quote)throw new Error('تأكد من تفاصيل السعر والضريبة.');
   totalPrice=quote.total;
   unitPrice=totalPrice/weightGrams;
   Object.assign(meta,{goldUnitPrice,makingCharge,stonePrice,vatRate:manualVat?0:rate,vatAmount:quote.vat});
  }
  invoiceDetails=meta;
 }
 if(!Number.isFinite(unitPrice)||unitPrice<=0||unitPrice>=100000000||totalPrice<=0||totalPrice>=100000000)
  throw new Error('القيم خارج النطاق المسموح.');
 return {portfolioId,karat,weightGrams,unitPrice,totalPrice,currency,
  purchasedAt:new Date(date+'T12:00:00Z').toISOString(),...(invoiceDetails?{invoiceDetails}:{})};
}
