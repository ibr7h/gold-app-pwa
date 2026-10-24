import {describe,it,expect} from 'vitest';
import {calculatorQuoteWithTaxRate} from '../calculator-quote';
describe('optional percentage VAT, consistent in online and offline calculators',()=>{
 it('15 means 15 percent of metal plus workmanship, not a currency amount',()=>{
  expect(calculatorQuoteWithTaxRate(300,10,20,15)).toEqual({raw:3000,fees:200,tax:480,total:3680});
 });
 it('supports a custom decimal percentage without premature rounding',()=>{
  const result=calculatorQuoteWithTaxRate(513.9284,2.5,7.35,7.5);
  expect(result.tax).toBeCloseTo((513.9284*2.5+7.35*2.5)*.075,10);
  expect(result.total).toBeCloseTo((513.9284+7.35)*2.5*1.075,10);
 });
 it('zero percent leaves the estimate untaxed',()=>{
  expect(calculatorQuoteWithTaxRate(300,10,20,0).total).toBe(3200);
 });
 it('rejects invalid, negative, and greater-than-100 percentages',()=>{
  for(const rate of [NaN,Infinity,-1,100.01])expect(calculatorQuoteWithTaxRate(300,10,20,rate).total).toBeNull();
 });
 it('never substitutes a price when no real/manual price is available',()=>{
  expect(calculatorQuoteWithTaxRate(null,10,20,15)).toEqual({raw:null,fees:200,tax:null,total:null});
 });
});
