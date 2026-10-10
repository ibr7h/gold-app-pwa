/** One account-scoped selection for price quotes, calculator and tafqeet.
 * Prices are fetched in the selected currency, never relabelled by FX guessing.
 */
export const PRICE_CURRENCIES=['SAR','USD'] as const;
export type PriceCurrency=typeof PRICE_CURRENCIES[number];
export function isPriceCurrency(value:unknown):value is PriceCurrency{
 return value==='SAR'||value==='USD';
}
const key=(accountId:string)=>'dh-user-price-currency:'+encodeURIComponent(accountId);
export function readPriceCurrency(accountId:string,storage?:Pick<Storage,'getItem'>):PriceCurrency{
 try{
  const store=storage??(typeof window!=='undefined'?window.localStorage:undefined);
  const raw=store?.getItem(key(accountId));
  return isPriceCurrency(raw)?raw:'SAR';
 }catch{return 'SAR';}
}
export function savePriceCurrency(accountId:string,currency:PriceCurrency,storage?:Pick<Storage,'setItem'>):void{
 try{
  const store=storage??(typeof window!=='undefined'?window.localStorage:undefined);
  store?.setItem(key(accountId),currency);
 }catch{ /* iOS private browsing / storage policy must not block the app. */ }
}
