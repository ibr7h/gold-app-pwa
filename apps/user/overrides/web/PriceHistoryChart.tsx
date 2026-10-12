import {activeLocale,useLanguage} from './i18n';
import {translateUiText} from './i18n-messages';
import {DisplayCalendar,formatDisplayDate} from './date-display';
import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {nearestTrendIndex,priceTrendDomain,priceTrendPoints,priceTrendRange,priceTrendWindow,priceTrendSegments,priceTrendTickIndices,priceTrendTradingCoordinates,nearestTrendPlotIndex,priceTrendMarketMarkers,priceTrendVisibleMarkers,trendPercent,TrendPoint,TrendRange,TrendSourceRow} from './price-trend';
import {Money,formatTwo,formattedMoney} from './price-display';

interface Props{rows:TrendSourceRow[];currency:string;karat:number;compact?:boolean;calendar?:DisplayCalendar;range?:TrendRange;onRangeChange?:(r:TrendRange)=>void;now?:number;loading?:boolean}
const currencyNumber=formatTwo;
const timeLabel=(ms:number,range:TrendRange,calendar:DisplayCalendar)=>range==='day'?
 formatDisplayDate(ms,activeLocale(),calendar,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):
 formatDisplayDate(ms,activeLocale(),calendar,{day:'2-digit',month:'2-digit'});
const completeDate=(ms:number,calendar:DisplayCalendar)=>formatDisplayDate(ms,activeLocale(),calendar,{dateStyle:'medium',timeStyle:'short'});
const onlyDate=(ms:number,calendar:DisplayCalendar)=>formatDisplayDate(ms,activeLocale(),calendar,{year:'numeric',month:'short',day:'numeric'});
const scopeLabels:{id:TrendRange;label:string}[]=[
 {id:'day',label:'24 ساعة'},{id:'week',label:'7 أيام'},{id:'month',label:'30 يومًا'},{id:'available',label:'المتاح'}
];
const compactScopes:{id:TrendRange;label:string}[]=[{id:'day',label:'يوم'},{id:'week',label:'أسبوع'},{id:'month',label:'شهر'}];

export default function PriceHistoryChart({rows,currency,karat,compact=false,calendar='gregorian',range:controlledRange,onRangeChange,now=Date.now(),loading=false}:Props){
 const {language,direction}=useLanguage();
 const tr=(label:string)=>translateUiText(label,language);
 const [localRange,setLocalRange]=useState<TrendRange>(compact?'day':'available');
 const range=controlledRange??localRange;
 const setRange=(next:TrendRange)=>{setLocalRange(next);onRangeChange?.(next);};
 const [width,setWidth]=useState(640);
 const [selectedIndex,setSelectedIndex]=useState<number|null>(null);
 const plotRef=useRef<HTMLDivElement>(null);
 const gradientId='dh-price-gradient-'+useId().replace(/:/g,'');
 const all=useMemo(()=>priceTrendPoints(rows),[rows]);
 const points=useMemo(()=>priceTrendRange(all,range,now),[all,range,now]);
 const timeWindow=priceTrendWindow(range,now,points);
 const domain=useMemo(()=>priceTrendDomain(points),[points]);
 const index=selectedIndex!==null&&selectedIndex>=0&&selectedIndex<points.length?selectedIndex:points.length-1;
 const selected=points[index];
 const change=trendPercent(points);
 const rising=change!==null&&change>=0;
 const hasDaily=points.some(p=>p.kind==='daily-average');
 const hasSpot=points.some(p=>p.kind==='spot');
 const left=12,right=Math.max(left+70,width-(compact?12:75)),top=24,bottom=compact?123:204;
 const axisStart=timeWindow?.start??0,axisEnd=timeWindow?.end??0;
 // Compress scheduled market closures without creating any artificial quotes.
 const proportions=useMemo(()=>priceTrendTradingCoordinates(points,axisStart,axisEnd),[points,axisStart,axisEnd]);
 const projectX=(_p:TrendPoint,i:number)=>left+(right-left)*(proportions[i]??0);
 const projectY=(p:TrendPoint)=>bottom-(bottom-top)*((p.price-(domain?.min||0))/Math.max(.00001,(domain?.max||1)-(domain?.min||0)));
 const plotted=points.map((p,i)=>({x:projectX(p,i),y:projectY(p),point:p}));
 const series=priceTrendSegments(points).map(segment=>segment.map(p=>{
  const index=points.indexOf(p);
  return {...plotted[index]};
 }));
 const marketMarkers=useMemo(()=>priceTrendMarketMarkers(points,now),[points,now]);
 const visibleMarkers=priceTrendVisibleMarkers(marketMarkers,plotted,compact);
 const closedConnectors=marketMarkers.flatMap((marker,i)=>{
  const next=marketMarkers[i+1];
  if(marker.type!=='close'||!next||next.type!=='open'||next.index<=marker.index)return [];
  const a=plotted[marker.index],b=plotted[next.index];
  if(!a||!b||!points.slice(marker.index+1,next.index).every(p=>p.kind!=='spot'))return [];
  return [{a,b}];
 });
 const paths=series.map(segment=>{
  const kind=segment[0].point.kind;
  const line=segment.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
  const area=segment.length>1?line+' L'+segment[segment.length-1].x.toFixed(2)+' '+bottom+' L'+segment[0].x.toFixed(2)+' '+bottom+' Z':'';
  return {line,area:kind==='spot'?area:'',single:segment.length===1?segment[0]:null,kind};
 });
 const focus=plotted[index];
 const ticks=domain&&!compact?Array.from({length:4},(_,i)=>domain.max-(domain.max-domain.min)*i/3):[];
 const tickIndices=priceTrendTickIndices(points,right-left,compact);
 const explicitRange=range!=='available'&&timeWindow!==null;
 const xAxisLabels=explicitRange?[{time:axisStart,x:left,anchor:'start' as const},{time:axisEnd,x:right,anchor:'end' as const}]:[];
 const rangeDescription=range==='day'?'24 ساعة':range==='week'?'7 أيام':range==='month'?'30 يومًا':'الفترة المتاحة';
 const rangeCoverage=range==='available'
  ?tr('جميع الأسعار المسجلة المتاحة')
  :tr('الفترة المحددة')+': '+timeLabel(axisStart,range,calendar)+' — '+timeLabel(axisEnd,range,calendar);
 const coverageNotice=points.length===0?tr('لا توجد أسعار مسجلة في هذه الفترة'):
  hasDaily?tr('متوسطات يومية:')+' '+String(points.filter(p=>p.kind==='daily-average').length)+
   (hasSpot?' · '+tr('تحديثات فعلية:')+' '+String(points.filter(p=>p.kind==='spot').length):''):
  points.length===1?tr('تحديث سعري واحد في هذه الفترة'):
  tr('عدد تحديثات الأسعار:')+' '+String(points.length);

 const movePointer=(clientX:number)=>{
  if(!points.length||!plotRef.current)return;
  const rect=plotRef.current.getBoundingClientRect();
  const localX=(clientX-rect.left)/Math.max(1,rect.width)*width;
  const ratio=Math.min(1,Math.max(0,(localX-left)/Math.max(1,right-left)));
  const nearest=nearestTrendPlotIndex(proportions,ratio);
  if(nearest>=0)setSelectedIndex(nearest);
 };
 useEffect(()=>{
  const node=plotRef.current;
  if(!node)return;
  const measure=()=>setWidth(Math.max(245,Math.round(node.getBoundingClientRect().width)||640));
  measure();
  if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);}
  const observer=new ResizeObserver(measure);
  observer.observe(node);
  return()=>observer.disconnect();
 },[points.length>=2]);
 useEffect(()=>setSelectedIndex(null),[range,karat,currency,rows]);

 return <div className={'dh-price-trend '+(compact?'compact':'')} dir={direction}>
  {compact&&<h3 className="home-chart-title">{tr('حركة السوق (عيار '+karat+')')}</h3>}
  {!compact&&<div className="dh-trend-header">
   <div className="dh-trend-reading">
    <span className="dh-trend-overline">{tr('سعر الجرام · عيار '+karat)}</span>
    <div className="dh-trend-price"><strong className="dh-trend-amount">{selected?<Money amount={selected.price} currency={currency}/>:'—'}</strong></div>
    {selected&&<small>{selected.kind==='daily-average'?tr('متوسط يومي')+': '+onlyDate(selected.time,calendar):tr('التحديث')+': '+completeDate(selected.time,calendar)}</small>}
   </div>
   <div className="dh-trend-movement">
    <span className={'dh-change '+(change===null?'neutral':rising?'up':'down')}>
     {hasDaily&&hasSpot?tr('نوعان من البيانات'):change===null?'لا توجد مقارنة':(rising?'+':'')+currencyNumber(change)+'%'}
    </span>
    <small>{tr('التغير ضمن النطاق المعروض')}</small>
   </div>
  </div>}
  <div className="dh-trend-controls" role="group" aria-label={tr('الفترة الزمنية للرسم')}>
   {(compact?compactScopes:scopeLabels).map(option=><button key={option.id} type="button"
    aria-pressed={range===option.id} className={range===option.id?'selected':''}
    onClick={()=>setRange(option.id)}>{tr(option.label)}</button>)}
  </div>
  <div className="dh-trend-range-coverage" role="status" aria-live="polite" key={range}>
   <strong>{rangeCoverage}</strong><small>{loading?tr('جارٍ تحميل أسعار الفترة المختارة…'):coverageNotice}</small>
  </div>
  {points.length<2||!domain?
   <div className="dh-trend-empty" role="status">
    <strong>{tr('لا توجد تحديثات سعرية كافية لرسم الاتجاه.')} ({tr(rangeDescription)})</strong>
    <span>{tr(range!=='available'?'لا تتوفر نقطتان فعليتان في المدة المحددة. اختر فترة أطول، ولن نملأ الفراغ بأسعار افتراضية.':compact?'بانتظار تحديثات فعلية إضافية.':'نعرض الأسعار الحقيقية المسجلة فقط. اختر مدة أخرى عند توفر بيانات أقدم.')}</span>
   </div>
  :
   <>
    <div className="dh-trend-plot" ref={plotRef} tabIndex={0} role="slider"
     aria-label={tr('استعراض أسعار الذهب عيار '+karat+' زمنيًا')}
     aria-valuemin={0} aria-valuemax={points.length-1} aria-valuenow={index}
     aria-valuetext={formattedMoney(selected.price,currency)+'، '+(selected.kind==='daily-average'?tr('متوسط يومي')+'، '+onlyDate(selected.time,calendar):completeDate(selected.time,calendar))}
     onPointerMove={e=>movePointer(e.clientX)}
     onPointerDown={e=>movePointer(e.clientX)}
     onPointerLeave={()=>setSelectedIndex(null)}
     onKeyDown={e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Home'||e.key==='End'){
       e.preventDefault();
       setSelectedIndex(e.key==='Home'?0:e.key==='End'?points.length-1:
        Math.max(0,Math.min(points.length-1,index+(e.key==='ArrowLeft'?-1:1))));
      }
     }}>
     <svg viewBox={'0 0 '+width+' '+(compact?162:250)} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
       <stop offset="0%" stopColor="#C5A021" stopOpacity=".24"/>
       <stop offset="100%" stopColor="#C5A021" stopOpacity="0"/>
      </linearGradient></defs>
      {ticks.map((v,i)=>{
       const y=top+(bottom-top)*(i/3);
       return <g key={i}><line className="dh-trend-grid" x1={left} y1={y} x2={right} y2={y}/>
        <text className="dh-trend-y" x={right+8} y={y+4} textAnchor="start">{currencyNumber(v)}</text></g>;
      })}
      {closedConnectors.map(({a,b},i)=><path key={'closure-'+i} className="dh-market-closure-bridge" d={'M'+a.x.toFixed(2)+' '+a.y.toFixed(2)+' L'+b.x.toFixed(2)+' '+b.y.toFixed(2)} fill="none" stroke="#8496a9" strokeWidth="1.4" strokeDasharray="2 4"/>)} 
      {paths.map(({line,area,single,kind},i)=><g key={i}>
       {area&&<path className="dh-trend-area" d={area} fill={'url(#'+gradientId+')'}/>}
       <path className="dh-trend-line" d={line} strokeDasharray={kind==='daily-average'?'5 4':undefined}/>
       {single&&<circle className="dh-trend-point" cx={single.x} cy={single.y} r="3"/>}
      </g>)}
      {visibleMarkers.map(marker=>{
       const original=plotted[marker.index],opening=marker.type==='open';
       const label=tr(opening?'أول سعر مسجل بعد فتح السوق':'آخر سعر مسجل قبل إغلاق السوق');
       // Separate opening and closing symbols vertically when source points cluster.
       const x=Math.max(left+5,Math.min(right-5,original.x+(opening?6:-6)));
       const y=Math.max(top+9,Math.min(bottom-9,original.y+(opening?-12:12)));
       return <g key={marker.type+'-'+marker.index}>
        <title>{label}: {formattedMoney(original.point.price,currency)} · {completeDate(original.point.time,calendar)}</title>
        <path d={'M'+original.x+' '+original.y+' L'+x+' '+y} stroke="#60738a" strokeWidth="1" fill="none"/>
        {opening?<path d={'M'+(x-5)+' '+(y-6)+' L'+(x+6)+' '+y+' L'+(x-5)+' '+(y+6)+' Z'} fill="#1a8b74" stroke="#ffffff" strokeWidth="1.6"/>:
         <rect x={x-4.5} y={y-4.5} width="9" height="9" rx="2" fill="#ad5d35" stroke="#ffffff" strokeWidth="1.5"/>}
       </g>;
      })}
      {focus&&selectedIndex!==null&&<g className="dh-trend-focus">
       {(!compact||selectedIndex!==null)&&<line x1={focus.x} y1={top} x2={focus.x} y2={bottom} className="dh-trend-crosshair"/>}
       {(!compact||selectedIndex!==null)&&<circle cx={focus.x} cy={focus.y} r="8" className="dh-trend-ring"/>}
       <circle cx={focus.x} cy={focus.y} r="4" className="dh-trend-point"/>
      </g>}
      {explicitRange?xAxisLabels.map((tick,i)=><text key={'window-'+i} className="dh-trend-x"
       x={tick.x} y={compact?154:238} textAnchor={tick.anchor}>
       {timeLabel(tick.time,range,calendar)}
      </text>):tickIndices.map((n,i)=><text key={n} className="dh-trend-x"
       x={plotted[n].x} y={compact?154:238} textAnchor={i===0?'start':i===tickIndices.length-1?'end':'middle'}>
       {timeLabel(points[n].time,range,calendar)}
      </text>)}
     </svg>
    </div>
    {!compact&&<div className="dh-trend-summary" aria-label={tr('ملخص حركة الأسعار خلال الفترة المعروضة')}>
     <div><span>{tr('الأعلى')}</span><strong><Money amount={domain.high} currency={currency}/></strong></div>
     <div><span>{tr('الأدنى')}</span><strong><Money amount={domain.low} currency={currency}/></strong></div>
     <div><span>{tr('بداية الفترة')}</span><strong><Money amount={points[0].price} currency={currency}/></strong></div>
    </div>}
    {compact&&selectedIndex!==null&&<p className="home-chart-selection"><Money amount={selected.price} currency={currency}/> · {selected.kind==='daily-average'?tr('متوسط يومي')+' · '+onlyDate(selected.time,calendar):completeDate(selected.time,calendar)}</p>}
   </>
  }
  {marketMarkers.length>0&&<div className="dh-session-legend" aria-label={tr('علامات جلسات السوق')}>
   <span><b className="dh-session-open">▶</b>{tr('أول سعر مسجل بعد فتح السوق')}</span>
   <span><b className="dh-session-close">■</b>{tr('آخر سعر مسجل قبل إغلاق السوق')}</span>
  </div>}
  <p className="dh-trend-footnote">{tr('تم ضغط فترات إغلاق السوق بصريًا؛ لا تعني الوصلات الرمادية حدوث تداول.')} · {hasDaily?tr('الخط المتقطع يمثل متوسطات يومية تاريخية؛ والخط المتصل يمثل تحديثات فعلية. لا يمثل المتوسط اليومي سعر إغلاق أو سعرًا لحظيًا.') :tr(compact?'أسعار مسجلة فقط، دون تقديرات.':'يعرض الرسم تغير الأسعار المسجلة خلال الفترة المختارة، دون إضافة أسعار تقديرية.')} · {tr('الفترة')}: {tr(rangeDescription)}</p>
 </div>;
}
