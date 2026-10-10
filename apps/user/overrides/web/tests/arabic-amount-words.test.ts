import {describe,it,expect} from 'vitest';
import {amountToSaudiRiyalWords,numberToArabicWords} from '../arabic-amount-words';

describe('Arabic tafqeet for Saudi calculator totals',()=>{
 it('uses whole riyals and two-digit halalas, including final wording',()=>{
  expect(amountToSaudiRiyalWords(0)).toBe('فقط صفر ريال سعودي لا غير');
  expect(amountToSaudiRiyalWords(1)).toBe('فقط ريال سعودي واحد لا غير');
  expect(amountToSaudiRiyalWords(2)).toBe('فقط ريالان سعوديان لا غير');
  expect(amountToSaudiRiyalWords(12.5)).toContain('خمسون هللة');
  expect(amountToSaudiRiyalWords(3680)).toContain('ثلاثة آلاف وستمائة وثمانون');
  expect(amountToSaudiRiyalWords(505.05)).toContain('خمس هللات');
  expect(amountToSaudiRiyalWords(5.999)).toContain('ستة ريالات');
 });
 it('rejects unavailable amounts; never treats missing price as zero',()=>{
  for(const n of [null,undefined,NaN,Infinity,-1])expect(amountToSaudiRiyalWords(n)).toBe('');
 });
 it('handles thousands and millions without dropping place values',()=>{
  expect(numberToArabicWords(1000)).toBe('ألف');
  expect(numberToArabicWords(2000)).toBe('ألفان');
  expect(numberToArabicWords(1000000)).toBe('مليون');
  expect(numberToArabicWords(1234)).toBe('ألف ومائتان وأربعة وثلاثون');
 });
});
