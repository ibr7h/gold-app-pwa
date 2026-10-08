import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const source=(relative:string)=>readFileSync(new URL(relative,import.meta.url).pathname,'utf8');

describe('User app identity',()=>{
  it('keeps the canonical JPEG for app and boot, and the approved mockup fingerprint for biometric entry',()=>{
    const auth=source('../AuthForm.tsx');
    const workspace=source('../UserWorkspace.tsx');
    expect(auth).toContain('className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg"');
    expect(auth).toContain('function MockupFingerprintIcon()');
    expect(auth).toContain('viewBox="0 0 512 512"');
    expect(auth).toContain('width="40" height="40"');
    expect(auth).toContain('<span className="mockup-biometric-circle"><MockupFingerprintIcon/></span>');
    expect(auth).not.toContain('className="mockup-biometric-app-icon" src=');
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

describe('User startup and release visibility',()=>{
 it('shows the real build on boot, login, and account screens',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const auth=source('../AuthForm.tsx');
  const release=source('../app-version.ts');
  expect(workspace).toContain("import {APP_DISPLAY_VERSION} from './app-version'");
  expect(auth).toContain("import {APP_DISPLAY_VERSION} from './app-version'");
  expect(workspace).toContain('className="app-version-account"');
  expect(workspace).toContain('className="app-version-stamp"');
  expect(auth.match(/className="app-version-stamp"/g)).toHaveLength(3);
  expect(release).toMatch(/export const APP_BUILD = '(?:__USER_BUILD_SHA__|[a-f0-9]{8})';/);
 });
 it('renders a previously verified User shell before slower remote session verification',()=>{
  const context=source('../../contexts/AuthContext.web.tsx');
  const warm=context.indexOf('setUser(cached);setLoading(false);');
  const remote=context.indexOf('const me=await loadMe();');
  expect(warm).toBeGreaterThan(0);
  expect(remote).toBeGreaterThan(warm);
  expect(context).toContain("if(me.role!=='user'){await clearSession()");
  expect(context).toContain('saveVerifiedUser(');
 });
});
