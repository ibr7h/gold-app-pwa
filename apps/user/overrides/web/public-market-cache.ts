import type {MarketPrice} from './model';

// Public market quotes only. Never put profiles, portfolios, JWTs or grants here.
export const PUBLIC_MARKET_CACHE='dhahabk:public-market-v1';
const allowedCurrencies=['SAR','USD','EUR'];
const allowedKarats=[18,21,22,24];
export interface PublicMarketSnapshot{version:1;savedAt:number;rows:MarketPrice[]}
export function parsePublicMarketSnapshot(value:unknown,now=Date.now()):PublicMarketSnapshot|null{
 if(!value||typeof value!=='object')return null;
 const v=value as Partial<PublicMarketSnapshot>;
 const savedAt=v.savedAt;
 if(v.version!==1||typeof savedAt!=='number'||!Number.isFinite(savedAt)||savedAt<=0||savedAt>now+300000||
    !Array.isArray(v.rows)||v.rows.length>12)return null;
 const rows:MarketPrice[]=[];
 const seen=new Set<string>();
 for(const row of v.rows){
  if(!row||!allowedCurrencies.includes(row.currency)||!allowedKarats.includes(row.karat)||
   typeof row.timestamp!=='string'||!Number.isFinite(Date.parse(row.timestamp))||Date.parse(row.timestamp)>now+300000||
   ![row.buyPrice,row.sellPrice].every(p=>typeof p==='string'&&p.length<=64&&p.trim()!==''&&Number.isFinite(Number(p))&&Number(p)>0&&Number(p)<100000000))return null;
  const id=row.currency+':'+row.karat;
  if(seen.has(id))return null;
  seen.add(id);
  // Whitelist fields: a caller cannot accidentally persist private API fields.
  rows.push({currency:row.currency,karat:row.karat,buyPrice:row.buyPrice,sellPrice:row.sellPrice,timestamp:row.timestamp});
 }
 return {version:1,savedAt,rows};
}
export function readPublicMarketSnapshot():PublicMarketSnapshot|null{
 try{
  if(typeof window==='undefined')return null;
  const raw=window.localStorage.getItem(PUBLIC_MARKET_CACHE);
  return raw&&raw.length<=20000?parsePublicMarketSnapshot(JSON.parse(raw)):null;
 }catch{return null;}
}
export function savePublicMarketSnapshot(rows:MarketPrice[],now=Date.now()):void{
 try{
  if(typeof window==='undefined')return;
  const previous=readPublicMarketSnapshot()?.rows||[];
  const updated=new Set(rows.map(r=>r.currency+':'+r.karat));
  const combined=[...rows,...previous.filter(r=>!updated.has(r.currency+':'+r.karat))];
  const snapshot=parsePublicMarketSnapshot({version:1,savedAt:now,rows:combined},now);
  if(snapshot?.rows.length){
   const serialized=JSON.stringify(snapshot);
   if(serialized.length<=20000)window.localStorage.setItem(PUBLIC_MARKET_CACHE,serialized);
  }
 }catch{/* Private browsing/quota must never break live pricing. */}
}
