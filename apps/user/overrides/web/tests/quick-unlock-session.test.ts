import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,setItem:async(k:string,v:string)=>{memory.set(k,v);},removeItem:async(k:string)=>{memory.delete(k);},
 multiRemove:async(keys:string[])=>{keys.forEach(k=>memory.delete(k));}
}}));
import {clearSession,saveSession,lockSession,api,activeSessionTokens,hasSession,saveVerifiedUser,getVerifiedCachedUser} from '../api';
import {protectSessionWithPin,unlockSessionWithPin,persistVaultDeviceGrant} from '../session-vault';
import {verifyQuickUnlock} from '../quick-unlock-session';
const tokens={accessToken:'access-fixture',refreshToken:'refresh-fixture'};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
beforeEach(async()=>{
 vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('window',{isSecureContext:true});vi.stubGlobal('location',{origin:'https://ibr7h.github.io'});
 await clearSession();await saveSession(tokens);await protectSessionWithPin('account','406195',tokens);lockSession();
});
afterEach(()=>vi.unstubAllGlobals());
describe('quick-unlock authentication state machine',()=>{
 it('blocks account data while locked, then verifies the decrypted session with the server',async()=>{
  const fetch=vi.fn(async(_url:string,_options:RequestInit)=>response({userId:'account',email:'user@example.test',role:'user'}));vi.stubGlobal('fetch',fetch);
  await expect(api('/portfolio')).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
  const restored=await unlockSessionWithPin('account','406195');
  expect(await verifyQuickUnlock('account',restored,()=>true)).toEqual({id:'account',email:'user@example.test',role:'user'});
  expect(fetch.mock.calls[0][0]).toMatch(/\/auth\/me$/);
  expect(new Headers(fetch.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer access-fixture');
  expect(activeSessionTokens()).toEqual(tokens);
 });
 it('restores the real name from the profile after PIN unlock and caches it for a later cold start',async()=>{
  const fetch=vi.fn(async(url:string)=>url.endsWith('/auth/profile')
   ?response({id:'account',fullName:'الاسم الكامل',email:'user@example.test'})
   :response({userId:'account',email:'user@example.test',role:'user'}));
  vi.stubGlobal('fetch',fetch);
  const recovered=await verifyQuickUnlock('account',tokens,()=>true);
  expect(recovered.name).toBe('الاسم الكامل');
  expect((await getVerifiedCachedUser())?.name).toBe('الاسم الكامل');
  expect(fetch.mock.calls.some(x=>String(x[0]).endsWith('/auth/profile'))).toBe(true);
 });
 it('uses an account-matched cached name when profile temporarily cannot load',async()=>{
  await saveVerifiedUser({id:'account',email:'user@example.test',role:'user',name:'اسم محفوظ'});
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
   if(url.endsWith('/auth/profile'))throw new Error('Temporary connection issue');
   return response({userId:'account',email:'user@example.test',role:'user'});
  }));
  const recovered=await verifyQuickUnlock('account',tokens,()=>true);
  expect(recovered.name).toBe('اسم محفوظ');
  expect((await getVerifiedCachedUser())?.name).toBe('اسم محفوظ');
 });
 it('never copies a cached name from a different account after a verified unlock',async()=>{
  await saveVerifiedUser({id:'other',email:'other@example.test',role:'user',name:'اسم حساب آخر'});
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('/auth/profile')
    ?response({id:'account',fullName:null})
    :response({userId:'account',email:'user@example.test',role:'user'})));
  expect((await verifyQuickUnlock('account',tokens,()=>true)).name).toBeUndefined();
 });
 it.each([{userId:'other',role:'user'},{userId:'account',role:'admin'},{userId:'account',role:'merchant'}])('rejects an account or role mismatch: %j',async identity=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response({...identity,email:'user@example.test'})));
  await expect(verifyQuickUnlock('account',tokens,()=>true)).rejects.toThrow();
  expect(await hasSession()).toBe(false);expect(memory.has('dhahabi_user_session_vault_v1')).toBe(false);
 });
 it('preserves encrypted factors but blocks account data if expired refresh has no device grant',async()=>{
  const fetch=vi.fn(async(_url:string,_options:RequestInit)=>response({message:'Invalid refresh token'},401));
  vi.stubGlobal('fetch',fetch);
  await expect(verifyQuickUnlock('account',tokens,()=>true)).rejects.toThrow();
  expect(memory.has('dhahabi_user_session_vault_v1')).toBe(true);
  await expect(api('/portfolio')).rejects.toThrow();
  expect(fetch.mock.calls.every(call=>!String(call[0]).endsWith('/auth/device/renew'))).toBe(true);
 });
 it('issues fresh server tokens from an enrolled device after refresh expires',async()=>{
  const grant={deviceId:'00000000-0000-4000-8000-000000000021',
   secret:'A'.repeat(43),expiresAt:'2027-01-01T00:00:00.000Z'};
  await persistVaultDeviceGrant('account',grant);
  const fetch=vi.fn(async(url:string,options:RequestInit)=>{
   if(url.endsWith('/auth/refresh'))return response({message:'Session has expired'},401);
   if(url.endsWith('/auth/device/renew')){
    expect(JSON.parse(String(options.body))).toMatchObject({deviceId:grant.deviceId,secret:grant.secret});
    return response({accessToken:'fresh-access',refreshToken:'fresh-refresh',deviceGrant:{...grant}});
   }
   if(url.endsWith('/auth/me'))
    return new Headers(options.headers).get('Authorization')==='Bearer fresh-access'
     ?response({userId:'account',email:'user@example.test',role:'user'})
     :response({message:'Session has expired'},401);
   if(url.endsWith('/auth/profile'))return response({id:'account',fullName:'مستخدم موثوق'});
   throw new Error('Unexpected endpoint: '+url);
  });
  vi.stubGlobal('fetch',fetch);
  const restored=await unlockSessionWithPin('account','406195');
  expect((await verifyQuickUnlock('account',restored,()=>true)).name).toBe('مستخدم موثوق');
  expect(activeSessionTokens()).toEqual({accessToken:'fresh-access',refreshToken:'fresh-refresh'});
  expect(fetch.mock.calls.filter(call=>String(call[0]).endsWith('/auth/device/renew'))).toHaveLength(1);
 });
 it('rejects an expired or revoked trusted-device grant without opening account data',async()=>{
  await persistVaultDeviceGrant('account',{deviceId:'00000000-0000-4000-8000-000000000022',
   secret:'B'.repeat(43),expiresAt:'2027-01-01T00:00:00.000Z'});
  vi.stubGlobal('fetch',vi.fn(async()=>response({message:'Device credential revoked'},401)));
  await expect(verifyQuickUnlock('account',tokens,()=>true)).rejects.toThrow();
  expect(memory.has('dhahabi_user_session_vault_v1')).toBe(true);
  await expect(api('/portfolio')).rejects.toThrow();
 });
 it('does not unlock when the user switches account or logs out during the server check',async()=>{
  let finish!:(value:Response)=>void;
  vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>{finish=resolve;})));
  const pending=verifyQuickUnlock('account',tokens,()=>true);await new Promise(r=>setTimeout(r,0));
  await clearSession();finish(response({userId:'account',role:'user',email:'user@example.test'}));
  await expect(pending).rejects.toThrow();expect(await hasSession()).toBe(false);
 });
 it('rejects a canceled biometric/PIN attempt before attaching tokens',async()=>{
  await clearSession();const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  await expect(verifyQuickUnlock('account',tokens,()=>false)).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
  expect(await hasSession()).toBe(false);
 });
});
