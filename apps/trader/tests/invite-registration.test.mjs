import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script,runInNewContext } from 'node:vm';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const html=read('register.html'),script=read('register.js'),login=read('index.html'),sw=read('sw.js');
class Node {
 constructor(id){this.id=id;this.value='';this.hidden=false;this.disabled=false;
  this.checked=false;this.textContent='';this.handlers={};this.classList={toggle(){}};
 }
 addEventListener(event,listener){this.handlers[event]=listener;}
 reset(){this.value='';}
 async submit(){await this.handlers.submit({preventDefault(){}});}
 click(){return this.handlers.click?.();}
}
function fixture(){
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
 const nodes=new Map(ids.map(id=>[id,new Node(id)]));
 const requests=[];
 let pending=0;
 const fetch=async(url,options={})=>{
  pending++;
  requests.push({url,body:JSON.parse(options.body||'{}')});
  const result=url.endsWith('/register/start')
   ?{registrationId:'11111111-1111-4111-8111-111111111111',channel:'email'}
   :{status:'pending',id:'22222222-2222-4222-8222-222222222222'};
  return {ok:true,status:201,json:async()=>result};
 };
 const document={getElementById:id=>nodes.get(id)};
 const ctx={document,window:{},fetch,AbortController,setTimeout,clearTimeout,
  Date,Number,JSON,Promise,Intl};
 runInNewContext(script,ctx);
 return {nodes,requests,pending:()=>pending};
}
test('Trader registration is only on the trader path and cannot modify User session',()=>{
 assert.doesNotThrow(()=>new Script(script));
 assert.match(login,/href="register\.html"/);
 assert.match(html,/رمز دعوة/);
 assert.match(html,/id="invite-form"/);
 assert.match(html,/id="otp-form"/);
 assert.doesNotMatch(script,/localStorage|sessionStorage|innerHTML/);
 assert.ok(script.includes('/merchant/onboarding/register/start'));
 assert.ok(script.includes('/merchant/onboarding/register/verify'));
});
test('no request is possible before the invitation gate',async()=>{
 const f=fixture();
 assert.equal(f.nodes.get('step-invite').hidden,false);
 assert.equal(f.nodes.get('step-details').hidden,true);
 f.nodes.get('invite-code').value='BAD-CODE';
 await f.nodes.get('invite-form').submit();
 assert.equal(f.nodes.get('step-invite').hidden,false);
 assert.equal(f.pending(),0);
});
test('merchant signs up only via code and email OTP, never gets a session before approval',async()=>{
 const f=fixture();
 f.nodes.get('invite-code').value='DBK-'+ 'A'.repeat(24);
 await f.nodes.get('invite-form').submit();
 assert.equal(f.nodes.get('step-details').hidden,false);
 f.nodes.get('merchant-name').value='Merchant owner';
 f.nodes.get('merchant-email').value='merchant@example.test';
 f.nodes.get('merchant-phone').value='+966509005555';
 f.nodes.get('merchant-password').value='safe-merchant-password';
 f.nodes.get('merchant-password-confirm').value='safe-merchant-password';
 f.nodes.get('legal-accepted').checked=true;
 await f.nodes.get('merchant-form').submit();
 assert.equal(f.requests.length,1);
 assert.equal(f.requests[0].body.code,'DBK-'+ 'A'.repeat(24));
 assert.equal(f.requests[0].body.email,'merchant@example.test');
 assert.equal(f.nodes.get('step-otp').hidden,false);
 f.nodes.get('merchant-otp').value='١٢٣٤٥٦';
 await f.nodes.get('otp-form').submit();
 assert.equal(f.requests.length,2);
 assert.equal(f.requests[1].body.code,'123456');
 assert.equal(f.nodes.get('step-pending').hidden,false);
 assert.ok(!script.includes('refreshToken'),'Registration must never mint sessions');
});

test('Trader installed PWA versions and precaches only Trader invitation assets',()=>{
 assert.match(sw,/dhahabi-trader-v2-invite/);
 for(const file of ['register.html','register.css','register.js']){
  assert.ok(sw.includes("'"+file+"'"),'Missing installed Merchant registration asset: '+file);
 }
 assert.match(sw,/path==='register\.html'/);
 assert.doesNotMatch(sw,/gold-app-pwa\/full|apps\/user|localStorage\.clear/);
});
