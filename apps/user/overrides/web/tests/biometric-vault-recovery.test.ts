import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,
 setItem:async(k:string,v:string)=>{memory.set(k,v);},
 removeItem:async(k:string)=>{memory.delete(k);}
}}));
import {
 clearSessionVault,closeSessionVault,hasBiometricVault,protectSessionWithPin,
 protectSessionWithBiometric,unlockSessionWithPin,unlockSessionWithBiometric
} from '../session-vault';
import {BiometricUnlockTimeoutError,withBiometricUnlockDeadline} from '../biometric-unlock-deadline';
const tokens={accessToken:'access-fixture',refreshToken:'refresh-fixture'};
const pin='492751',newPin='361804',bioSecret=new Uint8Array(32).fill(43);
const key='dhahabi_user_session_vault_v1';

beforeEach(async()=>{
 vi.stubGlobal('crypto',webcrypto);
 vi.stubGlobal('window',{isSecureContext:true});
 vi.stubGlobal('location',{origin:'https://app.dhahabk.com'});
 await clearSessionVault();memory.clear();
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});

describe('PIN and biometric must share one recoverable vault key',()=>{
 it('fails closed when biometric enrollment follows PIN on a newly opened tab; old PIN and vault survive',async()=>{
  await protectSessionWithPin('person',pin,tokens);
  const unchanged=memory.get(key);
  closeSessionVault();
  await expect(protectSessionWithBiometric('person',bioSecret,tokens)).rejects.toThrow(/افتح الجلسة أولًا/);
  expect(memory.get(key)).toBe(unchanged);
  expect(await unlockSessionWithPin('person',pin)).toEqual(tokens);
  await protectSessionWithBiometric('person',bioSecret,tokens);
  closeSessionVault();
  expect(await unlockSessionWithBiometric('person',bioSecret)).toEqual(tokens);
  closeSessionVault();
  expect(await unlockSessionWithPin('person',pin)).toEqual(tokens);
 });
 it('changing PIN while vault is closed cannot silently invalidate a working biometric key',async()=>{
  await protectSessionWithPin('person',pin,tokens);
  await protectSessionWithBiometric('person',bioSecret,tokens);
  const unchanged=memory.get(key);
  closeSessionVault();
  await expect(protectSessionWithPin('person',newPin,tokens)).rejects.toThrow(/افتح الجلسة أولًا/);
  expect(memory.get(key)).toBe(unchanged);
  expect(await unlockSessionWithBiometric('person',bioSecret)).toEqual(tokens);
  await protectSessionWithPin('person',newPin,tokens);
  closeSessionVault();
  expect(await unlockSessionWithPin('person',newPin)).toEqual(tokens);
  closeSessionVault();
  expect(await unlockSessionWithBiometric('person',bioSecret)).toEqual(tokens);
 });
 it('never removes an existing local biometric envelope when PIN reconnection is denied',async()=>{
  await protectSessionWithBiometric('person',bioSecret,tokens);
  closeSessionVault();
  expect(await hasBiometricVault('person')).toBe(true);
  await expect(protectSessionWithPin('person',pin,tokens)).rejects.toThrow();
  expect(await hasBiometricVault('person')).toBe(true);
  expect(await unlockSessionWithBiometric('person',bioSecret)).toEqual(tokens);
 });
});

describe('Face ID quick-unlock deadline',()=>{
 it('aborts the native prompt and rejects even when it never settles',async()=>{
  vi.useFakeTimers();
  const controller=new AbortController();
  const unresolved=new Promise<boolean>(()=>{});
  const result=withBiometricUnlockDeadline(unresolved,controller,45);
  const rejection=expect(result).rejects.toBeInstanceOf(BiometricUnlockTimeoutError);
  await vi.advanceTimersByTimeAsync(46);
  await rejection;
  expect(controller.signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
 });
 it('leaves completed biometric authentication alone and cleans its timeout',async()=>{
  vi.useFakeTimers();
  const controller=new AbortController();
  expect(await withBiometricUnlockDeadline(Promise.resolve(true),controller,65000)).toBe(true);
  expect(controller.signal.aborted).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
 });
 it('ignores a late promise resolution after the timeout was already reported',async()=>{
  vi.useFakeTimers();
  let finish!:(value:boolean)=>void;
  const pending=new Promise<boolean>(resolve=>{finish=resolve;});
  const controller=new AbortController();
  const completed=withBiometricUnlockDeadline(pending,controller,10);
  const rejection=expect(completed).rejects.toBeInstanceOf(BiometricUnlockTimeoutError);
  await vi.advanceTimersByTimeAsync(11);
  await rejection;
  finish(true);
  await Promise.resolve();
  expect(controller.signal.aborted).toBe(true);
 });
});
