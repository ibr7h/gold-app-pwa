import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const form=readFileSync(new URL('../AuthForm.tsx',import.meta.url).pathname,'utf8');
const phone=readFileSync(new URL('../international-phone.ts',import.meta.url).pathname,'utf8');
const css=readFileSync(new URL('../user.css',import.meta.url).pathname,'utf8');

describe('iPhone registration / login password field UX',()=>{
 it('validates via a single normalized mobile helper rather than double-escaped inline regex',()=>{
  expect(form).toContain("readInternationalPhone(phone,phoneCountry)");
  expect(phone).toContain('parsePhoneNumberFromString');
  expect(form).not.toContain('if(register&&!/^(?:05');
 });
 it('keeps separate stable password and confirmation field refs',()=>{
  expect(form).toContain('passwordRef=useRef<HTMLInputElement|null>(null)');
  expect(form).toContain('confirmRef=useRef<HTMLInputElement|null>(null)');
  expect(form).toContain('ref={passwordRef}');
  expect(form).toContain('ref={confirmRef}');
  expect(form).toContain('confirmVisible');
  expect(form).toContain('aria-pressed={visible}');
  expect(form).toContain('aria-pressed={confirmVisible}');
  expect(form).toContain('onPointerDown={e=>e.preventDefault()}');
  expect(form).toContain('document.activeElement!==input');
 });
 it('maintains nonzooming readable password controls in the web bundle',()=>{
  expect(form).toContain('toggleSecret(passwordRef.current,setVisible)');
  expect(form).toContain('toggleSecret(confirmRef.current,setConfirmVisible)');
  expect(css).toContain('font-size:16px!important;');
 });
 it('avoids automatic Safari focus-zoom and exposes 44px reveal targets',()=>{
  expect(css).toContain('.gold-auth .mockup-input-wrap .form-input[type="password"]');
  expect(css).toContain('font-size:16px!important;');
  expect(css).toContain('min-width:44px!important;');
  expect(form).toContain('dir="ltr" ref={passwordRef}');
 });
});
