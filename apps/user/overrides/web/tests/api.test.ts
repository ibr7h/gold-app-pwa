import {beforeEach,describe,it,expect,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{removeItem:async(k:string)=>{memory.delete(k);},getItem:async(k:string)=>memory.get(k)||null,setItem:async(k:string,v:string)=>{memory.set(k,v);},multiSet:async(pairs:string[][])=>pairs.forEach(([k,v])=>memory.set(k,v)),multiRemove:async(keys:string[])=>keys.forEach(k=>memory.delete(k))}}));
import {api,saveSession,clearSession,getVerifiedCachedUser,saveVerifiedUser,activeSessionTokens,authenticate,lockSession} from '../api';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status});
beforeEach(async()=>{await clearSession();vi.restoreAllMocks();await saveSession({accessToken:'expired',refreshToken:'refresh-fixture'});});
describe('sessions',()=>{
 it('refreshes concurrent requests once',async()=>{let refreshes=0;vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{if(url.endsWith('/auth/refresh')){refreshes++;await new Promise(r=>setTimeout(r,10));return json({accessToken:'fresh',refreshToken:'rotated'});}return new Headers(options.headers).get('Authorization')==='Bearer fresh'?json({ok:true}):json({message:'expired'},401);}));expect(await Promise.all([api('/portfolio'),api('/alerts')])).toEqual([{ok:true},{ok:true}]);expect(refreshes).toBe(1);});
 it('clears rejected refresh credentials',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>json({message:'Invalid refresh token'},401)));await expect(api('/auth/me')).rejects.toThrow();expect(memory.size).toBe(0);});
 it('retains tokens in memory after network failure and never retries a write blindly',async()=>{const fn=vi.fn(async()=>{throw new TypeError('network');});vi.stubGlobal('fetch',fn);await expect(api('/portfolio',{method:'POST',body:'{}'})).rejects.toThrow();expect(fn).toHaveBeenCalledTimes(1);expect(activeSessionTokens().refreshToken).toBe('refresh-fixture');expect(memory.has('dhahabi_user_refresh_token')).toBe(false);});
 it('rejects a response arriving after logout',async()=>{let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>release=r)));const pending=api('/auth/me');await new Promise(r=>setTimeout(r,0));await clearSession();release(json({userId:'old'}));await expect(pending).rejects.toThrow();expect(memory.size).toBe(0);});
 it('never stores reusable access or refresh tokens in browser storage',()=>{
  expect(memory.has('dhahabi_user_access_token')).toBe(false);expect(memory.has('dhahabi_user_refresh_token')).toBe(false);
 });
 it('cannot restore a session from a password response that arrives after logout',async()=>{
  let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>release=r)));
  const pending=authenticate('/auth/login',{email:'user@example.test',password:'test-password'});
  await clearSession();release(json({accessToken:'stale',refreshToken:'stale-refresh'}));
  await expect(pending).rejects.toThrow();expect(()=>activeSessionTokens()).toThrow();
 });
 it('cancels an in-flight account response when the PWA locks in the background',async()=>{
  let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>release=r)));
  const pending=api('/portfolio');await new Promise(r=>setTimeout(r,0));lockSession();release(json([{id:'private'}]));
  await expect(pending).rejects.toThrow();await expect(api('/portfolio')).rejects.toThrow();
 });
 it('discards refresh results that arrive after logout',async()=>{
  let finish!:(response:Response)=>void;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('/auth/refresh')
   ?new Promise<Response>(resolve=>{finish=resolve;}):json({message:'expired'},401)));
  const pending=api('/auth/me');await new Promise(r=>setTimeout(r,0));
  await clearSession();finish(json({accessToken:'stale-refreshed',refreshToken:'stale-rotated'}));
  await expect(pending).rejects.toThrow();expect(()=>activeSessionTokens()).toThrow();
  expect(memory.size).toBe(0);
 });
 it('invalidates a different tab without deleting the active tab shared persistence',async()=>{
  await saveVerifiedUser({id:'new-account',email:'new@example.test',role:'user'});
  await clearSession(false);expect(()=>activeSessionTokens()).toThrow();
  expect(await getVerifiedCachedUser()).toEqual({id:'new-account',email:'new@example.test',role:'user'});
 });
});
describe('startup identity cache',()=>{
 it('restores only a server-verified User identity for fast startup',async()=>{
  const identity={id:'sample-id',email:'investor@example.test',role:'user' as const};
  await saveVerifiedUser(identity);
  expect(await getVerifiedCachedUser()).toEqual(identity);
 });
 it('refuses a cached elevated role and invalid data',async()=>{
  memory.set('dhahabi_user_profile',JSON.stringify({id:'1',email:'admin@example.test',role:'admin'}));
  expect(await getVerifiedCachedUser()).toBeNull();
  memory.set('dhahabi_user_profile','invalid-json');
  expect(await getVerifiedCachedUser()).toBeNull();
 });
 it('discarded cached identity is not reused across a new login',async()=>{
  await saveVerifiedUser({id:'old',email:'old@example.test',role:'user'});
  await saveSession({accessToken:'new-session',refreshToken:'new-refresh'});
  expect(await getVerifiedCachedUser()).toBeNull();
 });
});
