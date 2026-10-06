import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>memory.get(k)||null,multiSet:async(pairs:string[][])=>pairs.forEach(([k,v])=>memory.set(k,v)),multiRemove:async(keys:string[])=>keys.forEach(k=>memory.delete(k))}}));
import {api,saveSession,clearSession,authenticate,errorMessage} from '../api';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status});
beforeEach(async()=>{await clearSession();vi.restoreAllMocks();await saveSession({accessToken:'expired',refreshToken:'refresh-fixture'});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('sessions',()=>{
 it('refreshes concurrent requests once',async()=>{let refreshes=0;vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{if(url.endsWith('/auth/refresh')){refreshes++;await new Promise(r=>setTimeout(r,10));return json({accessToken:'fresh',refreshToken:'rotated'});}return new Headers(options.headers).get('Authorization')==='Bearer fresh'?json({ok:true}):json({message:'expired'},401);}));expect(await Promise.all([api('/portfolio'),api('/alerts')])).toEqual([{ok:true},{ok:true}]);expect(refreshes).toBe(1);});
 it('clears rejected refresh credentials',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>json({message:'Invalid refresh token'},401)));await expect(api('/auth/me')).rejects.toThrow();expect(memory.size).toBe(0);});
 it('retains tokens after network failure and never retries a write blindly',async()=>{const fn=vi.fn(async()=>{throw new TypeError('network');});vi.stubGlobal('fetch',fn);await expect(api('/portfolio',{method:'POST',body:'{}'})).rejects.toThrow();expect(fn).toHaveBeenCalledTimes(1);expect(memory.has('dhahabi_refresh_token')).toBe(true);});
 it('rejects a response arriving after logout',async()=>{let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>release=r)));const pending=api('/auth/me');await new Promise(r=>setTimeout(r,0));await clearSession();release(json({userId:'old'}));await expect(pending).rejects.toThrow();expect(memory.size).toBe(0);});
});
describe('connection errors',()=>{
 it('reads the production API error envelope',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>json({success:false,error:{code:'UNAUTHORIZED',message:'Invalid credentials'}},401)));
  const error=await authenticate('/auth/login',{email:'test@example.invalid',password:'invalid'}).catch(e=>e);
  expect(errorMessage(error)).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
 });
 it('waits beyond the former 45-second cutoff without repeating registration',async()=>{
  vi.useFakeTimers();
  const fn=vi.fn((_url:string,options:RequestInit)=>new Promise<Response>((resolve,reject)=>{
   options.signal?.addEventListener('abort',()=>reject(new Error('aborted')));
   setTimeout(()=>resolve(json({accessToken:'new',refreshToken:'new-refresh'})),60000);
  }));
  vi.stubGlobal('fetch',fn);
  const pending=authenticate('/auth/register',{});
  await vi.advanceTimersByTimeAsync(60000);await pending;
  expect(fn).toHaveBeenCalledTimes(1);expect(memory.get('dhahabi_access_token')).toBe('new');
 });
 it('reports a server timeout distinctly and does not repeat a write',async()=>{
  vi.useFakeTimers();
  const fn=vi.fn((_url:string,options:RequestInit)=>new Promise<Response>((_resolve,reject)=>options.signal?.addEventListener('abort',()=>reject(new Error('aborted')))));
  vi.stubGlobal('fetch',fn);
  const pending=authenticate('/auth/register',{}).catch(e=>e);
  await vi.advanceTimersByTimeAsync(90000);
  expect(errorMessage(await pending)).toContain('تأخر الخادم');
  expect(fn).toHaveBeenCalledTimes(1);
 });
});
