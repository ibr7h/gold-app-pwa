import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {nearestTrendIndex,priceTrendDomain,priceTrendPoints,priceTrendRange,trendPercent,TrendPoint,TrendRange,TrendSourceRow} from './price-trend';

interface Props{rows:TrendSourceRow[];currency:string;karat:number;compact?:boolean}
const currencyNumber=(value:number)=>new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:4}).format(value);
const timeLabel=(ms:number,range:TrendRange)=>{
 const date=new Date(ms);
 return range==='day'?
  date.toLocaleTimeString('ar-SA',{hour:'numeric',minute:'2-digit'}):
  date.toLocaleDateString('ar-SA',{day:'numeric',month:'short'});
};
const completeDate=(ms:number)=>new Date(ms).toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'});
const scopeLabels:{id:TrendRange;label:string}[]=[
 {id:'day',label:'24 ساعة'},{id:'week',label:'7 أيام'},{id:'available',label:'المتاح'}
];

export default function PriceHistoryChart({rows,currency,karat,compact=false}:Props){
 const [range,setRange]=useState<TrendRange>('available');
 const [width,setWidth]=useState(640);
 const [selectedIndex,setSelectedIndex]=useState<number|null>(null);
 const plotRef=useRef<HTMLDivElement>(null);
 const gradientId='dh-price-gradient-'+useId().replace(/:/g,'');
 const all=useMemo(()=>priceTrendPoints(rows),[rows]);
 const points=useMemo(()=>priceTrendRange(all,range),[all,range]);
 const domain=useMemo(()=>priceTrendDomain(points),[points]);
 const latest=points[points.length-1];
 const index=selectedIndex!==null&&selectedIndex>=0&&selectedIndex<points.length?selectedIndex:points.length-1;
 const selected=points[index];
 const change=trendPercent(points);
 const rising=change!==null&&change>=0;
 const left=12,right=Math.max(left+70,width-75),top=24,bottom=204;
 const spanTime=Math.max(1,(latest?.time||0)-(points[0]?.time||0));
 const projectX=(p:TrendPoint)=>left+(right-left)*((p.time-points[0].time)/spanTime);
 const projectY=(p:TrendPoint)=>bottom-(bottom-top)*((p.price-(domain?.min||0))/Math.max(.00001,(domain?.max||1)-(domain?.min||0)));
 const plotted=points.map(p=>({x:projectX(p),y:projectY(p),point:p}));
 const line=plotted.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
 const area=plotted.length>1?line+' L'+plotted[plotted.length-1].x.toFixed(2)+' '+bottom+' L'+plotted[0].x.toFixed(2)+' '+bottom+' Z':'';
 const focus=plotted[index];
 const ticks=domain?Array.from({length:4},(_,i)=>domain.max-(domain.max-domain.min)*i/3):[];
 const tickIndices=points.length>=2?[0,Math.floor((points.length-1)/2),points.length-1].filter((n,i,arr)=>arr.indexOf(n)===i):[];
 const timeCoverage=all.length>1?(all[all.length-1].time-all[0].time)/(60*60*1000):0;
 const movePointer=(clientX:number)=>{
  if(!points.length||!plotRef.current)return;
  const rect=plotRef.current.getBoundingClientRect();
  const localX=(clientX-rect.left)/Math.max(1,rect.width)*width;
  const ratio=Math.min(1,Math.max(0,(localX-left)/Math.max(1,right-left)));
  const target=points[0].time+ratio*spanTime;
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
 },[points.length>0]);
 useEffect(()=>setSelectedIndex(null),[range,karat,currency,rows]);

 return <div className={'dh-price-trend '+(compact?'compact':'')} dir="rtl">
  <div className="dh-trend-header">
   <div className="dh-trend-reading">
    <span className="dh-trend-overline">سعر الجرام · عيار {karat}</span>
    <div className="dh-trend-price"><strong dir="ltr">{selected?currencyNumber(selected.price):'—'}</strong><span>{currency}</span></div>
    {selected&&<small>التحديث: {completeDate(selected.time)}</small>}
   </div>
   <div className="dh-trend-movement">
    <span className={'dh-change '+(change===null?'neutral':rising?'up':'down')}>
     {change===null?'لا توجد مقارنة':(rising?'+':'')+currencyNumber(change)+'%'}
    </span>
    <small>التغير ضمن النطاق المعروض</small>
   </div>
  </div>
  <div className="dh-trend-controls" role="group" aria-label="الفترة الزمنية للرسم">
   {scopeLabels.map(option=><button key={option.id} type="button"
    aria-pressed={range===option.id} className={range===option.id?'selected':''}
    onClick={()=>setRange(option.id)}>{option.label}</button>)}
  </div>
  {points.length<2||!domain?
   <div className="dh-trend-empty" role="status">
    <strong>{all.length<2?'لا توجد تحديثات سعرية كافية لرسم الاتجاه.':'لا توجد نقطتان مسجلتان ضمن الفترة المختارة.'}</strong>
    <span>نعرض الأسعار الحقيقية المسجلة فقط. يمكنك اختيار «المتاح» لعرض جميع السجلات المحمّلة.</span>
   </div>
  :
   <>
    <div className="dh-trend-plot" ref={plotRef} tabIndex={0} role="slider"
     aria-label={'استعراض أسعار الذهب عيار '+karat+' زمنيًا'}
     aria-valuemin={0} aria-valuemax={points.length-1} aria-valuenow={index}
     aria-valuetext={currencyNumber(selected.price)+' '+currency+'، '+completeDate(selected.time)}
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
     <svg viewBox={'0 0 '+width+' 250'} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
       <stop offset="0%" stopColor="#C5A021" stopOpacity=".24"/>
       <stop offset="100%" stopColor="#C5A021" stopOpacity="0"/>
      </linearGradient></defs>
      {ticks.map((v,i)=>{
       const y=top+(bottom-top)*(i/3);
       return <g key={i}><line className="dh-trend-grid" x1={left} y1={y} x2={right} y2={y}/>
        <text className="dh-trend-y" x={right+8} y={y+4} textAnchor="start">{currencyNumber(v)}</text></g>;
      })}
      <path className="dh-trend-area" d={area} fill={'url(#'+gradientId+')'}/>
      <path className="dh-trend-line" d={line}/>
      {focus&&<g className="dh-trend-focus">
       <line x1={focus.x} y1={top} x2={focus.x} y2={bottom} className="dh-trend-crosshair"/>
       <circle cx={focus.x} cy={focus.y} r="8" className="dh-trend-ring"/>
       <circle cx={focus.x} cy={focus.y} r="4" className="dh-trend-point"/>
      </g>}
      {tickIndices.map((n,i)=><text key={n} className="dh-trend-x"
       x={plotted[n].x} y={238} textAnchor={i===0?'start':i===tickIndices.length-1?'end':'middle'}>
       {timeLabel(points[n].time,range)}
      </text>)}
     </svg>
    </div>
    <div className="dh-trend-summary" aria-label="ملخص حركة الأسعار خلال الفترة المعروضة">
     <div><span>الأعلى</span><strong dir="ltr">{currencyNumber(domain.high)} <small>{currency}</small></strong></div>
     <div><span>الأدنى</span><strong dir="ltr">{currencyNumber(domain.low)} <small>{currency}</small></strong></div>
     <div><span>بداية الفترة</span><strong dir="ltr">{currencyNumber(points[0].price)} <small>{currency}</small></strong></div>
    </div>
   </>
  }
  <p className="dh-trend-footnote">
   {all.length>1?'الخط يربط تحديثات فعلية، والمسافات الأفقية تمثل الزمن الحقيقي.':'بانتظار حفظ تحديثات سعرية إضافية.'}
   {all.length>1&&timeCoverage<24&&range==='available'?' · السجل المتاح أقل من 24 ساعة.':''}
   {' '}بحد أقصى 200 سجل من الخادم؛ لا نضيف أسعارًا افتراضية.
  </p>
 </div>;
}
