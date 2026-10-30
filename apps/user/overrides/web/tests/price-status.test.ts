import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {describe,it,expect} from 'vitest';
import {priceFreshness,PRICE_STALE_AFTER_MS,isGlobalGoldMarketOpen} from '../price-status';

const now=Date.parse('2026-10-08T12:00:00Z');
const row=(timestamp:string,buyPrice:string)=>({timestamp,buyPrice});
describe('User price update freshness',()=>{
 it('marks a verified global spot quote fresh for 90 seconds',()=>{
  expect(priceFreshness(row('2026-10-08T11:59:00Z','500'),now)).toBe('fresh');
  expect(priceFreshness(row(new Date(now-PRICE_STALE_AFTER_MS).toISOString(),'500'),now)).toBe('fresh');
 });
 it('marks old saved prices as stale instead of live',()=>{
  expect(priceFreshness(row('2026-10-08T11:58:29Z','500'),now)).toBe('stale');
 });
 it('rejects missing, invalid, zero and future-dated spot quotes',()=>{
  expect(priceFreshness(null,now)).toBe('missing');
  expect(priceFreshness(row('not-a-date','500'),now)).toBe('missing');
  expect(priceFreshness(row('2026-10-08T11:59:00Z','0'),now)).toBe('missing');
  expect(priceFreshness(row('2026-10-08T12:06:00Z','500'),now)).toBe('missing');
 });
});

describe('User-only backend price refresh integration',()=>{
 const source=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url)),'utf8');
 it('polls the single spot endpoint every 30 seconds while open without reloading history',()=>{
  expect(source).toContain("const marketTimer=setInterval(()=>{");
  expect(source).toContain("if(document.visibilityState==='visible'&&isGlobalGoldMarketOpen(Date.now()))void loadLiveQuotes();");
  expect(source).toContain("api<PriceHistoryRow[]>('/prices/snapshot')");
  expect(source).toContain("api<PriceHistoryRow|null>('/prices/latest?currency='");
  expect(source).toContain("void loadLiveQuotes();");
  expect(source.indexOf('setAllMarketRows(publicRows)')).toBeLessThan(source.indexOf('setHistory(priceCurrency'));
  expect(source).not.toContain('api.gold-api.com');
 });
 it('offers manual refresh without granting clients access to the admin refresh route',()=>{
  expect(source).toContain('aria-label="تحديث أسعار الذهب من خادم ذهبك"');
  expect(source).toContain('onClick={()=>void loadMarket()}');
  expect(source).toContain('disabled={marketLoading}');
  expect(source).not.toContain("api('/prices/refresh'");
 });
 it('does not erase a real cached price on a temporary request failure',()=>{
  expect(source).not.toContain('setAllMarketRows([])');
  expect(source).toContain('setMarketError(');
  expect(source).toContain('readPublicMarketSnapshot()?.rows||[]');
 });
 it('does not invent a retail buy/sell spread from one global spot price',()=>{
  expect(source).toContain("tr('شراء التاجر:')");
  expect(source).toContain("tr('بيع التاجر:')");
  expect(source).toContain("tr('غير متاح')");
  expect(source).not.toContain('Number(homeMarket.sellPrice)');
 });
});


describe('New York scheduled gold-market hours (DST aware)',()=>{
 const open=(iso:string)=>isGlobalGoldMarketOpen(Date.parse(iso));
 it('closes the weekend including Sunday 02:27 Saudi time',()=>{
  expect(open('2026-10-10T23:27:00Z')).toBe(false);
  expect(open('2026-10-11T20:59:00Z')).toBe(false);
  expect(open('2026-10-11T22:01:00Z')).toBe(true);
 });
 it('closes Friday 17:00 New York across DST',()=>{
  expect(open('2026-10-09T20:59:00Z')).toBe(true);
  expect(open('2026-10-09T21:00:00Z')).toBe(false);
  expect(open('2026-11-06T21:59:00Z')).toBe(true);
  expect(open('2026-11-06T22:00:00Z')).toBe(false);
 });
 it('respects the weekday 17:00-18:00 ET market pause',()=>{
  expect(open('2026-10-12T20:59:00Z')).toBe(true);
  expect(open('2026-10-12T21:00:00Z')).toBe(false);
  expect(open('2026-10-12T22:00:00Z')).toBe(true);
  expect(open('2026-11-02T22:30:00Z')).toBe(false);
  expect(open('2026-11-02T23:00:00Z')).toBe(true);
 });
});
