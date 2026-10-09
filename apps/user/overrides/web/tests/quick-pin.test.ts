import {beforeEach,describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
const storage=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({
 default:{
  getItem:async(k:string)=>storage.get(k)||null,
  setItem:async(k:string,v:string)=>{storage.set(k,v);},
  removeItem:async(k:string)=>{storage.delete(k);}
 }
}));
import {setQuickPin,hasQuickPin,checkQuickPin,removeQuickPin,PIN_LENGTH} from '../quick-pin';

beforeEach(()=>{
 storage.clear();
 vi.stubGlobal('window',{isSecureContext:true});
 vi.stubGlobal('location',{origin:'https://ibr7h.github.io',hostname:'ibr7h.github.io'});
 vi.stubGlobal('crypto',webcrypto);
});
describe('User quick PIN: hashed, account-scoped, and rate-limited',()=>{
 it('accepts only exactly six ASCII digits and never persists the original code',async()=>{
  expect(PIN_LENGTH).toBe(6);
  await expect(setQuickPin('user-1','1234')).rejects.toThrow();
  await expect(setQuickPin('user-1','١٢٣٤٥٦')).rejects.toThrow();
  await setQuickPin('user-1','406195');
  const saved=[...storage.values()].join('');
  expect(saved).not.toContain('406195');
  expect(saved).toContain('salt');
  expect(saved).toContain('hash');
  expect(await hasQuickPin('user-1')).toBe(true);
  expect(await hasQuickPin('user-2')).toBe(false);
 });
 it('only unlocks a saved session for the same account and only with the right PIN',async()=>{
  await setQuickPin('account','406195');
  expect((await checkQuickPin('other','406195')).ok).toBe(false);
  expect((await checkQuickPin('account','000000')).ok).toBe(false);
  const good=await checkQuickPin('account','406195');
  expect(good.ok).toBe(true);
  await removeQuickPin('other');
  expect(await hasQuickPin('account')).toBe(true);
  await removeQuickPin('account');
  expect(await hasQuickPin('account')).toBe(false);
 });
 it('throttles five wrong entries and persists a fifteen-minute lockout',async()=>{
  await setQuickPin('account','406195');
  for(let i=0;i<4;i++){
   const r=await checkQuickPin('account','999999');
   expect(r.ok).toBe(false);
   expect(r.remaining).toBe(4-i);
  }
  const blocked=await checkQuickPin('account','999999');
  expect(blocked.ok).toBe(false);
  expect(blocked.waitSeconds).toBeGreaterThanOrEqual(14*60);
  const correct=await checkQuickPin('account','406195');
  expect(correct.ok).toBe(false);
  expect(correct.waitSeconds).toBeGreaterThan(0);
 });
});
