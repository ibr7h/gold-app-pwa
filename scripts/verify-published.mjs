import assert from 'node:assert/strict';
const base='https://ibr7h.github.io/gold-app-pwa/full/';
const expected='full-'+process.env.GITHUB_SHA.slice(0,8);
let verified=false;
for(let attempt=0;attempt<12;attempt++){
 try{
  const version=await fetch(base+'version.json?verify='+Date.now(),{signal:AbortSignal.timeout(15000)}).then(r=>{assert(r.ok);return r.json();});
  assert.equal(version.version,expected);
  const html=await fetch(base+'?verify='+Date.now(),{signal:AbortSignal.timeout(15000)}).then(r=>{assert(r.ok);return r.text();});
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>new URL(m[1],base)).filter(u=>u.origin==='https://ibr7h.github.io'&&u.pathname.includes('/_expo/'));
  assert(scripts.length>0);
  let found=false;
  for(const url of scripts){const js=await fetch(url,{signal:AbortSignal.timeout(20000)}).then(r=>r.text());if(js.includes('User Web 1.3')&&js.includes('mobile-bottom-nav'))found=true;}
  assert(found,'Published JavaScript does not contain User Web 1.3 and seven-tab mobile navigation');
  verified=true;console.log('Published version and user workspace verified:',expected);break;
 }catch(e){console.log('Waiting for Pages propagation, attempt',attempt+1);await new Promise(r=>setTimeout(r,5000));}
}
assert(verified,'Published release could not be verified');
