import type {MarketPrice} from './model';

// Backend remains the sole authoritative source for prices, portfolio and alerts.
// A stale spot price is real historical data, not a live dealer quotation.
export type PriceFreshness='fresh'|'stale'|'missing';
export const PRICE_STALE_AFTER_MS=15*60*1000;
export function priceFreshness(row:Pick<MarketPrice,'buyPrice'|'timestamp'>|null|undefined,now:number):PriceFreshness{
 const price=Number(row?.buyPrice),sourceTime=Date.parse(row?.timestamp||'');
 if(!row||!Number.isFinite(price)||price<=0||!Number.isFinite(sourceTime)||sourceTime>now+5*60*1000)return 'missing';
 return now-sourceTime>PRICE_STALE_AFTER_MS?'stale':'fresh';
}


/** Scheduled global gold trading hours in New York time (DST-aware).
 * Fri 17:00–Sun 18:00 and Mon–Thu 17:00–18:00 are typically closed.
 * This schedule is indicative and does not incorporate exchange holidays.
 */
export function isGlobalGoldMarketOpen(at:number):boolean{
 if(!Number.isFinite(at))return false;
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).formatToParts(new Date(at));
 const get=(type:string)=>parts.find(p=>p.type===type)?.value;
 const day=get('weekday'),hour=Number(get('hour'));
 if(!Number.isInteger(hour))return false;
 if(day==='Sat')return false;
 if(day==='Sun')return hour>=18;
 if(day==='Fri')return hour<17;
 if(['Mon','Tue','Wed','Thu'].includes(day||''))return hour!==17;
 return false;
}
