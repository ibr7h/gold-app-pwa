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
 it('keeps the core calculator controls with the restored optional percentage tax',()=>{
  const actual=getCalculator(current);
  const baseline=v1920Calculator;
  for(const marker of ['[24,22,21,18]','weight-presets','calcFee','calcWeight','calcKarat']){
   expect(actual).toContain(marker);
   expect(baseline).toContain(marker);
  }
  expect(actual).toContain('سعر الجرام الأساسي حسب العيار المحدد');
  expect(actual).toContain('money(calcBaseUnit,priceCurrency)');
  expect(actual).toContain('calc-manual-price');
  expect(actual).toContain('calcTaxInput');
  expect(actual).toContain('الضريبة (%) — اختيارية');
  expect(actual).toContain('تُحسب النسبة على قيمة الذهب وإجمالي المصنعية.');
  expect(actual).toContain('max="100"');
  expect(actual).not.toContain('ضريبة 15% (اختيارية)');
  expect(actual).not.toContain('calcVat');
  expect(actual).toContain('className="approved-card calc-estimate-card"');
  expect(actual).toContain('className="calc-words-block"');
  expect(actual).toContain('className="calc-words-label">{tr(\'المبلغ كتابة:\')}');
  expect(actual).not.toContain('className="calc-final-gold"');
  expect(actual).toContain('className="final"');
  expect(actual).toContain('className="calc-title-actions"');
  expect(actual).toContain("calcTotal!==null?(language==='ar'?amountToDisplayCurrencyWords(calcTotal,priceCurrency):amountToLocalizedWords(calcTotal,priceCurrency,language))");
  for(const field of ["calcRaw,priceCurrency","calcFeeTotal,priceCurrency","calcTax,priceCurrency","calcTotal,priceCurrency"])expect(actual).toContain(field);
  expect(current).toContain("const calcMarket=allMarketRows.find(r=>r.currency===priceCurrency&&r.karat===calcKarat)");
  expect(current).toContain("calculatorQuoteWithTaxRate(calcUnit,calcWeightN,calcFeeN,calcTaxRate)");
  expect(current).toContain("import {amountToDisplayCurrencyWords} from './arabic-amount-words'");
  expect(actual).not.toContain('calc-total-card');
  expect(actual).not.toContain('السعر الإجمالي التقريبي');
 });
 it('keeps the original historical chart in both pages with all range/interaction controls',()=>{
  expect(current).toContain('<section className="approved-card home-chart-card"><PriceHistoryChart rows={selectedHomeHistory} currency={priceCurrency} karat={24} calendar={calendar} compact range={homeRange} onRangeChange={setHomeRange} now={clock} loading={historyLoading}/></section>');
  expect(current).toContain('<PriceHistoryChart rows={visibleHistory} currency={priceCurrency} karat={chartKarat} calendar={calendar} range={chartRange} onRangeChange={setChartRange} now={clock} loading={historyLoading}/>');
  expect(current).toContain(`<section className="approved-card"><div className="approved-card-title"><span>{tr('الرسم الزمني للأسعار')}</span>`);
  expect(current).not.toContain('{!marketClosed&&<section className="approved-card home-chart-card">');
  const trend=read('../price-trend.ts');
  expect(trend).toContain('Date.parse(row.timestamp||row.createdAt||\'\')');
  expect(trend).toContain('isGlobalGoldMarketOpen(p.time)');
  expect(current).toContain("if(document.visibilityState==='visible'&&isGlobalGoldMarketOpen(Date.now()))void loadLiveQuotes();");
  expect(current).toContain('disabled={marketLoading} onClick={()=>void loadMarket()}');
  const chart=read('../PriceHistoryChart.tsx');
  for(const marker of ["id:'day'","id:'week'","id:'month'","priceTrendRange(all,range,now)","role=\"slider\"","onPointerMove","e.key==='ArrowLeft'"])expect(chart).toContain(marker);
 });
 it('does not roll back other User features or account changes',()=>{
  for(const marker of ['portfolio-card-actions',"dialog.portfolio?'PATCH':'POST'","marketClosed?'السوق العالمي مغلق'"])expect(current).toContain(marker);
 });
});
