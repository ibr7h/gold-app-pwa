import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {getFreshNearbyPosition,NearbyLocationError} from '../nearby-geolocation';

const source=readFileSync(fileURLToPath(new URL('../NearbyMarkets.tsx',import.meta.url)),'utf8');
afterEach(()=>vi.unstubAllGlobals());
const point={coords:{latitude:17.23966,longitude:42.62208,accuracy:12}};

describe('Near traders: fresh on-demand location on every screen entry',()=>{
 it('requests an uncached high-accuracy fix when permission is already granted',async()=>{
  const getCurrentPosition=vi.fn((success:(p:typeof point)=>void)=>success(point));
  const query=vi.fn(async()=>({state:'granted'}));
  vi.stubGlobal('navigator',{geolocation:{getCurrentPosition},permissions:{query}});
  expect(await getFreshNearbyPosition()).toEqual({latitude:17.23966,longitude:42.62208,accuracyMeters:12});
  expect(getCurrentPosition).toHaveBeenCalledOnce();
  expect(getCurrentPosition.mock.calls[0][2]).toEqual({enableHighAccuracy:true,maximumAge:0,timeout:20000});
  expect(query).toHaveBeenCalledWith({name:'geolocation'});
 });
 it('lets the browser request permission when the state is prompt',async()=>{
  const getCurrentPosition=vi.fn((success:(p:typeof point)=>void)=>success(point));
  vi.stubGlobal('navigator',{geolocation:{getCurrentPosition},permissions:{query:async()=>({state:'prompt'})}});
  expect((await getFreshNearbyPosition()).latitude).toBe(17.23966);
  expect(getCurrentPosition).toHaveBeenCalledOnce();
 });
 it('falls back to geolocation when Safari has no working Permissions API',async()=>{
  const getCurrentPosition=vi.fn((success:(p:typeof point)=>void)=>success(point));
  vi.stubGlobal('navigator',{geolocation:{getCurrentPosition},permissions:{query:async()=>{throw Error('unsupported');}}});
  expect((await getFreshNearbyPosition()).longitude).toBe(42.62208);
 });
 it('does not pretend to enable a browser permission the user has denied',async()=>{
  const getCurrentPosition=vi.fn();
  vi.stubGlobal('navigator',{geolocation:{getCurrentPosition},permissions:{query:async()=>({state:'denied'})}});
  await expect(getFreshNearbyPosition()).rejects.toMatchObject({reason:'permission'});
  expect(getCurrentPosition).not.toHaveBeenCalled();
 });
 it('shows an actionable retry if iOS rejects the geolocation prompt',async()=>{
  const getCurrentPosition=vi.fn((_a:unknown,error:(e:{code:number})=>void)=>error({code:1}));
  vi.stubGlobal('navigator',{geolocation:{getCurrentPosition}});
  await expect(getFreshNearbyPosition()).rejects.toMatchObject({reason:'permission'});
  expect(source).toContain('className="dh-nearby-retry"');
  expect(source).toContain('setAttempt(value=>value+1)');
 });
 it('enables the account preference only after permission and saves fresh coordinates on each entry',()=>{
  const at=source.indexOf('const fresh=await getFreshNearbyPosition()');
  const profile=source.indexOf("api<UserLocation>('/auth/profile')");
  const preference=source.indexOf("api<UserLocation>('/auth/location/preference'");
  const position=source.indexOf("api<UserLocation>('/auth/location/position'");
  expect(at).toBeGreaterThan(0);
  expect(profile).toBeGreaterThan(at);
  expect(preference).toBeGreaterThan(profile);
  expect(position).toBeGreaterThan(preference);
  expect(source).toContain("if(profile.locationEnabled!==true)");
  expect(source).toContain("return()=>{cancelled=true;};");
  expect(source).toContain('},[attempt]);');
  expect(source).toContain('setPoint(fresh)');
  expect(source).not.toContain('تم تحديث موقعك.');
 });
});
