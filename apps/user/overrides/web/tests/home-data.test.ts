import {describe,it,expect} from 'vitest';
import {homeMarketMovement,homePortfolioSummary,homeUpdateAge} from '../home-data';
import {MarketPrice,Purchase} from '../model';

const quote=(time:string,price=500,currency='SAR',karat=24):MarketPrice=>({currency,karat,buyPrice:String(price),sellPrice:String(price),timestamp:time,createdAt:time});
const buy=(currency='SAR',weight='10',karat=24):Purchase=>({id:currency,portfolioId:'wallet',currency,karat,weightGrams:weight,unitPrice:'400',totalPrice:'4000',purchasedAt:'2026-10-08T00:00:00Z'});
const now=Date.parse('2026-10-09T08:00:00Z');
describe('Home market observations',()=>{
 it('compares only today’s observed SAR 24K prices, with full intermediate precision',()=>{
  const latest=quote('2026-10-09T07:55:00Z',502.7594);
  const movement=homeMarketMovement([quote('2026-10-09T00:00:00Z',500.1234),quote('2026-10-09T03:00:00Z',900,'USD'),quote('2026-10-09T03:00:00Z',300,'SAR',18)],latest,now)!;
  expect(movement.difference).toBeCloseTo(2.636,10);
  expect(movement.percent).toBeCloseTo(2.636/500.1234*100,10);
 });
 it('uses the Saudi calendar boundary and excludes yesterday and future quotes',()=>{
  const latest=quote('2026-10-08T23:00:00Z',505);
  const movement=homeMarketMovement([quote('2026-10-08T20:59:00Z',100),quote('2026-10-08T21:00:00Z',500),quote('2026-10-09T12:00:00Z',900)],latest,now)!;
  expect(movement.difference).toBe(5);
 });
 it('does not invent a daily change for missing, stale, duplicate, or invalid observations',()=>{
  const latest=quote('2026-10-09T07:55:00Z');
  expect(homeMarketMovement([latest],latest,now)).toBeNull();
  expect(homeMarketMovement([],undefined,now)).toBeNull();
  expect(homeMarketMovement([],quote('2026-10-08T10:00:00Z'),now)).toBeNull();
  expect(homeMarketMovement([latest],{...latest,buyPrice:'NaN'},now)).toBeNull();
  expect(homeMarketMovement([latest],{...latest,buyPrice:'0'},now)).toBeNull();
  expect(homeMarketMovement([latest],quote('2026-10-09T07:55:00Z',100,'USD'),now)).toBeNull();
 });
 it('labels update age truthfully and rejects future or invalid times',()=>{
  expect(homeUpdateAge('2026-10-09T07:59:30Z',now)).toBe('تحديث منذ أقل من دقيقة');
  expect(homeUpdateAge('2026-10-09T07:55:00Z',now)).toBe('تحديث منذ 5 دقيقة');
  expect(homeUpdateAge('2026-10-09T06:00:00Z',now)).toBe('تحديث منذ 2 ساعة');
  expect(homeUpdateAge('2026-10-09T09:00:00Z',now)).toBe('لا يوجد تحديث موثوق');
  expect(homeUpdateAge(undefined,now)).toBe('لا يوجد تحديث موثوق');
 });
});
describe('Home portfolio currency isolation',()=>{
 it('keeps displayed weight, value and profit in SAR, including mixed karats',()=>{
  const summary=homePortfolioSummary([buy(),buy('USD','100'),{...buy('SAR','2',18),id:'18',totalPrice:'600'}],[quote('2026-10-09T08:00:00Z'),quote('2026-10-09T08:00:00Z',375,'SAR',18)],true);
  expect(summary.weight).toBe(12);
  expect(summary.cost).toBe(4600);
  expect(summary.value).toBe(5750);
  expect(summary.difference).toBe(1150);
  expect(summary.percent).toBe(25);
  expect(summary.hasOtherCurrencies).toBe(true);
 });
 it('preserves unavailable valuation rather than reporting missing prices as zero',()=>{
  const summary=homePortfolioSummary([buy()],[],true);
  expect(summary.value).toBeNull();
  expect(summary.difference).toBeNull();
  expect(summary.percent).toBeNull();
 });
 it('distinguishes a loaded empty portfolio from unloaded data and hides fake returns',()=>{
  expect(homePortfolioSummary([],[],true)).toMatchObject({weight:0,value:0,percent:null});
  expect(homePortfolioSummary([],[],false)).toMatchObject({weight:null,value:null,difference:null});
 });
});
