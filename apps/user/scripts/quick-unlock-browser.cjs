'use strict';
// Runs against an existing production export. All API responses are isolated test fixtures;
// prices are deliberately unavailable. No production account or backend write is used.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||''),base='/gold-app-pwa/full/';
assert(fs.existsSync(path.join(root,'index.html')),'Pass the existing Expo production export directory.');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const relative=decodeURIComponent(url.pathname.startsWith(base)?url.pathname.slice(base.length):url.pathname.slice(1));
 let target=path.resolve(root,relative||'index.html');
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
 if(!fs.existsSync(target)&&!path.extname(target))target=path.join(root,'index.html');
 if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(target).pipe(res);
});
const fixture={id:'browser-fixture-user',email:'browser@example.test',role:'user'};
const password='PasswordFixture-Only!7';
let passed=0;
const report=name=>{passed++;process.stdout.write('PASS '+name+'\n');};
async function digitSequence(page,pin){for(const digit of pin)await page.getByRole('button',{name:'الرقم '+digit,exact:true}).click();}
async function seed(page){
 await page.evaluate(async(user)=>{
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('406195'),'PBKDF2',false,['deriveBits']);
  const hash=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:600000,salt},key,256);
  const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
  localStorage.setItem('dhahabi_user_profile',JSON.stringify(user));
  localStorage.setItem('dhahabi_user_access_token','access-browser-fixture');
  localStorage.setItem('dhahabi_user_refresh_token','refresh-browser-fixture');
  localStorage.setItem('dhahabi_user_quick_pin_v1',JSON.stringify({version:2,accountId:user.id,origin:location.origin,salt:hex(salt),hash:hex(hash),failures:0,lockedUntil:0}));
  localStorage.setItem('untouched-push-fixture','preserved');
 },fixture);
 await page.reload();await page.locator('.dh-quick-lock').waitFor();
}
async function accountPage(page){
 const mobile=page.locator('.mobile-bottom-nav');
 const nav=await mobile.isVisible()?mobile:page.locator('.desktop-nav');
 await nav.getByRole('button',{name:'الملف',exact:true}).click();
 await page.getByText('الدخول السريع والأمان',{exact:true}).waitFor();
}
async function run(browser,url,viewport,label,virtual=false){
 const context=await browser.newContext({viewport});const page=await context.newPage();
 page.setDefaultTimeout(15000);
 const errors=[],requests=[];let expired=false;
 page.on('pageerror',e=>errors.push(e.message));
 if(virtual){const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});}
 await context.addInitScript(()=>{
  window.__deviceCalls={get:0,create:0};
  if(navigator.credentials){for(const method of ['get','create']){const original=navigator.credentials[method].bind(navigator.credentials);
   navigator.credentials[method]=options=>{window.__deviceCalls[method]++;return original(options);};}}
 });
 await context.route('https://gold-app-api-u8dl.onrender.com/**',async route=>{
  const request=route.request(),url=new URL(request.url());requests.push({path:url.pathname,method:request.method()});
  let status=200,data;
  if(url.pathname==='/auth/login'){
   const input=request.postDataJSON();if(input.password!==password){status=401;data={message:'Invalid credentials'};}
   else data={accessToken:'access-browser-fixture',refreshToken:'refresh-browser-fixture'};
  }else if(url.pathname==='/auth/refresh'){status=401;data={message:'Invalid refresh token'};}
  else if(url.pathname==='/auth/me'){
   if(expired){status=401;data={message:'expired'};}else data={userId:fixture.id,email:fixture.email,role:'user'};
  }else if(url.pathname.startsWith('/prices/')){status=503;data={message:'Prices unavailable in this isolated test'};}
  else if(url.pathname==='/alerts')data={items:[],total:0};
  else if(url.pathname.startsWith('/portfolio'))data=[];
  else{status=404;data={message:'fixture endpoint unavailable'};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 try{
 await page.goto(url);await page.locator('.mockup-login-container').waitFor();await seed(page);
 assert.deepEqual(await page.evaluate(()=>window.__deviceCalls),{get:0,create:0});
 assert.equal(requests.filter(x=>x.path.startsWith('/portfolio')||x.path==='/alerts').length,0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('dhahabi_user_refresh_token')),null);
 const ciphertext=await page.evaluate(()=>localStorage.getItem('dhahabi_user_session_vault_v1'));
 assert(ciphertext&&!ciphertext.includes('refresh-browser-fixture'));
 const protectedKey=await page.evaluate(async()=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('dhahabi-user-session-vault',1);r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{const db=r.result,tx=db.transaction('keys'),get=tx.objectStore('keys').get('session');
   get.onsuccess=async()=>{const key=get.result;let exportRejected=false;try{await crypto.subtle.exportKey('raw',key);}catch{exportRejected=true;}
    resolve({extractable:key.extractable,exportRejected});db.close();};};
 }));assert.deepEqual(protectedKey,{extractable:false,exportRejected:true});
 report(label+': legacy session migrates to real IndexedDB-backed encryption before any private request; no automatic passkey prompt');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,label+'-lock.png'),fullPage:true});}
 await digitSequence(page,'123456');await page.getByText(/رمز غير صحيح/).waitFor();
 await digitSequence(page,'406195');await page.locator('.gold-web.workspace').waitFor();
 assert(requests.some(x=>x.path==='/auth/me'));report(label+': wrong PIN stays locked; correct PIN requires backend account validation');
 await accountPage(page);await page.getByRole('button',{name:'تغيير رمز الدخول السريع',exact:true}).click();
 const modal=page.getByRole('dialog',{name:'إعداد رمز الدخول السريع'});await modal.waitFor();
 await modal.locator('input[type=password]').fill('incorrect-password-fixture');await modal.getByRole('button',{name:'تأكيد والمتابعة'}).click();
 await modal.getByText(/غير صحيحة/).waitFor();assert.equal(await modal.getByRole('button',{name:'الرقم 1',exact:true}).count(),0);
 await modal.locator('input[type=password]').fill(password);await modal.getByRole('button',{name:'تأكيد والمتابعة'}).click();
 await modal.getByRole('button',{name:'الرقم 1',exact:true}).waitFor();await digitSequence(page,'987650');await digitSequence(page,'987651');
 await modal.getByText(/غير متطابقين/).waitFor();await digitSequence(page,'987650');await digitSequence(page,'987650');await modal.waitFor({state:'hidden'});
 report(label+': PIN change rejects wrong account password and mismatched confirmation');
 if(virtual){
  await page.getByRole('switch',{name:'خدمة بصمة الوجه والإصبع'}).click();
  await page.getByText(/تم تسجيل بصمة الجهاز/).waitFor();
  assert.equal(await page.getByRole('switch',{name:'خدمة بصمة الوجه والإصبع'}).getAttribute('aria-checked'),'true');
  await page.getByRole('button',{name:'قفل ذهبي الآن',exact:true}).click();await page.locator('.dh-quick-lock').waitFor();
  assert.deepEqual(await page.evaluate(()=>window.__deviceCalls),{get:0,create:1});
  await page.getByRole('button',{name:'فتح ببصمة الجهاز',exact:true}).first().click();await page.locator('.gold-web.workspace').waitFor();
  assert.equal((await page.evaluate(()=>window.__deviceCalls)).get,1);
  report(label+': virtual platform WebAuthn enrollment and signed assertion work only after explicit button taps');
  await accountPage(page);
 }
 await page.getByRole('button',{name:'قفل ذهبي الآن',exact:true}).click();await page.locator('.dh-quick-lock').waitFor();
 await page.getByRole('button',{name:'نسيت رمز الدخول السريع؟ الدخول بكلمة المرور'}).click();await page.locator('.mockup-login-container').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('untouched-push-fixture')),'preserved');
 await page.locator('input[type=email]').fill(fixture.email);await page.locator('input[autocomplete="current-password"]').fill(password);
 await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await page.locator('.gold-web.workspace').waitFor();
 await accountPage(page);await page.getByRole('switch',{name:'تفعيل رمز الدخول السريع'}).click();await modal.waitFor();
 await modal.locator('input[type=password]').fill(password);await modal.getByRole('button',{name:'تأكيد وإيقاف الرمز'}).click();await modal.waitFor({state:'hidden'});
 assert.equal(await page.getByRole('switch',{name:'تفعيل رمز الدخول السريع'}).getAttribute('aria-checked'),'false');
 report(label+': forgotten PIN recovery and disabling require password, preserving unrelated subscription state');
 // Re-enable via the same verified dialog, then reject an expired server session.
 await page.getByRole('switch',{name:'تفعيل رمز الدخول السريع'}).click();await modal.waitFor();
 await modal.locator('input[type=password]').fill(password);await modal.getByRole('button',{name:'تأكيد والمتابعة'}).click();
 await modal.getByRole('button',{name:'الرقم 1',exact:true}).waitFor();await digitSequence(page,'406195');await digitSequence(page,'406195');await modal.waitFor({state:'hidden'});
 await page.getByRole('button',{name:'قفل ذهبي الآن',exact:true}).click();await page.locator('.dh-quick-lock').waitFor();expired=true;
 await digitSequence(page,'406195');await page.locator('.mockup-login-container').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('dhahabi_user_session_vault_v1')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('untouched-push-fixture')),'preserved');assert.deepEqual(errors,[]);
 report(label+': expired backend session never opens the workspace, even with the correct PIN');
 }catch(error){
  process.stdout.write('FAILED '+label+' UI: '+(await page.locator('body').innerText()).slice(-5000)+'\n');
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,label+'-failure.png'),fullPage:true});
  throw error;
 }finally{await context.close();}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://localhost:'+server.address().port+base;
 try{
  const browser=await chromium.launch({headless:true});
  try{await run(browser,url,{width:390,height:844},'mobile',true);await run(browser,url,{width:1280,height:900},'desktop');}finally{await browser.close();}
  if(process.env.TEST_WEBKIT==='1'){
   const engine=await webkit.launch({headless:true});try{await run(engine,url,{width:390,height:844},'webkit-mobile');}finally{await engine.close();}
  }
  process.stdout.write('Browser assertions passed: '+passed+'\n');
 }finally{server.close();}
})().catch(e=>{process.stderr.write(String(e.stack||e)+'\n');server.close();process.exitCode=1;});
