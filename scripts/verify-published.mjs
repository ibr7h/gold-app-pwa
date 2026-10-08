import assert from 'node:assert/strict';
const root='https://ibr7h.github.io/gold-app-pwa/';
const userBase=root+'full/';
const expected='full-'+process.env.GITHUB_SHA.slice(0,8);
async function text(url,timeout=15000){return fetch(url+'?verify='+Date.now(),{signal:AbortSignal.timeout(timeout)}).then(r=>{assert(r.ok,url+' returned '+r.status);return r.text();});}
async function json(url){return fetch(url+'?verify='+Date.now(),{signal:AbortSignal.timeout(15000)}).then(r=>{assert(r.ok,url+' returned '+r.status);return r.json();});}
let verified=false;
for(let attempt=0;attempt<12;attempt++){
 try{
  const version=await json(userBase+'version.json');
  assert.equal(version.version,expected);
  const html=await text(userBase);
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>new URL(m[1],userBase)).filter(u=>u.origin==='https://ibr7h.github.io'&&u.pathname.includes('/_expo/'));
  assert(scripts.length>0);
  let userFound=false;
  for(const url of scripts){
   const js=await text(url.toString(),20000);
   if(js.includes('User Web 1.4.0')&&js.includes('mobile-bottom-nav')){
    userFound=true;
   }
  }
  assert(userFound,'Published User JavaScript does not contain User Web 1.4.0');

  for(const forbidden of ['trader-home','trader-orders','trader-clients','admin-users','admin-invites','admin-permissions']){
    const response=await fetch(userBase+forbidden+'?verify='+Date.now(),{redirect:'manual',signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,404,'Forbidden role route is published in User app: '+forbidden);
  }

  for(const spec of [
   {path:'trader/',role:'merchant',session:'dhahabi_trader_',name:'Trader'},
   {path:'admin/',role:'admin',session:'dhahabi_admin_',name:'Admin'}
  ]){
   const base=root+spec.path;
   const roleHtml=await text(base);
   assert(roleHtml.includes('data-role="'+spec.role+'"'),spec.name+' role gate missing');
   assert(!roleHtml.includes('role-pills'),spec.name+' login contains a role switcher');
   const appJs=await text(base+'app.js');
   assert(appJs.includes(spec.session),spec.name+' session namespace missing');
   const manifest=await json(base+'manifest.webmanifest');
   assert.equal(manifest.scope,'/gold-app-pwa/'+spec.path);
  }

  verified=true;
  console.log('Published User, Trader, and Admin apps verified:',expected);
  break;
 }catch(e){
  console.log('Waiting for Pages propagation, attempt',attempt+1,String(e?.message||e));
  await new Promise(r=>setTimeout(r,5000));
 }
}
assert(verified,'Published three-app release could not be verified');
