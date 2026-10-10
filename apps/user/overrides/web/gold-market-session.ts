/**
 * Indicative XAU/USD spot market schedule. New York time, DST-aware:
 * Sunday 18:00 through Friday 17:00, 17:00–18:00 weekday pause.
 * This is the normal schedule, not an exchange holiday/calendar feed.
 */
export type GoldSpotSession='open'|'closed';
const nyFormatter=new Intl.DateTimeFormat('en-US',{
  timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',
  hourCycle:'h23',
});
export function goldSpotSession(now:number):GoldSpotSession{
  if(!Number.isFinite(now))return 'closed';
  const parts=nyFormatter.formatToParts(new Date(now));
  const weekday=parts.find(p=>p.type==='weekday')?.value;
  const hour=Number(parts.find(p=>p.type==='hour')?.value);
  const minute=Number(parts.find(p=>p.type==='minute')?.value);
  if(!Number.isFinite(hour)||!Number.isFinite(minute))return 'closed';
  const minutes=hour*60+minute;
  if(weekday==='Sat')return 'closed';
  if(weekday==='Sun')return minutes>=18*60?'open':'closed';
  if(weekday==='Fri')return minutes<17*60?'open':'closed';
  if(weekday==='Mon'||weekday==='Tue'||weekday==='Wed'||weekday==='Thu')
    return minutes>=17*60&&minutes<18*60?'closed':'open';
  return 'closed';
}
export function marketQuoteTime(timestamp:string|undefined):string{
 const value=Date.parse(timestamp||'');
 if(!Number.isFinite(value))return 'وقت السعر غير متاح';
 return new Date(value).toLocaleString('ar-SA',{
  timeZone:'Asia/Riyadh',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'
 });
}
export function marketStatusText(session:GoldSpotSession,freshness:'fresh'|'stale'|'missing',requestFailed=false):string{
 if(freshness==='missing')return 'السعر غير متاح';
 if(session==='closed')return 'السوق العالمي مغلق';
 if(requestFailed||freshness==='stale')return 'الأسعار غير محدثة';
 return 'السوق العالمي مفتوح';
}
export function latestQuoteLabel(timestamp:string|undefined,session:GoldSpotSession):string{
 if(!timestamp||!Number.isFinite(Date.parse(timestamp)))return 'لا يوجد سعر مسجل';
 return (session==='closed'?'آخر سعر متاح':'آخر سعر مسجل')+' · '+marketQuoteTime(timestamp);
}
