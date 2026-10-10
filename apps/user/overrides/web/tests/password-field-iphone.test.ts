import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const form=readFileSync(new URL('../AuthForm.tsx',import.meta.url).pathname,'utf8');
const phone=readFileSync(new URL('../registration-phone.ts',import.meta.url).pathname,'utf8');
const css=readFileSync(new URL('../user.css',import.meta.url).pathname,'utf8');
const lockJs=readFileSync(new URL('../../../scripts/iphone-preview-lock.js',import.meta.url).pathname,'utf8');
const lockCss=readFileSync(new URL('../../../scripts/iphone-preview-lock.css',import.meta.url).pathname,'utf8');

describe('iPhone registration / login password field UX',()=>{
 it('validates via a single normalized mobile helper rather than double-escaped inline regex',()=>{
  expect(form).toContain("normalizeRegistrationPhone(phone)");
  expect(phone).toContain(String.raw`^05\d{8}$`);
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
 it('prevents the keyboard from hiding the auth form without unlocking outer document scrolling',()=>{
  expect(lockJs).toContain("root.classList.toggle('dh-iphone-auth-editing', authEditing)");
  expect(lockJs).toContain("root.style.removeProperty('--dh-preview-height')");
  expect(lockJs).toContain('keepAuthFieldVisible()');
  expect(lockJs).toContain('auth.scrollTop += adjustment');
  expect(lockCss).toContain('.dh-iphone-auth-editing #root > .gold-auth');
  expect(lockCss).toContain('overflow-y: auto !important;');
  expect(lockCss).toContain('padding-bottom: max(32px, var(--dh-auth-keyboard-inset, 0px))');
  expect(lockJs).toContain("document.addEventListener('gesturestart', blockGesture");
 });
 it('avoids automatic Safari focus-zoom and exposes 44px reveal targets',()=>{
  expect(css).toContain('.gold-auth .mockup-input-wrap .form-input[type="password"]');
  expect(css).toContain('font-size:16px!important;');
  expect(css).toContain('min-width:44px!important;');
  expect(form).toContain('dir="ltr" ref={passwordRef}');
 });
});
