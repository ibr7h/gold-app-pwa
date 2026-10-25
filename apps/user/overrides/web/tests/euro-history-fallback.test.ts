import {describe,it,expect,vi} from 'vitest';
import {historicalQuoteDay,mergeEuroHistorySources,loadEuroHistorySources,HistoricalCurrencyRow} from '../euro-history-source';
import {parseEuroReferenceRates,euroHistoryRows} from '../euro-reference';
import {translateUiText} from '../i18n-messages';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';

const now=Date.parse('2026-10-24T12:00:00Z');
const fx=parseEuroReferenceRates({base:'USD',rates:{
 '2026-09-25':{EUR:.87},'2026-10-08':{EUR:.88},'2026-10-09':{EUR:.89},'2026-10-23':{EUR:.90}
}},now);
const spot=(currency:string,day:string,price='100',karat=24):HistoricalCurrencyRow=>({
 id:currency+'-'+day,source:'api.gold-api.com',currency,karat,buyPrice:price,
 kind:'spot',timestamp:day+'T15:00:00Z'
});
const daily=(currency:string,day:string,price='100'):HistoricalCurrencyRow=>({
 id:'daily-'+currency+'-'+day,source:'api.gold-api.com/history',currency,karat:24,buyPrice:price,
 kind:'daily-average',day
});

describe('recover missing historical EUR with actual gold observations and dated FX',()=>{
 it('fills a missing USD date from its real SAR record without altering either source',()=>{
  const usd=[spot('USD','2026-10-08')],sar=[spot('SAR','2026-10-08','375'),spot('SAR','2026-10-09','375')];
  const original=JSON.stringify({usd,sar});
  const out=euroHistoryRows(mergeEuroHistorySources(usd,sar),fx);
  expect(out).toHaveLength(2);
  expect(out.map(row=>Number(row.buyPrice))).toEqual([88,89]);
  expect(out[1].timestamp).toBe(sar[1].timestamp);
  expect(out[1].id).toBe(sar[1].id);
  expect(out[1].fxConversion).toEqual({sourceCurrency:'SAR',referenceSource:'ECB-reference-FX',rateDate:'2026-10-09',eurPerUsd:.89,sarPerUsd:3.75});
  expect(JSON.stringify({usd,sar})).toBe(original);
 });
 it('prefers genuine USD history for an existing day, without overwriting or double counting it',()=>{
  const usd=[daily('USD','2026-10-09')],sar=[spot('SAR','2026-10-09','400')];
  expect(mergeEuroHistorySources(usd,sar)).toEqual(usd);
 });
 it('preserves multiple real observations on a recovered date and their original times',()=>{
  const first=spot('SAR','2026-10-09','375'),second={...first,id:'second',timestamp:'2026-10-09T16:00:00Z',buyPrice:'380'};
  const out=euroHistoryRows(mergeEuroHistorySources([],[first,second]),fx);
  expect(out.map(row=>row.timestamp)).toEqual([first.timestamp,second.timestamp]);
  expect(out[0].buyPrice).not.toBe(out[1].buyPrice);
 });
 it('keeps daily averages as date-only averages, not invented ticks or latest prices',()=>{
  const out=euroHistoryRows(mergeEuroHistorySources([],[daily('SAR','2026-10-09','375')]),fx);
  expect(out[0]).toMatchObject({kind:'daily-average',day:'2026-10-09',buyPrice:'89'});
  expect(out[0].timestamp).toBeUndefined();
 });
 it('uses each date and the prior working day for weekends, never the current FX for old gold',()=>{
  const out=euroHistoryRows([spot('USD','2026-09-25'),spot('USD','2026-10-11')],fx);
  expect(out.map(row=>Number(row.buyPrice))).toEqual([87,89]);
  expect(out.map(row=>row.fxConversion.rateDate)).toEqual(['2026-09-25','2026-10-09']);
 });
 it('does not invent a gold quote for a date absent in both source currencies',()=>{
  expect(euroHistoryRows(mergeEuroHistorySources([],[]),fx)).toEqual([]);
 });
 it('does not guess FX when there is no suitably dated reference',()=>{
  expect(euroHistoryRows([spot('SAR','2026-10-20','375')],fx)).toEqual([]);
  expect(euroHistoryRows([spot('USD','2026-09-24')],fx)).toEqual([]);
 });
 it('uses the correct karat and never substitutes a different-purity quote',()=>{
  const usd=[spot('USD','2026-10-09','100',24)],sar=[spot('SAR','2026-10-09','328.125',21)];
  const out=euroHistoryRows(mergeEuroHistorySources(usd,sar),fx);
  expect(out.map(row=>row.karat)).toEqual([24,21]);
  expect(Number(out[1].buyPrice)).toBeCloseTo(87.5*.89,10);
 });
 it('rejects invalid fallback prices, dates and aggregation metadata',()=>{
  const valid=spot('SAR','2026-10-09','375');
  for(const row of [{...valid,buyPrice:'0'},{...valid,buyPrice:'NaN'},{...valid,sellPrice:'-1'},
   {...valid,karat:10},{...valid,timestamp:'2026-02-30T12:00:00Z'},
   {...valid,timestamp:'2026-10-09T12:00:00'},{...valid,day:'2026-10-09'}]){
   expect(mergeEuroHistorySources([],[row])).toEqual([]);
  }
 });
 it('normalizes offset timestamps to the actual UTC day while preserving the original timestamp',()=>{
  const row={...spot('USD','2026-10-08'),timestamp:'2026-10-08T23:30:00-03:00'};
  expect(historicalQuoteDay(row)).toBe('2026-10-09');
  const out=euroHistoryRows([row],fx);
  expect(out[0].buyPrice).toBe('89');expect(out[0].timestamp).toBe(row.timestamp);
 });
 it('recovers historical rows when only the USD history request fails',async()=>{
  const request=vi.fn(async(currency:'USD'|'SAR')=>{
   if(currency==='USD')throw Error('source unavailable');
   return [spot('SAR','2026-10-09','375')];
  });
  const out=euroHistoryRows(await loadEuroHistorySources(request),fx);
  expect(out[0].buyPrice).toBe('89');expect(request).toHaveBeenCalledTimes(2);
 });
 it('keeps USD history when the optional SAR fallback is unavailable',async()=>{
  const rows=[spot('USD','2026-10-09')];
  expect(await loadEuroHistorySources(async currency=>{
   if(currency==='SAR')throw Error('unavailable');return rows;
  })).toEqual(rows);
 });
 it('fails instead of claiming successful empty history when both requests fail',async()=>{
  await expect(loadEuroHistorySources(async()=>{throw Error('offline');})).rejects.toThrow('unavailable_eur_history_source');
 });
 it('never turns malformed JSON objects into source history',async()=>{
  await expect(loadEuroHistorySources(async()=>({} as HistoricalCurrencyRow[]))).rejects.toThrow();
 });
 it('retains the direct XAU/EUR path for current prices and the existing quote security policy',()=>{
  const source=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url)),'utf8');
  expect(source).toContain('loadEuroHistorySources(request)');
  expect(source).toContain('loadEuroSpot().catch(()=>null)');
  expect(source).toContain('euroSpotRows(eurSpot)');
  expect(source).not.toContain('euroMarketRows(cleanLatest');
 });
 it('labels derived history distinctly in Arabic, English and French',()=>{
  const label='أسعار اليورو التاريخية محوّلة بسعر صرف مؤرخ، وليست أسعار يورو مباشرة. تبقى الفترات بلا بيانات موثوقة فارغة.';
  expect(translateUiText(label,'en')).toContain('dated reference exchange rates');
  expect(translateUiText(label,'fr')).toContain('taux de change datés');
  const chart=readFileSync(fileURLToPath(new URL('../PriceHistoryChart.tsx',import.meta.url)),'utf8');
  expect(chart).toContain('hasHistoricalFx&&');expect(chart).toContain(label);
 });
});
