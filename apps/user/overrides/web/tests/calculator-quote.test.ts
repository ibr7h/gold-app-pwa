import {describe,it,expect} from 'vitest';
import {calculatorQuote} from '../calculator-quote';

describe('User retail calculator VAT',()=>{
 it('charges 15% on gold value plus workmanship',()=>{
  expect(calculatorQuote(300,10,20,true)).toEqual({raw:3000,fees:200,tax:480,total:3680});
 });
 it('still taxes gold when there is no workmanship',()=>{
  expect(calculatorQuote(300,10,0,true)).toEqual({raw:3000,fees:0,tax:450,total:3450});
 });
 it('adds no VAT when the user turns the tax switch off',()=>{
  expect(calculatorQuote(300,10,20,false)).toEqual({raw:3000,fees:200,tax:0,total:3200});
 });
 it('does not round any intermediate values to display precision',()=>{
  const result=calculatorQuote(505.5182,10,7.35,true);
  expect(result.raw).toBeCloseTo(5055.182,10);expect(result.fees).toBeCloseTo(73.5,10);
  expect(result.tax).toBeCloseTo(769.3023,10);expect(result.total).toBeCloseTo(5897.9843,10);
  expect(result.total).not.toBe(Number(result.total?.toFixed(2)));
 });
 it.each([null,NaN,0,-1])('keeps total and VAT unavailable when the actual gold price is unavailable: %s',price=>{
  expect(calculatorQuote(price,10,20,true)).toEqual({raw:null,fees:200,tax:null,total:null});
 });
});
