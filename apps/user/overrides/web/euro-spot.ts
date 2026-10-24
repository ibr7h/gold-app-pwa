import type {MarketPrice} from './model';

/** Public, key-free EUR quote. Never use the authenticated application API client here. */
export const EUR_SPOT_URL='https://api.gold-api.com/price/XAU/EUR';
export interface EuroSpotQuote{pricePerOunce:number;eurPerUsd:number;timestamp:string}
const OUNCE_IN_GRAMS=31.1034768;
const MAX_AGE_MS=4*86400000; // Includes a normal weekend; the UI still marks old quotes as saved.
const MAX_BYTES=16384;
let cache:{quote:EuroSpotQuote;fetchedAt:number}|null=null;
let flight:Promise<EuroSpotQuote>|null=null;

export function parseEuroSpot(response:unknown,now=Date.now()):EuroSpotQuote{
 if(!response||typeof response!=='object')throw new Error('invalid_eur_spot');
 const data=response as Record<string,unknown>;
 if(data.symbol!=='XAU'||data.currency!=='EUR')throw new Error('wrong_eur_spot_currency');
 const price=data.price,rate=data.exchangeRate;
 if(typeof price!=='number'||!Number.isFinite(price)||price<=0||price>=100000000)
  throw new Error('invalid_eur_spot_price');
 if(typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||rate>=10)
  throw new Error('invalid_eur_spot_fx');
 if(typeof data.updatedAt!=='string'||data.updatedAt.length>64||!data.updatedAt.trim())
  throw new Error('missing_eur_spot_timestamp');
 const observed=Date.parse(data.updatedAt);
 if(!Number.isFinite(observed)||observed>now+5*60000||now-observed>MAX_AGE_MS)
  throw new Error('invalid_eur_spot_timestamp');
 return {pricePerOunce:price,eurPerUsd:rate,timestamp:new Date(observed).toISOString()};
}

async function readBoundedJson(response:Response):Promise<unknown>{
 if(!response.body)throw new Error('empty_eur_spot');
 const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
 let size=0,text='';
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_BYTES){void reader.cancel().catch(()=>{});throw new Error('oversized_eur_spot');}
   text+=decoder.decode(value,{stream:true});
  }
  text+=decoder.decode();
  return JSON.parse(text);
 }finally{reader.releaseLock();}
}

export async function loadEuroSpot(now=Date.now(),request:typeof fetch=fetch):Promise<EuroSpotQuote>{
 if(cache&&now>=cache.fetchedAt&&now-cache.fetchedAt<30000&&now-Date.parse(cache.quote.timestamp)<=MAX_AGE_MS)
  return cache.quote;
 if(flight)return flight;
 const controller=new AbortController();
 let timer:ReturnType<typeof setTimeout>;
 const deadline=new Promise<never>((_resolve,reject)=>{
  timer=setTimeout(()=>{controller.abort();reject(new Error('eur_spot_timeout'));},8000);
 });
 const work=Promise.race([(async()=>{
  const response=await request(EUR_SPOT_URL,{cache:'no-store',credentials:'omit',redirect:'error',
   referrerPolicy:'no-referrer',headers:{Accept:'application/json'},signal:controller.signal});
  if(!response.ok)throw new Error('eur_spot_http_'+response.status);
  const result=parseEuroSpot(await readBoundedJson(response),now);
  if(controller.signal.aborted)throw new Error('eur_spot_timeout');
  if(cache&&Date.parse(result.timestamp)<Date.parse(cache.quote.timestamp))throw new Error('backward_eur_spot');
  cache={quote:result,fetchedAt:now};
  return result;
 })(),deadline]);
 flight=work;
 try{return await work;}finally{clearTimeout(timer!);if(flight===work)flight=null;}
}

/** Indicative spot only, not dealer bid/ask. Preserve precision and the provider's observation time. */
export function euroSpotRows(quote:EuroSpotQuote):MarketPrice[]{
 return [24,22,21,18].map(karat=>{
  const price=(quote.pricePerOunce/OUNCE_IN_GRAMS)*(karat/24);
  return {source:'api.gold-api.com',currency:'EUR',karat,
   buyPrice:String(price),sellPrice:String(price),timestamp:quote.timestamp};
 });
}
