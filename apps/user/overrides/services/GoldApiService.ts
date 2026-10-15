/**
 * User-facing market data is obtained only through the Dhahabi backend.
 * No upstream provider hostname, API key or key-management UI belongs in the PWA.
 */
export interface GoldApiResponse {
 timestamp:number;metal:string;currency:string;exchange:string;symbol:string;
 prev_close_price:number;open_price:number;low_price:number;high_price:number;
 open_time:number;price:number;ch:number;chp:number;ask:number;bid:number;
 price_gram_24k:number;price_gram_22k:number;price_gram_21k:number;
 price_gram_20k:number;price_gram_18k:number;price_gram_16k:number;
 price_gram_14k:number;price_gram_10k:number;
}
export interface KaratPrice {karat:string;pricePerGram:number}
export interface GoldPriceData {
 pricePerOunce:number;pricePerGram24K:number;currency:string;change:number;
 changePercent:number;high:number;low:number;open:number;prevClose:number;
 ask:number;bid:number;timestamp:number;karatPrices:KaratPrice[];
 source:string;isLive:boolean;
}
export interface FetchOptions {
 currency?:string;forceRefresh?:boolean;
 /** Legacy-only fields: deliberately ignored so secrets can never reach the client. */
 apiKey?:string;onKeyFailed?:(key:string,error:string)=>void;getNextKey?:()=>string|null;
}
interface BackendPrice {source?:unknown;currency?:unknown;buyPrice?:unknown;sellPrice?:unknown;timestamp?:unknown}
const API_BASE='https://gold-app-api-u8dl.onrender.com';
const CACHE_DURATION=120000;
let memoryCache:Record<string,{data:GoldPriceData;fetchedAt:number}>={};

function normalizedCurrency(value:string){
 const currency=value.trim().toUpperCase();
 if(!/^[A-Z]{3}$/.test(currency))throw new Error('Unsupported currency');
 return currency;
}
function finite(value:unknown,label:string){
 const number=Number(value);
 if(!Number.isFinite(number)||number<=0)throw new Error('Invalid '+label+' from price service');
 return number;
}
function mapPrice(row:BackendPrice,currency:string):GoldPriceData{
 const gram24=finite(row.buyPrice,'price');
 const sell=Number(row.sellPrice);
 const ounce=gram24*31.1034768;
 const timestamp=Date.parse(String(row.timestamp||''));
 const karats=[24,22,21,20,18,16,14,10];
 return {
  pricePerOunce:ounce,pricePerGram24K:gram24,currency,change:0,changePercent:0,
  high:ounce,low:ounce,open:ounce,prevClose:ounce,
  ask:Number.isFinite(sell)&&sell>0?sell*31.1034768:ounce,bid:ounce,
  timestamp:Number.isFinite(timestamp)?timestamp:Date.now(),
  karatPrices:karats.map(karat=>({karat:karat+'K',pricePerGram:gram24*(karat/24)})),
  source:typeof row.source==='string'?row.source:'Dhahabi backend',isLive:true
 };
}
export async function fetchGoldPrice(options:FetchOptions={}):Promise<GoldPriceData>{
 const currency=normalizedCurrency(options.currency||'USD');
 const cached=memoryCache[currency];
 if(!options.forceRefresh&&cached&&Date.now()-cached.fetchedAt<CACHE_DURATION)return cached.data;
 try{
  const response=await fetch(API_BASE+'/prices/latest?currency='+encodeURIComponent(currency)+'&karat=24',{
   headers:{Accept:'application/json'},cache:'no-store'
  });
  if(!response.ok)throw new Error('Price service returned HTTP '+response.status);
  const data=mapPrice(await response.json() as BackendPrice,currency);
  memoryCache[currency]={data,fetchedAt:Date.now()};return data;
 }catch(error){
  if(cached)return {...cached.data,isLive:false};
  throw error;
 }
}
export function clearCache(){memoryCache={};}
export const SUPPORTED_CURRENCIES=[
 {code:'USD',nameAr:'دولار أمريكي',nameEn:'US Dollar',nameFr:'Dollar américain',symbol:'$'},
 {code:'EUR',nameAr:'يورو',nameEn:'Euro',nameFr:'Euro',symbol:'€'},
 {code:'GBP',nameAr:'جنيه إسترليني',nameEn:'British Pound',nameFr:'Livre sterling',symbol:'£'},
 {code:'AED',nameAr:'درهم إماراتي',nameEn:'UAE Dirham',nameFr:'Dirham des EAU',symbol:'د.إ'},
 {code:'SAR',nameAr:'ريال سعودي',nameEn:'Saudi Riyal',nameFr:'Riyal saoudien',symbol:'ر.س'},
 {code:'KWD',nameAr:'دينار كويتي',nameEn:'Kuwaiti Dinar',nameFr:'Dinar koweïtien',symbol:'د.ك'},
 {code:'EGP',nameAr:'جنيه مصري',nameEn:'Egyptian Pound',nameFr:'Livre égyptienne',symbol:'ج.م'},
 {code:'INR',nameAr:'روبية هندية',nameEn:'Indian Rupee',nameFr:'Roupie indienne',symbol:'₹'},
 {code:'TRY',nameAr:'ليرة تركية',nameEn:'Turkish Lira',nameFr:'Livre turque',symbol:'₺'},
 {code:'JPY',nameAr:'ين ياباني',nameEn:'Japanese Yen',nameFr:'Yen japonais',symbol:'¥'}
];
export const KARAT_OPTIONS=['24K','22K','21K','18K','14K','10K'];
