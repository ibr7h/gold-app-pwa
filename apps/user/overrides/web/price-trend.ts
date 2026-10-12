import {isGlobalGoldMarketOpen} from './price-status';

export type TrendRange='day'|'week'|'month'|'available';
export interface TrendSourceRow{
 id?:string; buyPrice:string|number; createdAt?:string|null; timestamp?:string|null;
}
export interface TrendPoint{time:number;price:number;id:string}

/** Plot supplier observation times, never the ingestion/polling time.
 * Previously createdAt won over the real source timestamp, extending a flat graph
 * through the weekend when the backend re-saved an unchanged spot quote.
 * Preserve pre-close quotes ingested later, but reject source observations outside
 * the indicative trading session (weekends / NY 17:00–18:00 rollover).
 * Market holidays beyond the ordinary schedule are not represented here.
 */
export function priceTrendPoints(rows:TrendSourceRow[]):TrendPoint[]{
 const valid=rows.map((row,index)=>{
  const time=Date.parse(row.timestamp||row.createdAt||'');
  const price=Number(row.buyPrice);
  return {time,price,id:row.id||String(index)};
 }).filter(p=>Number.isFinite(p.time)&&isGlobalGoldMarketOpen(p.time)&&Number.isFinite(p.price)&&p.price>0)
 .sort((a,b)=>a.time-b.time);
 // Multiple saved updates at exactly the same instant share one x-coordinate.
 // Use the last saved observation, rather than fabricating a time interval.
 const deduped:TrendPoint[]=[];
 for(const point of valid){
  const last=deduped[deduped.length-1];
  // Same provider timestamp: take the most recent stored observation.
  if(last&&last.time===point.time)deduped[deduped.length-1]=point;
  else deduped.push(point);
 }
 // Older backend versions may have stored the same price at every polling
 // interval. Those records are not market movements, and must not extend a flat
 // line across hours/days. Compare the same 2 decimals displayed to the user.
 const observed:TrendPoint[]=[];
 for(const point of deduped){
  const previous=observed[observed.length-1];
  if(previous&&Math.round(previous.price*100)===Math.round(point.price*100))continue;
  observed.push(point);
 }
 return observed;
}
/** A chart must never imply trades across a market closure or an extended
 * period with no observations. Each returned group is an actual uninterrupted
 * observed session; gaps are rendered with no connecting line.
 */
export function priceTrendSegments(points:TrendPoint[]):TrendPoint[][]{
 const segments:TrendPoint[][]=[];
 const maxUnobservedGap=6*60*60*1000;
 const quarterHour=15*60*1000;
 for(const point of points){
  const previous=segments.at(-1)?.at(-1);
  const gap=previous?point.time-previous.time:0;
  let discontinuity=!!previous&&(gap<=0||gap>maxUnobservedGap);
  if(previous&&!discontinuity){
   // Sample the calendar gap rather than only its endpoints: both quotes can
   // fall in open sessions while a closed rollover/weekend lies between them.
   const firstTick=Math.ceil((previous.time+1)/quarterHour)*quarterHour;
   for(let tick=firstTick;tick<point.time;tick+=quarterHour){
    if(!isGlobalGoldMarketOpen(tick)){discontinuity=true;break;}
   }
  }
  if(!segments.length||discontinuity)segments.push([]);
  segments[segments.length-1].push(point);
 }
 return segments;
}

/** Sparse / heavily clustered observations must not overlap x-axis dates.
 * Only endpoints on narrow cards, plus one central date on wider charts when
 * there is enough *actual horizontal space* to label it.
 */
export function priceTrendTickIndices(points:TrendPoint[],width:number,compact:boolean):number[]{
 if(points.length<2)return [];
 const end=points.length-1;
 if(compact||width<350)return [0,end];
 const duration=points[end].time-points[0].time;
 if(duration<=0)return [0,end];
 let candidate=-1,dist=Infinity;
 for(let i=1;i<end;i++){
  const r=(points[i].time-points[0].time)/duration;
  const x=r*width,score=Math.abs(x-width/2);
  if(x>=85&&width-x>=85&&score<dist){candidate=i;dist=score;}
 }
 return candidate===-1?[0,end]:[0,candidate,end];
}

/** Fixed wall-clock window. A week must span a week on the X axis, even when
 * fewer than seven days of real market observations are available.
 */
export function priceTrendWindow(range:TrendRange,now=Date.now(),points:TrendPoint[]=[]):{start:number;end:number}|null{
 if(range==='available'){
  return points.length?{start:points[0].time,end:Math.max(points[0].time+1,points[points.length-1].time)}:null;
 }
 const days=range==='day'?1:range==='week'?7:30;
 return {start:now-days*86400000,end:now};
}
export function priceTrendRange(points:TrendPoint[],range:TrendRange,now=Date.now()):TrendPoint[]{
 if(!points.length)return points;
 const window=priceTrendWindow(range,now,points);
 if(!window)return points;
 return points.filter(p=>p.time>=window.start&&p.time<=window.end);
}
/** Visible labels describe the exact selected window, not the first/last quote.
 * This prevents identical axis labels when the server has only recent records.
 */
export function priceTrendCoverage(points:TrendPoint[],range:TrendRange,now=Date.now()):{
 total:number;oldest:number|null;newest:number|null;windowStart:number|null;windowEnd:number|null;
}{
 const win=priceTrendWindow(range,now,points);
 return {total:points.length,oldest:points[0]?.time??null,newest:points.at(-1)?.time??null,windowStart:win?.start??null,windowEnd:win?.end??null};
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
