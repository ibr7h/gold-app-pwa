import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {calculatorQuote} from '../calculator-quote';
import {tafqeetSar} from '../tafqeet-sar';

const ui=readFileSync(new URL('../UserWorkspace.tsx',import.meta.url).pathname,'utf8');

describe('Gold App calculator user-only layout',()=>{
 it('removes the redundant calculator total banner while retaining a single final total',()=>{
  expect(ui).not.toContain('className="approved-card calc-total-card"');
  expect(ui).not.toContain('السعر الإجمالي التقريبي');
  expect((ui.match(/<dt>الإجمالي النهائي<\/dt>/g)||[])).toHaveLength(1);
 });
 it('places selected-karat live gram price directly below karat selection',()=>{
  const karat=ui.indexOf('1. اختر عيار الذهب');
  const gram=ui.indexOf('className="calc-unit-price"');
  const weight=ui.indexOf('2. الوزن بالجرام');
  expect(karat).toBeGreaterThan(0);
  expect(gram).toBeGreaterThan(karat);
  expect(gram).toBeLessThan(weight);
  expect(ui).toContain('سعر الجرام الأساسي · عيار {calcKarat}');
  expect(ui).toContain("{money(calcUnit,'SAR')}");
 });
 it('renders tafqeet directly below the final breakdown and not in a separate top card',()=>{
  const total=ui.indexOf('<dt>الإجمالي النهائي</dt>');
  const breakdownEnd=ui.indexOf('</dl>',total);
  const tafqeet=ui.indexOf('className="calc-total-tafqeet"',total);
  expect(total).toBeGreaterThan(0);
  expect(tafqeet).toBeGreaterThan(breakdownEnd);
  expect(tafqeet).toBeLessThan(ui.indexOf('</section>',breakdownEnd));
  expect(ui).toContain("tafqeetSar(calcTotal)??'المبلغ غير متاح'");
 });
 it('preserves original VAT and workmanship arithmetic while spelling the *displayed* total',()=>{
  const quote=calculatorQuote(300,10,20,true);
  expect(quote.total).toBe(3680);
  expect(tafqeetSar(quote.total)).toContain('ريال سعودي');
  const precise=calculatorQuote(505.5182,10,7.35,true);
  expect(precise.total).toBeCloseTo(5897.9843,8);
  expect(tafqeetSar(precise.total)).toContain('وثمان وتسعون هللةً');
  expect(precise.total).not.toBe(Number(precise.total?.toFixed(2)));
 });
});
