import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,it,expect} from 'vitest';
import {priceTrendPoints,priceTrendMarketMarkers,priceTrendTradingCoordinates,
 nearestTrendPlotIndex,priceTrendVisibleMarkers,hasMarketClosureBetween} from '../price-trend';
import {chartRangeMessages} from '../i18n-chart-ranges';
import {translateUiText} from '../i18n-messages';

const quote=(id:string,time:string,price:number)=>({id,timestamp:time,buyPrice:String(price)});
const avg=(day:string,price:number)=>({id:'avg-'+day,kind:'daily-average' as const,day,buyPrice:String(price)});
const now=Date.parse('2026-10-12T16:00:00Z');

describe('Authentic opening and closing market observations',()=>{
 it('marks nearest REAL Friday close and Sunday reopen, never archived daily averages',()=>{
  const points=priceTrendPoints([
   quote('before-close','2026-10-09T20:58:00Z',501.14),
   avg('2026-10-11',502),
   quote('after-open','2026-10-11T22:05:00Z',503.28),
   quote('later','2026-10-11T22:09:00Z',503.50)
  ]);
  expect(points.map(p=>p.id)).toEqual(['before-close','avg-2026-10-11','after-open','later']);
  expect(priceTrendMarketMarkers(points,now)).toEqual([
   {index:0,type:'close'},{index:2,type:'open'}
  ]);
 });
 it('preserves identical close and reopened prices rather than wrongly deduplicating them',()=>{
  const points=priceTrendPoints([
   quote('friday','2026-10-09T20:59:00Z',501.005),
   quote('sunday','2026-10-11T22:02:00Z',501.005)
  ]);
  expect(points).toHaveLength(2);
  expect(priceTrendMarketMarkers(points,now)).toEqual([
   {index:0,type:'close'},{index:1,type:'open'}
  ]);
 });
 it('detects daily NY 17–18 maintenance boundary but never invents prices at 17:00',()=>{
  const points=priceTrendPoints([
   quote('before','2026-10-12T20:58:00Z',510.2),
   quote('after','2026-10-12T22:03:00Z',509.9)
  ]);
  expect(priceTrendMarketMarkers(points,Date.parse('2026-10-12T22:10:00Z'))).toEqual([
   {index:0,type:'close'},{index:1,type:'open'}
  ]);
  expect(points.map(p=>p.time)).toEqual([
   Date.parse('2026-10-12T20:58:00Z'),Date.parse('2026-10-12T22:03:00Z')
  ]);
 });
 it('never labels a very old quote as the price exactly at closing or opening',()=>{
  const points=priceTrendPoints([
   quote('too-early','2026-10-09T12:00:00Z',500),
   quote('too-late','2026-10-12T17:00:00Z',505)
  ]);
  expect(priceTrendMarketMarkers(points,now)).toEqual([]);
 });
 it('keeps last authentic before-close snapshot marked while currently closed',()=>{
  const points=priceTrendPoints([quote('before','2026-10-09T20:58:00Z',501)]);
  expect(priceTrendMarketMarkers(points,Date.parse('2026-10-10T16:00:00Z'))).toEqual([
   {index:0,type:'close'}
  ]);
 });
 it('compresses market-closed time without inventing points or changing their timestamps',()=>{
  const points=priceTrendPoints([
   quote('close','2026-10-09T20:55:00Z',501),
   quote('open','2026-10-11T22:05:00Z',502)
  ]);
  const start=Date.parse('2026-10-09T20:30:00Z'),end=Date.parse('2026-10-11T22:15:00Z');
  const p=priceTrendTradingCoordinates(points,start,end);
  expect(p).toHaveLength(2);
  expect(p[1]-p[0]).toBeLessThan(.4); // >48h closure is not a giant chart gap.
  expect(hasMarketClosureBetween(points[0].time,points[1].time)).toBe(true);
  expect(points[1].time).toBe(Date.parse('2026-10-11T22:05:00Z'));
  expect(nearestTrendPlotIndex(p,p[1])).toBe(1);
 });
 it('does not put Sunday daily averages into Friday close on compressed display axis',()=>{
  const points=priceTrendPoints([
   quote('friday','2026-10-09T20:58:00Z',501),
   avg('2026-10-11',502),
   quote('sunday','2026-10-11T22:10:00Z',503)
  ]);
  const p=priceTrendTradingCoordinates(points,
   Date.parse('2026-10-09T20:00:00Z'),Date.parse('2026-10-11T23:00:00Z'));
  expect(p[1]).toBeGreaterThan(p[0]);
  expect(p[2]).toBeGreaterThan(p[1]);
 });
 it('limits overlapping markers by distance and type on narrow iPhone view',()=>{
  const markers=[
   {index:0,type:'close' as const},{index:1,type:'close' as const},
   {index:2,type:'open' as const},{index:3,type:'open' as const}
  ];
  const coords=[{x:100,y:60},{x:106,y:61},{x:107,y:60},{x:110,y:61}];
  const visible=priceTrendVisibleMarkers(markers,coords,true);
  expect(visible).toEqual([{index:1,type:'close'},{index:3,type:'open'}]);
 });
});

describe('No untranslated User price chart text',()=>{
 const jsx=readFileSync(fileURLToPath(new URL('../PriceHistoryChart.tsx',import.meta.url).href),'utf8');
 const workspace=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
 it('carries all chart labels, marker descriptions and notes in ar/en/fr language file',()=>{
  const keys=[
   'حركة السوق','سعر الجرام · عيار','متوسطات يومية:','تحديثات فعلية:',
   'عدد تحديثات الأسعار:','التغير ضمن النطاق المعروض','الفترة الزمنية للرسم',
   'أول سعر مسجل بعد فتح السوق','آخر سعر مسجل قبل إغلاق السوق',
   'تم ضغط فترات إغلاق السوق بصريًا؛ لا تعني الوصلات الرمادية حدوث تداول.',
   'الخط المتقطع يمثل متوسطات يومية تاريخية؛ والخط المتصل يمثل تحديثات فعلية. لا يمثل المتوسط اليومي سعر إغلاق أو سعرًا لحظيًا.',
   'الرسم الزمني للأسعار','العيار','الأعلى','الأدنى','بداية الفترة'
  ];
  for(const key of keys){
   const record=chartRangeMessages.find(row=>row[0]===key);
   expect(record,key+' missing from locale catalog').toBeDefined();
   expect(record?.[1],key).toBeTruthy();
   expect(record?.[2],key).toBeTruthy();
   expect(translateUiText(key,'en'),key).not.toBe(key);
   expect(translateUiText(key,'fr'),key).not.toBe(key);
  }
  expect(jsx).toContain("tr('أول سعر مسجل بعد فتح السوق')");
  expect(jsx).toContain("tr('آخر سعر مسجل قبل إغلاق السوق')");
  expect(workspace).toContain("tr('الرسم الزمني للأسعار')");
  expect(workspace).toContain("tr('العيار')");
 });
 it('localizes all direct chart literals and keeps marker information in one catalog',()=>{
  const literal=/tr\('([^']+)'\)/g;
  for(const [,key] of jsx.matchAll(literal)){
   if(!/[\u0600-\u06FF]/.test(key))continue;
   expect(translateUiText(key,'en'),key+' EN').not.toBe(key);
   expect(translateUiText(key,'fr'),key+' FR').not.toBe(key);
  }
  expect(jsx).toContain('priceTrendTradingCoordinates');
  expect(jsx).toContain('priceTrendVisibleMarkers');
  expect(jsx).toContain('dh-session-legend');
  expect(jsx).not.toContain('dh-trend-footnote');
  expect(jsx).not.toContain('تم ضغط فترات إغلاق السوق بصريًا؛');
  expect(jsx).not.toContain('الخط المتقطع يمثل متوسطات يومية تاريخية؛');

 });
});
