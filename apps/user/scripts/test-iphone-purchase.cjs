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
assert.equal(version.version,'full-dc210924');
assert(read('_render_preview/gold-app-pwa/full/pwa-update.js').includes("const CURRENT = 'full-dc210924'"));
assert(read('_render_preview/gold-app-pwa/full/sw.js').includes("const VERSION = 'dc210924'"));
let count=0;
function scan(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(entry.isDirectory()){if(['node_modules','assets','_expo'].includes(entry.name))continue;scan(path.join(dir,entry.name));continue}
  if(!entry.name.endsWith('.html'))continue;
  const html=fs.readFileSync(path.join(dir,entry.name),'utf8');
  if(!html.includes('iphone-preview-lock.css'))continue;
  count++;
  assert(html.includes('iphone-preview-lock.css?v=dc210924'),entry.name+': stale CSS');
  assert(html.includes('iphone-preview-lock.js?v=dc210924'),entry.name+': stale JS');
 }
}
scan(preview);
assert(count>=20,'Too few preview pages verified: '+count);
console.log('PASS: '+count+' iPhone preview pages, purchase semantics, DOM patch syntax, fixed 16px controls, PWA version.');
