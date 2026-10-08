import {describe,it,expect} from 'vitest';
import {totals,marketUnitPrice,purchasePayload,MarketPrice} from '../model';

const prices:MarketPrice[]=[
 {id:'sar24',source:'fixture',currency:'SAR',karat:24,buyPrice:'375',sellPrice:'375',timestamp:'2026-10-05T20:00:00Z',createdAt:'2026-10-05T20:00:01Z'},
 {id:'usd18',source:'fixture',currency:'USD',karat:18,buyPrice:'75',sellPrice:'75',timestamp:'2026-10-05T20:00:00Z',createdAt:'2026-10-05T20:00:01Z'}
];

describe('records',()=>{
 it('separates currencies and values from backend market rows',()=>{
  const rows=totals([
   {id:'a',portfolioId:'p',karat:24,weightGrams:'2',unitPrice:'300',totalPrice:'600',currency:'SAR',purchasedAt:''},
   {id:'b',portfolioId:'p',karat:18,weightGrams:'1',unitPrice:'60',totalPrice:'60',currency:'USD',purchasedAt:''}
  ],prices);
  expect(rows).toHaveLength(2);
  expect(rows[0].value).toBeCloseTo(750);
  expect(rows[1].value).toBeCloseTo(75);
 });
 it('does not value missing backend prices at zero',()=>{
  expect(totals([{id:'a',portfolioId:'p',karat:24,weightGrams:'2',unitPrice:'300',totalPrice:'600',currency:'SAR',purchasedAt:''}],[])[0].value).toBeNull();
 });
 it('returns null for invalid or unavailable market rows',()=>{
  expect(marketUnitPrice(prices,'EUR',24)).toBeNull();
  expect(marketUnitPrice([{...prices[0],buyPrice:'0'}],'SAR',24)).toBeNull();
 });
 it('maps grams and unit price to backend contract',()=>{
  const f=new FormData();
  Object.entries({portfolioId:'p',karat:'21',weightGrams:'1.25',unitPrice:'430.5',currency:'SAR',purchasedAt:'2026-01-05'}).forEach(([k,v])=>f.set(k,v));
  expect(purchasePayload(f)).toMatchObject({weightGrams:1.25,unitPrice:430.5,totalPrice:538.125,karat:21});
  f.set('weightGrams','-1');expect(()=>purchasePayload(f)).toThrow();
  f.set('weightGrams','Infinity');expect(()=>purchasePayload(f)).toThrow();
 });
});

it('preserves existing currencies and less common karats when editing',()=>{
 const f=new FormData();Object.entries({portfolioId:'p',karat:'20',weightGrams:'1',unitPrice:'80',currency:'EUR',purchasedAt:'2026-01-05'}).forEach(([k,v])=>f.set(k,v));
 expect(purchasePayload(f)).toMatchObject({karat:20,currency:'EUR',totalPrice:80});
});

it('does not invent exchange rates for currencies without backend prices',()=>{
 const rows=totals([{id:'e',portfolioId:'p',karat:20,weightGrams:'1',unitPrice:'80',totalPrice:'80',currency:'EUR',purchasedAt:''}],prices);
 expect(rows[0]).toMatchObject({currency:'EUR',cost:80,value:null});
});
