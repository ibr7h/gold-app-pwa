import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {translateUiText} from '../i18n-messages';
const css=readFileSync(fileURLToPath(new URL('../user.css',import.meta.url)),'utf8');
const chart=readFileSync(fileURLToPath(new URL('../PriceHistoryChart.tsx',import.meta.url)),'utf8');

describe('iPhone French chart range segments',()=>{
 it('uses the existing translated period names in all three languages',()=>{
  expect(translateUiText('يوم','fr')).toBe('Jour');
  expect(translateUiText('أسبوع','fr')).toBe('Semaine');
  expect(translateUiText('شهر','fr')).toBe('Mois');
  expect(translateUiText('أسبوع','en')).toBe('Week');
  expect(chart).toContain('{tr(option.label)}');
 });
 it('stacks the long French title above a full-width selector on small phones',()=>{
  expect(css).toContain('@media(max-width:700px)');
  expect(css).toContain('.gold-web[lang="fr"] .dh-price-trend.compact{');
  expect(css).toContain('.gold-web[lang="fr"] .dh-price-trend.compact .home-chart-title{');
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))');
  expect(css).toContain('width:100%!important');
  expect(css).toContain('box-sizing:border-box');
 });
 it('keeps the French selected label inside its own tab, never over neighboring buttons',()=>{
  expect(css).toContain('.gold-web[lang="fr"] .dh-price-trend.compact .dh-trend-controls button{');
  expect(css).toContain('justify-content:center');
  expect(css).toContain('white-space:nowrap');
  expect(css).toContain('overflow:hidden');
  expect(css).toContain('font-size:clamp(11px,3.15vw,14px)!important');
 });
 it('does not override Arabic/English compact selectors or change any chart data',()=>{
  const tail=css.slice(css.lastIndexOf('/* iPhone FR:'));
  expect(tail).not.toContain('gold-web[lang="ar"]');
  expect(tail).not.toContain('gold-web[lang="en"]');
  expect(chart).toContain('range===option.id');
  expect(chart).toContain('onClick={()=>setRange(option.id)}');
 });
});
