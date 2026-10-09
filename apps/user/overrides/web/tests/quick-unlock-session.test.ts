import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,setItem:async(k:string,v:string)=>{memory.set(k,v);},removeItem:async(k:string)=>{memory.delete(k);},
 multiRemove:async(keys:string[])=>{keys.forEach(k=>memory.delete(k));}
}}));
import {clearSession,saveSession,lockSession,api,activeSessionTokens,hasSession} from '../api';
import {protectSessionWithPin,unlockSessionWithPin} from '../session-vault';
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
 it.each([{userId:'other',role:'user'},{userId:'account',role:'admin'},{userId:'account',role:'merchant'}])('rejects an account or role mismatch: %j',async identity=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response({...identity,email:'user@example.test'})));
  await expect(verifyQuickUnlock('account',tokens,()=>true)).rejects.toThrow();
  expect(await hasSession()).toBe(false);expect(memory.has('dhahabi_user_session_vault_v1')).toBe(false);
 });
 it('requires password when the server rejects an expired refresh session',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response({message:'Invalid refresh token'},401)));
  await expect(verifyQuickUnlock('account',tokens,()=>true)).rejects.toThrow();expect(await hasSession()).toBe(false);
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
