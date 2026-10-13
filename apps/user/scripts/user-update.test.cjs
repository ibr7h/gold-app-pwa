'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
    location:{href:'https://ibr7h.github.io/gold-app-pwa/full/',replace:href=>calls.replaced.push(href)},
    addEventListener:(type,fn)=>listeners.set(type,fn),
    fetch:async(url,fetchOptions)=>{calls.requests.push({url,options:fetchOptions});return {ok:true,json:async()=>options.compatVersion?{version:options.compatVersion,releaseVersion:options.compatVersion,semanticReleaseVersion:remote}:options.legacyVersion?{version:options.legacyVersion,releaseVersion:remote}:{version:remote}};},
    localStorage: {getItem:key=>key==='dhahabi:user:language'?(options.language||null):null},
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
  assert.match(worker,/fetch\(event\.request, \{cache:'no-store'\}\)/);
});
test('new worker is isolated to the User origin/scope and never caches fresh version metadata',()=>{
  assert.match(worker,/url\.origin !== self\.location\.origin/);
  assert.match(worker,/url\.pathname\.startsWith\(BASE\)/);
  assert.match(worker,/version\.json/);
  assert.match(worker,/'no-store'/);
});
