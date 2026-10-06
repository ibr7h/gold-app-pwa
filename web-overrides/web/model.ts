
export interface Portfolio{id:string;name:string;createdAt:string}
export interface Purchase{id:string;portfolioId:string;karat:number;weightGrams:string;unitPrice:string;totalPrice:string;currency:string;purchasedAt:string}
export interface PriceAlert{id:string;karat:number;currency:string;targetPrice:string;direction:'above'|'below';status:'active'|'paused'|'triggered';updatedAt:string}
export interface Feed{spotUsdPerOunce:number;updatedAt:string;source:string}
export const KARATS=[24,22,21,18,14],CURRENCIES=['SAR','USD','EUR','GBP','AED','KWD','EGP','INR','TRY','JPY'];
export function validFeed(v:any):Feed{if(!v||!Number.isFinite(Number(v.spotUsdPerOunce))||Number(v.spotUsdPerOunce)<=0||!Number.isFinite(Date.parse(v.updatedAt)))throw new Error('Invalid feed');return{spotUsdPerOunce:Number(v.spotUsdPerOunce),updatedAt:v.updatedAt,source:String(v.source||'api.gold-api.com')};}
export function indicativePrice(feed:Feed|null,currency:string,karat:number){return !feed||!['SAR','USD'].includes(currency)?null:feed.spotUsdPerOunce/31.1034768*karat/24*(currency==='SAR'?3.75:1);}
export function totals(buys:Purchase[],feed:Feed|null){
 const rows=new Map<string,{currency:string;weight:number;cost:number;value:number|null}>();
 for(const b of buys){const r=rows.get(b.currency)||{currency:b.currency,weight:0,cost:0,value:0};r.weight+=Number(b.weightGrams);r.cost+=Number(b.totalPrice);const unit=indicativePrice(feed,b.currency,b.karat);r.value=unit===null||r.value===null?null:r.value+Number(b.weightGrams)*unit;rows.set(b.currency,r);}return Array.from(rows.values());
}
export function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
export function purchasePayload(data:FormData){
 const portfolioId=String(data.get('portfolioId')||''),karat=Number(data.get('karat')),weightGrams=Number(data.get('weightGrams')),unitPrice=Number(data.get('unitPrice')),currency=String(data.get('currency')),date=String(data.get('purchasedAt'));
 if(!portfolioId||(!Number.isInteger(karat)||karat<1||karat>24)||!/^[A-Z]{3}$/.test(currency)||!Number.isFinite(weightGrams)||weightGrams<=0||!Number.isFinite(unitPrice)||unitPrice<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>localDate())throw new Error('تحقق من المحفظة والعيار والوزن والسعر والتاريخ.');
 const totalPrice=Number((weightGrams*unitPrice).toFixed(4));if(totalPrice<=0||totalPrice>=100000000||weightGrams>=100000000||unitPrice>=100000000)throw new Error('القيم خارج النطاق المسموح.');
 return{portfolioId,karat,weightGrams,unitPrice,totalPrice,currency,purchasedAt:new Date(date+'T12:00:00Z').toISOString()};
}
