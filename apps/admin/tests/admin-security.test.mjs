import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Script,runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const html=read('index.html'),css=read('styles.css'),app=read('app.js'),worker=read('sw.js');
const quick=read('admin-quick-unlock.js'),push=read('admin-push.js');

test('Admin secure unlock and Push scripts parse and are independently versioned',()=>{
 for(const [name,s] of [['quick',quick],['push',push],['worker',worker],['app',app]]){
  assert.doesNotThrow(()=>new Script(s),name+' should parse');
 }
 assert.match(html,/admin-quick-unlock\.js\?admin-__ADMIN_BUILD_SHA__/);
 assert.match(html,/admin-push\.js\?admin-__ADMIN_BUILD_SHA__/);
 assert.match(worker,/admin-quick-unlock\.js\?admin-__ADMIN_BUILD_SHA__/);
 assert.match(worker,/admin-push\.js\?admin-__ADMIN_BUILD_SHA__/);
});

test('Admin Face ID and PIN never bypass admin email OTP, and refresh is server-verified',()=>{
 assert.match(app,/\/auth\/admin\/login/);
 assert.match(app,/\/auth\/admin\/verify/);
 assert.match(app,/\/auth\/refresh/);
 assert.match(app,/\/auth\/me/);
 assert.match(app,/user\?\.role!=='admin'/);
 assert.match(quick,/webauthn\.create/);
 assert.match(quick,/webauthn\.get/);
 assert.match(quick,/getClientExtensionResults/);
 assert.match(quick,/userVerification:'required'/);
 assert.match(quick,/PBKDF2/);
 assert.match(quick,/AES-GCM/);
 assert.match(quick,/310000/);
 assert.match(quick,/MAX_FAILURES=5/);
 assert.match(quick,/WAIT=15\*60\*1000/);
 assert.match(quick,/window\.DhahabkAdminBridge\.resume/);
 assert.match(quick,/location\.origin/);
 assert.match(quick,/document\.addEventListener\('visibilitychange'/);
 assert.match(html,/id="quick-use-password"/);
 assert.doesNotMatch(quick,/admin2026|passwordHash|innerHTML|eval\(/);
});

test('Admin quick unlock UI follows navy gold red identity and does not show visitor entry',()=>{
 for(const id of ['admin-quick-screen','quick-pin-form','quick-use-face',
  'quick-set-pin-form','quick-enable-pin','quick-enable-face','quick-remove']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(css,/#001F3F/);
 assert.match(css,/#D4AF37/);
 assert.match(css,/#b91c1c/);
 assert.doesNotMatch(html,/تخطي كزائر/);
});

test('Admin push authorization is separate from User, including closed-app notification click',()=>{
 assert.match(app,/\/admin\/push\//);
 assert.match(push,/\/admin\/push\/config/);
 assert.match(push,/\/admin\/push\/subscriptions/);
 assert.match(push,/\/admin\/push\/test/);
 assert.match(push,/Notification\.requestPermission/);
 assert.match(push,/getSubscription/);
 assert.match(push,/pushManager\.subscribe/);
 assert.match(push,/display-mode: standalone/);
 assert.match(worker,/addEventListener\('push'/);
 assert.match(worker,/addEventListener\('notificationclick'/);
 assert.match(worker,/registration\.showNotification/);
 assert.match(worker,/clients\.openWindow/);
 assert.match(worker,/const BASE='\/gold-app-pwa\/admin\/'/);
 assert.doesNotMatch(push,/auth\('\/push\//);
});

test('Locked-screen push display never uses server-supplied sensitive title, body or URL',async()=>{
 const handlers={};
 let notification=null;
 const env={
  self:{
   location:{origin:'https://ibr7h.github.io'},
   addEventListener:(type,cb)=>{handlers[type]=cb;},
   registration:{showNotification:async(title,options)=>{notification={title,options};}},
   clients:{matchAll:async()=>[],openWindow:async()=>{}},
  },
  caches:{open:async()=>({addAll:async()=>{}}),keys:async()=>[]},
  fetch:async()=>({ok:true}),URL,Promise,
 };
 runInNewContext(worker.replaceAll('__ADMIN_BUILD_SHA__','abcdef12'),env);
 let pending;
 handlers.push({data:{json:()=>({title:'SECRET',body:'Sensitive account details',url:'https://attacker.test',tag:'sample'})},waitUntil:p=>{pending=p;}});
 await pending;
 assert.equal(notification.title,'ذهبك | تنبيه إداري');
 assert.doesNotMatch(notification.options.body,/SECRET|Sensitive/);
 assert.equal(notification.options.data.url,'/gold-app-pwa/admin/');
});
