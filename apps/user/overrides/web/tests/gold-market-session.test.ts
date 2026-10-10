import {describe,expect,it} from 'vitest';
import {goldSpotSession,latestQuoteLabel,marketQuoteTime,marketStatusText} from '../gold-market-session';
const instant=(str:string)=>Date.parse(str);

describe('Gold XAU/USD schedule (New York DST)',()=>{
 it('closes all Saturday and before Sunday 18 ET',()=>{
  expect(goldSpotSession(instant('2026-10-10T12:00:00Z'))).toBe('closed');
  expect(goldSpotSession(instant('2026-10-11T21:59:00Z'))).toBe('closed');
  expect(goldSpotSession(instant('2026-10-11T22:00:00Z'))).toBe('open');
 });
 it('closes Friday 17 ET and the weekday daily pause',()=>{
  expect(goldSpotSession(instant('2026-10-09T20:59:00Z'))).toBe('open');
  expect(goldSpotSession(instant('2026-10-09T21:00:00Z'))).toBe('closed');
  expect(goldSpotSession(instant('2026-10-08T20:59:00Z'))).toBe('open');
  expect(goldSpotSession(instant('2026-10-08T21:00:00Z'))).toBe('closed');
  expect(goldSpotSession(instant('2026-10-08T22:00:00Z'))).toBe('open');
 });
 it('adjusts to Eastern Standard Time in November automatically',()=>{
  expect(goldSpotSession(instant('2026-11-08T22:59:00Z'))).toBe('closed');
  expect(goldSpotSession(instant('2026-11-08T23:00:00Z'))).toBe('open');
  expect(goldSpotSession(instant('2026-11-13T21:59:00Z'))).toBe('open');
  expect(goldSpotSession(instant('2026-11-13T22:00:00Z'))).toBe('closed');
 });
 it('handles missing input conservatively',()=>{
  expect(goldSpotSession(NaN)).toBe('closed');
 });
});

describe('Market status and source labels',()=>{
 it('does not call a quote live after the global spot market closes',()=>{
  expect(marketStatusText('closed','fresh')).toBe('السوق العالمي مغلق');
  expect(marketStatusText('closed','stale')).toBe('السوق العالمي مغلق');
  expect(marketStatusText('open','fresh')).toBe('السوق العالمي مفتوح');
  expect(marketStatusText('open','stale')).toBe('الأسعار غير محدثة');
  expect(marketStatusText('open','fresh',true)).toBe('الأسعار غير محدثة');
  expect(marketStatusText('closed','missing')).toBe('السعر غير متاح');
 });
 it('identifies the actual time rather than the polling time or source hostname',()=>{
  expect(latestQuoteLabel('2026-10-09T20:58:00Z','closed')).toContain('آخر سعر متاح');
  expect(latestQuoteLabel('2026-10-09T20:58:00Z','open')).toContain('آخر سعر مسجل');
  expect(latestQuoteLabel(undefined,'open')).toBe('لا يوجد سعر مسجل');
  expect(marketQuoteTime('invalid')).toBe('وقت السعر غير متاح');
 });
});
