import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {describe,it,expect} from 'vitest';
import {translateUiText} from '../i18n-messages';

const read=(path:string)=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8');
const component=read('../UserWorkspace.tsx');
const css=read('../user.css');
describe('Gold live-price units follow Arabic RTL and European LTR visual order',()=>{
 it('keeps the numeric price, currency glyph and localized unit as isolated adjacent elements',()=>{
  expect(component).toContain('<div className="price-tag-large" dir={direction}>');
  expect(component).toContain('<span className="dh-home-price-amount">{money(');
  expect(component).toContain('<small className="dh-home-price-unit" dir={direction}>');
  expect(component).toContain('<span className="dh-unit-slash" aria-hidden="true">/</span><span>{tr(\'جرام\')}</span>');
  expect(component).not.toContain('priceCurrency)}<small>/جرام</small>');
  expect(css).toMatch(/\.gold-web\.reference-home \.price-tag-large\s*\{[^}]*flex-wrap:nowrap!important/);
  expect(css).toContain('.gold-web.reference-home .dh-home-price-unit');
 });
 it('does not reverse the numeric digits when moving only the currency glyph in Arabic',()=>{
  expect(css).toContain('.gold-web.reference-home[dir="rtl"] .price-tag-large .dh-money-currency');
  expect(css).toContain('order:-1;margin-inline-start:0!important');
  expect(css).toContain('.gold-web.reference-home .dh-home-price-amount{');
  expect(css).toContain('direction:ltr;');
  expect(css).not.toContain('.gold-web.reference-home[dir="ltr"] .price-tag-large .dh-money-currency');
 });
 it('aligns the buy and sell labels separately from immutable money widgets',()=>{
  expect(component).toContain('className="dh-buy-sell-row"><span>{tr(\'سعر الشراء:\')}</span><b>');
  expect(component).toContain('className="dh-buy-sell-row"><span>{tr(\'سعر البيع:\')}</span><b>');
  expect(css).toContain('.gold-web.reference-home .buy-sell-mini .dh-buy-sell-row{');
  expect(css).toContain('.gold-web.reference-home[dir="rtl"] .buy-sell-mini .dh-money-currency');
 });
 it('uses the maintained trilingual catalog for the gram unit and purchase/sale labels',()=>{
  for(const source of ['جرام','سعر الشراء:','سعر البيع:']){
   const english=translateUiText(source,'en');
   const french=translateUiText(source,'fr');
   expect(english,source+' en').not.toBe(source);
   expect(french,source+' fr').not.toBe(source);
  }
  expect(translateUiText('جرام','en')).toBe('gram');
  expect(translateUiText('جرام','fr')).toBe('gramme');
 });
});
