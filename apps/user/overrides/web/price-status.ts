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
