import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const source=(relative:string)=>readFileSync(new URL(relative,import.meta.url).pathname,'utf8');

describe('Gold App User iPhone shell',()=>{
 it('is isolated from the desktop and other apps',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const iphone=source('../iphone.css');
  expect(workspace).toContain("import './iphone.css';");
  expect(iphone).toContain('@supports (-webkit-touch-callout: none)');
  expect(iphone).toContain('@media (max-width: 800px) and (pointer: coarse)');
  expect(iphone).toContain('.gold-web.workspace');
 });
 it('locks the app shell and bottom navigation to the dynamic viewport',()=>{
  const css=source('../iphone.css');
  expect(css).toContain('position: fixed !important;');
  expect(css).toContain('height: 100dvh !important;');
  expect(css).toContain('flex: 1 1 0% !important;');
  expect(css).toContain('overflow-y: auto !important;');
  expect(css).toContain('flex: 0 0 auto !important;');
  expect(css).toContain('env(safe-area-inset-bottom, 0px)');
  expect(css).toContain('grid-template-columns: repeat(5, minmax(0, 1fr)) !important;');
 });
 it('prevents automatic iOS input focus zoom while keeping intentional pinch zoom',()=>{
  const css=source('../iphone.css');
  expect(css).toContain('font-size: 16px !important;');
  expect(css).toContain('touch-action: manipulation;');
  expect(css).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
 });
 it('resets only content scroll when changing pages',()=>{
  const workspace=source('../UserWorkspace.tsx');
  expect(workspace).toContain('ref={pageScrollRef}');
  expect(workspace).toContain("pageScrollRef.current?.scrollTo({top:0,behavior:'auto'});");
 });
 it('does not lose consecutive taps in quick PIN input or duplicate biometric entry',()=>{
  const lock=source('../QuickLockScreen.tsx');
  expect(lock).toContain("const digitsRef=useRef('');");
  expect(lock).toContain('commit(digitsRef.current+key)');
  expect(lock).toContain('if(/^\\d$/.test(e.key))');
  expect(lock).toContain('},[add,erase,loading]);');
  expect(lock).toContain('biometricEnabled&&!quickPinEnabled&&');
  expect(lock).toContain('onPin(value)');
  expect(lock).toContain('جارٍ التحقق من الرمز');
 });
});
