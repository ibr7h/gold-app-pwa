import {isGlobalGoldMarketOpen} from './price-status';

export type TrendRange='day'|'week'|'month'|'available';
export interface TrendSourceRow{
 id?:string; buyPrice:string|number; createdAt?:string|null; timestamp?:string|null;
 kind?:'spot'|'daily-average';day?:string|null;
}
export interface TrendPoint{time:number;price:number;id:string;kind:'spot'|'daily-average'}

/** Plot supplier observation times, never the ingestion/polling time.
 * Previously createdAt won over the real source timestamp, extending a flat graph
 * through the weekend when the backend re-saved an unchanged spot quote.
 * Preserve pre-close quotes ingested later, but reject source observations outside
 * the indicative trading session (weekends / NY 17:00–18:00 rollover).
 * Market holidays beyond the ordinary schedule are not represented here.
 */
export function priceTrendPoints(rows:TrendSourceRow[]):TrendPoint[]{
 const valid=rows.map((row,index)=>{
  const kind=row.kind==='daily-average'?'daily-average' as const:'spot' as const;
  // Noon UTC denotes the *day bucket* on the x-axis, not a fabricated quote time.
  const dailyDay=typeof row.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.day)?row.day:null;
  const time=kind==='daily-average'&&dailyDay?Date.parse(dailyDay+'T12:00:00Z'):Date.parse(row.timestamp||row.createdAt||'');
  const price=Number(row.buyPrice);
  return {time,price,id:row.id||String(index),kind};
 }).filter(p=>Number.isFinite(p.time)&&(p.kind==='daily-average'||isGlobalGoldMarketOpen(p.time))&&Number.isFinite(p.price)&&p.price>0)
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
  // A new session's first observed quote is meaningful even when its rounded
  // price equals the previous close. Keep it for the open/close markers.
  const crossedClosure=previous?.kind==='spot'&&point.kind==='spot'
    &&hasMarketClosureBetween(previous.time,point.time);
  if(previous&&previous.kind===point.kind&&!crossedClosure
   &&Math.round(previous.price*100)===Math.round(point.price*100))continue;
  observed.push(point);
 }
 return observed;
}
/** Exact schedule sampling is DST-aware via America/New_York; quote times
 * come from the supplier, never from our polling/storage clock. */
export function hasMarketClosureBetween(a:number,b:number):boolean{
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)return false;
 const quarter=15*60*1000;
 for(let t=a;t<b;){
  const stop=Math.min(b,(Math.floor(t/quarter)+1)*quarter);
  if(!isGlobalGoldMarketOpen(t+(stop-t)/2))return true;
  t=stop;
 }
 return false;
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
  let discontinuity=!!previous&&(gap<=0||previous.kind!==point.kind||
    gap>(point.kind==='daily-average'?36*60*60*1000:maxUnobservedGap));
  if(previous&&previous.kind==='spot'&&!discontinuity){
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
 if(points.length<2||points[0].price<=0||points.some(p=>p.kind!==points[0].kind))return null;
 return (points[points.length-1].price-points[0].price)/points[0].price*100;
}

export interface MarketBoundaryMarker{
 index:number;type:'open'|'close';
}
/** A compact, DST-aware trading-time axis: weekends and NY rollover consume
 * no horizontal space. The points retain their real source timestamps and the
 * chart NEVER fabricates a quote in those intervals. Date-only daily averages
 * are positioned in their calendar day's first open session if noon is closed;
 * this is a display bucket, not an observation timestamp.
 */
export function priceTrendTradingCoordinates(points:TrendPoint[],start:number,end:number):number[]{
 if(!points.length)return [];
 const QUARTER=15*60*1000;
 const displayAt=(point:TrendPoint)=>{
  if(point.kind!=='daily-average'||isGlobalGoldMarketOpen(point.time))return point.time;
  for(let t=point.time;t<point.time+24*60*60*1000;t+=QUARTER){
   if(isGlobalGoldMarketOpen(t))return t;
  }
  return point.time;
 };
 const dates=points.map(displayAt);
 const origin=Math.min(start,dates[0]);
 const finish=Math.max(end,dates[dates.length-1],origin+1);
 const events=[origin,...dates,finish];
 const values=[0];
 let elapsed=0;
 for(let i=1;i<events.length;i++){
  const a=events[i-1],b=Math.max(events[i],a);
  for(let t=a;t<b;){
   const next=Math.min(b,Math.floor(t/QUARTER+1)*QUARTER);
   if(isGlobalGoldMarketOpen(t+(next-t)/2))elapsed+=next-t;
   t=next;
  }
  values.push(elapsed);
 }
 const total=values.at(-1)||0;
 if(total<=0)return points.map((_,i)=>(i+1)/(points.length+1));
 // Bound the coordinate to [0,1]; schedule gaps have zero duration.
 return points.map((_,i)=>Math.max(0,Math.min(1,values[i+1]/total)));
}
export function nearestTrendPlotIndex(coords:number[],ratio:number):number{
 if(!coords.length)return -1;
 let best=0,diff=Infinity;
 coords.forEach((x,i)=>{const d=Math.abs(x-ratio);if(d<diff){diff=d;best=i;}});
 return best;
}
/** Mark ONLY first/last actual supplier observations adjacent to a scheduled
 * closure; not a theoretical exact open/close price or a daily average. */
export function priceTrendMarketMarkers(points:TrendPoint[],now:number):MarketBoundaryMarker[]{
 const spot=points.map((p,i)=>p.kind==='spot'?i:-1).filter(i=>i>=0);
 const markers:MarketBoundaryMarker[]=[];
 const STEP=15*60*1000,NEAR=3*60*60*1000;
 const closedSpan=(a:number,b:number):{first:number;last:number}|null=>{
  let first=-1,last=-1;
  for(let t=a;t<b;){
   const stop=Math.min(b,Math.floor(t/STEP+1)*STEP);
   if(!isGlobalGoldMarketOpen(t+(stop-t)/2)){
    if(first<0)first=t;
    last=stop;
   }
   t=stop;
  }
  return first<0?null:{first,last};
 };
 for(let n=1;n<spot.length;n++){
  const a=spot[n-1],b=spot[n],prev=points[a],next=points[b];
  if(next.time-prev.time>5*86400000)continue; // do not mislabel months-long outages.
  const closure=closedSpan(prev.time,next.time);
  if(!closure)continue;
  if(closure.first-prev.time<=NEAR)markers.push({index:a,type:'close'});
  if(next.time-closure.last<=NEAR)markers.push({index:b,type:'open'});
 }
 const last=spot.at(-1);
 if(last!==undefined&&now>points[last].time&&now-points[last].time<5*86400000
   &&!isGlobalGoldMarketOpen(now)){
  const closure=closedSpan(points[last].time,now);
  if(closure&&closure.first-points[last].time<=NEAR)markers.push({index:last,type:'close'});
 }
 const seen=new Set<string>();
 return markers.filter(marker=>{
  const key=marker.index+':'+marker.type;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
/** Keep symbols readable at narrow widths; retain the newest markers first
 * and never hide the type distinction of a close/open pair. */
export function priceTrendVisibleMarkers(markers:MarketBoundaryMarker[],
 points:{x:number;y:number}[],compact:boolean):MarketBoundaryMarker[]{
 const out:MarketBoundaryMarker[]=[];
 const max=compact?6:12;
 for(let i=markers.length-1;i>=0&&out.length<max;i--){
  const marker=markers[i],point=points[marker.index];
  if(!point)continue;
  if(out.some(existing=>{
   const other=points[existing.index];
   return existing.type===marker.type&&Math.hypot(other.x-point.x,other.y-point.y)<22;
  }))continue;
  out.push(marker);
 }
 return out.reverse();
}

/** Binary search for closest real observation under a cursor, not a synthesized sample. */
export function nearestTrendIndex(points:TrendPoint[],targetTime:number):number{
 if(!points.length)return -1;
 let lo=0,hi=points.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(points[mid].time<targetTime)lo=mid+1;else hi=mid;}
 if(lo<=0)return 0;if(lo>=points.length)return points.length-1;
 return targetTime-points[lo-1].time<=points[lo].time-targetTime?lo-1:lo;
}
