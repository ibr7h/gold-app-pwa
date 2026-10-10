import {describe,it,expect} from 'vitest';
import React from 'react';
import PriceHistoryChart from '../PriceHistoryChart';
const {renderToStaticMarkup}=require('react-dom/server') as {renderToStaticMarkup:(node:React.ReactElement)=>string};
describe('Compact home chart',()=>{
 it('renders day/week/month controls and real observations without the full prices dashboard',()=>{
  const rows=[{id:'1',buyPrice:'500.1234',timestamp:'2026-10-09T07:00:00Z'},{id:'2',buyPrice:'502.7594',timestamp:'2026-10-09T07:55:00Z'}];
  const html=renderToStaticMarkup(<PriceHistoryChart rows={rows} currency="SAR" karat={24} compact/>);
  expect(html).toContain('حركة السوق (عيار 24)');
  expect(html).toContain('>يوم</button>');
  expect(html).toContain('>أسبوع</button>');
  expect(html).toContain('>شهر</button>');
  expect(html).toContain('role="slider"');
  expect(html).toContain('aria-valuemax="1"');
  expect(html).toContain('dh-trend-line');
  expect(html).not.toContain('class="dh-trend-summary"');
 });
 it('explains paused trading rather than offering useless timestamp refreshes',()=>{
  const html=renderToStaticMarkup(<PriceHistoryChart rows={[]} currency="SAR" karat={24} compact marketClosed/>);
  expect(html).toContain('السوق العالمي مغلق');
  expect(html).toContain('حتى يستأنف سوق الذهب العالمي');
 });
 it('shows an honest empty state for insufficient data, without a decorative fake curve',()=>{
  const html=renderToStaticMarkup(<PriceHistoryChart rows={[]} currency="SAR" karat={24} compact/>);
  expect(html).toContain('لا توجد تغيرات سعرية كافية');
  expect(html).not.toContain('class="dh-trend-line"');
  expect(html).not.toContain('role="slider"');
 });
});
