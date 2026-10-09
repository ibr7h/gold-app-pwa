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
    const narrow=css.split('@media(max-width:600px)').slice(1).join('\n');
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
});

describe('User wallet interaction and deletion contrast',()=>{
 it('expands a wallet in place and shows a cost difference for every purchase',()=>{
  const workspace=source('../UserWorkspace.tsx');
  expect(workspace).toContain('onClick={()=>setExpandedPortfolioId(expanded?null:portfolio.id)}');
  expect(workspace).toContain('aria-expanded={expanded}');
  expect(workspace).toContain('className="portfolio-purchases-list"');
  expect(workspace).toContain('rows.map(purchase=>');
  expect(workspace).toContain('purchasePerformance(purchase,allMarketRows)');
  expect(workspace).toContain('الفرق عن تكلفة الشراء');
  expect(workspace).toContain("position.difference===null?'غير متاح'");
 });
 it('shows delete warnings with proper color on a light surface',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const css=source('../user.css');
  expect(workspace).toContain("role={confirm?'alertdialog':'dialog'}");
  expect(workspace).toContain('id="confirm-warning-description"');
  expect(workspace).toContain('className="confirm-warning"');
  expect(css).toMatch(/\.gold-web \.dialog\.confirm-dialog\{[^}]*background:#fff!important;[^}]*color:#132238!important;/s);
  expect(css).toMatch(/\.gold-web \.dialog\.confirm-dialog \.confirm-warning strong\{[^}]*color:#B91C1C!important;/s);
 });
 it('keeps responsive wallet rows and a visible keyboard focus target',()=>{
  const css=source('../user.css');
  expect(css).toContain('.portfolio-expand-trigger:focus-visible');
  expect(css).toContain('.portfolio-purchase-metrics');
  expect(css).toContain('@media(max-width:420px)');
 });
});

describe('User price alert editor and Push continuity',()=>{
 it('adds edit action for each alert and reuses the persisted fields',()=>{
  const workspace=source('../UserWorkspace.tsx');
  expect(workspace).toContain('onClick={()=>openAlertDialog(a)}>تعديل</button>');
  expect(workspace).toContain("dialog.alert?'تعديل التنبيه':'تنبيه جديد'");
  expect(workspace).toContain('value={dialog.alert?.karat||24}');
  expect(workspace).toContain("value={dialog.alert?.currency||'SAR'}");
  expect(workspace).toContain("defaultValue={dialog.alert?.targetPrice||''}");
  expect(workspace).toContain("defaultValue={dialog.alert?.direction||'above'}");
 });
 it('edits the existing ID with PATCH and never implicitly rearms triggered alerts',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const model=source('../model.ts');
  expect(workspace).toContain("dialog.alert?'/alerts/'+dialog.alert.id:'/alerts'");
  expect(workspace).toContain("dialog.alert?'PATCH':'POST'");
  expect(workspace).toContain('سيبقى التنبيه متوقفًا');
  expect(workspace).toContain('إعادة تفعيل');
  expect(model).toContain('return {currency,karat,targetPrice,direction}');
  expect(model).not.toContain('return {currency,karat,targetPrice,direction,status}');
 });
});

describe('Mockup-aligned User gold-price chart',()=>{
 it('draws the new touch and keyboard accessible real-time chart in both User pages',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const chart=source('../PriceHistoryChart.tsx');
  expect(workspace).toContain('PriceHistoryChart rows={visibleHistory}');
  expect(workspace).toContain("historyQuery===priceCurrency+':'+chartKarat?history:[]");
  expect(chart).toContain('role="slider"');
  expect(chart).toContain('onPointerMove');
  expect(chart).toContain("e.key==='ArrowLeft'");
  expect(chart).toContain("role=\"group\"");
  expect(chart).toContain("priceTrendRange(all,range)");
  expect(chart).toContain('priceTrendDomain(points)');
  expect(chart).toContain('dh-trend-summary');
  expect(chart).toContain('preserveAspectRatio="none"');
 });
 it('keeps fixed navy/gold identity, quiet grids and comfortable responsive touch targets',()=>{
  const css=source('../user.css');
  expect(css).toContain('.gold-web .dh-trend-line');
  expect(css).toContain('stroke:#C5A021');
  expect(css).toContain('.gold-web .dh-trend-plot:focus-visible');
  expect(css).toContain('.gold-web .dh-trend-controls button');
  expect(css).toContain('min-height:37px');
  expect(css).toContain('.gold-web .dh-price-trend.compact .dh-trend-plot');
 });
});

describe('Non-intrusive iOS device unlock and native SVG currency',()=>{
 it('never opens iOS passkey sheet on login mount; requires an explicit biometric tap',()=>{
  const auth=source('../AuthForm.tsx');
  expect(auth).not.toContain('autoBiometricAttempted');
  expect(auth).not.toContain('void loginWithBiometric().then');
  expect(auth).toContain('onClick={()=>void biometric()}');
  expect(auth).toContain('autoComplete="current-password"');
 });
 it('shows Saudi Riyal SVG in alert labels and keeps other currency codes for API',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const display=source('../price-display.tsx');
  expect(workspace).toContain('<CurrencyMark currency={a.currency}/>');
  expect(display).toContain('function SaudiRiyalGlyph()');
  expect(display).toContain('viewBox="0 0 1124.14 1256.39"');
  expect(display).toContain("currency==='SAR'?<SaudiRiyalGlyph/>:currencySymbol(currency)");
 });
 it('only alters presentation, not persisted weights, invoice values or navigation',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const purchase=source('../PurchaseFormFields.tsx');
  expect(workspace).toContain('const money=(n:number|null,c:string)=><Money amount={n} currency={c}/>;');
  expect(workspace).toContain('const number=(n:number)=>formatTwo(n);');
  expect(purchase).toContain('formatTwo(value)');
  expect(workspace).toContain("dialog.alert?'PATCH':'POST'");
  expect(source('../model.ts')).toContain('unitPrice=totalPrice/weightGrams;');
 });
});

describe('Screenshot-inspired quick lock screen and explicit biometric options',()=>{
 it('shows PIN screen before cached portfolio and only unlocks against same server account',()=>{
  const workspace=source('../UserWorkspace.tsx');
  expect(workspace).toContain('if(lockedAccount)return <QuickLockScreen');
  expect(workspace).toContain('onPin={unlockWithPin}');
  expect(workspace).toContain('onForgot={logout}');
 });
 it('renders six PIN dots and a large keypad, with a user-controlled biometric tap',()=>{
  const screen=source('../QuickLockScreen.tsx');
  expect(screen).toContain('Array.from({length:PIN_LENGTH}');
  expect(screen).toContain("['1','2','3','4','5','6','7','8','9','bio','0','delete']");
  expect(screen).toContain('onClick={onBiometric}');
  expect(screen).toContain('onPin(value)');
  expect(screen).toContain('نسيت رمز الدخول السريع؟');
  expect(screen).toContain('stage===\'enter\'');
  expect(screen).not.toContain('navigator.credentials.get');
 });
 it('adds separate on/off switches for quick PIN and biometric without changing original app theme',()=>{
  const workspace=source('../UserWorkspace.tsx'),css=source('../user.css');
  expect(workspace).toContain('role="switch" aria-label="تفعيل رمز الدخول السريع"');
  expect(workspace).toContain('role="switch" aria-label="خدمة بصمة الوجه والإصبع"');
  expect(workspace).toContain('QuickPinSetup mode={pinSetup}');
  expect(workspace).toContain("onClick={()=>setPinSetup('change')}");
  expect(css).toContain('.dh-quick-lock{');
  expect(css).toContain('.dh-pin-keypad{');
  expect(css).toContain('#C5A021');
  expect(css).toContain('#001F3F');
 });
});
