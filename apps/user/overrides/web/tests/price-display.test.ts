import {describe,it,expect} from 'vitest';
import React from 'react';
const {renderToStaticMarkup}=require('react-dom/server') as {renderToStaticMarkup:(node:React.ReactElement)=>string};
import {Money,currencySymbol,formatTwo,formattedMoney} from '../price-display';

describe('User money display — two decimal places and original currency symbols',()=>{
 it('always shows two decimal places, including zero and rounded observations',()=>{
  expect(formatTwo(1234.5)).toBe('١٬٢٣٤٫٥٠');
  expect(formatTwo(1234.5678)).toBe('١٬٢٣٤٫٥٧');
  expect(formatTwo(0)).toBe('٠٫٠٠');
  expect(formatTwo(4.999)).toBe('٥٫٠٠');
 });
 it('uses official Unicode 17.0 Saudi riyal sign, not the outdated Rial ligature',()=>{
  expect(currencySymbol('SAR')).toBe('\u20C1');
  expect(currencySymbol('SAR')).not.toBe('\uFDFC');
  expect(currencySymbol('USD')).toBe('$');
  expect(currencySymbol('EUR')).toBe('€');
  expect(currencySymbol('GBP')).toBe('£');
  expect(currencySymbol('INR')).toBe('₹');
  expect(currencySymbol('XYZ')).toBe('XYZ');
 });
 it('separates fractional digits for subtle styling without losing price accessibility',()=>{
  const html=renderToStaticMarkup(React.createElement(Money,{amount:1234.5,currency:'SAR'}));
  expect(html).toContain('dh-money-fraction');
  expect(html).toContain('dh-money-riyal');
  expect(html).toContain('aria-label');
  expect(html).toContain('٥٠');
  expect(html).toContain('⃁');
  expect(formattedMoney(1234.5,'SAR')).toBe('١٬٢٣٤٫٥٠ ⃁');
 });
 it('draws the official Saudi Rial contours as SVG on any desktop OS, not as unsupported text',()=>{
  const html=renderToStaticMarkup(React.createElement(Money,{amount:359.95,currency:'SAR'}));
  expect(html).toContain('viewBox="0 0 1124.14 1256.39"');
  expect(html).toContain('class="dh-riyal-svg"');
  expect(html).toContain('<path');
  expect(html).toContain('٣٥٩');
  expect(html).toContain('٩٥');
  const usd=renderToStaticMarkup(React.createElement(Money,{amount:359.95,currency:'USD'}));
  expect(usd).not.toContain('dh-riyal-svg');
  expect(usd).toContain('$');
 });
 it('does not present NaN or infinities as real financial prices',()=>{
  expect(formattedMoney(Number.NaN,'SAR')).toBe('غير متاح');
  expect(formattedMoney(Number.POSITIVE_INFINITY,'SAR')).toBe('غير متاح');
  expect(renderToStaticMarkup(React.createElement(Money,{amount:null,currency:'SAR'}))).toContain('غير متاح');
 });
});
