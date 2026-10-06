import {describe,it,expect} from 'vitest';
import {totals,validFeed,purchasePayload} from '../model';
const feed={spotUsdPerOunce:3110.34768,updatedAt:'2026-10-05T20:00:00Z',source:'fixture'};
describe('records',()=>{
 it('separates currencies and values purity',()=>{
 const rows=totals([{id:'a',portfolioId:'p',karat:24,weightGrams:'2',unitPrice:'300',totalPrice:'600',currency:'SAR',purchasedAt:''},{id:'b',portfolioId:'p',karat:18,weightGrams:'1',unitPrice:'60',totalPrice:'60',currency:'USD',purchasedAt:''}],feed);expect(rows).toHaveLength(2);expect(rows[0].value).toBeCloseTo(750);expect(rows[1].value).toBeCloseTo(75);
 });
 it('does not value missing prices at zero',()=>{expect(totals([{id:'a',portfolioId:'p',karat:24,weightGrams:'2',unitPrice:'300',totalPrice:'600',currency:'SAR',purchasedAt:''}],null)[0].value).toBeNull();});
 it('rejects invalid feeds',()=>{expect(()=>validFeed({...feed,spotUsdPerOunce:-1})).toThrow();expect(()=>validFeed({...feed,updatedAt:'invalid'})).toThrow();});
 it('maps grams and unit price to backend contract',()=>{const f=new FormData();Object.entries({portfolioId:'p',karat:'21',weightGrams:'1.25',unitPrice:'430.5',currency:'SAR',purchasedAt:'2026-01-05'}).forEach(([k,v])=>f.set(k,v));expect(purchasePayload(f)).toMatchObject({weightGrams:1.25,unitPrice:430.5,totalPrice:538.125,karat:21});f.set('weightGrams','-1');expect(()=>purchasePayload(f)).toThrow();f.set('weightGrams','Infinity');expect(()=>purchasePayload(f)).toThrow();});
});
it('preserves existing currencies and less common karats when editing',()=>{
 const f=new FormData();Object.entries({portfolioId:'p',karat:'20',weightGrams:'1',unitPrice:'80',currency:'EUR',purchasedAt:'2026-01-05'}).forEach(([k,v])=>f.set(k,v));
 expect(purchasePayload(f)).toMatchObject({karat:20,currency:'EUR',totalPrice:80});
});
it('does not invent exchange rates for currencies without a price feed',()=>{
 const rows=totals([{id:'e',portfolioId:'p',karat:20,weightGrams:'1',unitPrice:'80',totalPrice:'80',currency:'EUR',purchasedAt:''}],feed);
 expect(rows[0]).toMatchObject({currency:'EUR',cost:80,value:null});
});
