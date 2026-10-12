import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,it,expect} from 'vitest';
import {nearestTrendIndex,priceTrendDomain,priceTrendPoints,priceTrendRange,priceTrendWindow,priceTrendSegments,priceTrendTickIndices,trendPercent} from '../price-trend';

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
 it('filters 24h and 7d against the selected wall-clock window',()=>{
  const start=Date.UTC(2026,9,1);
  const points=priceTrendPoints([
   {id:'old',buyPrice:'400',createdAt:new Date(start).toISOString()},
   {id:'week',buyPrice:'405',createdAt:new Date(start+6*86400000).toISOString()},
   {id:'day',buyPrice:'406',createdAt:new Date(start+7*86400000).toISOString()}
  ]);
  const now=start+7*86400000;
  expect(priceTrendRange(points,'day',now).map(p=>p.price)).toEqual([405,406]);
  expect(priceTrendRange(points,'week',now)).toHaveLength(3);
  expect(priceTrendRange(points,'available',now)).toHaveLength(3);
  expect(priceTrendRange(points,'day',now+2*86400000)).toHaveLength(0);
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
  expect(priceTrendRange(points,'month',latest).map(p=>p.id)).toEqual(['30','7','1','0']);
  expect(priceTrendRange(points,'week',latest).map(p=>p.id)).toEqual(['7','1','0']);
  expect(priceTrendRange(points,'day',latest).map(p=>p.id)).toEqual(['1','0']);
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
  expect(priceTrendRange(points,'available',Date.parse('2026-10-11T19:00:00Z')).map(p=>p.price)).toEqual([411]);
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

describe('iPhone closed-session trend and readable axis labels',()=>{
 const sample=(id:string,timestamp:string,price:number)=>({id,timestamp,buyPrice:String(price)});
 it('removes repeated unchanged polling prices from old backend history',()=>{
  const points=priceTrendPoints([
   sample('open','2026-10-09T20:00:00Z',500),
   sample('repeat1','2026-10-09T20:05:00Z',500.002),
   sample('repeat2','2026-10-09T20:10:00Z',500.001),
   sample('changed','2026-10-09T20:15:00Z',500.11)
  ]);
  expect(points.map(x=>x.id)).toEqual(['open','changed']);
 });
 it('never joins Friday and Sunday through the closed weekend',()=>{
  const p=priceTrendPoints([
   sample('fri','2026-10-09T20:55:00Z',500),
   sample('sun','2026-10-11T22:05:00Z',504),
   sample('mon','2026-10-11T22:10:00Z',505)
  ]);
  expect(priceTrendSegments(p).map(g=>g.map(q=>q.id))).toEqual([['fri'],['sun','mon']]);
 });
 it('breaks lines across daily New York 17:00–18:00 maintenance',()=>{
  const p=priceTrendPoints([
   sample('before','2026-10-12T20:59:00Z',500),
   sample('after','2026-10-12T22:01:00Z',501)
  ]);
  expect(priceTrendSegments(p).map(g=>g.map(q=>q.id))).toEqual([['before'],['after']]);
 });
 it('does not interpolate through lengthy unobserved gaps during open trading',()=>{
  const p=priceTrendPoints([
   sample('start','2026-10-12T12:00:00Z',501),
   sample('end','2026-10-12T19:30:00Z',502)
  ]);
  expect(priceTrendSegments(p)).toHaveLength(2);
 });
 it('renders only endpoints for the compact iPhone chart regardless of late price clusters',()=>{
  const p=priceTrendPoints([
   sample('old','2026-10-12T12:00:00Z',501),
   sample('a','2026-10-12T19:00:00Z',502),
   sample('b','2026-10-12T19:01:00Z',503),
   sample('c','2026-10-12T19:02:00Z',504)
  ]);
  expect(priceTrendTickIndices(p,300,true)).toEqual([0,3]);
  expect(priceTrendTickIndices(p,260,false)).toEqual([0,3]);
  expect(priceTrendTickIndices(p,450,false)).toEqual([0,3]);
  expect(priceTrendTickIndices([],300,true)).toEqual([]);
 });
 it('allows a distinct centre date on a wide chart only when spaced far enough',()=>{
  const p=priceTrendPoints([
   sample('first','2026-10-12T12:00:00Z',501),
   sample('mid','2026-10-12T15:00:00Z',502),
   sample('last','2026-10-12T18:00:00Z',503)
  ]);
  expect(priceTrendTickIndices(p,500,false)).toEqual([0,1,2]);
 });
});

describe('Different date windows must change the iPhone price chart',()=>{
 const now=Date.parse('2026-10-12T15:00:00Z');
 const series=priceTrendPoints([
  {id:'lastMonth',timestamp:'2026-09-22T12:00:00Z',buyPrice:'400'},
  {id:'lastWeek',timestamp:'2026-10-06T12:00:00Z',buyPrice:'410'},
  {id:'yesterday',timestamp:'2026-10-11T22:15:00Z',buyPrice:'420'},
  {id:'today',timestamp:'2026-10-12T12:00:00Z',buyPrice:'430'}
 ]);
 it('always draws the complete 24-hour, 7-day, and 30-day time axis',()=>{
  const wDay=priceTrendWindow('day',now,series)!;
  const wWeek=priceTrendWindow('week',now,series)!;
  const wMonth=priceTrendWindow('month',now,series)!;
  expect(wDay.end-wDay.start).toBe(86400000);
  expect(wWeek.end-wWeek.start).toBe(7*86400000);
  expect(wMonth.end-wMonth.start).toBe(30*86400000);
  expect(priceTrendWindow('available',now,series)!.start).toBe(series[0].time);
 });
 it('uses different true recorded points for each selected period',()=>{
  expect(priceTrendRange(series,'day',now).map(p=>p.id)).toEqual(['yesterday','today']);
  expect(priceTrendRange(series,'week',now).map(p=>p.id)).toEqual(['lastWeek','yesterday','today']);
  expect(priceTrendRange(series,'month',now).map(p=>p.id)).toEqual(['lastMonth','lastWeek','yesterday','today']);
  expect(priceTrendRange(series,'available',now).map(p=>p.id)).toEqual(['lastMonth','lastWeek','yesterday','today']);
 });
 it('never treats old Friday quotes as current day prices on Monday',()=>{
  const friday=priceTrendPoints([{id:'friday',timestamp:'2026-10-09T20:58:00Z',buyPrice:'410'}]);
  expect(priceTrendRange(friday,'day',now)).toHaveLength(0);
  expect(priceTrendRange(friday,'week',now)).toHaveLength(1);
 });
 it('changes even when source has only one day of history: time windows differ',()=>{
  const recent=priceTrendPoints([
   {id:'a',timestamp:'2026-10-12T12:00:00Z',buyPrice:'410'},
   {id:'b',timestamp:'2026-10-12T12:02:00Z',buyPrice:'411'}
  ]);
  expect(priceTrendRange(recent,'day',now)).toHaveLength(2);
  expect(priceTrendRange(recent,'month',now)).toHaveLength(2);
  expect(priceTrendWindow('day',now,recent)?.start).not.toBe(priceTrendWindow('month',now,recent)?.start);
 });
});


describe('iPhone chart controls visibly respond to periods',()=>{
 const chart=readFileSync(fileURLToPath(new URL('../PriceHistoryChart.tsx',import.meta.url).href),'utf8');
 const app=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
 it('exposes distinct 24h 7d 30d and available selectors',()=>{
  for(const code of ["id:'day',label:'24 ساعة'","id:'week',label:'7 أيام'","id:'month',label:'30 يومًا'","id:'available',label:'المتاح'"]){
   expect(chart).toContain(code);
  }
  expect(chart).toContain('onClick={()=>setRange(option.id)}');
  expect(chart).toContain('priceTrendRange(all,range,now)');
 });
 it('reflects selected exact time boundaries and observation count in a live status area',()=>{
  expect(chart).toContain('const rangeCoverage=range===');
  expect(chart).toContain('const coverageNotice=points.length===0');
  expect(chart).toContain('aria-live="polite" key={range}');
  expect(chart).toContain('timeLabel(axisStart,range,calendar)');
  expect(chart).toContain('timeLabel(axisEnd,range,calendar)');
 });
 it('requests selected range and clears old results while new range loads',()=>{
  expect(app).toContain("'&limit=500&range='+chartRange");
  expect(app).toContain("setHistoryQuery(previous=>previous===priceCurrency+':'+chartKarat+':'+chartRange?previous:'')");
  expect(app).toContain("onRangeChange={setChartRange}");
  expect(app).toContain("onRangeChange={setHomeRange}");
 });
});

describe('History API must cover requested time windows',()=>{
 const source=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
 it('fetches period-spanning points for both charts and never assumes 200 recent points span a month',()=>{
  expect(source).toContain("'&limit=500&range='+chartRange");
  expect(source).toContain("'&karat=24&limit=500&range='+homeRange");
  expect(source).not.toContain("'&limit=200&range='+chartRange");
  expect(source).toContain('chartKarat===24&&chartRange===homeRange?selectedHistory:');
 });
});
