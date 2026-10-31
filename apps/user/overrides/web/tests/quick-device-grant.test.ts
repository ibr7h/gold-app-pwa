import {describe,expect,it} from 'vitest';
import {needsQuickDeviceEnrollment} from '../quick-device-grant';
import type {DeviceGrant} from '../session-vault';
const now=Date.UTC(2026,9,31,10);
const grant=(expiresAt:string):DeviceGrant=>({
 deviceId:'00000000-0000-4000-8000-000000000021',
 secret:'A'.repeat(43),expiresAt
});
const days=(n:number)=>new Date(now+n*86400000).toISOString();

describe('trusted device grant maintenance after verified local unlock',()=>{
 it('enrolls if no grant, invalid date, expired, or expiring within 7 days',()=>{
  expect(needsQuickDeviceEnrollment(null,now)).toBe(true);
  expect(needsQuickDeviceEnrollment(grant('not-a-date'),now)).toBe(true);
  expect(needsQuickDeviceEnrollment(grant(days(-1)),now)).toBe(true);
  expect(needsQuickDeviceEnrollment(grant(days(1)),now)).toBe(true);
  expect(needsQuickDeviceEnrollment(grant(days(7)),now)).toBe(true);
 });
 it('retains an active grant with more than a week left to avoid revocation churn',()=>{
  expect(needsQuickDeviceEnrollment(grant(days(8)),now)).toBe(false);
  expect(needsQuickDeviceEnrollment(grant(days(90)),now)).toBe(false);
 });
 it('never authorizes server access or session creation by itself',()=>{
  expect(Object.keys({deviceId:'public',secret:'sensitive',expiresAt:days(90)}))
   .toEqual(['deviceId','secret','expiresAt']);
  // This pure helper only requests *re-enrollment* after server authorization.
  expect(needsQuickDeviceEnrollment(grant(days(0)),now)).toBe(true);
 });
});
