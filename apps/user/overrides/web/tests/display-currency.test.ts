import {describe,it,expect} from 'vitest';
import {displayAmount,displayPortfolioSummary,sarPerUsd} from '../display-currency';
import {amountToDisplayCurrencyWords} from '../arabic-amount-words';
import {homeMarketMovement} from '../home-data';
import type {MarketPrice,Purchase} from '../model';

const t='2026-10-11T09:00:00.000Z';
const quotes:MarketPrice[]=[
 {currency:'SAR',karat:24,buyPrice:'375',sellPrice:'377',timestamp:t},
 {currency:'USD',karat:24,buyPrice:'100',sellPrice:'101',timestamp:t},
 {currency:'SAR',karat:21,buyPrice:'328.125',sellPrice:'329',timestamp:t},
 {currency:'USD',karat:21,buyPrice:'87.5',sellPrice:'88',timestamp:t}
];
const buy=(currency:string,totalPrice:string):Purchase=>({
 id:currency,portfolioId:'1',karat:21,weightGrams:'10',unitPrice:'100',
 totalPrice,currency,purchasedAt:'2026-10-01T12:00:00.000Z'
});
describe('App-wide selected display currency',()=>{
 it('computes indicative exchange ratio exclusively from paired real Backend market quotes',()=>{
  expect(sarPerUsd(quotes)).toBe(3.75);
  expect(sarPerUsd(quotes.slice(0,1))).toBeNull();
  expect(sarPerUsd([{...quotes[0],buyPrice:'9999'},quotes[1]])).toBeNull();
  expect(sarPerUsd([quotes[0],{...quotes[1],timestamp:'2026-10-10T09:00:00.000Z'}])).toBeNull();
  expect(sarPerUsd([quotes[0],{...quotes[1],buyPrice:'0'}])).toBeNull();
 });
 it('converts in both directions with no premature rounding or incorrect currency labels',()=>{
  const rate=sarPerUsd(quotes);
  expect(displayAmount(375,'SAR','USD',rate)).toEqual({amount:100,currency:'USD',converted:true,available:true});
  expect(displayAmount(100,'USD','SAR',rate)).toEqual({amount:375,currency:'SAR',converted:true,available:true});
  expect(displayAmount(123.456,'USD','USD',null)).toEqual({amount:123.456,currency:'USD',converted:false,available:true});
  expect(displayAmount(500,'EUR','USD',rate)).toEqual({amount:500,currency:'EUR',converted:false,available:false});
  expect(displayAmount(500,'SAR','USD',null)).toEqual({amount:500,currency:'SAR',converted:false,available:false});
 });
 it('summarizes recorded SAR and USD purchases in selected currency without mutating invoice records',()=>{
  const buys=[buy('SAR','2500'),buy('USD','600')];
  const original=JSON.stringify(buys);
  const summary=displayPortfolioSummary(buys,quotes,'USD',sarPerUsd(quotes),true);
  expect(summary.value).toBeCloseTo(1750,7); // 3281.25 / 3.75 + 875
  expect(summary.cost).toBeCloseTo(2500/3.75+600,7);
  expect(summary.weight).toBe(20);
  expect(summary.hasUnconverted).toBe(false);
  expect(JSON.stringify(buys)).toBe(original);
 });
 it('does not show incomplete mixed-currency totals or invent an EUR exchange rate',()=>{
  const buys=[buy('SAR','2500'),buy('EUR','100')];
  const summary=displayPortfolioSummary(buys,quotes,'USD',sarPerUsd(quotes),true);
  expect(summary.value).toBeNull();
  expect(summary.cost).toBeNull();
  expect(summary.weight).toBe(20);
  expect(summary.hasUnconverted).toBe(true);
 });
 it('preserves Arabic amount spelling in the selected currency',()=>{
  expect(amountToDisplayCurrencyWords(123.25,'USD')).toContain('دولار أمريكي');
  expect(amountToDisplayCurrencyWords(123.25,'USD')).toContain('سنت أمريكي');
  expect(amountToDisplayCurrencyWords(123.25,'USD')).not.toContain('ريال');
  expect(amountToDisplayCurrencyWords(123.25,'SAR')).toContain('ريال');
 });
 it('calculates the home market movement from USD quotes without mixing SAR history',()=>{
  const latest={...quotes[1],timestamp:'2026-10-11T12:00:00.000Z',createdAt:'2026-10-11T12:00:00.000Z',buyPrice:'105'};
  const usdHistory=[{...quotes[1],timestamp:'2026-10-11T09:00:00.000Z',createdAt:'2026-10-11T09:00:00.000Z'},quotes[0]];
  const movement=homeMarketMovement(usdHistory,latest,Date.parse('2026-10-11T12:30:00.000Z'),'USD');
  expect(movement?.difference).toBe(5);
  expect(movement?.percent).toBe(5);
 });
});
