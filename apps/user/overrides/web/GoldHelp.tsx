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
 const validNumber=(raw:string)=>raw.trim()!==''&&Number.isFinite(Number(raw))?Number(raw):null;
 const w=validNumber(weight),ct=validNumber(carats),rate=validNumber(gemRate);
 const fine=w===null?null:theoreticalFineGold(w,karat);
 const other=fine===null||w===null?null:w-fine;
 const gemstoneGrams=ct!==null&&ct>=0&&ct<=1000000?ct*gemCaratGrams:null;
 const gemstoneCharge=ct===null||rate===null?null:theoreticalStoneCharge(ct,rate);
 const invoice=theoreticalGoldInvoice(10,300,250,400)!;
 const factCards=(section:HelpSection)=><div className="dh-knowledge-fact-grid">
  {guideCards.filter(card=>card.section===section).map(card=>
   <article key={card.id} className="dh-knowledge-fact">
    <h4>{t(card.heading)}</h4>
    <ul>{card.points.map((p,i)=><li key={i}>{t(p)}</li>)}</ul>
   </article>)}
 </div>;
 const Table=({headers,rows,label}:{headers:readonly string[];rows:readonly (readonly React.ReactNode[])[];label:string})=>
  <div className="dh-knowledge-table-scroll">
   <table className="dh-knowledge-table" aria-label={label}>
    <thead><tr>{headers.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>
     j===0?<th key={j} scope="row">{cell}</th>:<td key={j}>{cell}</td>
    )}</tr>)}</tbody>
   </table>
  </div>;
 const gram=t(guideText.gram);
 return <div className="dh-knowledge" dir={language==='ar'?'rtl':'ltr'} lang={language}>
  <header className="dh-knowledge-header">
   <span className="dh-knowledge-eyebrow">Au · {t(guideText.subtitle)}</span>
   <h2>{t(guideText.title)}</h2>
  </header>

  <section className="dh-knowledge-chapter" aria-labelledby="gold-guide-purity">
   <h3 id="gold-guide-purity">{t(guideText.purity)}</h3>
   <Table label={t(guideText.purity)}
    headers={[t(guideText.karatCol),t(guideText.purityCol),t(guideText.hallmarkCol)]}
    rows={karatReference.map(k=>[
     <button type="button" className="dh-knowledge-karat-button" aria-pressed={karat===k.karat}
      onClick={()=>setKarat(k.karat)}>{k.karat}K</button>,
     <span dir="ltr">{number(k.percentage,k.karat===24?1:2)}%</span>,
     <span dir="ltr">{k.perThousand}</span>
    ])}/>
   {factCards('purity')}
  </section>

  <section className="dh-knowledge-chapter" aria-labelledby="gold-guide-weight">
   <h3 id="gold-guide-weight">{t(guideText.weight)}</h3>
   <Table label={t(guideText.weight)}
    headers={[t(guideText.unitCol),t(guideText.gramsCol)]}
    rows={weightRows.map(row=>[
     t(guideText[row.label]),
     <span dir="ltr">{number(row.amount,row.precision)} g</span>
    ])}/>
   {factCards('weight')}
  </section>

  <section className="dh-knowledge-chapter" aria-labelledby="gold-guide-gems">
   <h3 id="gold-guide-gems">{t(guideText.gems)}</h3>
   <Table label={t(guideText.gems)}
    headers={[t(guideText.gemCol),t(guideText.gemMeaning)]}
    rows={([
     ['caratWeight','caratMeaning'],['color','colorMeaning'],
     ['clarity','clarityMeaning'],['cut','cutMeaning']
    ] as const).map(([key,value])=>[t(guideText[key]),t(guideText[value])])}/>
   {factCards('gems')}
  </section>

  <section className="dh-knowledge-chapter" aria-labelledby="gold-guide-making">
   <h3 id="gold-guide-making">{t(guideText.workmanship)}</h3>
   <Table label={t(guideText.invoice)}
    headers={[t(guideText.part),t(guideText.amount)]}
    rows={[
     [t(guideText.goldValue),<span dir="ltr">{number(invoice.gold)}</span>],
     [t(guideText.making),<span dir="ltr">{number(250)}</span>],
     [t(guideText.stones),<span dir="ltr">{number(400)}</span>],
     [<strong>{t(guideText.total)}</strong>,<strong dir="ltr">{number(invoice.subtotal)}</strong>]
    ]}/>
   <div className="dh-knowledge-footnotes"><span>{t(guideText.fictional)}</span><span>{t(guideText.tax)}</span></div>
   {factCards('workmanship')}
  </section>

  <section className="dh-knowledge-chapter" aria-labelledby="gold-guide-buying">
   <h3 id="gold-guide-buying">{t(guideText.buying)}</h3>
   {factCards('buying')}
   <div className="dh-knowledge-checklist">
    <h4>{t(guideText.check)}</h4>
    <ul>{guideChecklist.map((item,i)=><li key={i}>{t(item)}</li>)}</ul>
   </div>
  </section>

  <section className="dh-knowledge-chapter" aria-labelledby="gold-guide-application">
   <h3 id="gold-guide-application">{t(guideText.dhahabi)}</h3>
   {factCards('dhahabi')}
  </section>

  <section className="dh-knowledge-chapter dh-knowledge-calculators" aria-label={t(guideText.fineTitle)}>
   <h3>{t(guideText.fineTitle)} / {t(guideText.stoneTitle)}</h3>
   <div className="dh-knowledge-tool-grid">
    <div className="dh-knowledge-tool">
     <h4>{t(guideText.fineTitle)}</h4>
     <div className="dh-knowledge-form-row">
      <label>{t(guideText.fineInput)}
       <input type="number" inputMode="decimal" min="0" max="1000000"
        value={weight} onChange={e=>setWeight(e.target.value)}/>
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
       <input type="number" inputMode="decimal" min="0" max="1000000"
        value={carats} onChange={e=>setCarats(e.target.value)}/>
      </label>
      <label>{t(guideText.stoneRate)}
       <input type="number" inputMode="decimal" min="0" max="100000000"
        value={gemRate} onChange={e=>setGemRate(e.target.value)}/>
      </label>
     </div>
     <dl className="dh-knowledge-result">
      <div><dt>{t(guideText.stoneGrams)}</dt><dd dir="ltr">{gemstoneGrams===null?'—':number(gemstoneGrams,3)+' g'}</dd></div>
      <div><dt>{t(guideText.stoneResult)}</dt><dd dir="ltr">{gemstoneCharge===null?'—':number(gemstoneCharge)}</dd></div>
     </dl>
     <small>{t(guideText.stoneNote)}</small>
    </div>
   </div>
  </section>

  <section className="dh-knowledge-chapter dh-knowledge-sources">
   <h3>{t(guideText.sources)}</h3>
   <ul>{helpReferences.map(ref=><li key={ref.url}><a href={ref.url}
    target="_blank" rel="noopener noreferrer">{t(ref.name)} <span aria-hidden="true">↗</span></a></li>)}</ul>
   <small>{t(guideText.caution)}</small>
  </section>
 </div>;
}
