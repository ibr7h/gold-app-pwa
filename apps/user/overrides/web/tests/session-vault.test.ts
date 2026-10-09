import {describe,it,expect,vi,beforeEach} from 'vitest';
import {webcrypto} from 'node:crypto';
const storage=vi.hoisted(()=>new Map<string,string>());
const device=vi.hoisted(()=>({key:null as CryptoKey|null,available:true}));
vi.mock('../device-key',()=>({getSessionKey:async()=>{
 if(!device.available)throw new Error('unavailable');
 if(!device.key)device.key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']) as CryptoKey;
 return device.key;
}}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>storage.get(k)||null,
 setItem:async(k:string,v:string)=>{storage.set(k,v);},removeItem:async(k:string)=>{storage.delete(k);},multiRemove:async(keys:string[])=>keys.forEach(k=>storage.delete(k))}}));
const VAULT='dhahabi_user_session_vault_v1',ACCESS='dhahabi_user_access_token',REFRESH='dhahabi_user_refresh_token';
const tokens={accessToken:'access-secret-fixture',refreshToken:'refresh-secret-fixture'};
beforeEach(()=>{vi.resetModules();storage.clear();device.key=null;device.available=true;vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('location',{origin:'https://ibr7h.github.io'});});
describe('encrypted User session at rest',()=>{
 it('persists only authenticated ciphertext and restores the exact session after reload',async()=>{
  const vault=await import('../session-vault');await vault.writeSessionTokens(tokens);
  const saved=storage.get(VAULT)!;expect(saved).not.toContain(tokens.accessToken);expect(saved).not.toContain(tokens.refreshToken);
  expect(storage.has(ACCESS)).toBe(false);expect(storage.has(REFRESH)).toBe(false);expect(device.key?.extractable).toBe(false);
  await expect(webcrypto.subtle.exportKey('raw',device.key!)).rejects.toThrow();
  vi.resetModules();expect(await (await import('../session-vault')).readSessionTokens()).toEqual(tokens);
 });
 it('migrates legacy credentials even before a quick lock is presented, without deleting other records',async()=>{
  storage.set(ACCESS,tokens.accessToken);storage.set(REFRESH,tokens.refreshToken);storage.set('push-fixture','keep');storage.set('portfolio-fixture','keep');
  const vault=await import('../session-vault');expect(await vault.storedSessionExists()).toBe(true);
  expect(storage.has(ACCESS)).toBe(false);expect(storage.has(REFRESH)).toBe(false);
  expect(storage.get('push-fixture')).toBe('keep');expect(storage.get('portfolio-fixture')).toBe('keep');
  expect(await vault.readSessionTokens()).toEqual(tokens);
 });
 it('randomizes ciphertext for the same session on each write',async()=>{
  const vault=await import('../session-vault');await vault.writeSessionTokens(tokens);const first=storage.get(VAULT);await vault.writeSessionTokens(tokens);expect(storage.get(VAULT)).not.toBe(first);
 });
 it('rejects corrupted ciphertext without returning reusable credentials',async()=>{
  await (await import('../session-vault')).writeSessionTokens(tokens);const envelope=JSON.parse(storage.get(VAULT)!);
  const bytes=Buffer.from(envelope.data,'base64');bytes[0]^=1;envelope.data=bytes.toString('base64');storage.set(VAULT,JSON.stringify(envelope));
  vi.resetModules();await expect((await import('../session-vault')).readSessionTokens()).rejects.toThrow();
 });
 it('rejects a ciphertext copied to another origin',async()=>{
  await (await import('../session-vault')).writeSessionTokens(tokens);vi.resetModules();vi.stubGlobal('location',{origin:'https://attacker.example'});
  await expect((await import('../session-vault')).readSessionTokens()).rejects.toThrow();
 });
 it('fails to tab-only password login when durable secure storage is unsupported',async()=>{
  device.available=false;const vault=await import('../session-vault');await vault.writeSessionTokens(tokens);
  expect(storage.size).toBe(0);expect(await vault.readSessionTokens()).toEqual(tokens);vi.resetModules();expect(await (await import('../session-vault')).storedSessionExists()).toBe(false);
 });
 it('loss of the device key requires password recovery and never falls back to raw tokens',async()=>{
  await (await import('../session-vault')).writeSessionTokens(tokens);device.available=false;vi.resetModules();
  await expect((await import('../session-vault')).readSessionTokens()).rejects.toThrow();expect([...storage.values()].join('')).not.toContain(tokens.refreshToken);
 });
 it('logout removes only User session tokens, preserving PIN and subscription records',async()=>{
  const vault=await import('../session-vault');await vault.writeSessionTokens(tokens);storage.set('dhahabi_user_quick_pin_v1','hashed-fixture');storage.set('push-fixture','keep');
  await vault.eraseSessionTokens();expect(await vault.readSessionTokens()).toBeNull();expect(storage.get('push-fixture')).toBe('keep');expect(storage.get('dhahabi_user_quick_pin_v1')).toBe('hashed-fixture');
 });
});
