import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {describe,expect,it} from 'vitest';

const read=(p:string)=>readFileSync(fileURLToPath(new URL(p,import.meta.url)),'utf8');
const current=read('../UserWorkspace.tsx');
const v1920Calculator=read('./fixtures/v1.9.20-calculator.txt');
const getCalculator=(src:string)=>{
 const a=src.indexOf("if(page==='calculator')return <>");
 const b=src.indexOf("if(page==='portfolio')return <>",a);
 if(a<0||b<0)throw Error('Calculator or next page not found');
 return src.slice(a,b);
};
describe('v1.9.20 user calculator and historical chart restoration',()=>{
 it('preserves v1.9.20 inputs and formulas, with the requested single summary card',()=>{
  const actual=getCalculator(current),baseline=v1920Calculator;
  const fields=(s:string)=>{
   const a=s.indexOf('<section className="approved-card calculator-form">');
   const b=s.indexOf('</section>',a);
   if(a<0||b<0)throw Error('Calculator inputs missing');
   return s.slice(a,b+10);
  };
  const withoutAddedUnitPrice=actual.replace(/\n    <div className="calc-unit-price" role="status" aria-live="polite">[\s\S]*?<\/div>/,'').replace('<label>المصنعية / جرام <span dir="ltr">({priceCurrency})</span> (اختياري)','<label>المصنعية / جرام (اختياري)');
  expect(fields(withoutAddedUnitPrice)).toBe(fields(baseline));
  expect(actual).toContain('سعر الجرام الأساسي حسب العيار المحدد');
  expect(actual).toContain("money(calcUnit,priceCurrency)");
  expect(actual).toContain('عيار {calcKarat}');
  expect(actual).toContain("marketClosed?' · آخر سعر مسجل':''");
  expect(current).toContain("const calcMarket=allMarketRows.find(r=>r.currency===priceCurrency&&r.karat===calcKarat)");
  expect(current).toContain('const calcUnit=calcMarket?Number(calcMarket.buyPrice):null;');
  expect(actual).not.toContain('calc-total-card');
  expect(actual).not.toContain('السعر الإجمالي التقريبي');
  expect(actual).toContain('className="approved-card calc-estimate-card"');
  expect(actual).toContain('className="calc-words-block"');
  expect(actual).toContain('className="calc-words-label">الإجمالي كتابة');
  expect(actual).toContain("calcTotal!==null?(language==='ar'?amountToDisplayCurrencyWords(calcTotal,priceCurrency):amountToLocalizedWords(calcTotal,priceCurrency,language))");
  for(const field of ["calcRaw,priceCurrency","calcFeeTotal,priceCurrency","calcTax,priceCurrency","calcTotal,priceCurrency"])expect(actual).toContain(field);
  expect(current).toContain("import {amountToDisplayCurrencyWords} from './arabic-amount-words'");
 });
 it('keeps the original historical chart in both pages with all range/interaction controls',()=>{
  expect(current).toContain('<section className="approved-card home-chart-card"><PriceHistoryChart rows={selectedHomeHistory} currency={priceCurrency} karat={24} calendar={calendar} compact range={homeRange} onRangeChange={setHomeRange} now={clock} loading={marketLoading}/></section>');
  expect(current).toContain('<PriceHistoryChart rows={visibleHistory} currency={priceCurrency} karat={chartKarat} calendar={calendar} range={chartRange} onRangeChange={setChartRange} now={clock} loading={marketLoading}/>');
  expect(current).toContain('<section className="approved-card"><div className="approved-card-title"><span>الرسم الزمني للأسعار</span>');
  expect(current).not.toContain('{!marketClosed&&<section className="approved-card home-chart-card">');
  const trend=read('../price-trend.ts');
  expect(trend).toContain('Date.parse(row.timestamp||row.createdAt||\'\')');
  expect(trend).toContain('isGlobalGoldMarketOpen(p.time)');
  expect(current).toContain("const marketTimer=setInterval(()=>{if(document.visibilityState==='visible')void loadMarket();},5*60000);");
  expect(current).toContain('disabled={marketLoading} onClick={()=>void loadMarket()}');
  const chart=read('../PriceHistoryChart.tsx');
  for(const marker of ["id:'day'","id:'week'","id:'month'","priceTrendRange(all,range,now)","role=\"slider\"","onPointerMove","e.key==='ArrowLeft'"])expect(chart).toContain(marker);
 });
 it('does not roll back other User features or account changes',()=>{
  for(const marker of ['portfolio-card-actions',"dialog.portfolio?'PATCH':'POST'","marketClosed?'السوق العالمي مغلق'"])expect(current).toContain(marker);
 });
});
