export type TrendRange='day'|'week'|'available';
export interface TrendSourceRow{
 id?:string; buyPrice:string|number; createdAt?:string|null; timestamp?:string|null;
}
export interface TrendPoint{time:number;price:number;id:string}

/** Plot against actual saved timestamps. Do not create/interpolate missing market prices. */
export function priceTrendPoints(rows:TrendSourceRow[]):TrendPoint[]{
 const valid=rows.map((row,index)=>{
  const time=Date.parse(row.createdAt||row.timestamp||'');
  const price=Number(row.buyPrice);
  return {time,price,id:row.id||String(index)};
 }).filter(p=>Number.isFinite(p.time)&&Number.isFinite(p.price)&&p.price>0)
 .sort((a,b)=>a.time-b.time);
 // Multiple saved updates at exactly the same instant share one x-coordinate.
 // Use the last saved observation, rather than fabricating a time interval.
 const deduped:TrendPoint[]=[];
 for(const point of valid){
  if(deduped.length&&deduped[deduped.length-1].time===point.time)deduped[deduped.length-1]=point;
  else deduped.push(point);
 }
 return deduped;
}
export function priceTrendRange(points:TrendPoint[],range:TrendRange):TrendPoint[]{
 if(!points.length||range==='available')return points;
 const period=range==='day'?24*60*60*1000:7*24*60*60*1000;
 const cutoff=points[points.length-1].time-period;
 return points.filter(p=>p.time>=cutoff);
}
export function priceTrendDomain(points:TrendPoint[]){
 if(!points.length)return null;
 const prices=points.map(p=>p.price),low=Math.min(...prices),high=Math.max(...prices);
 // Pad the visible range, but never imply a zero-baseline for tiny market movements.
 const padding=Math.max((high-low)*0.2,Math.max(high,1)*0.0006);
 return {min:Math.max(0,low-padding),max:high+padding,low,high};
}
export function trendPercent(points:TrendPoint[]):number|null{
 if(points.length<2||points[0].price<=0)return null;
 return (points[points.length-1].price-points[0].price)/points[0].price*100;
}
/** Binary search for closest real observation under a cursor, not a synthesized sample. */
export function nearestTrendIndex(points:TrendPoint[],targetTime:number):number{
 if(!points.length)return -1;
 let lo=0,hi=points.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(points[mid].time<targetTime)lo=mid+1;else hi=mid;}
 if(lo<=0)return 0;if(lo>=points.length)return points.length-1;
 return targetTime-points[lo-1].time<=points[lo].time-targetTime?lo-1:lo;
}
