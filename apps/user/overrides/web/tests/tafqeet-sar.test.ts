import {describe,expect,it} from 'vitest';
import {tafqeetSar} from '../tafqeet-sar';

describe('Gold App total as Saudi Riyal words from taf.html',()=>{
 it('handles one and two Riyals with matching singular and dual forms',()=>{
  expect(tafqeetSar(1)).toBe('فقط ريال سعودي لا غير');
  expect(tafqeetSar(2)).toBe('فقط ريالان سعوديان لا غير');
 });
 it('handles count grammar 3-10 and 11-99',()=>{
  expect(tafqeetSar(3)).toBe('فقط ثلاثة ريالات سعودية لا غير');
  expect(tafqeetSar(12)).toBe('فقط اثنا عشر ريالاً سعودياً لا غير');
  expect(tafqeetSar(21)).toBe('فقط واحد وعشرون ريالاً سعودياً لا غير');
 });
 it('reads both Riyals and Halalas, rounding to the displayed two decimals',()=>{
  expect(tafqeetSar(125.75)).toBe('فقط مائة وخمسة وعشرون ريالاً سعودياً وخمس وسبعون هللةً لا غير');
  expect(tafqeetSar(10.01)).toBe('فقط عشرة ريالات سعودية وهللة لا غير');
  expect(tafqeetSar(5.02)).toBe('فقط خمسة ريالات سعودية وهللتان لا غير');
  expect(tafqeetSar(0.50)).toBe('فقط خمسون هللةً لا غير');
 });
 it('handles zero, thousands and millions from the source grouping logic',()=>{
  expect(tafqeetSar(0)).toBe('فقط صفر ريال سعودي لا غير');
  expect(tafqeetSar(1000)).toBe('فقط ألف ريال سعودي لا غير');
  expect(tafqeetSar(1000000)).toBe('فقط مليون ريال سعودي لا غير');
  expect(tafqeetSar(1250450.75)).toContain('وخمس وسبعون هللةً');
 });
 it('returns no invented amount when a quote is unavailable or invalid',()=>{
  expect(tafqeetSar(null)).toBeNull();
  expect(tafqeetSar(undefined)).toBeNull();
  expect(tafqeetSar(NaN)).toBeNull();
  expect(tafqeetSar(Infinity)).toBeNull();
  expect(tafqeetSar(-1)).toBeNull();
  expect(tafqeetSar(1e15)).toBeNull();
 });
});
