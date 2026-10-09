import {describe,it,expect} from 'vitest';
import {classifyPush,PushConditions,humanStatus} from '../push-status';
const base:PushConditions={supported:true,iosInstallRequired:false,permission:'granted',serverReachable:true,serverConfigured:true,localSubscribed:true,serverRegistered:true};
describe('Web Push health does not overclaim device delivery',()=>{
 it('requires OS permission, local subscription AND a server record for ready',()=>{
  expect(classifyPush(base)).toBe('ready');
  expect(classifyPush({...base,serverRegistered:false})).toBe('server-missing');
  expect(classifyPush({...base,localSubscribed:false})).toBe('subscription-missing');
  expect(classifyPush({...base,permission:'default'})).toBe('permission-required');
  expect(classifyPush({...base,permission:'denied'})).toBe('blocked');
 });
 it('requires home-screen installation on iOS and handles unsupported browsers',()=>{
  expect(classifyPush({...base,iosInstallRequired:true})).toBe('install-required');
  expect(classifyPush({...base,supported:false})).toBe('unsupported');
 });
 it('does not treat a missing backend as a valid push subscription',()=>{
  expect(classifyPush({...base,serverReachable:false})).toBe('server-unavailable');
  expect(classifyPush({...base,serverConfigured:false})).toBe('not-configured');
  expect(humanStatus('ready')).toMatch(/الخادم/);
 });
});
