import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {
 helpArticles,helpCopy,helpNavMessages,helpReferences,helpSections,
 karatReference,localized,ounceGrams,gemCaratGrams,
 theoreticalFineGold,theoreticalGoldInvoice,theoreticalStoneCharge
} from '../gold-help-content';
import {translateUiText} from '../i18n-messages';

const read=(relative:string)=>readFileSync(fileURLToPath(new URL(relative,import.meta.url)),'utf8');
const guide=read('../GoldHelp.tsx');
const workspace=read('../UserWorkspace.tsx');
const css=read('../gold-help.css');

describe('Gold guide — trustworthy calculations',()=>{
 it('matches recognized karats and published fineness stamps',()=>{
  expect(karatReference.map(k=>k.karat)).toEqual([24,22,21,18,14,10,9]);
  const stamps=new Map(karatReference.map(k=>[k.karat,k.perThousand]));
  expect(stamps.get(22)).toBe('916');
  expect(stamps.get(21)).toBe('875');
  expect(stamps.get(18)).toBe('750');
  expect(stamps.get(14)).toBe('585');
  expect(theoreticalFineGold(10,24)).toBe(10);
  expect(theoreticalFineGold(10,22)).toBeCloseTo(9.1666666,5);
  expect(theoreticalFineGold(10,21)).toBe(8.75);
  expect(theoreticalFineGold(10,18)).toBe(7.5);
  expect(theoreticalFineGold(-10,18)).toBeNull();
  expect(theoreticalFineGold(10,25)).toBeNull();
 });
 it('keeps troy-ounce and gemstone-carat distinct',()=>{
  expect(ounceGrams).toBe(31.1034768);
  expect(gemCaratGrams).toBe(.2);
  expect(0.5*gemCaratGrams).toBeCloseTo(.1);
  expect(theoreticalStoneCharge(2,300)).toBe(600);
  expect(theoreticalStoneCharge(2,-1)).toBeNull();
  expect(theoreticalStoneCharge(NaN,300)).toBeNull();
 });
 it('calculates an illustrative bill without inventing a real gold price or tax',()=>{
  expect(theoreticalGoldInvoice(10,300,250,400)).toEqual({gold:3000,subtotal:3650});
  expect(theoreticalGoldInvoice(10,300,-1,400)).toBeNull();
  expect(theoreticalGoldInvoice(Infinity,300,250,400)).toBeNull();
  expect(guide).toContain('t(helpCopy.equationSub)');
  expect(guide).toContain('t(helpCopy.taxCaveat)');
  expect(guide).toContain('t(helpCopy.exampleNet)');
  expect(guide).toContain('t(helpCopy.gemRateNote)');
 });
});

describe('Gold guide — multilingual editorial completeness',()=>{
 it('covers six coherent chapters and all educational areas',()=>{
  expect(helpSections.map(s=>s.id)).toEqual(['purity','weight','gems','workmanship','buying','dhahabi']);
  expect(helpArticles.length).toBeGreaterThanOrEqual(20);
  const ids=new Set(helpArticles.map(a=>a.id));
  expect(ids.size).toBe(helpArticles.length);
  for(const section of helpSections)expect(helpArticles.some(a=>a.section===section.id),section.id).toBe(true);
  for(const term of ['karat','marks','ounce','gem-carat','diamond-4cs','stone-pricing','gem-origin','labour','making-model','invoice','resell','taxes','app-tools']){
   expect(ids.has(term),term).toBe(true);
  }
 });
 it('does not fall back to Arabic content for English or French',()=>{
  for(const lang of ['ar','en','fr'] as const){
   for(const [key,value]of Object.entries(helpCopy)){
    if(Array.isArray(value)){
     for(const item of value)expect(item[lang],key+'/'+lang).toBeTruthy();
    }else{
     expect((value as {ar:string;en:string;fr:string})[lang],key+'/'+lang).toBeTruthy();
    }
   }
   for(const section of helpSections){
    expect(section.label[lang]).toBeTruthy();
    expect(section.summary[lang]).toBeTruthy();
   }
   for(const a of helpArticles){
    expect(a.title[lang],a.id+'/'+lang).toBeTruthy();
    expect(a.body[lang].length,a.id+'/'+lang).toBeGreaterThan(80);
    if(a.tip)expect(a.tip[lang].length).toBeGreaterThan(25);
   }
   for(const r of helpReferences)expect(r.name[lang]).toBeTruthy();
  }
  expect(localized(helpSections[2].label,'fr')).toContain('Pierres');
 });
 it('translates the entry in the More menu using the shared source catalog',()=>{
  expect(helpNavMessages).toHaveLength(1);
  const source=helpNavMessages[0][0];
  expect(translateUiText(source,'en')).toBe(helpNavMessages[0][1]);
  expect(translateUiText(source,'fr')).toBe(helpNavMessages[0][2]);
  expect(workspace).toContain("<GoldHelp language={language}/>");
  expect(workspace).toContain("tr('دليل الذهب والعيارات والأحجار والمصنعية')");
  expect(workspace).not.toContain('Merchant Location لم تُنفذ');
 });
 it('references established external education sources without embedding a network request',()=>{
  expect(helpReferences.length).toBeGreaterThanOrEqual(4);
  expect(helpReferences.some(s=>s.url.includes('gold.org'))).toBe(true);
  expect(helpReferences.some(s=>s.url.includes('lbma.org.uk'))).toBe(true);
  expect(helpReferences.some(s=>s.url.includes('gia.edu'))).toBe(true);
  for(const r of helpReferences)expect(r.url.startsWith('https://')).toBe(true);
  expect(guide).toContain('rel="noopener noreferrer"');
  expect(guide).not.toContain('fetch(');
  expect(guide).not.toContain('/prices/latest');
 });
});

describe('Gold guide — accessible mobile UI',()=>{
 it('supports real search, chapter filters, native expandable articles and local language direction',()=>{
  expect(guide).toContain('type="search"');
  expect(guide).toContain('helpArticles.filter(');
  expect(guide).toContain("section==='all'||a.section===section");
  expect(guide).toContain('role="group"');
  expect(guide).toContain('aria-pressed={section===s.id}');
  expect(guide).toContain('<details className="dh-knowledge-article"');
  expect(guide).toContain("dir={language==='ar'?'rtl':'ltr'}");
  expect(guide).toContain('type="number" inputMode="decimal"');
  expect(guide).toContain('aria-live="polite"');
 });
 it('prevents narrow French/Arabic screens from clipping filters or calculators',()=>{
  expect(css).toContain('.gold-web .dh-knowledge-tabs{display:flex;gap:8px;overflow-x:auto;');
  expect(css).toContain('@media(max-width:600px)');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)');
  expect(css).toContain('.gold-web .dh-knowledge-tool input');
  expect(css).toContain('.gold-web .dh-knowledge-article summary');
  expect(css).toContain(':focus-visible');
 });
});
