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
  const pending=expect(loadEuroReferenceRates(now,request)).rejects.toThrow('eur_fx_timeout');
  await vi.advanceTimersByTimeAsync(8000);await pending;
 });
 it('reuses old dated FX for old prices during an outage, never for new dates',async()=>{
  vi.resetModules();
  const old={base:'USD',rates:{'2026-09-25':{EUR:.87}},fetchedAt:now-29*86400000};
  vi.stubGlobal('window',{localStorage:{getItem:()=>JSON.stringify(old),setItem:vi.fn()}});
  const {loadEuroReferenceRates,euroHistoryRows}=await import('../euro-reference');
  const fx=await loadEuroReferenceRates(now,vi.fn(async()=>{throw Error('offline');}));
  const rows=euroHistoryRows([
   {currency:'USD',buyPrice:'100',day:'2026-09-25'},
   {currency:'USD',buyPrice:'100',day:'2026-10-23'}
  ],fx);
  expect(rows).toHaveLength(1);expect(rows[0].day).toBe('2026-09-25');
  expect(rows[0].buyPrice).toBe('87');
 });
 it('bounds requests even when a transport ignores abort',async()=>{
  vi.resetModules();vi.useFakeTimers();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  const pending=expect(loadEuroReferenceRates(now,vi.fn(()=>new Promise<Response>(()=>{})))).rejects.toThrow('eur_fx_timeout');
  await vi.advanceTimersByTimeAsync(8000);await pending;
 });
 it('bounds stalled response bodies',async()=>{
  vi.resetModules();vi.useFakeTimers();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  const request=vi.fn(async()=>new Response(new ReadableStream({start(){}})));
  const pending=expect(loadEuroReferenceRates(now,request)).rejects.toThrow('eur_fx_timeout');
  await vi.advanceTimersByTimeAsync(8000);await pending;
 });
 it('rejects an oversized streamed payload instead of caching it',async()=>{
  vi.resetModules();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  await expect(loadEuroReferenceRates(now,vi.fn(async()=>new Response(' '.repeat(64001))))).rejects.toThrow('oversized_eur_fx');
 });
 it('never sends authentication or a referring application URL to the FX supplier',async()=>{
  vi.resetModules();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  const request=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>Response.json(payload));
  await loadEuroReferenceRates(now,request);
  expect(request.mock.calls[0][1]).toMatchObject({credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',headers:{Accept:'application/json'}});
  expect(String(request.mock.calls[0][0])).toMatch(/^https:\/\/api\.frankfurter\.dev\/v1\/\d{4}-\d{2}-\d{2}\.\.\d{4}-\d{2}-\d{2}\?base=USD&symbols=EUR$/);
 });
 it('requests the actual historical window with seven prior days, and preserves earlier cached FX',async()=>{
  vi.resetModules();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  await loadEuroReferenceRates(now-5*3600000,vi.fn(async()=>Response.json({rates:{'2026-09-25':{EUR:.87}}})));
  const request=vi.fn(async(_url:RequestInfo|URL)=>Response.json(payload));
  const result=await loadEuroReferenceRates(now,request,'2026-10-23');
  expect(String(request.mock.calls[0][0])).toContain('/2026-10-16..2026-10-24?');
  expect(result.byDay['2026-09-25']).toBe(.87);
  expect(result.byDay['2026-10-23']).toBe(.86);
 });
 it('expands a concurrent narrow request when the selected gold history needs older FX',async()=>{
  vi.resetModules();
  const {loadEuroReferenceRates}=await import('../euro-reference');
  let release!:(r:Response)=>void;
  let calls=0;
  const request=vi.fn((_url:RequestInfo|URL)=>++calls===1?
   new Promise<Response>(resolve=>{release=resolve;}):Promise.resolve(Response.json({rates:{'2026-09-25':{EUR:.87},...payload.rates}})));
  const recent=loadEuroReferenceRates(now,request,'2026-10-23');
  const older=loadEuroReferenceRates(now,request,'2026-09-25');
  release(Response.json(payload));
  await recent;const result=await older;
  expect(request).toHaveBeenCalledTimes(2);
  expect(String(request.mock.calls[1][0])).toContain('/2026-09-18..');
  expect(result.byDay['2026-09-25']).toBe(.87);
 });
});
