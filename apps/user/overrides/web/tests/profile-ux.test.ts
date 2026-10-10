import {describe,expect,it} from 'vitest';
import {profileInitials,profileSince,validateProfileFields} from '../profile-utils';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../ProfilePanel.tsx',import.meta.url).pathname,'utf8');
const workspace=readFileSync(new URL('../UserWorkspace.tsx',import.meta.url).pathname,'utf8');
const css=readFileSync(new URL('../user.css',import.meta.url).pathname,'utf8');

describe('User self-service profile input validation',()=>{
 it('validates display name and optional city without dropping Arabic',()=>{
  expect(validateProfileFields({fullName:'  محمد  أحمد  ',city:'  جازان   '})).toEqual({ok:true,fullName:'محمد أحمد',city:'جازان'});
  expect(validateProfileFields({fullName:'محمد أحمد',city:''})).toEqual({ok:true,fullName:'محمد أحمد',city:''});
  expect(validateProfileFields({fullName:' ',city:'مكة'}).ok).toBe(false);
  expect(validateProfileFields({fullName:'أ'.repeat(81),city:''}).ok).toBe(false);
  expect(validateProfileFields({fullName:'محمد',city:'ج'.repeat(81)}).ok).toBe(false);
  expect(validateProfileFields({fullName:'محمد\u0000',city:''}).ok).toBe(false);
 });
 it('shows initials or a safe fallback and handles missing registration dates',()=>{
  expect(profileInitials('محمد أحمد')).toBe('مأ');
  expect(profileInitials('')).toBe('ذ');
  expect(profileInitials('a@example.com')).toBe('A');
  expect(profileSince(undefined)).toBe('');
  expect(profileSince('invalid')).toBe('');
  expect(profileSince('2026-07-01T09:00:00Z').length).toBeGreaterThan(2);
 });
});
describe('User profile UX integration',()=>{
 it('reads a verified backend profile and updates only its own name/city',()=>{
  expect(source).toContain("api<AccountProfile>('/auth/profile')");
  expect(source).toContain("jsonRequest('PATCH'");
  expect(source).toContain('fullName:valid.fullName,city:valid.city');
  expect(source).toContain("response.email?.toLowerCase()!==email.toLowerCase()");
  expect(source).toContain('response.id!==profile.id');
  expect(source).not.toMatch(/(?:PATCH|updateProfile).*passwordHash/);
 });
 it('keeps verified email and phone read-only with safe explanations',()=>{
  expect(source).toContain('تغيير البريد يتطلب تحققًا آمنًا');
  expect(source).toContain('تغيير الرقم يتطلب تحققًا آمنًا');
  expect(source).not.toMatch(/name="(?:email|phone)"/);
  expect(source).toContain('aria-live="polite"');
  expect(source).toContain('role="alert"');
 });
 it('preserves existing quick unlock, notification controls, and sign-out',()=>{
  expect(workspace).toContain('<ProfilePanel email={email}');
  expect(workspace).toContain('className="dh-profile-security-summary"');
  expect(workspace).toContain('setPinSetup');
  expect(workspace).toContain('enableBiometric()');
  expect(workspace).toContain("navigate('notification-settings')");
  expect(workspace).toContain('dh-profile-signout-button');
  expect(workspace).toContain('onClick={signOut}');
 });
 it('uses touch-friendly focus-visible controls and small screen responsive layout',()=>{
  expect(css).toContain('.gold-web .dh-profile-edit-form input');
  expect(css).toContain('font-size:16px!important');
  expect(css).toContain('.gold-web .dh-profile-shortcuts button:focus-visible');
  expect(css).toContain('@media(max-width:540px)');
 });
});
