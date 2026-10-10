import {describe,expect,it} from 'vitest';
import {isPriceCurrency,PRICE_CURRENCIES,readPriceCurrency,savePriceCurrency} from '../price-currency-preference';
function mockStore(){
 const records=new Map<string,string>();
 return {
  getItem:(k:string)=>records.get(k)??null,
  setItem:(k:string,v:string)=>{records.set(k,v);},
  snapshot:records,
 };
}
describe('per-user preferred gold quotation currency',()=>{
 it('defaults to SAR and allows only actually provided quote currencies',()=>{
  const store=mockStore();
  expect(PRICE_CURRENCIES).toEqual(['SAR','USD']);
  expect(readPriceCurrency('account-a',store)).toBe('SAR');
  expect(isPriceCurrency('USD')).toBe(true);
  expect(isPriceCurrency('EUR')).toBe(false);
 });
 it('restores the selection without sharing it across accounts',()=>{
  const store=mockStore();
  savePriceCurrency('account-a','USD',store);
  expect(readPriceCurrency('account-a',store)).toBe('USD');
  expect(readPriceCurrency('account-b',store)).toBe('SAR');
  savePriceCurrency('account-b','SAR',store);
  expect(readPriceCurrency('account-a',store)).toBe('USD');
 });
 it('rejects corrupted or unsupported stored currency data',()=>{
  const store=mockStore();
  store.setItem('dh-user-price-currency:account-a','EUR');
  expect(readPriceCurrency('account-a',store)).toBe('SAR');
 });
 it('does not crash when WebKit blocks storage access',()=>{
  const blocked={
   getItem:(_key:string):string=>{throw Error('storage disabled');},
   setItem:(_key:string,_value:string):void=>{throw Error('storage disabled');}
  };
  expect(readPriceCurrency('private',blocked)).toBe('SAR');
  expect(()=>savePriceCurrency('private','USD',blocked)).not.toThrow();
 });
});
