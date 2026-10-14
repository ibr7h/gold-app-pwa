'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const client = fs.readFileSync(path.join(__dirname, 'user-update-client.js'), 'utf8');
const updateLocales = fs.readFileSync(path.join(__dirname, 'user-update-locales.js'), 'utf8');
const worker = fs.readFileSync(path.join(__dirname, 'user-service-worker.js'), 'utf8');

function appHarness(remote = 'full-bbbbbbbb', options = {}) {
  const listeners = new Map();
  const nodes = new Map();
  const calls = {requests: [], registrationUpdates: 0, messages: [], replaced: [], storageMutations: 0, timers: []};
  const newElement = tag => ({
    tag, children: [], attributes: {}, listeners: {}, style: {}, textContent: '', disabled: false,
    setAttribute(k,v){this.attributes[k] = v;},
    addEventListener(k,f){this.listeners[k] = f;},
    append(...children){this.children.push(...children);},
    appendChild(child){this.children.push(child); if(child.id) nodes.set(child.id,child);},
    remove(){nodes.delete(this.id);}
  });
  const body = newElement('body');
  const document = {
    body, visibilityState:'visible', documentElement:{lang:'ar'},
    createElement:newElement,
    getElementById:id => nodes.get(id)||null,
    addEventListener:(type,fn)=>listeners.set('doc:'+type,fn)
  };
  const swListeners = new Map();
  const serviceWorker = {
    controller:{},
    addEventListener:(type,fn)=>swListeners.set(type,fn),
    async register(){return registration;}
  };
  const registration = {
    waiting: options.noWaiting ? null : {postMessage(data) {
      calls.messages.push(data);
      const handler = swListeners.get('controllerchange');
      if(handler && !options.suppressControllerChange) handler();
    }},
    addEventListener(){},
    async update(){calls.registrationUpdates++;}
  };
  const context = {
    navigator:{onLine:true,serviceWorker},
    document,
    URL,Date,Promise,
    location:{href:'https://ibr7h.github.io/gold-app-pwa/full/',pathname:options.pathname||'/gold-app-pwa/full/',replace:href=>calls.replaced.push(href)},
    addEventListener:(type,fn)=>listeners.set(type,fn),
    fetch:async(url,fetchOptions)=>{calls.requests.push({url,options:fetchOptions});return {ok:true,json:async()=>options.compatVersion?{version:options.compatVersion,releaseVersion:options.compatVersion,semanticReleaseVersion:remote}:options.legacyVersion?{version:options.legacyVersion,releaseVersion:remote}:{version:remote}};},
    localStorage: {getItem:key=>key==='dhahabi:user:language'?(options.language||null):key==='dhahabi:user:auth-language'?(options.authLanguage||null):null},
    sessionStorage: {
      getItem(){return null;},
      setItem(){calls.storageMutations++;},
      removeItem(){calls.storageMutations++;}
    },
    setInterval(){},
    setTimeout(fn,ms){ if(ms >= 6000) calls.timers.push({fn,ms}); }
  };
  context.window=context;
  vm.runInNewContext(updateLocales,context);
  vm.runInNewContext(client.replace('__BUILD_VERSION__','aaaaaaaa'),context);
  const tick = () => new Promise(resolve=>setImmediate(resolve));
  return {calls,nodes,document,listeners,registration,async load(){listeners.get('load')();await tick();await tick();},tick};
}

test('a matching version causes no disruptive banner',async()=>{
  const app=appHarness('full-aaaaaaaa');
  await app.load();
  assert.equal(app.nodes.has('dhahabi-user-update'),false);
  assert.equal(app.calls.requests[0].options.cache,'no-store');
  assert.equal(app.calls.registrationUpdates,1);
});
test('legacy SHA-style metadata safely prompts when a previously installed client is behind',async()=>{
  const app=appHarness('full-bbbbbbbb');
  await app.load();
  assert.ok(app.nodes.get('dhahabi-user-update'));
  assert.equal(app.calls.requests[0].options.cache,'no-store');
});
test('modern installed client compares semantic releaseVersion instead of compatibility SHA',async()=>{
  const app=appHarness('full-aaaaaaaa',{legacyVersion:'full-bbbbbbbb'});
  await app.load();
  assert.equal(app.nodes.has('dhahabi-user-update'),false);
  assert.equal(app.calls.requests[0].options.cache,'no-store');
});
test('modern client offers semantic release even when legacy SHA metadata has another value',async()=>{
  const app=appHarness('full-1.9.62-20261013',{legacyVersion:'full-deadbeef'});
  await app.load();
  const prompt=app.nodes.get('dhahabi-user-update');
  assert.ok(prompt);
  assert.match(prompt.children[0].textContent,/1\.9\.62/);
});
test('v1.9.62 modern client recognizes a semantic release with a hex compatibility id',async()=>{
  const app=appHarness('full-1.9.62-20261013',{compatVersion:'full-56c2627a'});
  await app.load();
  assert.equal(app.nodes.has('dhahabi-user-update'),true);
  assert.equal(app.calls.requests[0].options.cache,'no-store');
});
test('updated modern client does not offer a ghost update when semantic version already matches',async()=>{
  const app=appHarness('full-aaaaaaaa',{compatVersion:'full-56c2627a'});
  await app.load();
  assert.equal(app.nodes.has('dhahabi-user-update'),false);
});
test('compatibility hex rescues v1.9.62 installed updater with broken semantic matcher',()=>{
  const legacyBroken=/^full-(?:[a-f0-9]{8,40}|\\\\d+\\\\.\\\\d+\\\\.\\\\d+-\\\\d{8})$/;
  assert.equal(legacyBroken.test('full-1.9.63-20261013'),false);
  assert.equal(legacyBroken.test('full-56c2627a'),true);
  const manifest={version:'full-56c2627a',releaseVersion:'full-56c2627a',
    semanticReleaseVersion:'full-1.9.63-20261013'};
  assert.equal(legacyBroken.test(manifest.releaseVersion),true);
});
test('release generator preserves legacy parsability and independent modern release identity',()=>{
  const release=fs.readFileSync(path.join(__dirname,'../../../scripts/release-iphone-version.cjs'),'utf8');
  assert.match(release,/legacyVersion='full-'/);
  assert.match(release,/releaseVersion:legacyVersion/);
  assert.match(release,/semanticReleaseVersion:version/);
  assert.match(release,/displayVersion:'v'/);
});
test('a newer version shows a mobile-safe prompt without automatic navigation',async()=>{
  const app=appHarness();
  await app.load();
  const banner=app.nodes.get('dhahabi-user-update');
  assert.ok(banner);
  assert.match(banner.style.cssText,/safe-area-inset-top/);
  assert.equal(app.calls.replaced.length,0);
  assert.equal(app.calls.messages.length,0);
});
test('user approval activates waiting SW before a cache-busted reload',async()=>{
  const app=appHarness();
  await app.load();
  const actions=app.nodes.get('dhahabi-user-update').children[2];
  actions.children[0].listeners.click();
  await app.tick();
  await app.tick();
  assert.equal(app.calls.messages[0].type,'SKIP_WAITING');
  assert.equal(app.calls.replaced.length,1);
  assert.match(app.calls.replaced[0],/_pwa=/);
});
test('iOS: controllerchange may not fire; reload still proceeds after bounded wait',async()=>{
  const app=appHarness('full-bbbbbbbb',{suppressControllerChange:true});
  await app.load();
  const actions=app.nodes.get('dhahabi-user-update').children[2];
  actions.children[0].listeners.click();
  await app.tick(); await app.tick();
  assert.equal(app.calls.messages[0]?.type,'SKIP_WAITING');
  assert.equal(app.calls.replaced.length,0);
  const timeout=app.calls.timers.find(t=>t.ms===6000);
  assert.ok(timeout);
  timeout.fn();
  await app.tick(); await app.tick();
  assert.equal(app.calls.replaced.length,1);
  assert.match(app.calls.replaced[0],/_pwa=/);
});
test('iOS: no waiting worker still triggers a fresh navigation without touching app data',async()=>{
  const app=appHarness('full-bbbbbbbb',{noWaiting:true});
  await app.load();
  const actions=app.nodes.get('dhahabi-user-update').children[2];
  actions.children[0].listeners.click();
  await app.tick(); await app.tick();
  assert.equal(app.calls.replaced.length,1);
  assert.equal(app.calls.messages.length,0);
});
test('later dismisses the banner without affecting app data',async()=>{
  const app=appHarness();
  await app.load();
  const actions=app.nodes.get('dhahabi-user-update').children[2];
  actions.children[1].listeners.click();
  assert.equal(app.nodes.has('dhahabi-user-update'),false);
  assert.equal(app.calls.messages.length,0);
  assert.equal(app.calls.replaced.length,0);
});
test('manual check reports up-to-date status',async()=>{
  const app=appHarness('full-aaaaaaaa');
  await app.load();
  app.listeners.get('dhahabi:user-check-update')();
  await app.tick();
  assert.match(app.nodes.get('dhahabi-update-notice').textContent,/آخر إصدار/);
});
test('update prompt and actions use selected English translations',async()=>{
  const app=appHarness('full-bbbbbbbb',{language:'en'});
  await app.load();
  const banner=app.nodes.get('dhahabi-user-update');
  assert.match(banner.children[0].textContent,/Dhahabi update/);
  assert.equal(banner.children[2].children[0].textContent,'Update now');
  assert.equal(banner.children[2].children[1].textContent,'Later');
  assert.equal(banner.attributes['aria-label'],'Update Dhahabi app');
});
test('the selected French language is used for update prompt and feedback',async()=>{
  const app=appHarness('full-bbbbbbbb',{language:'fr'});
  await app.load();
  const banner=app.nodes.get('dhahabi-user-update');
  assert.match(banner.children[0].textContent,/mise à jour de Dhahabi/);
  assert.equal(banner.children[2].children[0].textContent,'Mettre à jour');
  assert.equal(banner.children[2].children[1].textContent,'Plus tard');
  assert.match(banner.style.cssText,/direction:ltr/);
});
test('language dictionary includes all required updater messages in three languages',()=>{
  const keys=['updateAria','available','info','updateNow','later','installing','retry',
   'previousIncomplete','installFailed','offline','current','verifyFailed'];
  for(const language of ['ar','en','fr']){
    const locale=appHarness('full-aaaaaaaa',{language});
    // Confirm the standalone updater always uses catalog-backed message keys.
    assert.ok(locale);
    for(const key of keys) assert.match(updateLocales,new RegExp('"' + key + '"'));
  }
});
test('script never clears sessions or stores in any branch',()=>{
  assert.doesNotMatch(client,/localStorage\.(clear|removeItem)|indexedDB\.deleteDatabase|caches\.delete|CLEAR_CACHES/);
});
test('new worker never activates in install and only clears its own old caches on activation',()=>{
  const install=worker.split("self.addEventListener('install'")[1].split("self.addEventListener('activate'")[0];
  assert.doesNotMatch(install,/skipWaiting/);
  assert.match(worker,/event\.data\?\.type === 'SKIP_WAITING'/);
  assert.match(worker,/key\.startsWith\(PREFIX\) && key !== CACHE/);
  assert.doesNotMatch(worker,/CLEAR_CACHES/);
});
test('new worker does not block install on optional icon failures or cache the update bootstrap',()=>{
  const install=worker.split("self.addEventListener('install'")[1].split("self.addEventListener('activate'")[0];
  assert.match(install,/Promise\.allSettled/);
  assert.match(worker,/url\.pathname\.endsWith\('\/index\.html'\)/);
  assert.match(worker,/'\/pwa-update\.js'/);
  assert.match(worker,/'\/standalone-install-gate\.js'/);
  assert.ok(worker.includes("fetch(event.request,{cache:'no-store'})"));
});
test('a temporary network outage resolves every worker FetchEvent to a response',async()=>{
 const handlers=new Map();
 const cache={
  async addAll(){},
  async add(){},
  async put(){}
 };
 const storedRoutes=new Map([['/gold-app-pwa/full/login.html',new Response('cached-login',{status:200})]]);
 const context={
  self:{
   location:{origin:'https://dhahabi-user-iphone-preview.onrender.com'},
   addEventListener:(name,callback)=>handlers.set(name,callback)
  },
  caches:{
   async match(url){return storedRoutes.get(typeof url==='string'?url:url.url.replace('https://dhahabi-user-iphone-preview.onrender.com',''));},
   async open(){return cache;},
   async keys(){return []},
   async delete(){return true}
  },
  Response,URL,Promise,
  fetch:async()=>{throw new TypeError('Failed to fetch')}
 };
 vm.runInNewContext(worker.replace('__BUILD_VERSION__','test-offline'),context);
 const dispatch=async(path,mode='cors')=>{
  let pending;
  const request={method:'GET',url:'https://dhahabi-user-iphone-preview.onrender.com'+path,mode};
  handlers.get('fetch')({request,respondWith:promise=>{pending=Promise.resolve(promise);}});
  assert.ok(pending,'a same-origin URL must be handled');
  return pending;
 };
 const login=await dispatch('/gold-app-pwa/full/login','navigate');
 assert.equal(await login.text(),'cached-login');
 const uncachedRoute=await dispatch('/gold-app-pwa/full/register','navigate');
 assert.equal(uncachedRoute.status,503);
 const uncachedAsset=await dispatch('/gold-app-pwa/full/_expo/static/js/web/entry-deadbeef.js');
 assert.equal(uncachedAsset.status,503);
 const fresh=await dispatch('/gold-app-pwa/full/version.json');
 assert.equal(fresh.status,503);
});

test('worker only pre-caches user auth routes and never intercepts external services',()=>{
 assert.ok(worker.includes("BASE + 'login.html'"));
 assert.ok(worker.includes("BASE + 'register.html'"));
 assert.ok(worker.includes("network().catch(() => unavailable())"));
 assert.ok(worker.includes("return await caches.match(fallback) || unavailable(true)"));
 assert.ok(worker.includes("url.origin !== self.location.origin"));
});

test('updater honors the auth locale on the login route without overriding app locale',async()=>{
 const app=appHarness('full-bbbbbbbb',{language:'ar',pathname:'/gold-app-pwa/full/login',authLanguage:'fr'});
 await app.load();
 const banner=app.nodes.get('dhahabi-user-update');
 assert.match(banner.children[0].textContent,/mise à jour de Dhahabi/);
 const regular=appHarness('full-bbbbbbbb',{language:'en',pathname:'/gold-app-pwa/full/'});
 await regular.load();
 assert.match(regular.nodes.get('dhahabi-user-update').children[0].textContent,/Dhahabi update/);
});

test('iPhone preview never overwrites EN/FR purchase labels after React translation',()=>{
 const preview=fs.readFileSync(path.join(__dirname,'../../../_render_preview/gold-app-pwa/full/iphone-preview-lock.js'),'utf8');
 const purchaseStart=preview.indexOf('/* Purchase form:');
 const scriptStart=preview.indexOf('(function(){',purchaseStart);
 const scriptEnd=preview.indexOf('/* Unified iPhone form handling:',scriptStart);
 assert.ok(purchaseStart>=0&&scriptStart>=0&&scriptEnd>scriptStart,'purchase patch boundaries present');
 const script=preview.slice(scriptStart,scriptEnd);
 const events=new Map(),observers=[];
 const labelText={nodeType:3,nodeValue:'Net weight (g)'};
 const label={
  childNodes:[labelText],dataset:{},
  style:{getPropertyValue(){return ''},setProperty(){}},
  querySelector(){return {name:'weightGrams'}}
 };
 const form={
  querySelectorAll(selector){return selector==='label'?[label]:[]},
  querySelector(){return null}
 };
 const sheet={querySelector(selector){return selector==='.gold-purchase-form'?form:null},closest(){return null}};
 const document={
  readyState:'loading',
  documentElement:{lang:'en',classList:{contains(){return false}}},
  body:{},
  addEventListener:(name,fn)=>events.set(name,fn),
  getElementById(){return {}},
  querySelector(selector){return selector.includes('.gold-purchase-form')?sheet:null}
 };
 class MutationObserverStub{
  constructor(fn){this.callback=fn;observers.push(this)}
  observe(){}
 }
 const context={
  document,window:{visualViewport:null},MutationObserver:MutationObserverStub,
  requestAnimationFrame:fn=>{fn();return 1;},setTimeout(){},
  encodeURIComponent,WeakSet,Math
 };
 vm.runInNewContext(script,context);
 assert.equal(typeof events.get('DOMContentLoaded'),'function');
 events.get('DOMContentLoaded')();
 assert.equal(labelText.nodeValue,'Net weight (g)','English label unchanged');
 assert.equal(label.dataset.dhPurchaseIcon,'weight','icon stays active');
 document.documentElement.lang='fr';
 labelText.nodeValue='Poids net (g)';
 observers[0].callback([]);
 assert.equal(labelText.nodeValue,'Poids net (g)','French label unchanged');
 document.documentElement.lang='ar';
 labelText.nodeValue='الوزن الأصلي';
 observers[0].callback([]);
 assert.equal(labelText.nodeValue,'الوزن الصافي (جم)','Arabic compact label retained');
 document.documentElement.lang='en';
 labelText.nodeValue='Net weight';
 observers[0].callback([]);
 assert.equal(labelText.nodeValue,'Net weight','no Arabic rewrite on return to English');
 // The other legacy dialog patch must not rewrite localized labels or options.
 assert.ok(preview.includes("document.documentElement.lang==='ar'&&!saved.has(label)"));
 assert.ok(preview.includes("document.documentElement.lang==='ar'&&direction&&!saved.has(direction)"));
});

test('new worker is isolated to the User origin/scope and never caches fresh version metadata',()=>{
  assert.match(worker,/url\.origin !== self\.location\.origin/);
  assert.match(worker,/url\.pathname\.startsWith\(BASE\)/);
  assert.match(worker,/version\.json/);
  assert.match(worker,/'no-store'/);
});


test('release generator upgrades both legacy and already-patched published updater templates',()=>{
  const repoRoot=path.resolve(__dirname,'../../..');
  const source=fs.readFileSync(path.join(repoRoot,'scripts/release-iphone-version.cjs'),'utf8');
  const modernClient=fs.readFileSync(path.join(repoRoot,'_render_preview/gold-app-pwa/full/pwa-update.js'),'utf8');
  const worker=fs.readFileSync(path.join(repoRoot,'_render_preview/gold-app-pwa/full/sw.js'),'utf8');
  const versionSource=fs.readFileSync(path.join(repoRoot,'apps/user/overrides/web/app-version.ts'),'utf8');
  const legacyBlock=/^[ \t]*const requested = data\?\.(?:semanticReleaseVersion \|\| data\?\.)?releaseVersion \|\| data\?\.version;\r?\n[^\n]*version_invalid'\);\r?\n[^\n]*if \(requested !== CURRENT\) \{\r?\n[^\n]*showPrompt\(requested\);/m;
  assert.match(modernClient,legacyBlock,'Current committed client must have a semantic block for the compatibility test');
  const originalClient=modernClient.replace(legacyBlock,
    "      if (data.version !== CURRENT) {\n        showPrompt(data.version);");
  for(const [label,input] of [['legacy',originalClient],['patched',modernClient]]){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dhahabi-release-test-'));
    try{
      const base=path.join(dir,'_render_preview/gold-app-pwa/full');
      const scripts=path.join(dir,'scripts');
      const src=path.join(dir,'apps/user/overrides/web');
      fs.mkdirSync(base,{recursive:true});fs.mkdirSync(scripts,{recursive:true});fs.mkdirSync(src,{recursive:true});
      fs.writeFileSync(path.join(scripts,'release-iphone-version.cjs'),source);
      fs.writeFileSync(path.join(src,'app-version.ts'),versionSource);
      fs.writeFileSync(path.join(base,'sw.js'),worker);
      fs.writeFileSync(path.join(base,'pwa-update.js'),input);
      for(let i=0;i<25;i++){
        const file=path.join(base,'route'+i+'.html');
        fs.writeFileSync(file,'<script src="/gold-app-pwa/full/pwa-update.js?v=seed"></script>');
      }
      const result=spawnSync(process.execPath,[path.join(scripts,'release-iphone-version.cjs')],{
        cwd:dir,encoding:'utf8',env:{...process.env,GITHUB_SHA:'aabbccddeeff0011223344556677889900aabbcc'}
      });
      assert.equal(result.status,0,label+' generator: '+result.stderr+' '+result.stdout);
      const released=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
      assert.equal(released.releaseVersion,released.version);
      assert.match(released.semanticReleaseVersion,/^full-\d+\.\d+\.\d+-\d{8}$/);
      const updated=fs.readFileSync(path.join(base,'pwa-update.js'),'utf8');
      assert.match(updated,/const requested = data\?\.semanticReleaseVersion \|\| data\?\.releaseVersion \|\| data\?\.version;/);
      const line=updated.split('\n').find(x=>x.includes("typeof requested !== 'string'"));
      const matched=line?.match(/!\/(\^full-\(\?:.+\)\$)\/\.test\(requested\)/);
      assert.ok(matched,label+' version regex');
      const regex=new RegExp(matched[1]);
      assert.equal(regex.test(released.semanticReleaseVersion),true,label+' semantic release accepted');
      assert.equal(regex.test(released.version),true,label+' hex compatibility accepted');
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
  }
});
