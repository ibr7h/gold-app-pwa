import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
const code=readFileSync(new URL('../public/admin-quick-unlock.js',import.meta.url),'utf8');
function fixture(pinResponse='ok'){
 const store=new Map(),nodes=new Map(),listeners=new Map();
 const ids=[...readFileSync(new URL('../public/index.html',import.meta.url),'utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 for(const id of ids){
  nodes.set(id,{
   id,value:'',textContent:'',hidden:false,disabled:false,
   classList:{toggle(){},add(){},remove(){}},
   handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},focus(){}
  });
 }
 const key=webcrypto.getRandomValues(new Uint8Array(32));
 const encoded=Buffer.from(key).toString('base64url');
 const calls={resume:0,lock:0,register:0,pinVerify:0};
 const bridge={
  async api(path,method,body){
   if(path==='/auth/admin/quick/register'){calls.register++;return {deviceId:'00000000-0000-4000-8000-000000000004',unlockKey:encoded};}
   if(path==='/auth/admin/quick/revoke')return {removed:true};
   throw Error('unexpected admin call');
  },
  async pinVerify(deviceId,pin){
   calls.pinVerify++;
   if(pinResponse==='denied'||pin!=='728439'){const e=new Error('no');e.status=429;throw e;}
   return {unlockKey:encoded};
  },
  async resume(refresh,id){
   assert.equal(id,'00000000-0000-4000-8000-000000000001');
   assert.equal(refresh,'a.v0.example-session-refresh');
   calls.resume++;
   return {accessToken:'new-access',refreshToken:'a.v0.updated-session-refresh'};
  },
  lock(){calls.lock++;}
 };
 const window={isSecureContext:true,DhahabkAdminBridge:bridge};
 const document={
  visibilityState:'visible',
  getElementById:id=>nodes.get(id),
  addEventListener:(name,fn)=>listeners.set(name,fn)
 };
 const context={
  document,window,
  navigator:{credentials:{}},crypto:webcrypto,location:{origin:'https://ibr7h.github.io',hostname:'ibr7h.github.io'},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  TextEncoder,TextDecoder,Uint8Array,JSON,Date,Promise,
  atob:v=>Buffer.from(v,'base64').toString('binary'),
  btoa:v=>Buffer.from(v,'binary').toString('base64'),
 };
 runInNewContext(code,context);
 return {nodes,window,document,listeners,store,calls};
}
const submit=async el=>el.handlers.submit({preventDefault(){}});
test('Admin PIN cannot unlock without server key and valid refresh; stores only ciphertext',async()=>{
 const f=fixture();
 await f.window.AdminQuickUnlock.onAuthenticated(
  {role:'admin',userId:'00000000-0000-4000-8000-000000000001',email:'admin@example.test'},
  {accessToken:'test-access',refreshToken:'a.v0.example-session-refresh'});
 f.nodes.get('quick-setup-pin').value='728439';
 f.nodes.get('quick-setup-confirm').value='728439';
 await submit(f.nodes.get('quick-set-pin-form'));
 const contents=f.store.get('dhahabk_admin_secure_v1');
 assert.ok(contents);
 assert.doesNotMatch(contents,/example-session-refresh|728439|test-access/);
 assert.equal(f.calls.register,1);
 f.window.AdminQuickUnlock.lock();
 assert.equal(f.calls.lock,1);
 f.nodes.get('quick-pin-input').value='728439';
 await submit(f.nodes.get('quick-pin-form'));
 assert.equal(f.calls.pinVerify,1);
 assert.equal(f.calls.resume,1);
 assert.equal(f.nodes.get('admin-quick-screen').hidden,true);
 const rotated=f.store.get('dhahabk_admin_secure_v1');
 assert.doesNotMatch(rotated,/updated-session-refresh/);
});
test('Admin PIN server throttling failure cannot resume the dashboard',async()=>{
 const f=fixture('denied');
 await f.window.AdminQuickUnlock.onAuthenticated(
  {role:'admin',userId:'00000000-0000-4000-8000-000000000001',email:'admin@example.test'},
  {accessToken:'test-access',refreshToken:'a.v0.example-session-refresh'});
 f.nodes.get('quick-setup-pin').value='728439';
 f.nodes.get('quick-setup-confirm').value='728439';
 await submit(f.nodes.get('quick-set-pin-form'));
 f.window.AdminQuickUnlock.lock();
 f.nodes.get('quick-pin-input').value='728439';
 await submit(f.nodes.get('quick-pin-form'));
 assert.equal(f.calls.resume,0);
 assert.match(f.nodes.get('quick-notice').textContent,/15 دقيقة/);
});
