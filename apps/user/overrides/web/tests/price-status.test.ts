import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {priceFreshness,PRICE_STALE_AFTER_MS} from '../price-status';

const now=Date.parse('2026-10-08T12:00:00Z');
const row=(timestamp:string,buyPrice:string)=>({timestamp,buyPrice});
describe('User price update freshness',()=>{
 it('marks the saved backend price fresh within fifteen minutes',()=>{
  expect(priceFreshness(row('2026-10-08T11:55:00Z','500'),now)).toBe('fresh');
  expect(priceFreshness(row(new Date(now-PRICE_STALE_AFTER_MS).toISOString(),'500'),now)).toBe('fresh');
 });
 it('marks old saved prices as stale instead of live',()=>{
  expect(priceFreshness(row('2026-10-08T11:44:59Z','500'),now)).toBe('stale');
 });
 it('rejects missing, invalid, zero and future-dated spot quotes',()=>{
  expect(priceFreshness(null,now)).toBe('missing');
  expect(priceFreshness(row('not-a-date','500'),now)).toBe('missing');
  expect(priceFreshness(row('2026-10-08T11:59:00Z','0'),now)).toBe('missing');
  expect(priceFreshness(row('2026-10-08T12:06:00Z','500'),now)).toBe('missing');
 });
});

describe('User-only backend price refresh integration',()=>{
 const source=readFileSync(new URL('../UserWorkspace.tsx',import.meta.url).pathname,'utf8');
 it('polls the backend only every five minutes while the app is visible',()=>{
  expect(source).toContain("const marketTimer=setInterval(()=>{if(document.visibilityState==='visible')void loadMarket();},5*60000)");
  expect(source).toContain("api<PriceHistoryRow|null>('/prices/latest?currency='");
  expect(source).not.toContain('api.gold-api.com');
 });
 it('offers manual refresh without granting clients access to the admin refresh route',()=>{
  expect(source).toContain('aria-label="تحديث أسعار الذهب من خادم ذهبي"');
  expect(source).toContain('onClick={()=>void loadMarket()}');
  expect(source).not.toContain("api('/prices/refresh'");
 });
 it('does not erase a real cached price on a temporary request failure',()=>{
  expect(source).not.toContain('setAllMarketRows([])');
  expect(source).toContain('setMarketError(');
 });
});
