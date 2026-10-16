import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const script=readFileSync(new URL('../public/admin-quick-lock.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function harness(){
 const nodes=new Map([...html.matchAll(/id="([^"]+)"/g)].map(x=>[x[1],{
  id:x[1],value:'',disabled:false,hidden:false,textContent:'',handlers:{},
  addEventListener(type,fn){this.handlers[type]=fn;},
  async fire(type){return this.handlers[type]?.({preventDefault(){}});}
 }]));
 const domListeners={};const winListeners={};const stored=new Map();const window={
  isSecureContext:true,PublicKeyCredential:null,confirm:()=>true,
  addEventListener:(n,fn)=>{winListeners[n]=fn;}
 };
 const document={
  getElementById:id=>nodes.get(id)||null,
  visibilityState:'visible',
  addEventListener:(n,fn)=>{domListeners[n]=fn;}
 };
 const localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
 const context={window,document,crypto:webcrypto,localStorage,
  navigator:{credentials:null},location:{origin:'https://ibr7h.github.io',hostname:'ibr7h.github.io'},
  TextEncoder,TextDecoder,DataView,Uint8Array,Date,Array,JSON,RegExp,
  atob,btoa,Event:class FakeEvent{constructor(type){this.type=type}},
 };
 runInNewContext(script,context);
 return {nodes,window,document,stored,domListeners,winListeners,
  node:id=>nodes.get(id),
  async setPin(code='123456'){nodes.get('admin-setup-pin').value=code;nodes.get('admin-confirm-pin').value=code;
    await nodes.get('admin-pin-enable').fire('click');
    // PBKDF2 is intentionally expensive; wait for actual completion, not a fixed 10ms.
    for(let attempt=0;attempt<60&&!stored.size;attempt++)
      await new Promise(resolve=>setTimeout(resolve,25));
    assert.ok(stored.size,'PIN enrollment must persist a salted verifier');
  },
  async submitPin(code){nodes.get('admin-lock-pin').value=code;await nodes.get('admin-lock-pin-form').fire('submit');}
 };
}
test('PIN never stores a JWT and only locks an active OTP session',async()=>{
 const h=harness();let revalidations=0;
 h.window.AdminQuickLock.onAuth('admin@example.test',async()=>{revalidations++;return true;});
 await h.setPin();
 const vault=JSON.stringify([...h.stored.values()]);
 assert.match(vault,/pin/);
 assert.doesNotMatch(vault,/accessToken|refreshToken|123456|password|otp/);
 assert.equal(h.node('admin-lock-screen').hidden,true);
 h.document.visibilityState='hidden';h.domListeners.visibilitychange();
 assert.equal(h.node('admin-lock-screen').hidden,false);
 await h.submitPin('123456');
 assert.equal(revalidations,1);
 assert.equal(h.node('admin-lock-screen').hidden,true);
});
test('wrong PIN is rate-limited locally; fallback requires full admin login',async()=>{
 const h=harness();
 h.window.AdminQuickLock.onAuth('admin@example.test',async()=>true);
 await h.setPin();
 h.window.AdminQuickLock.lock();
 for(let i=0;i<5;i++)await h.submitPin('000000');
 assert.equal(h.node('admin-lock-screen').hidden,false);
 assert.match(h.node('admin-lock-message').textContent,/15 دقيقة/);
 await h.submitPin('123456');
 assert.equal(h.node('admin-lock-screen').hidden,false);
 assert.match(h.node('admin-lock-message').textContent,/محاولات كثيرة/);
 let event=false;
 h.window.dispatchEvent=()=>{event=true;};
 await h.node('admin-password-unlock').fire('click');
 assert.equal(event,true);
});
test('a different admin account cannot reuse the previous lock config',async()=>{
 const h=harness();
 h.window.AdminQuickLock.onAuth('admin@example.test',async()=>true);await h.setPin();
 h.window.AdminQuickLock.offAuth();
 h.window.AdminQuickLock.onAuth('different@example.test',async()=>true);
 assert.match(h.node('admin-quick-state').textContent,/غير مفعّل/);
 assert.equal(h.node('admin-lock-screen').hidden,true);
});
test('the Admin quick lock never persists credential secrets or requests biometric auth automatically',()=>{
 assert.doesNotMatch(script,/localStorage\.(?:setItem|put)\([^\n]*(?:accessToken|refreshToken)/);
 assert.doesNotMatch(script,/indexedDB|sessionStorage/);
 assert.match(script,/verifyFace\(profile\.face,start,forAccount\)/);
 assert.match(script,/clientVerified\(response\.clientDataJSON,'webauthn\.get'/);
 assert.match(script,/crypto\.subtle\.verify/);
 assert.match(script,/navigator\.credentials\.create/);
 assert.match(script,/navigator\.credentials\.get/);
});
