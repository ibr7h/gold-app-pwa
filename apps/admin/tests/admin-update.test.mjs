import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const client=readFileSync(new URL('../public/admin-update-client.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');

function harness(remote='admin-aaaaaaaa', online=true){
  const nodes=new Map();
  const listeners=new Map();
  const swListeners=new Map();
  const calls={fetch:[],registration:[],updates:0,postMessages:[],replacements:[],storage:0};
  const index=node=>{if(node.id)nodes.set(node.id,node);for(const n of node.children||[])index(n);};
  const node=(tag,id)=>({
    tag,id,children:[],events:{},hidden:true,disabled:false,textContent:'',
    setAttribute(){},
    addEventListener(name,callback){this.events[name]=callback;},
    append(...children){this.children.push(...children);children.forEach(index);},
    appendChild(child){this.children.push(child);index(child);},
    remove(){if(this.id)nodes.delete(this.id);},
  });
  for(const id of ['admin-check-update-login','admin-check-update-settings','admin-update-notice'])nodes.set(id,node('div',id));
  const body=node('body');
  const registration={
    waiting:{postMessage(data){calls.postMessages.push(data);swListeners.get('controllerchange')?.();}},
    installing:null,
    addEventListener(){},
    async update(){calls.updates++;},
  };
  const serviceWorker={
    controller:{},
    addEventListener(type,fn){swListeners.set(type,fn);},
    async register(url,options){calls.registration.push({url,options});return registration;},
  };
  const document={
    body,
    visibilityState:'visible',
    getElementById:id=>nodes.get(id)||null,
    createElement:tag=>node(tag),
    addEventListener:(event,fn)=>listeners.set('doc:'+event,fn),
  };
  const globals={
    document,
    navigator:{serviceWorker,onLine:online},
    URL,Date,Promise,
    location:{href:'https://ibr7h.github.io/gold-app-pwa/admin/',replace:x=>calls.replacements.push(x)},
    addEventListener:(event,fn)=>listeners.set(event,fn),
    fetch:async(url,opts)=>{calls.fetch.push({url,opts});return {ok:true,json:async()=>({version:remote,displayVersion:'v1.0.25'})};},
    setTimeout(){},
    setInterval(){},
  };
  runInNewContext(client.replaceAll('__ADMIN_BUILD_SHA__','aaaaaaaa').replaceAll('__ADMIN_DISPLAY_VERSION__','v1.0.24'),globals);
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  return {calls,nodes,listeners,registration,async load(){listeners.get('load')();for(let i=0;i<5;i++)await tick();},tick};
}

test('same version does not prompt, manual check confirms current version',async()=>{
  const a=harness();
  await a.load();
  assert.equal(a.nodes.has('admin-update-banner'),false);
  assert.equal(a.calls.registration.length,1);
  assert.equal(a.calls.registration[0].options.updateViaCache,'none');
  assert.equal(a.calls.fetch[0].opts.cache,'no-store');
  a.nodes.get('admin-check-update-login').events.click();
  await a.tick();await a.tick();
  assert.match(a.nodes.get('admin-update-notice').textContent,/آخر إصدار/);
});

test('new version prompts without automatic reload or silent SW activation',async()=>{
  const a=harness('admin-bbbbbbbb');
  await a.load();
  assert.ok(a.nodes.has('admin-update-banner'));
  assert.equal(a.calls.replacements.length,0);
  assert.equal(a.calls.postMessages.length,0);
});

test('user approval activates waiting SW then reloads with cache busting',async()=>{
  const a=harness('admin-bbbbbbbb');
  await a.load();
  const banner=a.nodes.get('admin-update-banner');
  const install=banner.children[3].children[0];
  install.events.click();
  for(let i=0;i<4;i++)await a.tick();
  assert.deepEqual(JSON.parse(JSON.stringify(a.calls.postMessages[0])),{type:'SKIP_WAITING'});
  assert.match(a.calls.replacements[0],/\/gold-app-pwa\/admin\/\?_pwa=/);
  assert.equal(a.calls.storage,0);
});

test('later keeps old session and does not reload; settings can request a new check',async()=>{
  const a=harness('admin-bbbbbbbb');
  await a.load();
  const later=a.nodes.get('admin-update-banner').children[3].children[1];
  later.events.click();
  assert.equal(a.nodes.has('admin-update-banner'),false);
  assert.equal(a.calls.replacements.length,0);
  a.nodes.get('admin-check-update-settings').events.click();
  for(let i=0;i<4;i++)await a.tick();
  assert.ok(a.nodes.has('admin-update-banner'));
});

test('manual check reports offline without deleting data',async()=>{
  const a=harness('admin-bbbbbbbb',false);
  await a.load();
  assert.equal(a.calls.fetch.length,0);
  a.nodes.get('admin-check-update-login').events.click();
  await a.tick();
  assert.match(a.nodes.get('admin-update-notice').textContent,/الإنترنت/);
});

test('only admin cache is cleaned and version metadata is always network only',()=>{
  assert.match(worker,/const BASE='\/gold-app-pwa\/admin\/'/);
  assert.match(worker,/key\.startsWith\(PREFIX\)/);
  assert.match(worker,/if\(url\.pathname===BASE\+'version\.json'\)/);
  assert.match(worker,/fetch\(event\.request,\{cache:'no-store'\}\)/);
  const install=worker.split("self.addEventListener('install'")[1].split("self.addEventListener('activate'")[0];
  assert.doesNotMatch(install,/skipWaiting/);
  assert.doesNotMatch(client,/localStorage\.clear|sessionStorage\.clear|indexedDB\.deleteDatabase/);
});
