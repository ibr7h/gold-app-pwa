import {describe,expect,it} from 'vitest';
import {callingCode,countryName,phoneExample,readInternationalPhone,searchCountries,PHONE_COUNTRIES} from '../international-phone';

describe('International registration phone, region detection and E.164',()=>{
 it('offers full metadata-supported country list with Arabic country/dial lookup',()=>{
  expect(PHONE_COUNTRIES.length).toBeGreaterThan(200);
  expect(searchCountries('السعودية')).toContain('SA');
  expect(searchCountries('united kingdom')).toContain('GB');
  expect(searchCountries('+966')).toContain('SA');
  expect(callingCode('SA')).toBe('+966');
  expect(countryName('SA')).toContain('السعودية');
  expect(phoneExample('GB').length).toBeGreaterThan(4);
 });
 it('normalizes both Saudi forms shown on actual iPhone registration',()=>{
  const local=readInternationalPhone('0545563269','SA');
  const international=readInternationalPhone('+966545563269','SA');
  expect(local.status).toBe('valid');
  expect(international.status).toBe('valid');
  expect(local.e164).toBe('+966545563269');
  expect(international.e164).toBe(local.e164);
 });
 it('reformats Arabic digit input and returns exact E.164 for real countries',()=>{
  expect(readInternationalPhone('٠٥٤٥٥٦٣٢٦٩','SA').e164).toBe('+966545563269');
  expect(readInternationalPhone('+12133734253','SA').country).toBe('US');
  expect(readInternationalPhone('+12133734253','SA').e164).toBe('+12133734253');
  expect(readInternationalPhone('+447911123456','SA').country).toBe('GB');
  expect(readInternationalPhone('+447911123456','SA').e164).toBe('+447911123456');
  expect(readInternationalPhone('+971501234567','AE').e164).toBe('+971501234567');
 });
 it('detects invalid and incomplete numbers before submit',()=>{
  expect(readInternationalPhone('','SA').status).toBe('empty');
  expect(readInternationalPhone('05','SA').status).toBe('incomplete');
  expect(readInternationalPhone('0123456789','SA').e164).toBeNull();
  expect(readInternationalPhone('+000000000','SA').e164).toBeNull();
  expect(readInternationalPhone('05455632699999','SA').status).not.toBe('valid');
 });
 it('keeps correct metadata-backed calling codes for shared regions',()=>{
  expect(callingCode('US')).toBe('+1');
  expect(callingCode('CA')).toBe('+1');
  expect(callingCode('GB')).toBe('+44');
  expect(callingCode('AE')).toBe('+971');
  expect(callingCode('EG')).toBe('+20');
 });
});
