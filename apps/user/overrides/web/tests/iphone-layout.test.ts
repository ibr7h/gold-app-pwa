import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const source=(relative:string)=>readFileSync(new URL(relative,import.meta.url),'utf8');

describe('User app identity',()=>{
  it('uses the canonical JPEG in login, biometric entry, and boot',()=>{
    const auth=source('../AuthForm.tsx');
    const workspace=source('../UserWorkspace.tsx');
    expect(auth).toContain('className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg"');
    expect(auth).toContain('className="mockup-biometric-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg"');
    expect(workspace).toContain('className="boot-photo-icon" src="/gold-app-pwa/full/app_icon_user.jpg"');
  });
});

describe('User mobile viewport regressions',()=>{
  it('keeps the tab navigation content-sized while the main view scrolls',()=>{
    const css=source('../user.css');
    expect(css).toContain('USER IPHONE VIEWPORT / CANONICAL BIOMETRIC 2026-10-08');
    expect(css).toMatch(/\.gold-web \.workspace-content\s*\{[^}]*flex:1 1 0%!important;[^}]*overflow-y:auto!important;/s);
    expect(css).toMatch(/\.gold-web \.mobile-bottom-nav\s*\{[^}]*flex:0 0 auto!important;[^}]*max-height:calc\(80px \+ env\(safe-area-inset-bottom\)\)!important;/s);
  });
  it('stacks live price and buy-sell values on narrow screens',()=>{
    const css=source('../user.css');
    const narrow=css.split('@media(max-width:600px)').at(-1)||'';
    expect(narrow).toContain('flex-direction:column!important;');
    expect(narrow).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important;');
  });
});
