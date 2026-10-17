import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Script,runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const html=read('index.html'),source=read('app.js');
class Element{
 constructor(id){this.id=id;this.textContent='';this.hidden=false;this.value='';this.disabled=false;
  this.children=[];this.handlers={};this.classList={toggle(){}};
 }
 addEventListener(k,fn){this.handlers[k]=fn;}
 async fire(k){return this.handlers[k]?.({preventDefault(){}});}
 replaceChildren(...children){this.children=children;}
 append(...children){this.children.push(...children);}
 reset(){}
}
function fixture(authorized=true){
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 const nodes=new Map(ids.map(id=>[id,new Element(id)]));
 const sent=[];
 const fetch=async(url,options={})=>{
  const path=new URL(url).pathname,method=options.method||'GET';
  sent.push({path,method,body:options.body?JSON.parse(options.body):null});
  if(path==='/marketer/merchant-invites'&&!authorized)
   return {ok:false,status:403,json:async()=>({message:'Not an authorized marketer'})};
  const data=path==='/auth/login'?{accessToken:'test-token',refreshToken:'unused'}:
   path==='/auth/me'?{role:'user',email:'marketer@example.test'}:
   path==='/marketer/merchant-invites'&&method==='GET'?{items:[]}:
   path==='/marketer/merchant-invites'&&method==='POST'?
    {code:'DBK-'+'A'.repeat(24),issuerType:'marketer'}:{success:true};
  return {ok:true,status:200,json:async()=>data};
 };
 const listeners={};
 const document={getElementById:id=>nodes.get(id),createElement:()=>new Element(''),
  visibilityState:'visible',addEventListener:(type,fn)=>{listeners[type]=fn;}};
 const env={document,
  navigator:{clipboard:{writeText:async()=>{}}},window:{},fetch,
  AbortController,setTimeout,clearTimeout,Date,Number,JSON,Promise,URL};
 runInNewContext(source,env);
 return {nodes,sent,document,listeners};
}
test('Marketer is not an administrator and invitation access requires a backend grant',async()=>{
 assert.doesNotThrow(()=>new Script(source));
 assert.doesNotMatch(source,/localStorage|sessionStorage|innerHTML/);
 assert.ok(source.includes('/marketer/merchant-invites'));
 assert.ok(!source.includes('/admin/merchant-invites'));
 const f=fixture(false);
 f.nodes.get('marketer-email').value='marketer@example.test';
 f.nodes.get('marketer-password').value='test-password';
 await f.nodes.get('login-form').fire('submit');
 assert.equal(f.nodes.get('login-screen').hidden,false);
 assert.equal(f.nodes.get('portal-screen').hidden,true);
});
test('Authorized marketer may issue only single-use bound-email code, never review a Merchant',async()=>{
 const f=fixture(true);
 f.nodes.get('marketer-email').value='marketer@example.test';
 f.nodes.get('marketer-password').value='test-password';
 await f.nodes.get('login-form').fire('submit');
 assert.equal(f.nodes.get('portal-screen').hidden,false);
 f.nodes.get('store-name').value='Saudi Gold Shop';
 f.nodes.get('store-email').value='business@example.test';
 f.nodes.get('invite-days').value='7';
 await f.nodes.get('issue-form').fire('submit');
 const post=f.sent.find(x=>x.path==='/marketer/merchant-invites'&&x.method==='POST');
 assert.ok(post);
 assert.equal(post.body.maxUses,1);
 assert.equal(post.body.intendedEmail,'business@example.test');
 assert.equal(post.body.expiresInDays,7);
 assert.equal(f.nodes.get('issued-panel').hidden,false);
 assert.ok(f.nodes.get('issued-code').textContent.startsWith('DBK-'));
 assert.equal(f.sent.some(x=>x.path.includes('/review')),false);
 await f.nodes.get('marketer-logout').fire('click');
 assert.equal(f.nodes.get('issued-code').textContent,'');
});

test('one-time marketer invite disappears immediately when iPhone is backgrounded',async()=>{
 const f=fixture();
 f.nodes.get('marketer-email').value='marketer@example.test';
 f.nodes.get('marketer-password').value='test-password';
 await f.nodes.get('login-form').fire('submit');
 f.nodes.get('store-name').value='Saudi Gold Shop';
 f.nodes.get('store-email').value='business@example.test';
 f.nodes.get('invite-days').value='7';
 await f.nodes.get('issue-form').fire('submit');
 assert.equal(f.nodes.get('issued-panel').hidden,false);
 f.document.visibilityState='hidden';
 f.listeners.visibilitychange();
 assert.equal(f.nodes.get('issued-panel').hidden,true);
 assert.equal(f.nodes.get('issued-code').textContent,'');
});
