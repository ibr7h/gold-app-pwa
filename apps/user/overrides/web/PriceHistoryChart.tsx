import {activeLocale} from './i18n';
import {DisplayCalendar,formatDisplayDate} from './date-display';
import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {nearestTrendIndex,priceTrendDomain,priceTrendPoints,priceTrendRange,priceTrendWindow,priceTrendSegments,priceTrendTickIndices,trendPercent,TrendPoint,TrendRange,TrendSourceRow} from './price-trend';
import {Money,formatTwo,formattedMoney} from './price-display';

interface Props{rows:TrendSourceRow[];currency:string;karat:number;compact?:boolean;calendar?:DisplayCalendar;range?:TrendRange;onRangeChange?:(r:TrendRange)=>void;now?:number;loading?:boolean}
const currencyNumber=formatTwo;
const timeLabel=(ms:number,range:TrendRange,calendar:DisplayCalendar)=>range==='day'?
 formatDisplayDate(ms,activeLocale(),calendar,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):
 formatDisplayDate(ms,activeLocale(),calendar,{day:'2-digit',month:'2-digit'});
const completeDate=(ms:number,calendar:DisplayCalendar)=>formatDisplayDate(ms,activeLocale(),calendar,{dateStyle:'medium',timeStyle:'short'});
const scopeLabels:{id:TrendRange;label:string}[]=[
 {id:'day',label:'24 ساعة'},{id:'week',label:'7 أيام'},{id:'month',label:'30 يومًا'},{id:'available',label:'المتاح'}
];
const compactScopes:{id:TrendRange;label:string}[]=[{id:'day',label:'يوم'},{id:'week',label:'أسبوع'},{id:'month',label:'شهر'}];

export default function PriceHistoryChart({rows,currency,karat,compact=false,calendar='gregorian',range:controlledRange,onRangeChange,now=Date.now(),loading=false}:Props){
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
 const latest=points[points.length-1];
 const index=selectedIndex!==null&&selectedIndex>=0&&selectedIndex<points.length?selectedIndex:points.length-1;
 const selected=points[index];
 const change=trendPercent(points);
 const rising=change!==null&&change>=0;
 const left=12,right=Math.max(left+70,width-(compact?12:75)),top=24,bottom=compact?123:204;
 const axisStart=timeWindow?.start??0,axisEnd=timeWindow?.end??0;
 const spanTime=Math.max(1,axisEnd-axisStart);
 const projectX=(p:TrendPoint)=>left+(right-left)*((p.time-axisStart)/spanTime);
 const projectY=(p:TrendPoint)=>bottom-(bottom-top)*((p.price-(domain?.min||0))/Math.max(.00001,(domain?.max||1)-(domain?.min||0)));
 const plotted=points.map(p=>({x:projectX(p),y:projectY(p),point:p}));
 const series=priceTrendSegments(points).map(segment=>segment.map(p=>({x:projectX(p),y:projectY(p),point:p})));
 const paths=series.map(segment=>{
  const line=segment.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
  const area=segment.length>1?line+' L'+segment[segment.length-1].x.toFixed(2)+' '+bottom+' L'+segment[0].x.toFixed(2)+' '+bottom+' Z':'';
  return {line,area,single:segment.length===1?segment[0]:null};
 });
 const focus=plotted[index];
 const ticks=domain&&!compact?Array.from({length:4},(_,i)=>domain.max-(domain.max-domain.min)*i/3):[];
 const tickIndices=priceTrendTickIndices(points,right-left,compact);
 const explicitRange=range!=='available'&&timeWindow!==null;
 const xAxisLabels=explicitRange?[{time:axisStart,x:left,anchor:'start' as const},{time:axisEnd,x:right,anchor:'end' as const}]:[];
 const rangeDescription=range==='day'?'24 ساعة':range==='week'?'7 أيام':range==='month'?'30 يومًا':'الفترة المتاحة';
 const movePointer=(clientX:number)=>{
  if(!points.length||!plotRef.current)return;
  const rect=plotRef.current.getBoundingClientRect();
  const localX=(clientX-rect.left)/Math.max(1,rect.width)*width;
  const ratio=Math.min(1,Math.max(0,(localX-left)/Math.max(1,right-left)));
  const target=axisStart+ratio*spanTime;
  const nearest=nearestTrendIndex(points,target);
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

 return <div className={'dh-price-trend '+(compact?'compact':'')} dir="rtl">
  {compact&&<h3 className="home-chart-title">حركة السوق (عيار {karat})</h3>}
  {!compact&&<div className="dh-trend-header">
   <div className="dh-trend-reading">
    <span className="dh-trend-overline">سعر الجرام · عيار {karat}</span>
    <div className="dh-trend-price"><strong className="dh-trend-amount">{selected?<Money amount={selected.price} currency={currency}/>:'—'}</strong></div>
    {selected&&<small>التحديث: {completeDate(selected.time,calendar)}</small>}
   </div>
   <div className="dh-trend-movement">
    <span className={'dh-change '+(change===null?'neutral':rising?'up':'down')}>
     {change===null?'لا توجد مقارنة':(rising?'+':'')+currencyNumber(change)+'%'}
    </span>
    <small>التغير ضمن النطاق المعروض</small>
   </div>
  </div>}
  <div className="dh-trend-controls" role="group" aria-label="الفترة الزمنية للرسم">
   {(compact?compactScopes:scopeLabels).map(option=><button key={option.id} type="button"
    aria-pressed={range===option.id} className={range===option.id?'selected':''}
    onClick={()=>setRange(option.id)}>{option.label}</button>)}
  </div>
  {loading&&<p className="dh-trend-loading" role="status">جارٍ تحميل أسعار الفترة المختارة…</p>}
  {points.length<2||!domain?
   <div className="dh-trend-empty" role="status">
    <strong>{'البيانات خلال '+rangeDescription+': '+(points.length===0?'لا توجد أسعار مسجلة.':'لا توجد تحديثات كافية لرسم الاتجاه.')}</strong>
    <span>{range!=='available'?'لا تتوفر نقطتان فعليتان في المدة المحددة. اختر فترة أطول، ولن نملأ الفراغ بأسعار افتراضية.':compact?'بانتظار تحديثات فعلية إضافية.':'نعرض الأسعار الحقيقية المسجلة فقط. اختر مدة أخرى عند توفر بيانات أقدم.'}</span>
   </div>
  :
   <>
    <div className="dh-trend-plot" ref={plotRef} tabIndex={0} role="slider"
     aria-label={'استعراض أسعار الذهب عيار '+karat+' زمنيًا'}
     aria-valuemin={0} aria-valuemax={points.length-1} aria-valuenow={index}
     aria-valuetext={formattedMoney(selected.price,currency)+'، '+completeDate(selected.time,calendar)}
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
      {paths.map(({line,area,single},i)=><g key={i}>
       {area&&<path className="dh-trend-area" d={area} fill={'url(#'+gradientId+')'}/>}
       <path className="dh-trend-line" d={line}/>
       {single&&<circle className="dh-trend-point" cx={single.x} cy={single.y} r="3"/>}
      </g>)}
      {focus&&<g className="dh-trend-focus">
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
    {!compact&&<div className="dh-trend-summary" aria-label="ملخص حركة الأسعار خلال الفترة المعروضة">
     <div><span>الأعلى</span><strong><Money amount={domain.high} currency={currency}/></strong></div>
     <div><span>الأدنى</span><strong><Money amount={domain.low} currency={currency}/></strong></div>
     <div><span>بداية الفترة</span><strong><Money amount={points[0].price} currency={currency}/></strong></div>
    </div>}
    {compact&&selectedIndex!==null&&<p className="home-chart-selection"><Money amount={selected.price} currency={currency}/> · {completeDate(selected.time,calendar)}</p>}
   </>
  }
  <p className="dh-trend-footnote">{'الفترة: '+rangeDescription+' · أسعار مسجلة فعليًا فقط، دون تمديد الرسم خلال إغلاق السوق.'}</p>
 </div>;
}
