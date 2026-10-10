const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'../../..');
const preview=path.join(base,'_render_preview/gold-app-pwa/full');
const read=relative=>fs.readFileSync(path.join(base,relative),'utf8');
const script=read('_render_preview/gold-app-pwa/full/iphone-preview-lock.js');
new vm.Script(script,{filename:'iphone-preview-lock.js'});
assert(script.includes('Purchase form: compact Arabic field captions'),'iPhone purchase patch absent');
assert(script.includes('MutationObserver(schedule)'),'Purchase modal observer absent');
assert(script.includes("info.open=false"),'New purchase invoice should be collapsed');
const css=read('_render_preview/gold-app-pwa/full/iphone-preview-lock.css');
assert(css.includes('purchase sheet UX v1.9.21'),'Purchase CSS absent');
assert(css.includes('font-size:16px!important'),'iOS focus-zoom prevention absent');
assert(css.includes('.dialog:has(.gold-purchase-form)'), 'Purchase modal not targeted');
assert(css.includes('min-height:48px!important'), 'Touch targets too small');
const src=read('apps/user/overrides/web/PurchaseFormFields.tsx');
assert(src.includes('open={Boolean(purchase)}'), 'Existing purchases should retain invoice details');
assert(src.includes('name="weightGrams"')&&src.includes('name="purchasedAt"'),'Purchase fields missing');
assert(src.includes("purchaseQuote("), 'Original quote calculation missing');
const man=JSON.parse(read('_render_preview/gold-app-pwa/full/manifest.json'));
assert(man.icons.length>0);
const version=JSON.parse(read('_render_preview/gold-app-pwa/full/version.json'));
const suffix=version.version.replace(/^full-/,'');
assert(/^([a-f0-9]{8}|\d+\.\d+\.\d+-\d{8})$/.test(suffix),'Unexpected release identifier');
assert(read('_render_preview/gold-app-pwa/full/pwa-update.js').includes("const CURRENT = '"+version.version+"'"));
assert(read('_render_preview/gold-app-pwa/full/sw.js').includes("const VERSION = '"+suffix+"'"));
if(version.displayVersion){
 const semver=suffix.split('-')[0];
 assert.equal(version.displayVersion,'v'+semver);
 assert(read('apps/user/overrides/web/app-version.ts').includes("APP_VERSION = '"+semver+"'"));
 assert(read('_render_preview/gold-app-pwa/full/pwa-update.js').includes('watchAccountVersion()'));
}
let count=0;
function scan(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.isDirectory()){if(['node_modules','assets','_expo'].includes(entry.name))continue;scan(path.join(dir,entry.name));continue}
  if(!entry.name.endsWith('.html'))continue;
  const html=fs.readFileSync(path.join(dir,entry.name),'utf8');
  if(!html.includes('iphone-preview-lock.css'))continue;
  count++;
  assert(html.includes('iphone-preview-lock.css?v='+suffix),entry.name+': stale CSS');
  assert(html.includes('iphone-preview-lock.js?v='+suffix),entry.name+': stale JS');
 }
}
scan(preview);
assert(count>=20,'Too few preview pages verified: '+count);
assert(read('_render_preview/gold-app-pwa/full/index.html').includes('pwa-update.js?v='+suffix),'Update script has an outdated cache query');
console.log('PASS: '+count+' iPhone preview pages, purchase semantics, DOM patch syntax, fixed 16px controls, PWA version.');


/* iPhone wide-screen consistency */
assert(css.includes('iPhone User unified form and navigation polish'),'Shared mobile polish missing');
assert(css.includes('.dialog-backdrop:has(>.dialog>form):not(:has(.gold-purchase-form))'),'Wallet/alert sheet not isolated');
assert(css.includes('font-size:16px!important;line-height:1.35!important'),'Need native-sized text controls');
assert(css.includes('.calculator-form .weight-presets'),'Calculator touch presets missing');
assert(css.includes('.dh-personal-actions button'),'Profile save/cancel targets missing');
assert(css.includes('.settings-list button'),'More navigation touch targets missing');
assert(css.includes('.dh-push-actions'),'Notification actions must wrap');
assert(css.includes('.dh-location-radius'),'Nearby search selection must avoid iOS zoom');
assert(script.includes('Unified iPhone form handling'),'Keyboard helper missing');
assert(script.includes('keepFieldVisible(input)'),'Focus scrolling missing');
assert(script.includes('namesInDialog[field.name]'),'Alert/wallet icon fields missing');
assert(script.includes('window.visualViewport'),'Viewport handling missing');
assert(script.includes("!document.querySelector('.gold-web.workspace .dialog-backdrop:has(.dialog > form)')"),'Modal keyboard guard missing');
const workspace=read('apps/user/overrides/web/UserWorkspace.tsx');
assert(workspace.includes('const payload=alertPayload(data)'), 'Alert payload should stay unchanged');
assert(workspace.includes("if(dialog.type==='portfolio')"),'Wallet submission should stay unchanged');
assert(workspace.includes('يرتفع إلى الهدف أو أكثر'),'Alert increase threshold meaning changed');
assert(workspace.includes('ينخفض إلى الهدف أو أقل'),'Alert decrease threshold meaning changed');
assert(!css.includes('html.dh-iphone-page-lock .gold-auth .gold-purchase-form'),'Purchase scope corrupted');
console.log('PASS: user wallet, alerts, calculator, profile, push, nearby and navigation mobile regression checks.');
