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
