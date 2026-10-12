import type {MarketPrice,Purchase} from './model';
import {purchasePerformance} from './model';

export type DisplayCurrency='SAR'|'USD'|'EUR';
export interface DisplayAmount{amount:number|null;currency:string;converted:boolean;available:boolean}

/** Derived only from matching real 24K Backend quotes; never hard-code a made-up FX rate.
 * This is a display estimate (gold bid-price ratio), NOT a bank exchange quotation.
 */
export function sarPerUsd(prices:MarketPrice[]):number|null{
 const row=(currency:string)=>prices.find(p=>p.currency===currency&&p.karat===24);
 const sar=row('SAR'),usd=row('USD');
 if(!sar||!usd)return null;
 const a=Number(sar.buyPrice),b=Number(usd.buyPrice);
 const ta=Date.parse(sar.timestamp),tb=Date.parse(usd.timestamp);
 if(!Number.isFinite(a)||a<=0||!Number.isFinite(b)||b<=0||!Number.isFinite(ta)||!Number.isFinite(tb))return null;
 if(Math.abs(ta-tb)>90*60*1000)return null;
 const rate=a/b;
 // Prevent a malformed or mismatched gold quote from being treated as an FX rate.
 return Number.isFinite(rate)&&rate>=3&&rate<=5?rate:null;
}

/** Presentation only. Never use these results in API write payloads or price alerts. */
export function displayAmount(value:number|null|undefined,source:string,target:DisplayCurrency,rate:number|null,eurPerUsd:number|null=null):DisplayAmount{
 if(value==null||!Number.isFinite(value))return {amount:null,currency:source,converted:false,available:false};
 if(source===target)return {amount:value,currency:target,converted:false,available:true};
 const fromUsd=source==='USD'?1:source==='SAR'?rate===null?null:1/rate:
  source==='EUR'?eurPerUsd===null?null:1/eurPerUsd:null;
 const toUsd=target==='USD'?1:target==='SAR'?rate:eurPerUsd;
 if(fromUsd!==null&&toUsd!==null&&Number.isFinite(fromUsd)&&fromUsd>0&&
   Number.isFinite(toUsd)&&toUsd>0)
  return {amount:value*fromUsd*toUsd,currency:target,converted:true,available:true};
 // No fabricated conversion for unsupported currencies or missing reference FX.
 return {amount:value,currency:source,converted:false,available:false};
}

/** Portfolio totals in one display currency; excluded currencies remain distinct in details.
 * Missing valuations invalidate the market-value total, never silently become zero.
 */
export function displayPortfolioSummary(purchases:Purchase[],prices:MarketPrice[],target:DisplayCurrency,rate:number|null,loaded:boolean,eurPerUsd:number|null=null){
 let cost=0,value=0,weight=0,hasUnconverted=false,hasMissingValuation=false;
 for(const p of purchases){
  const w=Number(p.weightGrams);
  if(Number.isFinite(w)&&w>0)weight+=w;
  const position=purchasePerformance(p,prices);
  const costResult=displayAmount(position.cost,p.currency,target,rate,eurPerUsd);
  const valueResult=displayAmount(position.value,p.currency,target,rate,eurPerUsd);
  if(!costResult.available||!valueResult.available||costResult.currency!==target||valueResult.currency!==target){
   if(!costResult.available||costResult.currency!==target)hasUnconverted=true;
   if(position.value===null)hasMissingValuation=true;
   continue;
  }
  cost+=costResult.amount||0;value+=valueResult.amount||0;
 }
 const finalValue=!loaded||hasMissingValuation||hasUnconverted?null:value;
 const finalCost=!loaded||hasUnconverted?null:cost;
 const difference=finalValue===null||finalCost===null?null:finalValue-finalCost;
 return {value:finalValue,cost:finalCost,weight:loaded?weight:null,difference,
  percent:difference===null||finalCost===null||finalCost<=0?null:difference/finalCost*100,
  hasUnconverted,hasMissingValuation};
}
