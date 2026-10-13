import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {
 ounceGrams,gemCaratGrams,karatReference,localized,
 theoreticalFineGold,theoreticalGoldInvoice,theoreticalStoneCharge,
 helpNavMessages,helpReferences
} from '../gold-help-content';
import {guideCards,guideChecklist,guideText} from '../gold-help-facts';
import {translateUiText} from '../i18n-messages';

const read=(path:string)=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8');
const component=read('../GoldHelp.tsx');
const styles=read('../gold-help.css');
const workspace=read('../UserWorkspace.tsx');

describe('Gold knowledge — specialist accuracy',()=>{
 it('uses standard fineness marks and keeps approximate 24K distinct from ideal 24/24 calculation',()=>{
  expect(karatReference.map(x=>x.karat)).toEqual([24,22,21,18,14,10,9]);
  const hallmark=Object.fromEntries(karatReference.map(x=>[x.karat,x.perThousand]));
  expect(hallmark[24]).toBe('999 / 999.9');
  expect(hallmark[22]).toBe('916');
  expect(hallmark[21]).toBe('875');
  expect(hallmark[18]).toBe('750');
  expect(theoreticalFineGold(10,18)).toBe(7.5);
  expect(theoreticalFineGold(10,22)).toBeCloseTo(9.166666,5);
  expect(theoreticalFineGold(10,24)).toBe(10);
  expect(theoreticalFineGold(-2,24)).toBeNull();
  expect(theoreticalFineGold(Infinity,24)).toBeNull();
 });
 it('does not confuse troy ounces, gemstone carats or alloy-karat purity',()=>{
  expect(ounceGrams).toBe(31.1034768);
  expect(gemCaratGrams).toBe(.2);
  expect(.5*gemCaratGrams).toBeCloseTo(.1);
  expect(theoreticalStoneCharge(2,300)).toBe(600);
  expect(theoreticalStoneCharge(2,-300)).toBeNull();
 });
 it('uses illustrative line items and no fictional live quote or universal tax rate',()=>{
  expect(theoreticalGoldInvoice(10,300,250,400)).toEqual({gold:3000,subtotal:3650});
  expect(theoreticalGoldInvoice(10,300,-1,400)).toBeNull();
  expect(component).toContain('t(guideText.fictional)');
  expect(component).toContain('t(guideText.tax)');
  expect(component).not.toContain('fetch(');
  expect(component).not.toContain('/prices/latest');
 });
});

describe('Gold knowledge — editorial and language quality',()=>{
 it('keeps all 22 short factual topics in six closed-by-default expandable chapters',()=>{
  expect(guideCards).toHaveLength(22);
  expect(new Set(guideCards.map(c=>c.id)).size).toBe(22);
  expect(new Set(guideCards.map(c=>c.section))).toEqual(new Set(['purity','weight','gems','workmanship','buying','dhahabi']));
  expect(guideCards.every(c=>c.points.length>=2&&c.points.length<=3)).toBe(true);
  expect(component).toContain('<details key={card.id} className="dh-help-topic"');
  expect(component).toContain('<details className="dh-help-category" key={section}');
  expect(component).toContain("{sections.map(section=><details");
  expect(component).toContain('className="dh-help-topic-body"');
  expect(component).toContain('className="dh-help-category-body"');
  expect(component).toContain('<ul>{card.points.map(');
  expect(component).not.toContain('defaultOpen');
  expect(component).not.toContain(' open={');
 });
 it('provides proper Arabic, English and French for every card, table header, note and checklist point',()=>{
  for(const lang of ['ar','en','fr'] as const){
   for(const [name,value]of Object.entries(guideText)){
    expect(value[lang],name+'/'+lang).toBeTruthy();
    expect(value[lang].trim()).toBe(value[lang]);
   }
   for(const card of guideCards){
    expect(card.heading[lang],card.id).toBeTruthy();
    for(const point of card.points){
     expect(point[lang],card.id).toBeTruthy();
     expect(point[lang].length,card.id).toBeLessThan(225);
    }
   }
   for(const point of guideChecklist)expect(point[lang]).toBeTruthy();
  }
  expect(localized(guideText.purity,'fr')).toContain('or');
  expect(localized(guideText.making,'ar')).toContain('الصياغة');
 });
 it('removes noisy labels and previous long narrative from the actual help interface',()=>{
  expect(component).not.toContain('t(helpCopy.intro)');
  expect(component).not.toContain('22 موضوع');
  expect(component).not.toContain('dh-knowledge-search');
  expect(component).not.toContain('dh-knowledge-tabs');
  expect(component).not.toContain('dh-knowledge-count');
  expect(component).not.toContain('معلومات موثوقة تساعدك');
  expect(component).not.toContain('t(guideText.title)');
  expect(component).not.toContain('dh-knowledge-header');
  expect(component).not.toContain('t(guideText.subtitle)');
  expect(component).toContain('<Table label={t(guideText.purity)}');
 });
 it('maintains the iPhone More help entry in the shared three-language catalog',()=>{
  expect(helpNavMessages).toHaveLength(1);
  expect(translateUiText(helpNavMessages[0][0],'en')).toBe(helpNavMessages[0][1]);
  expect(translateUiText(helpNavMessages[0][0],'fr')).toBe(helpNavMessages[0][2]);
  expect(workspace).toContain('<GoldHelp language={language}/>');
  expect(workspace).not.toContain('Merchant Location لم تُنفذ');
 });
 it('links to domain specialists without external translation or price calculation requests',()=>{
  expect(helpReferences.some(x=>x.url.includes('gold.org'))).toBe(true);
  expect(helpReferences.some(x=>x.url.includes('lbma.org.uk'))).toBe(true);
  expect(helpReferences.some(x=>x.url.includes('gia.edu'))).toBe(true);
  for(const source of helpReferences){
   expect(source.url.startsWith('https://')).toBe(true);
   expect(source.name.ar).toBeTruthy();
   expect(source.name.en).toBeTruthy();
   expect(source.name.fr).toBeTruthy();
  }
  expect(component).toContain('rel="noopener noreferrer"');
 });
});

describe('Gold knowledge — responsive structured content',()=>{
 it('uses high-contrast foregrounds for open purity tables on iOS (including WebKit fill)',()=>{
  const tail=styles.slice(styles.lastIndexOf('/* iOS PWA contrast guard'));
  expect(tail).toContain('.dh-help-category[open] .dh-knowledge-table thead th');
  expect(tail).toContain('.dh-help-category[open] .dh-knowledge-table tbody td');
  expect(tail).toContain('.dh-help-category[open] .dh-knowledge-karat-button');
  expect(tail).toContain('-webkit-text-fill-color:#14273d!important');
  expect(tail).toContain('-webkit-text-fill-color:#001f3f!important');
  expect(tail).toContain('background:#fff!important');
  expect(tail).toContain('color-scheme:light');
  expect(tail).not.toContain('opacity:0');
  expect(component).toContain('<Table label={t(guideText.purity)}');
 });
 it('renders actual HTML data tables with accessible headers and a scroll boundary',()=>{
  expect(component).toContain('<table className="dh-knowledge-table"');
  expect(component).toContain('<thead><tr>');
  expect(component).toContain('scope="col"');
  expect(component).toContain('scope="row"');
  expect(component).toContain('className="dh-knowledge-table-scroll"');
  expect(styles).toContain('overflow-x:auto');
  expect(styles).toContain('table-layout:fixed');
 });
 it('keeps the chapter and inner topic surfaces visible as independent light cards',()=>{
  expect(component).toContain("style={{background:'#fff',border:'1px solid #e1e8f0',borderRadius:15,overflow:'hidden'}}");
  expect(component).toContain("style={{border:'1px solid #e3e9f1',background:'#fff',borderRadius:12,overflow:'hidden'}}");
  expect(component).toContain('className="dh-help-category-title"');
  expect(component).toContain('className="dh-help-topic-title"');
  expect(styles).toContain('details[open]>summary>.dh-help-chevron');
  expect(component).not.toContain('معلومات موثوقة تساعدك');
  expect(component).not.toContain('dh-knowledge-search');
  expect(component).not.toContain('dh-knowledge-tabs');
 });
 it('contrasts open chapters and educational cards without grey text on grey panels',()=>{
  expect(styles).toContain('.gold-web .dh-help-category[open]>.dh-help-category-title{');
  expect(styles).toContain('background:#001f3f!important');
  expect(styles).toContain('color:#ffffff!important');
  expect(styles).toContain('.gold-web .dh-help-category[open]>.dh-help-category-title .dh-help-category-name{');
  expect(styles).toContain('.gold-web .dh-help-topic[open]>.dh-help-topic-title{');
  expect(styles).toContain('background:#eef3f8!important');
  expect(styles).toContain('.gold-web .dh-help-topic-body{');
  expect(styles).toContain('background:#fffaf0!important');
  expect(styles).toContain('.gold-web .dh-help-topic-body ul{');
  expect(styles).toContain('color:#152941!important');
  expect(styles).toContain('.gold-web .dh-knowledge-table tbody tr:nth-child(even){');
  expect(styles).toContain('background:#f0f4f8!important');
  expect(styles).toContain('@media(max-width:600px)');
 });
 it('keeps price, metric values and input order safe across RTL and LTR',()=>{
  expect(component).toContain("dir={language==='ar'?'rtl':'ltr'}");
  expect(component).toContain('dir="ltr"');
  expect(component).toContain('inputMode="decimal"');
  expect(component).toContain('aria-pressed={karat===k.karat}');
  expect(styles).toContain('@media(max-width:600px)');
  expect(styles).toContain('.gold-web .dh-help-category');
  expect(styles).toContain('.gold-web .dh-help-topic[open]');
  expect(styles).toContain('grid-template-columns:minmax(0,1fr)');
 });
});
