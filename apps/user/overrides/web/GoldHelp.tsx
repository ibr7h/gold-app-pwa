import React,{useMemo,useState} from 'react';
import {
 helpArticles,helpCopy,helpReferences,helpSections,karatReference,
 localized,theoreticalFineGold,theoreticalGoldInvoice,theoreticalStoneCharge,gemCaratGrams,
 type HelpLanguage,type HelpSection
} from './gold-help-content';
import './gold-help.css';

/** Offline, accessible User gold-literacy center. It never reads or persists
 * account credentials, wallet totals, prices, or exchange rates.
 */
export default function GoldHelp({language}:{language:HelpLanguage}){
 const t=(text:{ar:string;en:string;fr:string})=>localized(text,language);
 const [section,setSection]=useState<HelpSection|'all'>('all');
 const [search,setSearch]=useState('');
 const [karat,setKarat]=useState(21);
 const [weight,setWeight]=useState('10');
 const [carats,setCarats]=useState('1');
 const [gemRate,setGemRate]=useState('200');
 const locale=language==='ar'?'ar-SA':language==='fr'?'fr-FR':'en-US';
 const number=(x:number,digits=2)=>new Intl.NumberFormat(locale,{
  minimumFractionDigits:digits,maximumFractionDigits:digits
 }).format(x);
 const fine=theoreticalFineGold(Number(weight),karat);
 const alloy=fine===null?null:Number(weight)-fine;
 const stoneGrams=carats.trim()!==''&&Number.isFinite(Number(carats))&&Number(carats)>=0&&Number(carats)<=1000000
  ?Number(carats)*gemCaratGrams:null;
 const stoneCharge=carats.trim()!==''&&gemRate.trim()!==''
  ?theoreticalStoneCharge(Number(carats),Number(gemRate)):null;
 const quote=theoreticalGoldInvoice(10,300,250,400)!;
 const normalized=(s:string)=>s.toLocaleLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'').trim();
 const matching=useMemo(()=>{
  const q=normalized(search);
  return helpArticles.filter(a=>(section==='all'||a.section===section)&&(!q||[
   a.title[language],a.body[language],a.tip?.[language]||'',
   ...a.tags
  ].some(v=>normalized(v).includes(q))));
 },[language,search,section]);
 const sections=section==='all'?helpSections:helpSections.filter(s=>s.id===section);
 return <section className="approved-card help-panel dh-knowledge" lang={language} dir={language==='ar'?'rtl':'ltr'}>
  <div className="approved-card-title">{t(helpCopy.helpLabel)}</div>
  <p className="dh-knowledge-intro">{t(helpCopy.intro)}</p>

  <div className="dh-knowledge-library">
   <div className="dh-knowledge-section-heading">
    <h3>{t(helpCopy.title)}</h3>
    <span className="dh-knowledge-count" aria-live="polite">{matching.length} {t(helpCopy.articlesCount)}</span>
   </div>
   <label className="dh-knowledge-search">
    <span className="dh-visually-hidden">{t(helpCopy.searchLabel)}</span>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
    <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
     placeholder={t(helpCopy.search)} aria-label={t(helpCopy.searchLabel)}/>
   </label>
   <div className="dh-knowledge-tabs" role="group" aria-label={t(helpCopy.title)}>
    <button type="button" aria-pressed={section==='all'} onClick={()=>setSection('all')}
     className={section==='all'?'active':''}>{t(helpCopy.everything)}</button>
    {helpSections.map(s=><button type="button" key={s.id} aria-pressed={section===s.id}
     className={section===s.id?'active':''} onClick={()=>setSection(s.id)}>{t(s.label)}</button>)}
   </div>
   {matching.length===0?<div className="dh-knowledge-empty" role="status">
    <p>{t(helpCopy.noResults)}</p><button type="button" onClick={()=>{setSearch('');setSection('all');}}>{t(helpCopy.everything)}</button>
   </div>:sections.map(s=>{
    const rows=matching.filter(x=>x.section===s.id);
    if(!rows.length)return null;
    return <div key={s.id} className="dh-knowledge-chapter">
     <div className="dh-knowledge-chapter-head">
      <h4>{t(s.label)}</h4><small>{t(s.summary)}</small>
     </div>
     <div className="dh-knowledge-articles">
      {rows.map(row=><details className="dh-knowledge-article" key={row.id}>
       <summary>{t(row.title)}</summary>
       <div className="dh-knowledge-answer"><p>{t(row.body)}</p>
        {row.tip&&<div className="dh-knowledge-tip"><strong>{t(helpCopy.note)}</strong><p>{t(row.tip)}</p></div>}
       </div>
      </details>)}
     </div>
    </div>;
   })}
  </div>

  <details className="dh-knowledge-utility dh-knowledge-tools">
   <summary>{t(helpCopy.toolTitle)}</summary>
   <div className="dh-knowledge-utility-body">
   <div className="dh-knowledge-tools-heading">
    <h3>{t(helpCopy.toolTitle)}</h3><p>{t(helpCopy.toolDescription)}</p>
   </div>
   <div className="dh-knowledge-tool-grid">
    <div className="dh-knowledge-tool">
     <h4>{t(helpCopy.fineGold)}</h4>
     <div className="dh-knowledge-form-row">
      <label>{t(helpCopy.grossWeight)}
       <input type="number" inputMode="decimal" min="0" max="1000000" step="any"
        value={weight} onChange={e=>setWeight(e.target.value)}/>
      </label>
      <label>{t(helpCopy.purityKarat)}
       <select value={karat} onChange={e=>setKarat(Number(e.target.value))}>
        {karatReference.map(k=><option value={k.karat} key={k.karat}>{k.karat}K</option>)}
       </select>
      </label>
     </div>
     <div className="dh-knowledge-result" aria-live="polite">
      <div><span>{t(helpCopy.fineGold)}</span><strong dir="ltr">{fine===null?'—':number(fine,3)} g</strong></div>
      <div><span>{t(helpCopy.otherMetals)}</span><strong dir="ltr">{alloy===null?'—':number(alloy,3)} g</strong></div>
     </div>
     <p className="dh-knowledge-caption">{t(helpCopy.approximate)}</p>
    </div>
    <div className="dh-knowledge-tool">
     <h4>{t(helpCopy.gemToolTitle)}</h4>
     <label>{t(helpCopy.gemCarats)}
      <input type="number" inputMode="decimal" min="0" max="1000000" step="any"
       value={carats} onChange={e=>setCarats(e.target.value)}/>
     </label>
     <label>{t(helpCopy.gemRate)}
      <input type="number" inputMode="decimal" min="0" max="100000000" step="any"
       value={gemRate} onChange={e=>setGemRate(e.target.value)}/>
     </label>
     <div className="dh-knowledge-result" aria-live="polite">
      <div><span>{t(helpCopy.gemGrams)}</span><strong dir="ltr">{stoneGrams===null?'—':number(stoneGrams,3)} g</strong></div>
      <div><span>{t(helpCopy.gemValue)}</span><strong dir="ltr">{stoneCharge===null?'—':number(stoneCharge)}</strong></div>
     </div>
     <p className="dh-knowledge-caption">{t(helpCopy.gemNote)}</p>
     <p className="dh-knowledge-caption">{t(helpCopy.gemRateNote)}</p>
    </div>
   </div>
   </div>
  </details>

  <details className="dh-knowledge-utility dh-knowledge-karat">
   <summary>{t(helpSections[0].label)}</summary>
   <div className="dh-knowledge-utility-body">
   <div className="dh-knowledge-section-heading">
    <h3>{t(helpSections[0].label)}</h3>
    <p>{t(helpSections[0].summary)}</p>
   </div>
   <div className="dh-knowledge-karat-grid">
    {karatReference.map(k=><button key={k.karat} type="button"
     aria-pressed={karat===k.karat} onClick={()=>setKarat(k.karat)}
     className={'dh-karat-card'+(karat===k.karat?' is-selected':'')}>
     <b dir="ltr">{k.karat}K</b><span dir="ltr">{number(k.percentage,k.karat===24?1:2)}%</span>
     <div className="dh-karat-bar" aria-hidden="true"><i style={{width:k.percentage+'%'}}/></div>
     <small dir="ltr">{k.perThousand}</small>
    </button>)}
   </div>
   </div>
  </details>

  <details className="dh-knowledge-utility dh-knowledge-invoice">
   <summary>{t(helpCopy.equationTitle)}</summary>
   <div className="dh-knowledge-utility-body">
   <div className="dh-knowledge-section-heading">
    <h3>{t(helpCopy.equationTitle)}</h3><p>{t(helpCopy.equationSub)}</p>
   </div>
   <div className="dh-knowledge-invoice-grid">
    <div className="dh-knowledge-receipt" role="group" aria-label={t(helpCopy.equationTitle)}>
     <div><span>{t(helpCopy.netWeight)}</span><b dir="ltr">10 g</b></div>
     <div><span>{t(helpCopy.priceGram)}</span><b dir="ltr">{number(300)} × 10</b></div>
     <div><span>{t(helpCopy.basePrice)}</span><b dir="ltr">{number(quote.gold)}</b></div>
     <div><span>{t(helpCopy.makingFee)}</span><b dir="ltr">+ {number(250)}</b></div>
     <div><span>{t(helpCopy.stonesPrice)}</span><b dir="ltr">+ {number(400)}</b></div>
     <div className="dh-knowledge-receipt-total"><span>{t(helpCopy.subtotal)}</span><strong dir="ltr">{number(quote.subtotal)}</strong></div>
     <small>{t(helpCopy.unit)}</small>
    </div>
    <div className="dh-knowledge-invoice-side">
     <p>{t(helpCopy.exampleNet)}</p>
     <p>{t(helpCopy.taxCaveat)}</p>
    </div>
   </div>
   </div>
  </details>

  <details className="dh-knowledge-utility dh-knowledge-checklist">
   <summary>{t(helpCopy.checklistTitle)}</summary>
   <div className="dh-knowledge-utility-body">
   <h3>{t(helpCopy.checklistTitle)}</h3>
   <ol>{helpCopy.checklist.map((item,i)=><li key={i}>{t(item)}</li>)}</ol>
   </div>
  </details>

  <details className="dh-knowledge-utility dh-knowledge-sources">
   <summary>{t(helpCopy.sourcesTitle)}</summary>
   <div className="dh-knowledge-utility-body">
   <h3>{t(helpCopy.sourcesTitle)}</h3>
   <p>{t(helpCopy.sourceNote)}</p>
   <ul>{helpReferences.map(ref=><li key={ref.url}><a href={ref.url}
     target="_blank" rel="noopener noreferrer" aria-label={t(ref.name)+' — '+t(helpCopy.openReference)}>
      {t(ref.name)} <span aria-hidden="true">↗</span>
     </a></li>)}</ul>
   </div>
  </details>

 </section>;
}
