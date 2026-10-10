import {describe,it,expect} from 'vitest';
import {nearestTrendIndex,priceTrendDomain,priceTrendPoints,priceTrendRange,trendPercent} from '../price-trend';

const instant=(minute:number,price:number,id='price-'+minute)=>({
 id,createdAt:new Date(Date.UTC(2026,9,8,8,minute)).toISOString(),timestamp:new Date(Date.UTC(2026,9,8,8,minute)).toISOString(),buyPrice:String(price)
});
describe('User real-time gold chart geometry',()=>{
 it('sorts observations by source time rather than API list order',()=>{
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
   {...same,id:'no-time',createdAt:'invalid',buyPrice:'400'}]);
  expect(result.map(x=>x.price)).toEqual([381,385]);
  expect(result[0].id).toBe('newer');
 });
 it('prefers the source observation time and collapses flat checks when market closes',()=>{
  const rows=[
    {id:'first',timestamp:'2026-10-09T20:55:00Z',createdAt:'2026-10-09T20:55:10Z',buyPrice:'500'},
    {id:'same',timestamp:'2026-10-09T20:55:00Z',createdAt:'2026-10-09T20:56:10Z',buyPrice:'500'},
    {id:'late-check',timestamp:'2026-10-09T21:30:00Z',createdAt:'2026-10-09T21:30:10Z',buyPrice:'501.004'},
    {id:'real-change',timestamp:'2026-10-09T20:56:00Z',createdAt:'2026-10-09T20:56:08Z',buyPrice:'501'},
    {id:'closed-check',timestamp:'2026-10-10T11:30:00Z',createdAt:'2026-10-10T11:30:12Z',buyPrice:'501'},
  ];
  const result=priceTrendPoints(rows);
  expect(result.map(x=>x.id)).toEqual(['same','real-change']);
  expect(result[1].time).toBe(Date.parse('2026-10-09T20:56:00Z'));
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
