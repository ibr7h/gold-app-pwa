import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const form=readFileSync(new URL('../AuthForm.tsx',import.meta.url).pathname,'utf8');
const auth=readFileSync(new URL('../../contexts/AuthContext.web.tsx',import.meta.url).pathname,'utf8');

describe('Immediate user registration without email or SMS OTP',()=>{
 it('collects full name, email and mobile and requires password confirmation',()=>{
  expect(form).toContain('الاسم الكامل');
  expect(form).toContain('رقم الجوال');
  expect(form).toContain('type="tel"');
  expect(form).toContain('autoComplete="tel"');
  expect(form).toContain('value={phone} required');
  expect(form).toContain('register&&password!==confirm');
  expect(form).toContain("startRegistration(name,email,password,cleanedPhone!)");
 });
 it('issues user session directly through existing protected registration API',()=>{
  expect(auth).toContain("passwordSession('/auth/register',{email:email.trim(),password,fullName:name.trim(),phone:phone.trim()})");
  expect(auth).toContain("const me=await loadMe(attempt)");
  expect(auth).toContain('setUser(me)');
  expect(auth).toContain("registerStep:'form'");
  expect(form).not.toMatch(/verifyRegistration\(/);
 });
 it('states that mobile is stored without OTP and does not falsely claim verification',()=>{
  expect(form).toContain('يُحفظ رقم الجوال ضمن بيانات الحساب دون إرسال رمز تحقق');
  expect(form).not.toContain('تم التحقق من البريد');
  expect(form).not.toContain('تم التحقق من الجوال');
 });
 it('does not affect user-only role restrictions or PIN and biometric mechanisms',()=>{
  expect(auth).toContain("if(me.role!=='user')");
  expect(auth).toContain('enableBiometric');
  expect(auth).toContain('enableQuickPin');
 });
});
