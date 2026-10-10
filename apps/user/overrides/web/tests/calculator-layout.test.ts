import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {calculatorQuote} from '../calculator-quote';
import {tafqeetSar,tafqeetCurrency} from '../tafqeet-sar';

const ui=readFileSync(new URL('../UserWorkspace.tsx',import.meta.url).pathname,'utf8');
const styles=readFileSync(new URL('../user.css',import.meta.url).pathname,'utf8');

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
  expect(ui).toContain('{money(calcUnit,priceCurrency)}');
 });
 it('uses exactly one preferred currency for real quotes, breakdown and words',()=>{
  expect(ui).toContain('readPriceCurrency(accountId)');
  expect(ui).toContain('savePriceCurrency(accountId,priceCurrency)');
  expect(ui).toContain("r.currency===priceCurrency&&r.karat===calcKarat");
  expect(ui).toContain('selectPriceCurrency(e.target.value)');
  expect(ui).toContain('aria-pressed={currency===priceCurrency}');
  expect(ui).toContain('tafqeetCurrency(calcTotal,priceCurrency)');
  expect(ui).toContain("money(calcRaw,priceCurrency)");
  expect(ui).toContain("money(calcFeeTotal,priceCurrency)");
  expect(ui).toContain("money(calcTax,priceCurrency)");
  expect(ui).toContain("money(calcTotal,priceCurrency)");
  expect(ui).not.toContain("tafqeetSar(calcTotal)");
  expect(ui).not.toContain("r.currency==='SAR'&&r.karat===calcKarat");
 });
 it('does not silently carry manually entered fees between currencies',()=>{
  expect(ui).toContain("setCalcFee('0');");
  expect(ui).toContain('setPriceCurrency(currency);');
  expect(ui).toContain("أجرة المصنعية لكل جرام ({priceCurrency})");
 });
 it('keeps the calculator wording legible in the navy and gold visual identity',()=>{
  expect(styles).toContain('.gold-web .calc-unit-price');
  expect(styles).toContain('.gold-web .calc-total-tafqeet');
  expect(styles).not.toContain('.gold-web .calc-total-card');
 });
 it('renders tafqeet directly below the final breakdown and not in a separate top card',()=>{
  const total=ui.indexOf('<dt>الإجمالي النهائي</dt>');
  const breakdownEnd=ui.indexOf('</dl>',total);
  const tafqeet=ui.indexOf('className="calc-total-tafqeet"',total);
  expect(total).toBeGreaterThan(0);
  expect(tafqeet).toBeGreaterThan(breakdownEnd);
  expect(tafqeet).toBeLessThan(ui.indexOf('</section>',breakdownEnd));
  expect(ui).toContain("tafqeetCurrency(calcTotal,priceCurrency)??'المبلغ غير متاح'");
 });
 it('preserves original VAT and workmanship arithmetic while spelling the *displayed* total',()=>{
  const quote=calculatorQuote(300,10,20,true);
  expect(quote.total).toBe(3680);
  expect(tafqeetCurrency(quote.total,'SAR')).toContain('ريالاً سعودياً');
  expect(tafqeetCurrency(quote.total,'USD')).toContain('دولاراً أمريكياً');
  const precise=calculatorQuote(505.5182,10,7.35,true);
  expect(precise.total).toBeCloseTo(5897.9843,8);
  expect(tafqeetSar(precise.total)).toContain('وثمان وتسعون هللةً');
  expect(precise.total).not.toBe(Number(precise.total?.toFixed(2)));
 });
});
