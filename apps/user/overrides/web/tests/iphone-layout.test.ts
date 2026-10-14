import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {describe,it,expect} from 'vitest';

const source=(relative:string)=>readFileSync(fileURLToPath(new URL(relative,import.meta.url)),'utf8');

describe('iPhone language stability regressions',()=>{
 it('persists an explicit choice for both auth and app without a second language override',()=>{
  const locale=source('../i18n.tsx');
  expect(locale).toContain("if(language===next)return;");
  expect(locale).toContain("window.localStorage.setItem(LANGUAGE_KEY,next)");
  expect(locale).toContain("window.localStorage.setItem(AUTH_LANGUAGE_KEY,next)");
  expect(locale).toContain("setLanguageState(next)");
  expect(locale).toContain("mode==='auth'?authLanguage():storedLanguage()");
 });
 it('does not retranslate the entire page on every React text mutation',()=>{
  const locale=source('../i18n.tsx');
  expect(locale).toContain('function localizeChanges(records:readonly MutationRecord[]');
  expect(locale).toContain('localizeChanges(changes.splice(0),language)');
  expect(locale).toContain('document.querySelectorAll(ROOTS).forEach(el=>localizeRoot(el,language))');
  const observer=locale.split('const observer=new MutationObserver(records=>')[1].split('observerRef.current=observer;')[0];
  expect(observer).not.toContain('refresh();');
  expect(locale).toContain("el.closest('[data-no-translate]')");
 });
});

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
 it('shows the configured release on the account screen',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const release=source('../app-version.ts');
  expect(workspace).toContain("import {APP_DISPLAY_VERSION} from './app-version'");
  expect(workspace).toContain('className="app-version-account"');
  expect(release).toMatch(/export const APP_BUILD = '(?:__USER_BUILD_SHA__|[a-f0-9]{8})';/);
 });
 it('uses cached identity only to label the lock and verifies the server before showing account data',()=>{
  const context=source('../../contexts/AuthContext.web.tsx');
  const remote=context.indexOf('const me=await loadMe(boot)');
  expect(context).not.toContain('setUser(cached)');
  expect(remote).toBeGreaterThan(0);
  expect(context.indexOf('setUser(me);',remote)).toBeGreaterThan(remote);
  expect(context).toContain("if(me.role!=='user'){await clearSession()");
  expect(context).toContain('saveVerifiedUser(');
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
  expect(workspace).toContain("value={dialog.alert?.currency||(priceCurrency==='EUR'?'USD':priceCurrency)}");
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
  expect(workspace).toContain("historyQuery===priceCurrency+':'+chartKarat+':'+chartRange?history:[]");
  expect(chart).toContain('role="slider"');
  expect(chart).toContain('onPointerMove');
  expect(chart).toContain("e.key==='ArrowLeft'");
  expect(chart).toContain("role=\"group\"");
  expect(chart).toContain("priceTrendRange(all,range,now)");
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
  const context=source('../../contexts/AuthContext.web.tsx');
  expect(auth).not.toContain('autoBiometricAttempted');
  expect(auth).not.toContain('void loginWithBiometric().then');
  expect(auth).toContain('onClick={()=>void biometric()}');
  expect(auth).toContain('autoComplete="current-password"');
  expect(context).toContain('await verifyLocalCredential(c,request.current!.signal);');
  expect(context).toContain("await verifyQuickUnlock(c.accountId,tokens,()=>attempt===version.current)");
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
  const provider=source('../../contexts/AuthContext.web.tsx');
  expect(workspace).toContain('if(lockedAccount)return <QuickLockScreen');
  expect(workspace).toContain('onPin={unlockWithPin}');
  expect(workspace).toContain('onForgot={continueWithPassword}');
  expect(provider).toContain('const continueWithPassword=()=>{');
  expect(provider).toContain('begin();closeSessionVault();lockSession();');
  // The password fallback must not call clearSession/erase the user's PIN vault.
  const fallback=provider.slice(provider.indexOf('const continueWithPassword=()=>{'),provider.indexOf('const logout=()=>{'));
  expect(fallback).not.toContain('clearSession(');
  expect(provider).toContain('const pinReady=cached?.id?await hasQuickPin(String(cached.id)):false');
  expect(provider).toContain('const result=await checkQuickPin(String(account.id),pin);');
  expect(provider).toContain('const me=await verifyQuickUnlock(String(account.id),tokens,()=>attempt===version.current)');
  expect(provider).toContain('await protectSessionWithPin(String(me.id),pin,activeSessionTokens())');
  expect(provider).toContain('Date.now()-hiddenAt>=60000');
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


describe('Approved global gold market-closed UI',()=>{
 it('shows the agreed status, static price and indicative label',()=>{
  const s=source('../UserWorkspace.tsx');
  expect(s).toContain('const marketClosed=!isGlobalGoldMarketOpen(clock)');
  expect(s).toContain("const marketLabel=marketClosed?'السوق العالمي مغلق'");
  expect(s).toContain("marketClosed?'آخر سعر مسجل - عيار 24':'سعر الذهب الآن - عيار 24'");
  expect(s).toContain('<span>السعر العالمي الاسترشادي</span>');
  expect(s).not.toContain("المصدر: {homeMarket?.source");
  expect(s).toContain("marketClosed?'لا تداول حاليًا'");
 });
 it('keeps both charts visible during closure but uses only real trading-session prices',()=>{
  const s=source('../UserWorkspace.tsx');
  expect(s).toContain('<section className="approved-card home-chart-card"><PriceHistoryChart');
  expect(s).toContain('<section className="approved-card"><div className="approved-card-title"><span>{tr(\'الرسم الزمني للأسعار\')}</span>');
  expect(s).not.toContain('{!marketClosed&&<section className="approved-card home-chart-card">');
  expect(s).not.toContain('{!marketClosed&&<section className="approved-card"><div className="approved-card-title"><span>الرسم الزمني للأسعار</span>');
  const trend=source('../price-trend.ts');
  expect(trend).toContain('Date.parse(row.timestamp||row.createdAt||\'\')');
  expect(trend).toContain('isGlobalGoldMarketOpen(p.time)');
  expect(s).toContain("const marketTimer=setInterval(()=>{if(document.visibilityState==='visible')void loadMarket();},5*60000)");
  expect(s).toContain('disabled={marketLoading} onClick={()=>void loadMarket()}');
 });
 it('matches the approved estimated-price details card and tafqeet block',()=>{
  const s=source('../UserWorkspace.tsx');
  const css=source('../user.css');
  expect(s).not.toContain('className="approved-card calc-total-card"');
  expect(s).not.toContain('السعر الإجمالي التقريبي');
  expect(s).toContain('className="approved-card calc-estimate-card"');
  expect(s).toContain('className="calc-words-block"');
  expect(s).toContain('className="calc-words-label">الإجمالي كتابة');
  expect(s).toContain("calcTotal!==null?(language==='ar'?amountToDisplayCurrencyWords(calcTotal,priceCurrency):amountToLocalizedWords(calcTotal,priceCurrency,language))");
  const a=s.indexOf('className="approved-card calc-estimate-card"');
  let pos=a;
  for(const label of ['قيمة الذهب الخام','إجمالي المصنعية','الضريبة التقديرية','الإجمالي النهائي','الإجمالي كتابة']){
   const next=s.indexOf(label,pos+1);
   expect(next).toBeGreaterThan(pos);
   pos=next;
  }
  expect(css).toContain('.calc-estimate-card .calc-words-block');
  expect(css).toContain('border-top:2px dashed #E2D3A2');
  expect(css).toContain('.calc-estimate-card .calc-breakdown .final');
 });
});

describe('iPhone more and profile UX redesign',()=>{
 it('groups More services and settings and presents the verified account name before the email',()=>{
  const workspace=source('../UserWorkspace.tsx');
  expect(workspace).toContain('className="dh-ux-more"');
  expect(workspace).toContain('className="approved-card dh-ux-account-link"');
  expect(workspace).toContain('className="dh-ux-account-text"');
  expect(workspace).toContain('<strong dir="auto" data-no-translate>{accountName}</strong>');
  expect(workspace).toContain('عرض الملف الشخصي وتعديل بياناتي');
  expect(workspace).toContain('id="dh-more-services-title"');
  expect(workspace).toContain('id="dh-more-settings-title"');
  expect(workspace).toContain('id="dh-preferences-title"');
 });
 it('exposes a real device-persistent price currency preference without pretending language options work',()=>{
  const workspace=source('../UserWorkspace.tsx');
  expect(workspace).toContain("window.localStorage.getItem('dhahabi:user:price-currency')");
  expect(workspace).toContain("window.localStorage.setItem('dhahabi:user:price-currency',priceCurrency)");
  expect(workspace).toContain('aria-pressed={priceCurrency===\'SAR\'}');
  expect(workspace).toContain('aria-pressed={priceCurrency===\'USD\'}');
  expect(workspace).toContain("onClick={()=>setLanguage('en')}");
  expect(workspace).toContain("onClick={()=>setLanguage('fr')}");
  expect(workspace).not.toContain('English · قريبًا</button>');
 });
 it('separates profile identity, details, local security and services while retaining update and sign out actions',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const details=source('../UserPersonalDetails.tsx');
  expect(workspace).toContain('className="dh-ux-profile"');
  expect(workspace).toContain('className="approved-card dh-ux-profile-hero"');
  expect(workspace).toContain('<UserPersonalDetails/>');
  expect(workspace).toContain('className="dh-security-help"');
  expect(workspace).toContain('aria-checked={quickPinEnabled}');
  expect(workspace).toContain('aria-checked={biometricActive}');
  expect(workspace).toContain("new Event('dhahabi:user-check-update')");
  expect(workspace).toContain('className="dh-ux-logout" onClick={signOut}');
  expect(workspace).toContain('className="app-version-account"');
  expect(details).toContain('aria-label="تعديل الاسم الكامل"');
  expect(details).toContain('aria-label="تعديل المدينة"');
  expect(details).toContain('onSubmit={save}');
  expect(details).toContain('await updateProfile({fullName:trimmed,city:city.trim()})');
 });
 it('keeps readable sections and touch targets on narrow iPhones',()=>{
  const css=source('../user.css');
  expect(css).toContain('iPhone more, preferences and account UX — 2026-10-11');
  expect(css).toContain('.gold-web.workspace .dh-ux-profile-hero');
  expect(css).toContain('.gold-web.workspace .dh-personal-rows > div');
  expect(css).toContain('.gold-web.workspace .dh-currency-options button');
  expect(css).toContain('min-height:44px');
  expect(css).toContain('@media(max-width:400px)');
 });

 it('uses distinct, meaningful outline icons for iPhone More while keeping routes unchanged',()=>{
  const workspace=source('../UserWorkspace.tsx');
  const more=workspace.split('return <div className="dh-ux-more">')[1].split('  </div>;\n };\n return <div className=')[0];
  expect(workspace).toContain("if(name==='storefront'||name==='receipt-text'||name==='bell-ring'||name==='circle-help'||name==='globe'||name==='coins')");
  expect(workspace).toContain('strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"');
  expect(more).toContain('<Icon name="storefront"/></span><span className="dh-ux-row-copy"><strong>التجار القريبون');
  expect(more).toContain('<Icon name="receipt-text"/></span><span className="dh-ux-row-copy"><strong>المشتريات والفواتير');
  expect(more).toContain('<Icon name="bell"/></span><span className="dh-ux-row-copy"><strong>تنبيهات الأسعار');
  expect(more).toContain('<Icon name="bell-ring"/></span><span className="dh-ux-row-copy"><strong>إعدادات الإشعارات');
  expect(more).toContain('<Icon name="circle-help"/></span><span className="dh-ux-row-copy"><strong>{tr(\'المساعدة\')}');
  expect(more).toContain("tr('دليل الذهب والعيارات والأحجار والمصنعية')");
  expect(more).toContain('<Icon name="globe"/></span>\n     <span className="dh-preference-text"><strong>لغة التطبيق');
  expect(more).toContain('<Icon name="coins"/></span>\n     <span className="dh-preference-text"><strong>عملة عرض الأسعار');
  expect(more).toContain("onClick={()=>navigate('notification-settings')}");
  expect(more).toContain("onClick={()=>navigate('alerts')}");
  expect(more).toContain("onClick={()=>setPriceCurrency('USD')}");
  expect(more).toContain("onClick={()=>setPriceCurrency('EUR')}");
  expect(more).toContain("onClick={()=>setPriceCurrency('SAR')}");
  expect(more).not.toContain('<Icon name="settings"/></span>\n     <span className="dh-preference-text"><strong>لغة التطبيق');
  expect(more).toContain("onClick={()=>setLanguage('fr')}");
 });
 it('uses 44px neutral navy icon boxes and 22px outline strokes instead of excessive gold',()=>{
  const css=source('../user.css');
  const scoped=css.split('/* iPhone More: neutral, consistent outline icons; reserve gold for selected controls. */')[1];
  expect(scoped).toContain('.dh-ux-more .dh-ux-row-icon');
  expect(scoped).toContain('width:44px;height:44px;min-width:44px');
  expect(scoped).toContain('width:22px;height:22px;stroke-width:1.8');
  expect(scoped).toContain('background:#F2F5F9;color:#001F3F');
  expect(css).toContain('button[aria-pressed="true"]');
 });
});

describe('Global display-currency integration regression',()=>{
 const workspace=source('../UserWorkspace.tsx');
 it('keeps a single preference through home prices, 24K history, calculator and portfolio',()=>{
  expect(workspace).toContain("r.currency===priceCurrency&&r.karat===24");
  expect(workspace).toContain("r.currency===priceCurrency&&r.karat===calcKarat");
  expect(workspace).toContain("homeHistoryCurrency===priceCurrency?homeHistory:[]");
  expect(workspace).toContain('PriceHistoryChart rows={selectedHomeHistory} currency={priceCurrency}');
  expect(workspace).toContain('money(calcTotal,priceCurrency)');
  expect(workspace).toContain('displayPortfolioSummary(purchases,allMarketRows,priceCurrency,fxRate,loaded,eurFx?.eurPerUsd??null)');
  expect(workspace).toContain("homeMarketMovement(realHomeQuotes,homeMarket,clock,priceCurrency)");
   expect(workspace).toContain("r.kind!=='daily-average'");
 });
 it('uses preferred display currency but preserves original invoices and alert conditions for writes',()=>{
  expect(workspace).toContain('preferredCurrency={priceCurrency}');
  expect(workspace).toContain("value={dialog.alert?.currency||(priceCurrency==='EUR'?'USD':priceCurrency)}");
  expect(workspace).toContain('showMoney(Number(a.targetPrice),a.currency)');
  expect(workspace).toContain('showMoney(Number(p.totalPrice),p.currency)');
  expect(workspace).toContain('const payload=purchasePayload(data)');
  expect(workspace).toContain('const payload=alertPayload(data)');
 });
});

describe('iPhone bilingual and French support',()=>{
 it('exposes three functioning locale selections and persists chosen UI language',()=>{
  const ws=source('../UserWorkspace.tsx');
  const intl=source('../i18n.tsx');
  expect(ws).toContain('const {language,setLanguage,direction}=useLanguage();');
  expect(ws).toContain("onClick={()=>setLanguage('ar')}");
  expect(ws).toContain("onClick={()=>setLanguage('en')}");
  expect(ws).toContain("onClick={()=>setLanguage('fr')}");
  expect(ws).toContain("dir={direction} lang={language}");
  expect(ws).toContain('<LanguageProvider key={mode} mode={mode}><LocalizedUserWorkspace/></LanguageProvider>');
  expect(intl).toContain('window.localStorage.setItem(LANGUAGE_KEY,next)');
  expect(intl).toContain('window.localStorage.setItem(AUTH_LANGUAGE_KEY,next)');
  expect(intl).toContain("window.localStorage.setItem(LANGUAGE_KEY,language)");
  expect(intl).toContain("html.setAttribute('dir',LANGUAGE_META[language].dir)");
  expect(intl).toContain('MutationObserver(records=>');
  expect(intl).toContain('window.requestAnimationFrame');
  expect(intl).toContain("el.closest('[data-no-translate]')");
 });
 it('keeps the layout, currency and the Arabic baseline intact',()=>{
  const css=source('../user.css');
  const ws=source('../UserWorkspace.tsx');
  expect(css).toContain('.dh-language-options button[aria-pressed="true"]');
  expect(css).toContain('.gold-web[dir="ltr"] .dh-ux-link-list >button');
  expect(ws).toContain("language==='ar'?amountToDisplayCurrencyWords(calcTotal,priceCurrency)");
  expect(ws).toContain("amountToLocalizedWords(calcTotal,priceCurrency,language)");
  expect(ws).toContain("onClick={()=>setPriceCurrency('USD')}");
  expect(ws).not.toContain('الإنجليزية والفرنسية ستتوفران لاحقًا');
 });
});

describe('iPhone chart does not visually simulate prices during closed sessions',()=>{
 it('uses disconnected real-observation segments instead of one line through downtime',()=>{
  const trend=source('../price-trend.ts');
  const chart=source('../PriceHistoryChart.tsx');
  expect(trend).toContain('priceTrendSegments(points:TrendPoint[])');
  expect(trend).toContain('isGlobalGoldMarketOpen(tick)');
  expect(chart).toContain('priceTrendSegments(points).map(');
  expect(chart).toContain('{paths.map(({line,area,single,kind},i)');
  expect(chart).not.toContain('const line=plotted.map(');
 });
 it('prevents overlapping historical Arabic dates with compact tick labels',()=>{
  const chart=source('../PriceHistoryChart.tsx');
  expect(chart).toContain('priceTrendTickIndices(points,right-left,compact)');
  expect(chart).toContain('formatDisplayDate(ms,activeLocale(),calendar,');
  expect(chart).toContain("{day:'2-digit',month:'2-digit'}");
 });
});

describe('iPhone chart period controls request the matching real historical window',()=>{
 it('keeps separate home and price-page selections and passes them to charts',()=>{
  const sourceText=source('../UserWorkspace.tsx');
  expect(sourceText).toContain("setHomeRange]=useState<TrendRange>('day')");
  expect(sourceText).toContain("setChartRange]=useState<TrendRange>('available')");
  expect(sourceText).toContain("onRangeChange={setHomeRange}");
  expect(sourceText).toContain("onRangeChange={setChartRange}");
  expect(sourceText).toContain("range={homeRange}");
  expect(sourceText).toContain("range={chartRange}");
  expect(sourceText).toContain("historyQuery===priceCurrency+':'+chartKarat+':'+chartRange");
 });
 it('fetches specific history per date window while preserving latest-quote requests',()=>{
  const sourceText=source('../UserWorkspace.tsx');
  expect(sourceText).toContain("'&range='+chartRange");
  expect(sourceText).toContain("&range='+homeRange");
  expect(sourceText).toContain("api<PriceHistoryRow|null>('/prices/latest?currency='");
 });
 it('draws selected window endpoints, not a misleading zoom to the last saved record',()=>{
  const chart=source('../PriceHistoryChart.tsx');
  expect(chart).toContain("const timeWindow=priceTrendWindow(range,now,points)");
  expect(chart).toContain("priceTrendTradingCoordinates(points,axisStart,axisEnd)");
   expect(chart).toContain("const projectX=(_p:TrendPoint,i:number)=>left+(right-left)*(proportions[i]??0)");
  expect(chart).toContain("const explicitRange=range!=='available'&&timeWindow!==null");
  expect(chart).toContain("onClick={()=>setRange(option.id)}");
  expect(chart).toContain("aria-pressed={range===option.id}");
  expect(chart).toContain("xAxisLabels.map");
 });
});
