import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,setItem:async(k:string,v:string)=>{memory.set(k,v);},removeItem:async(k:string)=>{memory.delete(k);}
}}));
import {protectSessionWithPin,protectSessionWithBiometric,unlockSessionWithPin,unlockSessionWithBiometric,persistVaultSession,clearSessionVault,closeSessionVault,hasSessionVault,hasOpenVault,removeVaultMethod} from '../session-vault';
const tokens={accessToken:'private-access-fixture',refreshToken:'private-refresh-fixture'};
const secret=new Uint8Array(32).fill(41);
beforeEach(async()=>{
 await clearSessionVault();memory.clear();vi.stubGlobal('window',{isSecureContext:true});
 vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('location',{origin:'https://ibr7h.github.io'});
});
afterEach(()=>vi.unstubAllGlobals());
describe('encrypted User session persistence',()=>{
 it('stores neither PIN, tokens, nor data key, and restores after memory is discarded',async()=>{
  await protectSessionWithPin('account','406195',tokens);
  const stored=[...memory.values()].join('');
  for(const value of ['406195',tokens.accessToken,tokens.refreshToken,'rawKey'])expect(stored).not.toContain(value);
  closeSessionVault();expect(hasOpenVault('account')).toBe(false);
  expect(await unlockSessionWithPin('account','406195')).toEqual(tokens);
 });
 it('rejects wrong PIN, tampered ciphertext, a different account and a different origin',async()=>{
  await protectSessionWithPin('account','406195',tokens);closeSessionVault();
  await expect(unlockSessionWithPin('account','999999')).rejects.toThrow();
  await expect(unlockSessionWithPin('other','406195')).rejects.toThrow();
  const saved=memory.get('dhahabi_user_session_vault_v1')!;
  const v=JSON.parse(saved);v.session.cipher='00'+v.session.cipher.slice(2);
  memory.set('dhahabi_user_session_vault_v1',JSON.stringify(v));
  await expect(unlockSessionWithPin('account','406195')).rejects.toThrow();
  memory.set('dhahabi_user_session_vault_v1',saved);
  vi.stubGlobal('location',{origin:'https://another.example'});
  expect(await hasSessionVault('account')).toBe(false);
  await expect(unlockSessionWithPin('account','406195')).rejects.toThrow();
 });
 it('keeps both factors valid after refresh-token rotation and PIN change',async()=>{
  await protectSessionWithPin('account','406195',tokens);
  await protectSessionWithBiometric('account',secret,tokens);
  const rotated={accessToken:'rotated-access',refreshToken:'rotated-refresh'};
  await persistVaultSession(rotated);closeSessionVault();
  expect(await unlockSessionWithBiometric('account',secret)).toEqual(rotated);
  await protectSessionWithPin('account','918273',rotated);closeSessionVault();
  await expect(unlockSessionWithPin('account','406195')).rejects.toThrow();
  expect(await unlockSessionWithPin('account','918273')).toEqual(rotated);closeSessionVault();
  expect(await unlockSessionWithBiometric('account',secret)).toEqual(rotated);
 });
 it('requires PIN/password after restart when the browser lacks authenticator PRF',async()=>{
  await protectSessionWithPin('account','406195',tokens);
  expect(await unlockSessionWithBiometric('account',null)).toEqual(tokens);
  closeSessionVault();await expect(unlockSessionWithBiometric('account',null)).rejects.toThrow();
 });
 it('removes only the selected factor and clears keys when the last factor is disabled',async()=>{
  await protectSessionWithPin('account','406195',tokens);
  await protectSessionWithBiometric('account',secret,tokens);
  await removeVaultMethod('other','pin');expect(await hasSessionVault('account')).toBe(true);
  await removeVaultMethod('account','pin');closeSessionVault();
  await expect(unlockSessionWithPin('account','406195')).rejects.toThrow();
  expect(await unlockSessionWithBiometric('account',secret)).toEqual(tokens);
  await removeVaultMethod('account','biometric');expect(await hasSessionVault()).toBe(false);
  expect(hasOpenVault('account')).toBe(false);
 });
 it('cannot resurrect persisted credentials when logout races with enrollment',async()=>{
  const pending=protectSessionWithPin('account','406195',tokens);
  const failed=expect(pending).rejects.toThrow();await clearSessionVault();await failed;
  expect(memory.size).toBe(0);expect(hasOpenVault('account')).toBe(false);
 });
 it('fails safely without a secure context',async()=>{
  vi.stubGlobal('window',{isSecureContext:false});
  await expect(protectSessionWithPin('account','406195',tokens)).rejects.toThrow();
  expect(await hasSessionVault()).toBe(false);
 });
});
