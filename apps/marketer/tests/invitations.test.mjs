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
 const sent=[];let claimed=false;let available=true;
 const fetch=async(url,options={})=>{
  const path=new URL(url).pathname,method=options.method||'GET';
  sent.push({path,method,body:options.body?JSON.parse(options.body):null});
  if(path.startsWith('/marketer/merchant-invites')&&!authorized)
   return {ok:false,status:403,json:async()=>({message:'Not an authorized marketer'})};
  const assigned={id:'00000000-0000-4000-8000-000000000007',merchantName:'Admin issued',
   intendedEmail:'business@example.test',codeTail:'ABC123',canClaim:!claimed,status:'active'};
  const data=path==='/auth/login'?{accessToken:'test-token'}:
   path==='/auth/me'?{role:'user',email:'marketer@example.test'}:
   path==='/marketer/merchant-invites'&&method==='GET'?{items:available?[assigned]:[]}:
   path.endsWith('/claim')&&method==='POST'?(claimed=true,{code:'DBK-'+'A'.repeat(24)}):
   {success:true};
  return {ok:true,status:200,json:async()=>data};
 };
 const env={document:{getElementById:id=>nodes.get(id),createElement:()=>new Element(''),addEventListener(){}},
  navigator:{clipboard:{writeText:async()=>{}}},window:{confirm:()=>true},fetch,
  AbortController,setTimeout,clearTimeout,Date,Number,JSON,Promise,URL,encodeURIComponent};
 runInNewContext(source,env);
 return {nodes,sent,claimed:()=>claimed,available:v=>available=v};
}
test('Marketer app never offers generation, Admin review, or client-held persistent tokens',async()=>{
 assert.doesNotThrow(()=>new Script(source));
 assert.doesNotMatch(source,/localStorage|sessionStorage|innerHTML/);
 assert.doesNotMatch(source,/\/marketer\/merchant-invites',['POST'].join(''));
 assert.ok(!html.includes('issue-form'));
 assert.ok(!html.includes('issue-submit'));
 assert.ok(!source.includes('/admin/merchant-invites'));
 assert.ok(source.includes('/claim'));
});
test('Marketer cannot access assigned invitations without valid server grant',async()=>{
 const f=fixture(false);
 f.nodes.get('marketer-email').value='marketer@example.test';
 f.nodes.get('marketer-password').value='password';
 await f.nodes.get('login-form').fire('submit');
 assert.equal(f.nodes.get('login-screen').hidden,false);
 assert.equal(f.nodes.get('portal-screen').hidden,true);
 assert.equal(f.sent.some(x=>x.path.endsWith('/claim')),false);
});
test('Admin allocation appears in Marketer portal, reveal is explicit and one-time',async()=>{
 const f=fixture(true);
 f.nodes.get('marketer-email').value='marketer@example.test';
 f.nodes.get('marketer-password').value='password';
 await f.nodes.get('login-form').fire('submit');
 assert.equal(f.nodes.get('portal-screen').hidden,false);
 const rows=f.nodes.get('my-invites').children;
 assert.equal(rows.length,1);
 const receive=rows[0].children.find(x=>x.textContent==='استلام الرمز المخصص');
 assert.ok(receive);
 assert.equal(f.claimed(),false);
 await receive.fire('click');
 assert.equal(f.claimed(),true);
 const requests=f.sent.filter(x=>x.path.endsWith('/claim'));
 assert.equal(requests.length,1);
 assert.equal(requests[0].method,'POST');
 assert.equal(f.nodes.get('issued-code').textContent,'DBK-'+'A'.repeat(24));
 assert.equal(f.nodes.get('issued-panel').hidden,false);
 await f.nodes.get('marketer-logout').fire('click');
 assert.equal(f.nodes.get('issued-code').textContent,'');
 assert.equal(f.nodes.get('issued-panel').hidden,true);
 const unauthorizedPosts=f.sent.filter(x=>x.method==='POST'&&x.path==='/marketer/merchant-invites');
 assert.equal(unauthorizedPosts.length,0);
});
