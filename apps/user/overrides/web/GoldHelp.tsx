import React,{useState} from 'react';
import {
 helpReferences,karatReference,localized,ounceGrams,gemCaratGrams,
 theoreticalFineGold,theoreticalStoneCharge,theoreticalGoldInvoice,
 type HelpLanguage,type HelpText,type HelpSection
} from './gold-help-content';
import {guideText,guideCards,guideChecklist} from './gold-help-facts';
import './gold-help.css';

const sections:readonly HelpSection[]=['purity','weight','gems','workmanship','buying','dhahabi'];
const weightRows=[
 {label:'gram',amount:1,precision:0},
 {label:'kilogram',amount:1000,precision:0},
 {label:'ounce',amount:ounceGrams,precision:7},
 {label:'tola',amount:11.6638,precision:4},
 {label:'carat',amount:gemCaratGrams,precision:1}
] as const;

/** All 6 chapters and 22 individual topic cards begin collapsed. */
export default function GoldHelp({language}:{language:HelpLanguage}){
 const t=(value:HelpText)=>localized(value,language);
 const locale=language==='ar'?'ar-SA':language==='fr'?'fr-FR':'en-US';
 const number=(value:number,digits=2)=>new Intl.NumberFormat(locale,{
  minimumFractionDigits:digits,maximumFractionDigits:digits
 }).format(value);
 const [karat,setKarat]=useState(21);
 const [weight,setWeight]=useState('10');
 const [carats,setCarats]=useState('1');
 const [gemRate,setGemRate]=useState('200');
 const valid=(raw:string)=>raw.trim()!==''&&Number.isFinite(Number(raw))?Number(raw):null;
 const w=valid(weight),ct=valid(carats),rate=valid(gemRate);
 const fine=w===null?null:theoreticalFineGold(w,karat);
 const other=fine===null||w===null?null:w-fine;
 const stoneGrams=ct!==null&&ct>=0&&ct<=1000000?ct*gemCaratGrams:null;
 const stoneCharge=ct===null||rate===null?null:theoreticalStoneCharge(ct,rate);
 const invoice=theoreticalGoldInvoice(10,300,250,400)!;

 const factCards=(section:HelpSection)=><div className="dh-help-topics">
  {guideCards.filter(card=>card.section===section).map(card=>
   <details key={card.id} className="dh-help-topic"
    style={{border:'1px solid #e3e9f1',background:'#fff',borderRadius:12,overflow:'hidden'}}>
    <summary className="dh-help-topic-title" style={{
     display:'flex',alignItems:'center',justifyContent:'space-between',
     padding:'14px 15px',gap:12,color:'#001f3f',cursor:'pointer',fontWeight:650
    }}>
     <span>{t(card.heading)}</span><span className="dh-help-chevron" aria-hidden="true">⌄</span>
    </summary>
    <div className="dh-help-topic-body" style={{padding:'0 15px 16px'}}>
     <ul>{card.points.map((point,i)=><li key={i}>{t(point)}</li>)}</ul>
    </div>
   </details>)}
 </div>;

 const Table=({headers,rows,label}:{headers:readonly string[];rows:readonly (readonly React.ReactNode[])[];label:string})=>
  <div className="dh-knowledge-table-scroll">
   <table className="dh-knowledge-table" aria-label={label}>
    <thead><tr>{headers.map((head,i)=><th key={i} scope="col">{head}</th>)}</tr></thead>
    <tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>
     j===0?<th key={j} scope="row">{cell}</th>:<td key={j}>{cell}</td>
    )}</tr>)}</tbody>
   </table>
  </div>;

 const headings:Record<HelpSection,HelpText>={
  purity:guideText.purity,weight:guideText.weight,gems:guideText.gems,
  workmanship:guideText.workmanship,buying:guideText.buying,dhahabi:guideText.dhahabi
 };
 const categories:Record<HelpSection,string>={
  purity:'24K',weight:'g',gems:'◇',workmanship:'✧',buying:'✓',dhahabi:'Au'
 };
 const chapter=(section:HelpSection)=>{
  switch(section){
   case 'purity':return <>
    <Table label={t(guideText.purity)}
     headers={[t(guideText.karatCol),t(guideText.purityCol),t(guideText.hallmarkCol)]}
     rows={karatReference.map(k=>[
      <button type="button" className="dh-knowledge-karat-button"
       aria-pressed={karat===k.karat} onClick={()=>setKarat(k.karat)}>{k.karat}K</button>,
      <span dir="ltr">{number(k.percentage,k.karat===24?1:2)}%</span>,
      <span dir="ltr">{k.perThousand}</span>
     ])}/>
    {factCards(section)}
   </>;
   case 'weight':return <>
    <Table label={t(guideText.weight)}
     headers={[t(guideText.unitCol),t(guideText.gramsCol)]}
     rows={weightRows.map(row=>[t(guideText[row.label]),<span dir="ltr">{number(row.amount,row.precision)} g</span>])}/>
    {factCards(section)}
   </>;
   case 'gems':return <>
    <Table label={t(guideText.gems)}
     headers={[t(guideText.gemCol),t(guideText.gemMeaning)]}
     rows={([
      ['caratWeight','caratMeaning'],['color','colorMeaning'],
      ['clarity','clarityMeaning'],['cut','cutMeaning']
     ] as const).map(([key,value])=>[t(guideText[key]),t(guideText[value])])}/>
    {factCards(section)}
   </>;
   case 'workmanship':return <>
    <Table label={t(guideText.invoice)}
     headers={[t(guideText.part),t(guideText.amount)]}
     rows={[
      [t(guideText.goldValue),<span dir="ltr">{number(invoice.gold)}</span>],
      [t(guideText.making),<span dir="ltr">{number(250)}</span>],
      [t(guideText.stones),<span dir="ltr">{number(400)}</span>],
      [<strong>{t(guideText.total)}</strong>,<strong dir="ltr">{number(invoice.subtotal)}</strong>]
     ]}/>
    <div className="dh-knowledge-footnotes"><span>{t(guideText.fictional)}</span><span>{t(guideText.tax)}</span></div>
    {factCards(section)}
   </>;
   case 'buying':return <>
    {factCards(section)}
    <div className="dh-help-checklist">
     <h4>{t(guideText.check)}</h4>
     <ul>{guideChecklist.map((point,i)=><li key={i}>{t(point)}</li>)}</ul>
    </div>
   </>;
   case 'dhahabi':return factCards(section);
  }
 };
 return <div className="dh-knowledge dh-help-accordion" dir={language==='ar'?'rtl':'ltr'} lang={language}
  style={{display:'grid',gap:12,minWidth:0,maxWidth:1080,marginInline:'auto',paddingBottom:25}}>
  {sections.map(section=><details className="dh-help-category" key={section}
   style={{background:'#fff',border:'1px solid #e1e8f0',borderRadius:15,overflow:'hidden'}}>
   <summary className="dh-help-category-title" style={{
    display:'flex',alignItems:'center',gap:12,minHeight:70,padding:'14px 16px',
    cursor:'pointer',color:'#001f3f',fontWeight:750
   }}>
    <span className="dh-help-category-icon" dir="ltr" aria-hidden="true">{categories[section]}</span>
    <span className="dh-help-category-name">{t(headings[section])}</span>
    <span className="dh-help-chevron" aria-hidden="true">⌄</span>
   </summary>
   <div className="dh-help-category-body" style={{padding:'0 14px 15px'}}>
    {chapter(section)}
   </div>
  </details>)}

  <details className="dh-help-category" style={{background:'#fff',border:'1px solid #e1e8f0',borderRadius:15,overflow:'hidden'}}>
   <summary className="dh-help-category-title" style={{display:'flex',alignItems:'center',gap:12,minHeight:70,padding:'14px 16px',cursor:'pointer',color:'#001f3f',fontWeight:750}}>
    <span className="dh-help-category-icon" aria-hidden="true">∑</span>
    <span className="dh-help-category-name">{t(guideText.fineTitle)} / {t(guideText.stoneTitle)}</span>
    <span className="dh-help-chevron" aria-hidden="true">⌄</span>
   </summary>
   <div className="dh-help-category-body" style={{padding:'0 14px 15px'}}>
    <div className="dh-knowledge-tool-grid">
     <div className="dh-knowledge-tool">
      <h4>{t(guideText.fineTitle)}</h4>
      <div className="dh-knowledge-form-row">
       <label>{t(guideText.fineInput)}
        <input type="number" inputMode="decimal" min="0" max="1000000" value={weight} onChange={e=>setWeight(e.target.value)}/>
       </label>
       <label>{t(guideText.purity)}
        <select value={karat} onChange={e=>setKarat(Number(e.target.value))}>
         {karatReference.map(k=><option key={k.karat} value={k.karat}>{k.karat}K</option>)}
        </select>
       </label>
      </div>
      <dl className="dh-knowledge-result">
       <div><dt>{t(guideText.fineResult)}</dt><dd dir="ltr">{fine===null?'—':number(fine,3)+' g'}</dd></div>
       <div><dt>{t(guideText.otherResult)}</dt><dd dir="ltr">{other===null?'—':number(other,3)+' g'}</dd></div>
      </dl>
      <small>{t(guideText.fineNote)}</small>
     </div>
     <div className="dh-knowledge-tool">
      <h4>{t(guideText.stoneTitle)}</h4>
      <div className="dh-knowledge-form-row">
       <label>{t(guideText.stoneInput)}
        <input type="number" inputMode="decimal" min="0" max="1000000" value={carats} onChange={e=>setCarats(e.target.value)}/>
       </label>
       <label>{t(guideText.stoneRate)}
        <input type="number" inputMode="decimal" min="0" max="100000000" value={gemRate} onChange={e=>setGemRate(e.target.value)}/>
       </label>
      </div>
      <dl className="dh-knowledge-result">
       <div><dt>{t(guideText.stoneGrams)}</dt><dd dir="ltr">{stoneGrams===null?'—':number(stoneGrams,3)+' g'}</dd></div>
       <div><dt>{t(guideText.stoneResult)}</dt><dd dir="ltr">{stoneCharge===null?'—':number(stoneCharge)}</dd></div>
      </dl>
      <small>{t(guideText.stoneNote)}</small>
     </div>
    </div>
   </div>
  </details>

  <details className="dh-help-category" style={{background:'#fff',border:'1px solid #e1e8f0',borderRadius:15,overflow:'hidden'}}>
   <summary className="dh-help-category-title" style={{display:'flex',alignItems:'center',gap:12,minHeight:70,padding:'14px 16px',cursor:'pointer',color:'#001f3f',fontWeight:750}}>
    <span className="dh-help-category-icon" aria-hidden="true">↗</span>
    <span className="dh-help-category-name">{t(guideText.sources)}</span>
    <span className="dh-help-chevron" aria-hidden="true">⌄</span>
   </summary>
   <div className="dh-help-category-body" style={{padding:'0 14px 15px'}}>
    <ul className="dh-help-reference-list">{helpReferences.map(ref=><li key={ref.url}>
     <a href={ref.url} target="_blank" rel="noopener noreferrer">{t(ref.name)} ↗</a>
    </li>)}</ul>
    <small className="dh-help-reference-note">{t(guideText.caution)}</small>
   </div>
  </details>
 </div>;
}
