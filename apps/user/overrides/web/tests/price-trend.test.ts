import {describe,it,expect} from 'vitest';
import {nearestTrendIndex,priceTrendDomain,priceTrendPoints,priceTrendRange,trendPercent} from '../price-trend';

const instant=(minute:number,price:number,id='price-'+minute)=>({
 id,createdAt:new Date(Date.UTC(2026,9,8,8,minute)).toISOString(),timestamp:new Date(Date.UTC(2026,9,8,8,minute)).toISOString(),buyPrice:String(price)
});
describe('User real-time gold chart geometry',()=>{
 it('sorts actual source observations by time rather than ingestion order',()=>{
  const result=priceTrendPoints([instant(40,390),instant(0,385),instant(10,387)]);
  expect(result.map(x=>x.price)).toEqual([385,387,390]);
  expect(result[1].time-result[0].time).toBe(10*60*1000);
  expect(result[2].time-result[1].time).toBe(30*60*1000);
 });
 it('collapses duplicate timestamps and excludes invalid or fabricated points',()=>{
  const same=instant(0,380);
  const result=priceTrendPoints([same,{...same,id:'newer',buyPrice:'381'},instant(10,385),
   {...same,id:'bad',buyPrice:'NaN'},
   {...same,id:'zero',buyPrice:'0'},
   {...same,id:'no-time',createdAt:'invalid',timestamp:'invalid',buyPrice:'400'}]);
  expect(result.map(x=>x.price)).toEqual([381,385]);
  expect(result[0].id).toBe('newer');
 });
 it('selects nearest observed snapshot with unequal time gaps',()=>{
  const points=priceTrendPoints([instant(0,385),instant(10,386),instant(40,392)]);
  expect(nearestTrendIndex(points,points[1].time+4*60*1000)).toBe(1);
  expect(nearestTrendIndex(points,points[1].time+21*60*1000)).toBe(2);
  expect(nearestTrendIndex(points,-Infinity)).toBe(0);
  expect(nearestTrendIndex([],Date.now())).toBe(-1);
 });
 it('filters 24h and 7d relative to the most recently saved snapshot, not wall clock',()=>{
  const start=Date.UTC(2026,9,1);
  const points=priceTrendPoints([
   {id:'old',buyPrice:'400',createdAt:new Date(start).toISOString()},
   {id:'week',buyPrice:'405',createdAt:new Date(start+6*86400000).toISOString()},
   {id:'day',buyPrice:'406',createdAt:new Date(start+7*86400000).toISOString()}
  ]);
  expect(priceTrendRange(points,'day').map(p=>p.price)).toEqual([405,406]);
  expect(priceTrendRange(points,'week')).toHaveLength(3);
  expect(priceTrendRange(points,'available')).toHaveLength(3);
 });
 it('computes visible min/max and actual percent change without false zero baselines',()=>{
  const data=priceTrendPoints([instant(0,400),instant(10,404)]);
  const domain=priceTrendDomain(data)!;
  expect(domain.min).toBeGreaterThan(0);
  expect(domain.high).toBe(404);
  expect(domain.low).toBe(400);
  expect(trendPercent(data)).toBeCloseTo(1);
  expect(trendPercent([data[0]])).toBeNull();
  expect(priceTrendDomain([])).toBeNull();
 });
 it('filters a 30-day month without synthesizing missing daily prices',()=>{
  const latest=Date.UTC(2026,9,9);
  const points=priceTrendPoints([31,30,7,1,0].map(days=>({id:String(days),buyPrice:String(500+days),timestamp:new Date(latest-days*86400000).toISOString()})));
  expect(priceTrendRange(points,'month').map(p=>p.id)).toEqual(['30','7','1','0']);
  expect(priceTrendRange(points,'week').map(p=>p.id)).toEqual(['7','1','0']);
  expect(priceTrendRange(points,'day').map(p=>p.id)).toEqual(['1','0']);
 });
});


describe('Do not extend gold-price chart across closed market hours',()=>{
 const quote=(id:string,sourceTime:string,price:number,storedAt='2026-10-11T19:00:00Z')=>
  ({id,timestamp:sourceTime,createdAt:storedAt,buyPrice:String(price)});
 it('prefers the supplier observation timestamp, even when stored later during closure',()=>{
  const points=priceTrendPoints([
   quote('late-saved','2026-10-09T20:58:00Z',410,'2026-10-11T12:00:00Z'),
   quote('last-trade','2026-10-09T20:59:00Z',411,'2026-10-11T12:01:00Z'),
   quote('repeated-last-trade','2026-10-09T20:59:00Z',411,'2026-10-11T12:02:00Z')
  ]);
  expect(points.map(p=>p.id)).toEqual(['late-saved','repeated-last-trade']);
  expect(points.at(-1)?.time).toBe(Date.parse('2026-10-09T20:59:00Z'));
 });
 it('omits flat after-close observations Friday, Saturday and Sunday before reopening',()=>{
  const points=priceTrendPoints([
   quote('friday-trade','2026-10-09T20:59:00Z',411),
   quote('friday-closed','2026-10-09T21:00:00Z',411),
   quote('saturday-closed','2026-10-10T11:00:00Z',411),
   quote('sunday-closed','2026-10-11T21:59:00Z',411)
  ]);
  expect(points.map(p=>p.id)).toEqual(['friday-trade']);
  expect(priceTrendRange(points,'available').map(p=>p.price)).toEqual([411]);
 });
 it('resumes with a new true observation when trading opens Sunday 18:00 New York',()=>{
  const points=priceTrendPoints([
   quote('last-friday','2026-10-09T20:59:00Z',411),
   quote('closed','2026-10-11T21:59:00Z',411),
   quote('first-sunday','2026-10-11T22:01:00Z',412)
  ]);
  expect(points.map(p=>p.id)).toEqual(['last-friday','first-sunday']);
 });
 it('also excludes the daily 17:00–18:00 New York maintenance window',()=>{
  const points=priceTrendPoints([
   quote('before','2026-10-12T20:59:00Z',410),
   quote('rollover','2026-10-12T21:01:00Z',410),
   quote('after','2026-10-12T22:01:00Z',411)
  ]);
  expect(points.map(p=>p.id)).toEqual(['before','after']);
 });
});
