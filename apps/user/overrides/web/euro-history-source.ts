/** Read-only history fallback. Never write converted values back as provider quotes. */
export interface HistoricalCurrencyRow{
 id:string;currency:string;karat:number;buyPrice:string;sellPrice?:string;
 source?:string;kind?:'spot'|'daily-average';timestamp?:string;day?:string;
}
export function historicalQuoteDay(row:{timestamp?:string;day?:string}):string|null{
 if(row.day!==undefined){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.day))return null;
  const at=Date.parse(row.day+'T00:00:00Z');
  return Number.isFinite(at)&&new Date(at).toISOString().slice(0,10)===row.day?row.day:null;
 }
 if(typeof row.timestamp!=='string'||row.timestamp.length>64||
  !/(?:Z|[+-]\d{2}(?::?\d{2})?)$/.test(row.timestamp))return null;
 const datePart=row.timestamp.slice(0,10),midnight=Date.parse(datePart+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(datePart)||!Number.isFinite(midnight)||
  new Date(midnight).toISOString().slice(0,10)!==datePart)return null;
 const at=Date.parse(row.timestamp);
 return Number.isFinite(at)?new Date(at).toISOString().slice(0,10):null;
}
const validPrice=(value:unknown)=>typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value)&&
 Number.isFinite(Number(value))&&Number(value)>0;
function validRow(row:HistoricalCurrencyRow,currency:'USD'|'SAR'):boolean{
 return !!row&&typeof row==='object'&&row.currency===currency&&[18,21,22,24].includes(row.karat)&&
  typeof row.id==='string'&&!!row.id&&validPrice(row.buyPrice)&&
  (row.sellPrice===undefined||validPrice(row.sellPrice))&&!!historicalQuoteDay(row)&&
  (row.kind==='daily-average'?row.day!==undefined&&row.timestamp===undefined:
   (row.kind===undefined||row.kind==='spot')&&row.timestamp!==undefined&&row.day===undefined);
}
/** Prefer USD for each observed UTC day and karat; SAR fills only missing days.
 * Do not interleave independently sampled quotes or double-count a daily average
 * and a spot observation. Preserve original timestamps, aggregation, IDs and prices.
 */
export function mergeEuroHistorySources<T extends HistoricalCurrencyRow>(usd:T[],sar:T[]):T[]{
 const primary=usd.filter(row=>validRow(row,'USD'));
 const covered=new Set(primary.map(row=>row.karat+':'+historicalQuoteDay(row)));
 return [...primary,...sar.filter(row=>validRow(row,'SAR')&&
  !covered.has(row.karat+':'+historicalQuoteDay(row)))];
}
export async function loadEuroHistorySources<T extends HistoricalCurrencyRow>(
 request:(currency:'USD'|'SAR')=>Promise<T[]>):Promise<T[]>{
 const settled=await Promise.allSettled(['USD','SAR'].map(async currency=>{
  const rows=await request(currency as 'USD'|'SAR');
  if(!Array.isArray(rows)||rows.length>800)throw new Error('invalid_eur_history_source');
  return rows;
 }));
 if(settled.every(result=>result.status==='rejected'))throw new Error('unavailable_eur_history_source');
 return mergeEuroHistorySources(
  settled[0].status==='fulfilled'?settled[0].value:[],
  settled[1].status==='fulfilled'?settled[1].value:[]);
}
