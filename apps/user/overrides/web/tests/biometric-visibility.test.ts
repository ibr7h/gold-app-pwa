import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {canShowBiometricLogin} from '../biometric-visibility';

describe('biometric entry requires an explicit secure opt-in',()=>{
 it('is hidden before activation, even if the device supports biometrics',()=>{
  expect(canShowBiometricLogin({biometricAvailable:true,biometricEnrolled:false,biometricEnabled:false})).toBe(false);
  expect(canShowBiometricLogin({biometricAvailable:true,biometricEnrolled:false,biometricEnabled:true})).toBe(false);
 });
 it('does not offer an unavailable or disabled credential',()=>{
  expect(canShowBiometricLogin({biometricAvailable:false,biometricEnrolled:true,biometricEnabled:true})).toBe(false);
  expect(canShowBiometricLogin({biometricAvailable:true,biometricEnrolled:true,biometricEnabled:false})).toBe(false);
 });
 it('offers biometric login only when availability, enrollment, and opt-in are all true',()=>{
  expect(canShowBiometricLogin({biometricAvailable:true,biometricEnrolled:true,biometricEnabled:true})).toBe(true);
 });
 it('actually applies the gate in the sign-in view and exposes an accurate status in profile',()=>{
  const auth=readFileSync(new URL('../AuthForm.tsx',import.meta.url).pathname,'utf8');
  const workspace=readFileSync(new URL('../UserWorkspace.tsx',import.meta.url).pathname,'utf8');
  const context=readFileSync(new URL('../../contexts/AuthContext.web.tsx',import.meta.url).pathname,'utf8');
  expect(auth).toContain('showBiometricLogin&&<button className="mockup-biometric"');
  expect(auth).toContain("showBiometricLogin?'أو بالبريد الإلكتروني':'الدخول بالبريد الإلكتروني'");
  expect(workspace).toContain('const biometricActive=canShowBiometricLogin(');
  expect(workspace).toContain('الحماية والأمان');
  expect(workspace).toContain('تفعيل الدخول بالبصمة يتطلب دعمًا آمنًا من الخادم');
  expect(context).toContain('biometricAvailable:false');
  expect(context).toContain('biometricEnrolled:false');
  expect(context).toContain('biometricEnabled:false');
 });
});
