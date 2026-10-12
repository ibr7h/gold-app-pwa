import {describe,it,expect} from 'vitest';
import {parseEuroReferenceRates,euroRateOnDate,euroMarketRows,euroHistoryRows,eurFromUsd} from '../euro-reference';
import {displayAmount,displayPortfolioSummary,sarPerUsd} from '../display-currency';
import {amountToDisplayCurrencyWords} from '../arabic-amount-words';
import {amountToLocalizedWords} from '../amount-words-localized';
import type {MarketPrice,Purchase} from '../model';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const now=Date.parse('2026-10-12T18:00:00Z');
const fx=parseEuroReferenceRates({rates:{
 '2026-10-07':{EUR:0.876},
 '2026-10-09':{EUR:0.89238},
 '2026-10-12':{EUR:0.89438}
}},now);
const quotes:MarketPrice[]=[
 {currency:'SAR',karat:24,buyPrice:'375',sellPrice:'380',timestamp:'2026-10-12T12:00:00Z'},
 {currency:'USD',karat:24,buyPrice:'100',sellPrice:'102',timestamp:'2026-10-12T12:00:00Z'},
 {currency:'USD',karat:21,buyPrice:'87.5',sellPrice:'89',timestamp:'2026-10-12T12:00:00Z'}
];
const purchase=(currency:string,totalPrice:string):Purchase=>({
 id:currency,portfolioId:'1',karat:21,weightGrams:'10',unitPrice:'1',
 totalPrice,currency,purchasedAt:'2026-10-01T12:00:00Z'
});
describe('Reliable reference EUR pricing in User iPhone',()=>{
 it('validates recorded FX responses and rejects stale, fictional or malformed rates',()=>{
  expect(fx.latestDate).toBe('2026-10-12');
  expect(fx.eurPerUsd).toBe(0.89438);
  expect(()=>parseEuroReferenceRates({rates:{'2026-10-12':{EUR:0}}},now)).toThrow();
  expect(()=>parseEuroReferenceRates({rates:{'2026-10-12':{EUR:6}}},now)).toThrow();
  expect(()=>parseEuroReferenceRates({rates:{'2026-09-20':{EUR:0.9}}},now)).toThrow();
  expect(()=>parseEuroReferenceRates({rates:{'2026-10-34':{EUR:0.8}}},now)).toThrow();
 });
 it('uses the nearest prior WORKING day across weekends, not a made-up Sunday FX quote',()=>{
  expect(euroRateOnDate(fx,'2026-10-11')).toBe(0.89238);
  expect(euroRateOnDate(fx,'2026-10-12')).toBe(0.89438);
  expect(euroRateOnDate(fx,'2026-10-08')).toBe(0.876);
  expect(euroRateOnDate(fx,'2026-09-01')).toBeNull();
 });
 it('converts the USD quote in memory, preserving source timestamps and SAR/USD data',()=>{
  const orig=JSON.stringify(quotes);
  const eur=euroMarketRows(quotes,fx);
  expect(eur).toHaveLength(2);
  expect(eur[0].currency).toBe('EUR');
  expect(Number(eur[0].buyPrice)).toBeCloseTo(89.438,4);
  expect(eur[0].timestamp).toBe(quotes[1].timestamp);
  expect(JSON.stringify(quotes)).toEqual(orig);
 });
 it('uses the FX rate from each historical date rather than applying current FX to the month',()=>{
  const historic=[
   {currency:'USD',id:'daily',kind:'daily-average',day:'2026-10-09',buyPrice:'100'},
   {currency:'USD',id:'spot',kind:'spot',timestamp:'2026-10-12T12:00:00Z',buyPrice:'100'}
  ];
  const out=euroHistoryRows(historic,fx);
  expect(out.map(x=>x.currency)).toEqual(['EUR','EUR']);
  expect(Number(out[0].buyPrice)).toBeCloseTo(89.238,4);
  expect(Number(out[1].buyPrice)).toBeCloseTo(89.438,4);
  expect(out.map(x=>x.id)).toEqual(['daily','spot']);
  expect(euroHistoryRows([{...historic[0],day:'2026-09-01'}],fx)).toEqual([]);
 });
 it('safely converts displayed saved purchase costs while never modifying invoice amounts',()=>{
  const buys=[purchase('SAR','375'),purchase('EUR','100')];
  const original=JSON.stringify(buys);
  const market=[...quotes,...euroMarketRows(quotes,fx)];
  const summary=displayPortfolioSummary(buys,market,'EUR',sarPerUsd(market),true,fx.eurPerUsd);
  expect(summary.hasUnconverted).toBe(false);
  expect(summary.cost).toBeCloseTo(375/3.75*fx.eurPerUsd+100,5);
  expect(summary.value).toBeNull(); // SAR21 not provided, no invented 21K SAR quote
  expect(JSON.stringify(buys)).toEqual(original);
 });
 it('provides EUR symbol and words in Arabic English and French',()=>{
  expect(amountToDisplayCurrencyWords(12.50,'EUR')).toContain('يورو');
  expect(amountToLocalizedWords(12.50,'EUR','en')).toContain('euro');
  expect(amountToLocalizedWords(12.50,'EUR','fr')).toContain('euros');
  expect(displayAmount(100,'USD','EUR',3.75,fx.eurPerUsd).amount).toBeCloseTo(89.438,5);
  expect(displayAmount(375,'SAR','EUR',3.75,fx.eurPerUsd).amount).toBeCloseTo(89.438,5);
  expect(displayAmount(100,'EUR','USD',3.75,fx.eurPerUsd).amount).toBeCloseTo(111.8095,3);
  expect(displayAmount(100,'EUR','SAR',3.75,null).available).toBe(false);
  expect(eurFromUsd(100,null)).toBeNull();
 });
 it('offers EUR as a display currency, while keeping API requests in supported SAR/USD',()=>{
  const s=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url)),'utf8');
  expect(s).toContain("priceCurrency==='EUR'?'USD':priceCurrency");
  expect(s).toContain("euroHistoryRows(historyRows,reference)");
  expect(s).toContain("euroMarketRows(cleanLatest,reference)");
  expect(s).toContain("setPriceCurrency('EUR')");
  expect(s).toContain('>EUR</option>');
  expect(s).toContain("dialog.alert?.currency||(priceCurrency==='EUR'?'USD':priceCurrency)");
 });
});
