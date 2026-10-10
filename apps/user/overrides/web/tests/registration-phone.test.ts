import {describe,expect,it} from 'vitest';
import {normalizeRegistrationPhone} from '../registration-phone';

describe('Saudi registration mobile validation regression',()=>{
 it('accepts the two equivalent forms shown on the iPhone screenshots',()=>{
  expect(normalizeRegistrationPhone('0545563269')).toBe('+966545563269');
  expect(normalizeRegistrationPhone('+966545563269')).toBe('+966545563269');
 });
 it('accepts local, country-code and E.164 variants',()=>{
  expect(normalizeRegistrationPhone('0501234567')).toBe('+966501234567');
  expect(normalizeRegistrationPhone('966501234567')).toBe('+966501234567');
  expect(normalizeRegistrationPhone('+966501234567')).toBe('+966501234567');
  expect(normalizeRegistrationPhone('05 0123 4567')).toBe('+966501234567');
  expect(normalizeRegistrationPhone('٠٥٤٥٥٦٣٢٦٩')).toBe('+966545563269');
  expect(normalizeRegistrationPhone('۰۵۴۵۵۶۳۲۶۹')).toBe('+966545563269');
  expect(normalizeRegistrationPhone('+447911123456')).toBe('+447911123456');
 });
 it('rejects malformed short international and other Saudi number formats',()=>{
  for(const value of ['','123','054556326','+966445563269','96655456','00966545563269','+0000000000','+', 'abc']){
   expect(normalizeRegistrationPhone(value)).toBeNull();
  }
 });
});
