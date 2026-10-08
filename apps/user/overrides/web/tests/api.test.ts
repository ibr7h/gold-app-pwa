import {beforeEach,describe,it,expect,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>memory.get(k)||null,multiSet:async(pairs:string[][])=>pairs.forEach(([k,v])=>memory.set(k,v)),multiRemove:async(keys:string[])=>keys.forEach(k=>memory.delete(k))}}));
import {api,saveSession,clearSession} from '../api';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status});
beforeEach(async()=>{await clearSession();vi.restoreAllMocks();await saveSession({accessToken:'expired',refreshToken:'refresh-fixture'});});
describe('sessions',()=>{
 it('refreshes concurrent requests once',async()=>{let refreshes=0;vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{if(url.endsWith('/auth/refresh')){refreshes++;await new Promise(r=>setTimeout(r,10));return json({accessToken:'fresh',refreshToken:'rotated'});}return new Headers(options.headers).get('Authorization')==='Bearer fresh'?json({ok:true}):json({message:'expired'},401);}));expect(await Promise.all([api('/portfolio'),api('/alerts')])).toEqual([{ok:true},{ok:true}]);expect(refreshes).toBe(1);});
 it('clears rejected refresh credentials',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>json({message:'Invalid refresh token'},401)));await expect(api('/auth/me')).rejects.toThrow();expect(memory.size).toBe(0);});
 it('retains tokens after network failure and never retries a write blindly',async()=>{const fn=vi.fn(async()=>{throw new TypeError('network');});vi.stubGlobal('fetch',fn);await expect(api('/portfolio',{method:'POST',body:'{}'})).rejects.toThrow();expect(fn).toHaveBeenCalledTimes(1);expect(memory.has('dhahabi_user_refresh_token')).toBe(true);});
 it('rejects a response arriving after logout',async()=>{let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>release=r)));const pending=api('/auth/me');await new Promise(r=>setTimeout(r,0));await clearSession();release(json({userId:'old'}));await expect(pending).rejects.toThrow();expect(memory.size).toBe(0);});
});