import {describe,it,expect} from 'vitest';
import {calculatorQuoteWithTaxAmount} from '../calculator-quote';
import {quoteShareText,ShareQuote} from '../calculator-sharing';
describe('user calculator with manually entered tax',()=>{
 it('uses user tax as a currency amount, never as a percent',()=>{
  expect(calculatorQuoteWithTaxAmount(513.92,10,0,0)).toEqual({raw:5139.2,fees:0,tax:0,total:5139.2});
  expect(calculatorQuoteWithTaxAmount(513.92,10,5,36)).toEqual({raw:5139.2,fees:50,tax:36,total:5225.2});
 });
 it('does not allow negative or non-finite tax',()=>{
  for(const tax of [-1,NaN,Infinity])expect(calculatorQuoteWithTaxAmount(500,10,0,tax).total).toBeNull();
 });
 it('does not fabricate a total when a price is missing',()=>{
  expect(calculatorQuoteWithTaxAmount(null,10,20,12)).toEqual({raw:null,fees:200,tax:12,total:null});
 });
});
const example:ShareQuote={
 language:'ar',currency:'SAR',karat:24,weight:10,unitPrice:513.92,basePrice:501.77,
 priceSource:'manual',raw:5139.2,fees:0,tax:0,total:5139.2,
 words:'فقط خمسة آلاف ومائة وتسعة وثلاثون ريالًا سعوديًا وعشرون هللة لا غير',
 generatedAt:'2026-10-16T17:00:00.000Z'
};
describe('quote sharing',()=>{
 it('uses exactly the amounts passed by the calculator',()=>{
  const content=quoteShareText(example);
  expect(content).toContain('٥١٣٫٩٢');
  expect(content).toContain('٥٠١٫٧٧');
  expect(content).toContain('٥٬١٣٩٫٢٠');
  expect(content).toContain('الضريبة المدخلة: ٠٫٠٠ SAR');
  expect(content).not.toContain('آخر متوسط السوق');
  expect(content).not.toContain('15%');
  expect(content).toContain('https://app.dhahabk.com');
 });
 it('supports non-Arabic content from the same quote snapshot',()=>{
  const en=quoteShareText({...example,language:'en',words:'Only five thousand one hundred thirty-nine Saudi riyals and twenty halalas.'});
  expect(en).toContain('Entered tax amount: 0.00 SAR');
  expect(en).toContain('Estimated total: 5,139.20 SAR');
  const fr=quoteShareText({...example,language:'fr',words:'Cinq mille cent trente-neuf riyals.'});
  expect(fr).toContain('Taxe saisie: 0,00 SAR');
 });
});
