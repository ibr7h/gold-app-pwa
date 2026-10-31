import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {fileURLToPath,URL} from 'node:url';
const memory=vi.hoisted(()=>new Map<string,string>());
const faults=vi.hoisted(()=>({failNextKey:''}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,
 setItem:async(k:string,v:string)=>{if(faults.failNextKey===k){faults.failNextKey='';throw new Error('Simulated interrupted storage write');}memory.set(k,v);},
 removeItem:async(k:string)=>{memory.delete(k);}
}}));
import {
 clearSessionVault,closeSessionVault,hasBiometricVault,protectSessionWithPin,
 protectSessionWithBiometric,promoteSessionBiometric,unlockSessionWithPin,unlockSessionWithBiometric,
 persistVaultSession,persistVaultDeviceGrant,readVaultDeviceGrant
} from '../session-vault';
import {BiometricUnlockTimeoutError,withBiometricUnlockDeadline} from '../biometric-unlock-deadline';
import {persistLocalCredential,type LocalCredential} from '../local-biometric';
const tokens={accessToken:'access-fixture',refreshToken:'refresh-fixture'};
const pin='492751',newPin='361804',bioSecret=new Uint8Array(32).fill(43);
const key='dhahabi_user_session_vault_v1';
const credentialKey='dhahabi_user_local_biometric_v1';
const oldSecret=new Uint8Array(32).fill(55),nextSecret=new Uint8Array(32).fill(77);
const localCredential=(credentialId:string):LocalCredential=>({version:1,accountId:'person',
 email:'person@example.test',rpId:'app.dhahabk.com',credentialId,
 publicKeySpki:'public-fixture',counter:0});

beforeEach(async()=>{
 vi.stubGlobal('crypto',webcrypto);
 vi.stubGlobal('window',{isSecureContext:true});
 vi.stubGlobal('location',{origin:'https://app.dhahabk.com'});
 await clearSessionVault();memory.clear();faults.failNextKey='';
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

describe('Saved PIN reconnection to fresh password session',()=>{
 it('reseals fresh tokens with the existing vault key without replacing PIN, Face ID or trusted-device grant',async()=>{
  const grant={deviceId:'00000000-0000-4000-8000-000000000021',
   secret:'A'.repeat(43),expiresAt:'2027-01-01T00:00:00.000Z'};
  await protectSessionWithPin('person',pin,tokens);
  await protectSessionWithBiometric('person',bioSecret,tokens);
  await persistVaultDeviceGrant('person',grant);
  closeSessionVault();
  expect(await unlockSessionWithPin('person',pin)).toEqual(tokens);
  const newTokens={accessToken:'fresh-password-access',refreshToken:'fresh-password-refresh'};
  await persistVaultSession(newTokens);
  closeSessionVault();
  expect(await unlockSessionWithBiometric('person',bioSecret)).toEqual(newTokens);
  expect(await readVaultDeviceGrant('person')).toEqual(grant);
  closeSessionVault();
  expect(await unlockSessionWithPin('person',pin)).toEqual(newTokens);
 });
 it('uses PIN verification, not only an old decrypted JWT, before restoring the new session',()=>{
  const auth=readFileSync(fileURLToPath(new URL('../../contexts/AuthContext.web.tsx',import.meta.url)),'utf8');
  const procedure=auth.split('const reconnectQuickPin=async(')[1]?.split('const disableQuickPin=async(')[0];
  expect(procedure).toContain('await checkQuickPin(accountId,currentPin)');
  expect(procedure).toContain('await unlockSessionWithPin(accountId,currentPin)');
  expect(procedure).toContain('await persistVaultSession(tokens)');
  expect(procedure).toContain('await provisionQuickDevice(accountId,attempt,true)');
 });
});

describe('Interrupted biometric credential migration',()=>{
 it('keeps the old biometric working when saving the replacement credential fails',async()=>{
  await protectSessionWithPin('person',pin,tokens);
  await protectSessionWithBiometric('person',oldSecret,tokens,'old-id');
  await persistLocalCredential(localCredential('old-id'));
  await promoteSessionBiometric('person','old-id');
  const originalCredential=memory.get(credentialKey);
  await protectSessionWithBiometric('person',nextSecret,tokens,'new-id');
  faults.failNextKey=credentialKey;
  await expect(persistLocalCredential(localCredential('new-id'))).rejects.toThrow(/interrupted/);
  expect(memory.get(credentialKey)).toBe(originalCredential);
  closeSessionVault();
  expect(await hasBiometricVault('person','old-id')).toBe(true);
  expect(await unlockSessionWithBiometric('person',oldSecret,'old-id')).toEqual(tokens);
 });
 it('allows new Face ID to unlock after restart before its pending envelope is promoted',async()=>{
  await protectSessionWithPin('person',pin,tokens);
  await protectSessionWithBiometric('person',oldSecret,tokens,'old-id');
  await persistLocalCredential(localCredential('old-id'));
  await promoteSessionBiometric('person','old-id');
  await protectSessionWithBiometric('person',nextSecret,tokens,'new-id');
  await persistLocalCredential(localCredential('new-id'));
  closeSessionVault();
  expect(await hasBiometricVault('person','new-id')).toBe(true);
  expect(await unlockSessionWithBiometric('person',nextSecret,'new-id')).toEqual(tokens);
  await promoteSessionBiometric('person','new-id');
  closeSessionVault();
  expect(await unlockSessionWithBiometric('person',nextSecret,'new-id')).toEqual(tokens);
  expect(await hasBiometricVault('person','old-id')).toBe(false);
 });
 it('recovers from failure of the final promotion storage write',async()=>{
  await protectSessionWithBiometric('person',oldSecret,tokens,'old-id');
  await persistLocalCredential(localCredential('old-id'));
  await promoteSessionBiometric('person','old-id');
  await protectSessionWithBiometric('person',nextSecret,tokens,'new-id');
  await persistLocalCredential(localCredential('new-id'));
  faults.failNextKey=key;
  await expect(promoteSessionBiometric('person','new-id')).rejects.toThrow(/interrupted/);
  closeSessionVault();
  expect(await unlockSessionWithBiometric('person',nextSecret,'new-id')).toEqual(tokens);
 });
 it('retains the active biometric when another re-enrollment is interrupted',async()=>{
  await protectSessionWithBiometric('person',oldSecret,tokens,'old-id');
  await persistLocalCredential(localCredential('old-id'));
  await promoteSessionBiometric('person','old-id');
  await protectSessionWithBiometric('person',nextSecret,tokens,'new-id');
  await persistLocalCredential(localCredential('new-id'));
  await promoteSessionBiometric('person','new-id');
  await protectSessionWithBiometric('person',new Uint8Array(32).fill(88),tokens,'third-id');
  faults.failNextKey=credentialKey;
  await expect(persistLocalCredential(localCredential('third-id'))).rejects.toThrow();
  closeSessionVault();
  expect(await unlockSessionWithBiometric('person',nextSecret,'new-id')).toEqual(tokens);
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
