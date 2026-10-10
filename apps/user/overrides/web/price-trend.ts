export type TrendRange='day'|'week'|'month'|'available';
export interface TrendSourceRow{
 id?:string; buyPrice:string|number; createdAt?:string|null; timestamp?:string|null;
}
export interface TrendPoint{time:number;price:number;id:string}

/** Use the supplier's actual quote timestamp; createdAt is only a last-resort legacy fallback.
 * Consecutive unchanged two-decimal prices are not market events: no flat artificial segment
 * when the source is checked repeatedly after closing. Keep the FIRST genuine observation.
 */
export function priceTrendPoints(rows:TrendSourceRow[]):TrendPoint[]{
 const valid=rows.map((row,index)=>{
  const time=Date.parse(row.timestamp||row.createdAt||'');
  const saved=Date.parse(row.createdAt||row.timestamp||'');
  const price=Number(row.buyPrice);
  return {time,saved,price,id:row.id||String(index)};
 }).filter(p=>Number.isFinite(p.time)&&Number.isFinite(p.price)&&p.price>0)
 .sort((a,b)=>a.time-b.time||a.saved-b.saved);
 const points:TrendPoint[]=[];
 for(const row of valid){
  const point={time:row.time,price:row.price,id:row.id};
  const previous=points[points.length-1];
  if(previous?.time===point.time){
   // Quote from same instant, keep the most recently saved revision.
   points[points.length-1]=point;
  }else if(previous&&Math.round(previous.price*100)===Math.round(point.price*100)){
   // No visible market movement; preserve actual first timestamp.
   continue;
  }else points.push(point);
 }
 return points;
}
export function priceTrendRange(points:TrendPoint[],range:TrendRange):TrendPoint[]{
 if(!points.length||range==='available')return points;
 const period=(range==='day'?1:range==='week'?7:30)*24*60*60*1000;
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
