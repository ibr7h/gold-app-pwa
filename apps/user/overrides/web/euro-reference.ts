import type {MarketPrice} from './model';

/** ECB-aligned daily *reference* FX observations, used only for display.
 * Frankfurter supplies dates and USD→EUR rates. No guessed or static rate.
 */
export interface EuroReferenceRates{
 latestDate:string;
 eurPerUsd:number;
 byDay:Record<string,number>;
 fetchedAt:number;
}
const FX_URL='https://api.frankfurter.dev/v1/';
const DAY_MS=86400000;
const MS_4H=4*3600000;
let cache:EuroReferenceRates|null=null;
let flight:Promise<EuroReferenceRates>|null=null;
const STORAGE='dhahabk:public-eur-reference-v1';

function validDay(value:unknown):value is string{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const t=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value;
}
const isoDate=(ms:number)=>new Date(ms).toISOString().slice(0,10);
function validRate(value:unknown):value is number{
 return typeof value==='number'&&Number.isFinite(value)&&value>.3&&value<1.5;
}
export function parseEuroReferenceRates(response:unknown, now=Date.now()):EuroReferenceRates{
 if(!response||typeof response!=='object')throw new Error('invalid_eur_fx');
 const data=response as {base?:unknown;start_date?:unknown;end_date?:unknown;rates?:unknown};
 if(data.base!==undefined&&data.base!=='USD')throw new Error('invalid_eur_fx_base');
 if(!data.rates||typeof data.rates!=='object'||Array.isArray(data.rates))throw new Error('missing_eur_fx');
 const byDay:Record<string,number>={};
 for(const [day,values]of Object.entries(data.rates as Record<string,unknown>)){
  if(!validDay(day)||Date.parse(day+'T00:00:00Z')>now||!values||typeof values!=='object')continue;
  const rate=(values as {EUR?:unknown}).EUR;
  if(validRate(rate))byDay[day]=rate;
 }
 const days=Object.keys(byDay).sort();
 const latestDate=days[days.length-1];
 if(!latestDate)throw new Error('missing_eur_fx');
 // A reference exchange quote older than six calendar days is too stale.
 if(now-Date.parse(latestDate+'T00:00:00Z')>6*DAY_MS)throw new Error('stale_eur_fx');
 return {latestDate,eurPerUsd:byDay[latestDate],byDay,fetchedAt:now};
}
export async function loadEuroReferenceRates(now=Date.now(),request:typeof fetch=fetch):Promise<EuroReferenceRates>{
 if(!cache){
  try{
   const raw=typeof window!=='undefined'?window.localStorage.getItem(STORAGE):null;
   if(raw&&raw.length<=64000){
    const stored=JSON.parse(raw),parsed=parseEuroReferenceRates(stored,now);
    if(typeof stored.fetchedAt==='number'&&stored.fetchedAt>0&&stored.fetchedAt<=now)
     cache={...parsed,fetchedAt:stored.fetchedAt};
   }
  }catch{/* A corrupted/blocked public FX cache cannot authorize a made-up rate. */}
 }
 if(cache&&now>=cache.fetchedAt&&now-cache.fetchedAt<MS_4H&&now-Date.parse(cache.latestDate+'T00:00:00Z')<=6*DAY_MS)return cache;
 if(flight)return flight;
 const start=isoDate(now-372*DAY_MS);
 const end=isoDate(now);
 const url=FX_URL+start+'..'+end+'?base=USD&symbols=EUR';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 const work=(async()=>{
  try{
   const res=await request(url,{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
   if(!res.ok)throw new Error('eur_fx_http_'+res.status);
   const payload:unknown=await res.json();
   const result=parseEuroReferenceRates(payload,now);
   cache=result;
   try{
    const rates=Object.fromEntries(Object.entries(result.byDay).map(([day,EUR])=>[day,{EUR}]));
    if(typeof window!=='undefined')window.localStorage.setItem(STORAGE,JSON.stringify({rates,fetchedAt:now}));
   }catch{/* Public cache persistence is optional. */}
   return result;
  }catch(error){
   // Daily reference observations remain explicitly dated; never invent a rate.
   if(cache&&now-Date.parse(cache.latestDate+'T00:00:00Z')<=6*DAY_MS)return cache;
   throw error;
  }finally{clearTimeout(timer);}
 })();
 flight=work;
 try{return await work;}finally{if(flight===work)flight=null;}
}
export function euroRateOnDate(rates:EuroReferenceRates,date:string):number|null{
 if(!validDay(date))return null;
 // An ECB working-day observation covers weekends/holidays until the next one.
 const closest=Object.keys(rates.byDay).filter(d=>d<=date).sort().at(-1);
 if(!closest)return null;
 if(Date.parse(date+'T00:00:00Z')-Date.parse(closest+'T00:00:00Z')>5*DAY_MS)return null;
 return rates.byDay[closest];
}
export function eurFromUsd(value:number,rate:number|null):number|null{
 return rate!==null&&validRate(rate)&&Number.isFinite(value)&&value>=0?value*rate:null;
}
/** Generate read-only reference EUR gold snapshots. Never persist them as quotes. */
export function euroMarketRows(usdPrices:MarketPrice[],rates:EuroReferenceRates):MarketPrice[]{
 return usdPrices.filter(p=>p.currency==='USD').flatMap(p=>{
  const date=p.timestamp.slice(0,10);
  const fx=euroRateOnDate(rates,date);
  const buy=eurFromUsd(Number(p.buyPrice),fx),sell=eurFromUsd(Number(p.sellPrice),fx);
  if(buy===null||sell===null||buy<=0||sell<=0)return [];
  return [{...p,currency:'EUR',source:(p.source||'gold')+'+ECB-reference-FX',
   buyPrice:buy.toFixed(6),sellPrice:sell.toFixed(6)}];
 });
}
export function euroHistoryRows<T extends {currency:string;buyPrice:string;sellPrice?:string;timestamp?:string;day?:string}>(
 rows:T[],rates:EuroReferenceRates):T[]{
 return rows.flatMap(row=>{
  if(row.currency!=='USD')return [];
  const date=row.day||row.timestamp?.slice(0,10)||'';
  const rate=euroRateOnDate(rates,date);
  const buy=eurFromUsd(Number(row.buyPrice),rate);
  if(buy===null||buy<=0)return [];
  return [{...row,currency:'EUR',buyPrice:buy.toFixed(6),
    ...(row.sellPrice===undefined?{}:{
     sellPrice:eurFromUsd(Number(row.sellPrice),rate)?.toFixed(6)
    })} as T];
 });
}
