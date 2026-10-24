import {afterEach,describe,it,expect,vi} from 'vitest';
const now=Date.parse('2026-10-24T10:00:00Z');
const payload={rates:{'2026-10-23':{EUR:.86}}};
describe('bounded credential-free EUR transport',()=>{
 afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
 it('deduplicates in-flight calls and does not send credentials',async()=>{
  vi.resetModules();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  const request=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>new Response(JSON.stringify(payload),{status:200}));
  const [a,b]=await Promise.all([loadEuroReferenceRates(now,request),loadEuroReferenceRates(now,request)]);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][1]).toMatchObject({credentials:'omit',redirect:'error',cache:'no-store'});
  expect(a.eurPerUsd).toBe(.86);expect(b.eurPerUsd).toBe(.86);
 });
 it('uses validated persisted daily rates without making an unnecessary request',async()=>{
  vi.resetModules();
  vi.stubGlobal('window',{localStorage:{getItem:()=>JSON.stringify({...payload,fetchedAt:now-1000}),setItem:vi.fn()}});
  const {loadEuroReferenceRates}=await import('../euro-reference');
  const request=vi.fn();
  expect((await loadEuroReferenceRates(now,request)).eurPerUsd).toBe(.86);
  expect(request).not.toHaveBeenCalled();
 });
 it('never accepts a corrupt stored rate or fabricates one after an outage',async()=>{
  vi.resetModules();
  vi.stubGlobal('window',{localStorage:{getItem:()=>JSON.stringify({rates:{'2026-10-23':{EUR:0}},fetchedAt:now}),setItem:vi.fn()}});
  const {loadEuroReferenceRates}=await import('../euro-reference');
  await expect(loadEuroReferenceRates(now,vi.fn(async()=>{throw Error('offline');}))).rejects.toThrow('offline');
 });
 it('aborts a stalled request after eight seconds',async()=>{
  vi.resetModules();vi.useFakeTimers();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  const request=vi.fn((_url:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
   init?.signal?.addEventListener('abort',()=>reject(new Error('aborted')));
  }));
  const pending=expect(loadEuroReferenceRates(now,request)).rejects.toThrow('aborted');
  await vi.advanceTimersByTimeAsync(8000);await pending;
 });
});
