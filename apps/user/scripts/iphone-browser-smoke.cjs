'use strict';
// Test-only localhost server and browser context. Never signs into production.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]),BASE='/gold-app-pwa/full/';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const csp=html.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)?.[0];
assert(csp,'Test must use the actual packaged CSP');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
const probeScript=`Promise.all([
 fetch('https://api.frankfurter.dev/v1/2026-10-23?base=USD&symbols=EUR',{credentials:'omit'}).then(r=>r.json()).then(d=>document.body.dataset.fx=String(d.rates.EUR)),
 fetch('https://unapproved.example.invalid/blocked',{credentials:'omit'}).then(()=>{throw Error('CSP opened an unapproved origin')},()=>document.body.dataset.blocked='yes')
]).catch(e=>document.body.dataset.failure=e.message);`;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('Cache-Control','no-store');
 if(url.pathname===BASE+'qa-csp-probe.html'){
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head>'+csp+'</head><body><script src="'+BASE+'qa-csp-probe.js"></script></body></html>');return;
 }
 if(url.pathname===BASE+'qa-csp-probe.js'){res.setHeader('Content-Type','application/javascript');res.end(probeScript);return;}
 if(!url.pathname.startsWith(BASE)){res.writeHead(404).end();return;}
 let file=path.resolve(root,decodeURIComponent(url.pathname.slice(BASE.length)||'index.html'));
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(!fs.existsSync(file)&&!path.extname(file)&&fs.existsSync(file+'.html'))file+='.html';
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',serviceWorkers:'allow'});
  let privateRequests=0;
  await context.route('https://gold-app-api-u8dl.onrender.com/**',route=>{
   if(!new URL(route.request().url()).pathname.startsWith('/prices/'))privateRequests++;
   return route.abort();
  });
  await context.route('https://api.frankfurter.dev/**',route=>{
   assert.equal(route.request().headers().authorization,undefined);
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({rates:{EUR:.86}})});
  });
  // Test-only PWA display-mode signal, not an authentication bypass or physical iPhone claim.
  await context.addInitScript(()=>{
   Object.defineProperty(navigator,'standalone',{get:()=>true});
   localStorage.setItem('dhahabi:user:auth-language','en');
   if(!localStorage.getItem('dhahabk:public-market-v1'))localStorage.setItem('dhahabk:public-market-v1',JSON.stringify({version:1,savedAt:Date.now(),rows:[{currency:'SAR',karat:24,buyPrice:'300',sellPrice:'300',timestamp:new Date(Date.now()-60000).toISOString()}]}));
  });
  const probe=await context.newPage();
  await probe.goto(origin+BASE+'qa-csp-probe.html');
  await probe.waitForFunction(()=>document.body.dataset.fx==='0.86'&&document.body.dataset.blocked==='yes',{},{timeout:10000});
  console.log('PASS real Chromium CSP: reviewed EUR origin allowed, unrelated origin blocked, no Authorization header');
  await probe.close();
  const page=await context.newPage();
  await page.goto(origin+BASE);
  await page.evaluate(async base=>{
   await navigator.serviceWorker.register(base+'sw.js',{scope:base});
   await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Offline worker failed to install')),20000))]);
   if(!navigator.serviceWorker.controller)await Promise.race([new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})),new Promise((_,reject)=>setTimeout(()=>reject(Error('Offline worker did not claim client')),10000))]);
  },BASE);
  await context.setOffline(true);
  await page.close();
  const offline=await context.newPage();
  const served=[];
  offline.on('response',response=>{if(/\.(?:js|css)(?:\?|$)/.test(response.url()))served.push({url:response.url(),status:response.status(),sw:response.fromServiceWorker()});});
  const navigation=await offline.goto(origin+BASE,{waitUntil:'domcontentloaded'});
  assert.equal(navigation.status(),200);assert.equal(navigation.fromServiceWorker(),true);
  await offline.getByRole('heading',{name:'Offline mode',exact:true}).waitFor({timeout:15000});
  assert.match(await offline.locator('body').innerText(),/Prices are not live/);
  await offline.getByLabel('Workmanship / gram',{exact:true}).fill('20');
  await offline.getByLabel(/Tax \(%\)/).fill('15');
  assert.match(await offline.locator('.calc-breakdown .final').innerText(),/3,680/);
  assert.ok(served.some(r=>/entry-.*\.js/.test(r.url)&&r.status===200&&r.sw));
  assert.ok(served.some(r=>/standalone-install-gate\.js/.test(r.url)&&r.status===200&&r.sw));
  assert.ok(!served.some(r=>r.status!==200),'Every requested offline JS/CSS file must load successfully');
  assert.equal(await offline.evaluate(async base=>(await fetch(base+'version.json')).status,BASE),503);
  assert.equal(privateRequests,0,'Public offline tools must not request private account endpoints');
  console.log('PASS real cold offline reopen: saved price, calculator 15% = 480 tax / 3680 total, boot JS/CSS from service worker, no account API');
  await context.setOffline(false);
  await offline.waitForFunction(()=>!document.body.innerText.includes('Offline mode'),{},{timeout:10000});
  assert.equal(await offline.getByRole('button',{name:'Portfolio',exact:true}).count(),0);
  console.log('PASS reconnect exits public offline view without creating an authenticated session');
  await context.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
