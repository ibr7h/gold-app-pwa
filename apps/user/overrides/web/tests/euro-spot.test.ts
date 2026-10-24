import {afterEach,describe,it,expect,vi} from 'vitest';
import {parseEuroSpot,euroSpotRows} from '../euro-spot';
const now=Date.parse('2026-10-25T08:00:00Z');
const payload={symbol:'XAU',currency:'EUR',price:3110.34768,exchangeRate:.9,updatedAt:'2026-10-25T07:59:00Z'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});

describe('direct public XAU/EUR, independent of daily historical FX',()=>{
 afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
 it('uses the actual EUR ounce quote for all four karats with its own timestamp',()=>{
  const quote=parseEuroSpot(payload,now),rows=euroSpotRows(quote);
  expect(rows.map(r=>r.karat)).toEqual([24,22,21,18]);
  for(const row of rows){
   expect(row.currency).toBe('EUR');expect(row.source).toBe('api.gold-api.com');
   expect(Number(row.buyPrice)).toBeCloseTo(100*row.karat/24,10);
   expect(row.sellPrice).toBe(row.buyPrice);expect(row.timestamp).toBe('2026-10-25T07:59:00.000Z');
  }
 });
 it('rejects wrong currencies/metals, invalid prices, missing FX and invalid timestamps',()=>{
  for(const patch of [{currency:'USD'},{symbol:'XAG'},{price:0},{price:Infinity},{price:'3110'},
   {exchangeRate:0},{exchangeRate:undefined},{updatedAt:undefined},{updatedAt:'bad'},
   {updatedAt:'2026-10-25T08:10:00Z'},{updatedAt:'2026-10-20T08:00:00Z'}])
   expect(()=>parseEuroSpot({...payload,...patch},now)).toThrow();
 });
 it('retains an actual Friday observation across the weekend without making its timestamp fresh',()=>{
  const friday={...payload,updatedAt:'2026-10-23T20:59:00Z'};
  expect(parseEuroSpot(friday,now).timestamp).toBe('2026-10-23T20:59:00.000Z');
 });
 it('deduplicates requests, uses the exact endpoint and never sends credentials or a referrer',async()=>{
  vi.resetModules();const {loadEuroSpot,EUR_SPOT_URL}=await import('../euro-spot');
  const request=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>json(payload));
  const [a,b]=await Promise.all([loadEuroSpot(now,request),loadEuroSpot(now,request)]);
  expect(a).toEqual(b);expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toBe('https://api.gold-api.com/price/XAU/EUR');
  expect(EUR_SPOT_URL).toBe(request.mock.calls[0][0]);
  const init=request.mock.calls[0][1]!;
  expect(init).toMatchObject({cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
  expect(new Headers(init.headers).has('Authorization')).toBe(false);
 });
 it('uses a 30-second memory cache, then refreshes without persisting anything private',async()=>{
  vi.resetModules();const {loadEuroSpot}=await import('../euro-spot');
  const storage=vi.fn();vi.stubGlobal('window',{localStorage:{setItem:storage}});
  const request=vi.fn(async()=>json(payload));
  await loadEuroSpot(now,request);await loadEuroSpot(now+29999,request);
  expect(request).toHaveBeenCalledTimes(1);
  await loadEuroSpot(now+30000,request);expect(request).toHaveBeenCalledTimes(2);
  expect(storage).not.toHaveBeenCalled();
 });
 it('does not invent a price or use daily FX after an HTTP failure',async()=>{
  vi.resetModules();const {loadEuroSpot}=await import('../euro-spot');
  await expect(loadEuroSpot(now,vi.fn(async()=>json({},503)))).rejects.toThrow('eur_spot_http_503');
 });
 it('rejects a response body larger than 16 KiB',async()=>{
  vi.resetModules();const {loadEuroSpot}=await import('../euro-spot');
  await expect(loadEuroSpot(now,vi.fn(async()=>json({...payload,padding:'x'.repeat(17000)})))).rejects.toThrow('oversized');
 });
 it('enforces an absolute eight-second deadline even if a transport ignores abort',async()=>{
  vi.resetModules();vi.useFakeTimers();const {loadEuroSpot}=await import('../euro-spot');
  const request=vi.fn(()=>new Promise<Response>(()=>{}));
  const pending=expect(loadEuroSpot(now,request)).rejects.toThrow('eur_spot_timeout');
  await vi.advanceTimersByTimeAsync(8000);await pending;
 });
 it('applies the same deadline while waiting for a stalled response body',async()=>{
  vi.resetModules();vi.useFakeTimers();const {loadEuroSpot}=await import('../euro-spot');
  const body=new ReadableStream<Uint8Array>({start(){}});
  const pending=expect(loadEuroSpot(now,vi.fn(async()=>new Response(body)))).rejects.toThrow('eur_spot_timeout');
  await vi.advanceTimersByTimeAsync(8000);await pending;
 });
 it('rejects backward observations and never refreshes the old quote timestamp',async()=>{
  vi.resetModules();const {loadEuroSpot}=await import('../euro-spot');
  await loadEuroSpot(now,vi.fn(async()=>json(payload)));
  await expect(loadEuroSpot(now+31000,vi.fn(async()=>json({...payload,updatedAt:'2026-10-25T07:58:00Z'})))).rejects.toThrow('backward');
 });
});
