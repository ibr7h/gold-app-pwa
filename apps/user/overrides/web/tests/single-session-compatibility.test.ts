import {beforeEach,describe,expect,it,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,
 setItem:async(k:string,v:string)=>{memory.set(k,v);},
 removeItem:async(k:string)=>{memory.delete(k);},
 multiRemove:async(keys:string[])=>keys.forEach(k=>memory.delete(k)),
}}));
vi.mock('../session-vault',()=>({
 clearSessionVault:vi.fn(async()=>{memory.delete('dhahabi_user_session_vault_v1');}),
 closeSessionVault:vi.fn(),
 hasSessionVault:vi.fn(async()=>memory.has('dhahabi_user_session_vault_v1')),
 persistVaultSession:vi.fn(async()=>{}),
}));
import {clearSession,pendingSessionReplacement,saveSession,wasSessionReplaced,
 SESSION_REPLACED_MESSAGE,isSessionReplaced,ApiError} from '../api';
describe('single session device replacement preserves local biometric and PIN',()=>{
 beforeEach(async()=>{memory.clear();await clearSession(false);});
 it('revokes in-memory tokens without erasing saved biometric, quick PIN or vault',async()=>{
  memory.set('dhahabi_user_session_vault_v1','encrypted-old-session');
  memory.set('dhahabi_user_local_biometric_v1','public-credential');
  memory.set('dhahabi_user_quick_pin_v1','hashed-pin');
  await clearSession(true,true);
  expect(wasSessionReplaced()).toBe(true);
  expect(await pendingSessionReplacement()).toBe(true);
  expect(memory.get('dhahabi_user_session_vault_v1')).toBe('encrypted-old-session');
  expect(memory.get('dhahabi_user_local_biometric_v1')).toBe('public-credential');
  expect(memory.get('dhahabi_user_quick_pin_v1')).toBe('hashed-pin');
  expect(SESSION_REPLACED_MESSAGE).toContain('جهاز');
 });
 it('removes replacement prompt after password login while preserving local factors',async()=>{
  await clearSession(true,true);
  await saveSession({accessToken:'new-access',refreshToken:'new-refresh'});
  expect(await pendingSessionReplacement()).toBe(false);
  expect(wasSessionReplaced()).toBe(false);
 });
 it('distinguishes server-side replacement from offline and unrelated 401',()=>{
  expect(isSessionReplaced(new ApiError('Session replaced by a sign-in on another device',401))).toBe(true);
  expect(isSessionReplaced(new ApiError('Invalid refresh token',401))).toBe(false);
  expect(isSessionReplaced(new ApiError('تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.'))).toBe(false);
 });
});
