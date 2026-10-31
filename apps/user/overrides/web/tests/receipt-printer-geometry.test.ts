import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';

const source=(path:string)=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8');
describe('Dhahabk tactile Receipt Printer geometry',()=>{
 it('locates the slot inside the chassis, not as a floating sibling below it',()=>{
  const ui=source('../EstimatedPriceReceiptPrinter.tsx');
  const machine=ui.indexOf('<div className="dh-estimate-printer-machine">');
  const slot=ui.indexOf('<div className="dh-estimate-printer-slot"');
  const output=ui.indexOf('<div className="dh-estimate-printer-output">');
  expect(machine).toBeGreaterThan(0);
  expect(slot).toBeGreaterThan(machine);
  expect(output).toBeGreaterThan(slot);
  expect(ui.slice(slot,output)).toMatch(/slot" aria-hidden="true"\/>\s*<\/div>/);
 });
 it('recesses the slot and overlaps a narrow paper without a giant external bar',()=>{
  const css=source('../estimated-price-receipt-printer.css');
  const slot=css.split('.dh-estimate-printer-slot{')[1]?.split('}')[0]||'';
  const output=css.split('.dh-estimate-printer-output{')[1]?.split('}')[0]||'';
  expect(slot).toContain('position:absolute');
  expect(slot).toContain('bottom:12px');
  expect(slot).toContain('height:8px');
  expect(slot).not.toContain('margin:');
  expect(output).toContain('margin:-16px auto 0');
  expect(output).toContain('width:calc(80% + 32px)');
  const machine=css.split('.dh-estimate-printer-machine{')[1]?.split('}')[0]||'';
  expect(machine).toContain('z-index:3;isolation:isolate;overflow:hidden');
  // The receipt must overlap the lower housing edge at the slot.
  // A smaller output z-index hides the paper's upper 16px and
  // makes it appear to emerge BELOW the printer, not from the slot.
  const outputLayer=Number(output.split('z-index:')[1]?.split(';')[0]);
  const housingLayer=Number(machine.split('z-index:')[1]?.split(';')[0]);
  expect(outputLayer).toBeGreaterThan(housingLayer);
  expect(output).toContain('z-index:50');
  expect(css).toContain('.dh-estimate-printer-output::before{');
 });
 it('keeps a 40-tooth paper edge, stepped feed and reduced motion fallback',()=>{
  const ui=source('../EstimatedPriceReceiptPrinter.tsx');
  const css=source('../estimated-price-receipt-printer.css');
  expect(ui).toContain('const toothCount=40');
  expect(ui).toContain('style={{clipPath:receiptEdge}}');
  expect(css).toContain('7.5%,10.5%');
  expect(css).toContain('91.5%,94.5%');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(css).toContain('@media print');
 });
});
