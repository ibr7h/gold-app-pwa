'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {collectOfflineAssets,buildOfflineWorker}=require('./offline-assets.cjs');
const template=fs.readFileSync(path.join(__dirname,'user-service-worker.js'),'utf8');
const BASE='/gold-app-pwa/full/',VERSION='1.9.90-20261024',ORIGIN='https://test.invalid';
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dhahabk-offline-test-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const put=(file,body)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),body);};
 const html='<link rel="stylesheet" href="'+BASE+'style.css"><script src="'+BASE+'standalone-install-gate.js?v='+VERSION+'" data-entry="'+BASE+'_expo/entry-12345678.js"></script>';
 for(const file of ['index.html','login.html','register.html'])put(file,html);
 put('style.css','body{color:navy}');put('standalone-install-gate.js','/* reviewed gate */');
 put('_expo/entry-12345678.js','/* actual boot entry */');put('assets/node_modules/font.woff','font');
 return {root,put,html};
}
function harness(root){
 const handlers=new Map(),stores=new Map();let offline=false;
 const getKey=(request,ignoreSearch=false)=>{
  const url=new URL(typeof request==='string'?request:request.url,ORIGIN);
  return url.pathname+(ignoreSearch?'':url.search);
 };
 const fetcher=async request=>{
  if(offline)throw new TypeError('offline');
  const key=getKey(request).split('?')[0];
  const file=path.join(root,key===BASE?'index.html':key.slice(BASE.length));
  return fs.existsSync(file)&&fs.statSync(file).isFile()?new Response(fs.readFileSync(file),{status:200}):new Response('missing',{status:404});
 };
 const open=async name=>{
  if(!stores.has(name))stores.set(name,new Map());
  const entries=stores.get(name);
  const put=async(request,response)=>entries.set(getKey(request),response.clone());
  return {put,async add(request){const response=await fetcher(request);if(!response.ok)throw Error('missing');await put(request,response);},
   async addAll(requests){for(const request of requests)await this.add(request);},
   async match(request,options){const key=getKey(request,options?.ignoreSearch);for(const [stored,response]of entries){if((options?.ignoreSearch?stored.split('?')[0]:stored)===key)return response.clone();}}
  };
 };
 vm.runInNewContext(buildOfflineWorker(root,template,VERSION),{
  self:{location:{origin:ORIGIN},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers.set(name,fn)},
  caches:{open,keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key)},fetch:fetcher,Response,URL,Promise
 });
 return {stores,setOffline:()=>{offline=true;},async install(){let pending;handlers.get('install')({waitUntil:p=>{pending=p;}});await pending;},
  async request(file,mode='cors'){let pending;handlers.get('fetch')({request:{method:'GET',url:ORIGIN+BASE+file,mode},respondWith:p=>{pending=p;}});return pending;}
 };
}
test('manifest includes gated entry, CSS, bootstrap, and bundled fonts, but no source maps',t=>{
 const f=fixture(t);f.put('_expo/entry-12345678.js.map','private-source-map');
 const assets=collectOfflineAssets(f.root);
 for(const file of ['style.css','standalone-install-gate.js','_expo/entry-12345678.js','assets/node_modules/font.woff'])assert.ok(assets.includes(BASE+file));
 assert.ok(!assets.some(p=>p.endsWith('.map')));
});
test('a missing boot dependency rejects packaging instead of publishing a partial cache',t=>{
 const f=fixture(t);fs.unlinkSync(path.join(f.root,'_expo/entry-12345678.js'));
 assert.throws(()=>collectOfflineAssets(f.root),/Missing offline boot asset/);
});
test('cold offline navigation loads the shell AND every required boot dependency',async t=>{
 const f=fixture(t),app=harness(f.root);await app.install();app.setOffline();
 assert.equal((await app.request('','navigate')).status,200);
 assert.equal((await app.request('standalone-install-gate.js?v='+VERSION)).status,200);
 assert.equal((await app.request('_expo/entry-12345678.js?v=old-query')).status,200);
 assert.equal((await app.request('style.css')).status,200);
 assert.equal((await app.request('assets/node_modules/font.woff')).status,200);
});
test('offline metadata is never reported as fresh and a different release bootstrap is not substituted',async t=>{
 const f=fixture(t),app=harness(f.root);await app.install();app.setOffline();
 assert.equal((await app.request('version.json')).status,503);
 assert.equal((await app.request('standalone-install-gate.js?v=9.9.9-20261024')).status,503);
});
test('offline lookup never reads another release cache',async t=>{
 const f=fixture(t),app=harness(f.root);await app.install();
 app.stores.set('dhahabi-full-old',new Map([[BASE+'missing.js',new Response('old-secret')]]));app.setOffline();
 const response=await app.request('missing.js');assert.equal(response.status,503);assert.notEqual(await response.text(),'old-secret');
});
