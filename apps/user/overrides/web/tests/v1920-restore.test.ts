import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
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
  expect(fields(actual)).toBe(fields(baseline));
  expect(actual).not.toContain('calc-total-card');
  expect(actual).not.toContain('السعر الإجمالي التقريبي');
  expect(actual).toContain('className="approved-card calc-estimate-card"');
  expect(actual).toContain('className="calc-words-block"');
  expect(actual).toContain('className="calc-words-label">الإجمالي كتابة');
  expect(actual).toContain('calcTotal!==null?amountToSaudiRiyalWords(calcTotal)');
  for(const field of ["calcRaw,'SAR'","calcFeeTotal,'SAR'","calcTax,'SAR'","calcTotal,'SAR'"])expect(actual).toContain(field);
  expect(current).toContain("import {amountToSaudiRiyalWords} from './arabic-amount-words'");
 });
 it('keeps the original historical chart in both pages with all range/interaction controls',()=>{
  expect(current).toContain('<section className="approved-card home-chart-card"><PriceHistoryChart rows={homeHistory} currency="SAR" karat={24} compact/></section>');
  expect(current).toContain('<PriceHistoryChart rows={visibleHistory} currency={priceCurrency} karat={chartKarat}/>');
  expect(current).toContain('<section className="approved-card"><div className="approved-card-title"><span>الرسم الزمني للأسعار</span>');
  expect(current).not.toContain('{!marketClosed&&<section className="approved-card home-chart-card">');
  const trend=read('../price-trend.ts');
  expect(trend).toContain('Date.parse(row.timestamp||row.createdAt||\'\')');
  expect(trend).toContain('isGlobalGoldMarketOpen(p.time)');
  expect(current).toContain("const marketTimer=setInterval(()=>{if(document.visibilityState==='visible')void loadMarket();},5*60000);");
  expect(current).toContain('disabled={marketLoading} onClick={()=>void loadMarket()}');
  const chart=read('../PriceHistoryChart.tsx');
  for(const marker of ["id:'day'","id:'week'","id:'month'","priceTrendRange(all,range)","role=\"slider\"","onPointerMove","e.key==='ArrowLeft'"])expect(chart).toContain(marker);
 });
 it('does not roll back other User features or account changes',()=>{
  for(const marker of ['portfolio-card-actions',"dialog.portfolio?'PATCH':'POST'","marketClosed?'السوق العالمي مغلق'"])expect(current).toContain(marker);
 });
});
