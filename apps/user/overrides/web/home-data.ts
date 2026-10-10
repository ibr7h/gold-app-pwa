import {MarketPrice,Purchase,totals} from './model';
import {priceTrendPoints} from './price-trend';

const saudiDay=(time:number)=>new Date(time+3*60*60*1000).toISOString().slice(0,10);

/** Compare observed SAR/24K quotes within today's Saudi calendar date only. */
export function homeMarketMovement(history:MarketPrice[],latest:MarketPrice|undefined,now:number){
 if(!latest||latest.currency!=='SAR'||latest.karat!==24||!Number.isFinite(now)||!Number.isFinite(Number(latest.buyPrice))||Number(latest.buyPrice)<=0)return null;
 const points=priceTrendPoints([...history.filter(row=>row.currency==='SAR'&&row.karat===24),latest])
  .filter(point=>point.time<=now&&saudiDay(point.time)===saudiDay(now));
 const last=points[points.length-1];
 const latestTime=Date.parse(latest.timestamp||latest.createdAt);
 if(points.length<2||last.time!==latestTime)return null;
 const difference=Number(latest.buyPrice)-points[0].price;
 if(!Number.isFinite(difference))return null;
 return {difference,percent:difference/points[0].price*100};
}

/** Keep the SAR home card's weight and valuation in the same currency. */
export function homePortfolioSummary(purchases:Purchase[],prices:MarketPrice[],loaded:boolean){
 const sar=totals(purchases.filter(p=>p.currency==='SAR'),prices)[0];
 const value=loaded?(sar?sar.value:0):null;
 const cost=loaded?(sar?.cost||0):null;
 const difference=value===null||cost===null?null:value-cost;
 return {value,cost,weight:loaded?(sar?.weight||0):null,difference,
  percent:difference===null||cost===null||cost<=0?null:difference/cost*100,
  hasOtherCurrencies:purchases.some(p=>p.currency!=='SAR')};
}

export function homeUpdateAge(timestamp:string|undefined,now:number){
 const time=Date.parse(timestamp||'');
 if(!Number.isFinite(time)||!Number.isFinite(now)||time>now)return 'لا يوجد تحديث موثوق';
 const minutes=Math.floor((now-time)/60000);
 if(minutes<1)return 'تحديث منذ أقل من دقيقة';
 if(minutes<60)return 'تحديث منذ '+minutes+' دقيقة';
 const hours=Math.floor(minutes/60);
 if(hours<24)return 'تحديث منذ '+hours+' ساعة';
 return 'آخر تحديث: '+new Date(time).toLocaleDateString('ar-SA',{timeZone:'Asia/Riyadh'});
}
