import {describe,it,expect} from 'vitest';
import {calculatorQuoteWithTaxAmount} from '../calculator-quote';
import {quoteShareText,fitQuoteWords,ShareQuote} from '../calculator-sharing';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
describe('user calculator with manually entered tax',()=>{
 it('uses user tax as a currency amount, never as a percent',()=>{
  expect(calculatorQuoteWithTaxAmount(513.92,10,0,0)).toEqual({raw:5139.2,fees:0,tax:0,total:5139.2});
  expect(calculatorQuoteWithTaxAmount(513.92,10,5,36)).toEqual({raw:5139.2,fees:50,tax:36,total:5225.2});
 });
 it('does not allow negative or non-finite tax',()=>{
  for(const tax of [-1,NaN,Infinity])expect(calculatorQuoteWithTaxAmount(500,10,0,tax).total).toBeNull();
 });
 it('does not fabricate a total when a price is missing',()=>{
  expect(calculatorQuoteWithTaxAmount(null,10,20,12)).toEqual({raw:null,fees:200,tax:12,total:null});
 });
});
const example:ShareQuote={
 language:'ar',currency:'SAR',karat:24,weight:10,unitPrice:513.92,basePrice:501.77,
 priceSource:'manual',raw:5139.2,fees:0,tax:0,total:5139.2,
 words:'فقط خمسة آلاف ومائة وتسعة وثلاثون ريالًا سعوديًا وعشرون هللة لا غير',
 generatedAt:'2026-10-16T17:00:00.000Z'
};
describe('quote sharing',()=>{
 it('uses exactly the amounts passed by the calculator',()=>{
  const content=quoteShareText(example);
  expect(content).toContain('٥١٣٫٩٢');
  expect(content).toContain('٥٠١٫٧٧');
  expect(content).toContain('٥٬١٣٩٫٢٠');
  expect(content).toContain('الضريبة المدخلة: ٠٫٠٠ SAR');
  expect(content).not.toContain('آخر متوسط السوق');
  expect(content).not.toContain('15%');
  expect(content).toContain('https://app.dhahabk.com');
 });
 it('supports non-Arabic content from the same quote snapshot',()=>{
  const en=quoteShareText({...example,language:'en',words:'Only five thousand one hundred thirty-nine Saudi riyals and twenty halalas.'});
  expect(en).toContain('Entered tax amount: 0.00 SAR');
  expect(en).toContain('Final estimated total: 5,139.20 SAR');
  const fr=quoteShareText({...example,language:'fr',words:'Cinq mille cent trente-neuf riyals.'});
  expect(fr).toContain('Taxe saisie: 0,00 SAR');
 });
});


describe('story-only quote and fitting',()=>{
 const source=(file:string)=>readFileSync(fileURLToPath(new URL(file,import.meta.url)),'utf8');
 it('places three accessible action icons beside the heading with no bottom share section or format selector',()=>{
  const ui=source('../UserWorkspace.tsx');
  expect(ui).toContain('className="approved-card-title calc-quote-heading"');
  expect(ui).toContain('className="calc-quote-actions"');
  expect(ui).toContain('<Icon name="copy"/>');
  expect(ui).toContain('<Icon name="share"/>');
  expect(ui).toContain('<Icon name="download"/>');
  expect(ui).not.toContain('calc-share-panel');
  expect(ui).not.toContain('calcShareFormat');
  expect(ui).not.toContain('منشور 4:5');
  expect(ui).not.toContain('مقاس الصورة');
 });
 it('exports only 1080 x 1920 with dark gold QR and actual User icon',()=>{
  const imageSource=source('../calculator-sharing.ts');
  expect(imageSource).toContain('const w=1080,h=1920;');
  expect(imageSource).toContain("ctx.fillStyle='#C5A021';");
  expect(imageSource).toContain("const quoteIconUrl='/gold-app-pwa/full/app_icon_user.jpg';");
  expect(imageSource).toContain('drawOfficialIcon(ctx,brandIcon);');
  expect(imageSource).not.toContain("format:ShareFormat");
  expect(imageSource).not.toContain(".slice(0,3)");
  expect(imageSource).not.toContain("rtl?'ذ':'D'");
  expect(imageSource).toContain('const totalHeight=335;');
  expect(imageSource).toContain('rounded(ctx,57,positions.total,966,totalHeight,25,gradient);');
  expect(imageSource).toContain('fitted.lines.forEach((line,i)=>write(');
  expect(imageSource).not.toContain('positions.words');
 });
 it('keeps every word and shrinks oversized tafqeet instead of truncating',()=>{
  const ctx={
   font:'',
   measureText(value:string){
    const size=Number(this.font.match(/(\d+)px/)?.[1]||30);
    return {width:Array.from(value).length*size*.66};
   },
  };
  const words=Array.from({length:95},(_,i)=>i%2?'وثلاثون':'خمسة').join(' ');
  const result=fitQuoteWords(ctx as unknown as CanvasRenderingContext2D,words,852,118);
  expect(result.fontSize).toBeLessThan(30);
  expect(result.lines.join(' ')).toBe(words);
  expect(result.lines.length*result.lineHeight).toBeLessThanOrEqual(118);
 });
});
