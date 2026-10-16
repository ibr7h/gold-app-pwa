import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

// Dependency-free mocked browser exercising the *actual* production Admin UI,
// including mandatory password+email OTP, with no network access or credentials.
class FakeNode {
  constructor(tag='div'){
    this.tagName=tag;this.children=[];this._text='';this.value='';this.disabled=false;
    this.hidden=false;this.open=false;this.className='';this.dataset={};this.handlers={};
    this.attributes={};this.checked=false;this.classList={
      add:()=>{},remove:()=>{},toggle:()=>{},
    };
  }
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('');}
  append(...items){for(const item of items)this.appendChild(item);}
  appendChild(node){this.children.push(node);return node;}
  replaceChildren(...items){this.children=[];this._text='';this.append(...items);}
  setAttribute(key,val){this.attributes[key]=String(val);}
  removeAttribute(key){delete this.attributes[key];}
  addEventListener(type,handler){(this.handlers[type]??=[]).push(handler);}
  async fire(type){for(const cb of this.handlers[type]||[])await cb({preventDefault(){}});}
  focus(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
}
function createFixture(items){
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  const nodes=new Map(ids.map(id=>[id,new FakeNode()]));
  nodes.get('email').value='admin@example.test';
  nodes.get('password').value='valid-test-password';
  nodes.get('otp-code').value='123456';
  const nav=[...html.matchAll(/data-panel="([^"]+)"/g)].map(m=>{
    const el=new FakeNode('button');el.dataset.panel=m[1];return el;
  });
  const panels=[...html.matchAll(/data-view="([^"]+)"/g)].map(m=>{
    const el=new FakeNode('section');el.dataset.view=m[1];return el;
  });
  const requests=[];
  const document={
    body:{dataset:{},classList:{add(){},remove(){}}},
    getElementById:id=>nodes.get(id),
    createElement:tag=>new FakeNode(tag),
    querySelectorAll:sel=>sel==='[data-panel]'?nav:sel==='[data-view]'?panels:[],
  };
  const fetch=async(url,options={})=>{
    const path=new URL(url).pathname;
    requests.push({path,method:options.method||'GET'});
    const payload=path==='/auth/admin/login'?{requiresVerification:true,challengeId:'test-challenge'}:
      path==='/auth/admin/verify'?{accessToken:'ephemeral-access',refreshToken:'ephemeral-refresh'}:
      path==='/auth/me'?{email:'admin@example.test',role:'admin'}:
      path==='/admin/users'?{items,total:items.length,page:1,pages:1}:
      path==='/admin/summary'?{users:2,merchants:1,admins:1,suspended:1}:
      path==='/admin/audit'?{items:[],total:0,page:1,pages:0}:
      path==='/prices/latest'?{buyPrice:200,currency:'SAR'}:{};
    return {ok:true,status:200,json:async()=>payload};
  };
  const context=createContext({
    document,window:{scrollTo(){},addEventListener(){}},navigator:{},fetch,
    AbortController,URLSearchParams,URL,Intl,Date,Number,String,Array,Boolean,
    setTimeout,clearTimeout,
  });
  new Script(source).runInContext(context);
  return {nodes,nav,requests};
}
async function settle(){for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));}
async function login(fixture){
  await fixture.nodes.get('login-form').fire('submit');
  fixture.nodes.get('otp-code').value='123456';
  await fixture.nodes.get('otp-form').fire('submit');
  await settle();
  const users=fixture.nav.find(item=>item.dataset.panel==='users');
  await users.fire('click');await settle();
}
function actionButtons(card){
  const controls=card.children.find(child=>child.className==='account-controls');
  assert.ok(controls,'Every account card should explicitly explain available actions');
  const row=controls.children.find(child=>child.className==='account-controls-row');
  assert.ok(row,'Every account card has two status action buttons');
  return {buttons:row.children,hint:controls.children.find(child=>child.className==='account-controls-hint')?.textContent,
    deletion:controls.children.find(child=>child.className==='account-delete-note')?.textContent};
}

test('a real Admin OTP session renders enabled suspend/reactivate controls with protected exceptions',async()=>{
  const fixture=createFixture([
    {id:'00000000-0000-4000-8000-000000000001',fullName:'Normal User',email:'user@example.test',role:'user',status:'active'},
    {id:'00000000-0000-4000-8000-000000000002',fullName:'Merchant',email:'merchant@example.test',role:'merchant',status:'suspended'},
    {id:'00000000-0000-4000-8000-000000000003',fullName:'Administrator',email:'admin@example.test',role:'admin',status:'active'},
    {id:'00000000-0000-4000-8000-000000000004',fullName:'Deleted',email:'deleted@example.test',role:'user',status:'deleted'},
  ]);
  await login(fixture);
  const cards=fixture.nodes.get('users-cards').children;
  assert.equal(cards.length,4);
  const active=actionButtons(cards[0]);
  assert.deepEqual(active.buttons.map(b=>b.textContent),['إيقاف','تنشيط']);
  assert.equal(active.buttons[0].disabled,false);
  assert.equal(active.buttons[1].disabled,true);
  const suspended=actionButtons(cards[1]);
  assert.equal(suspended.buttons[0].disabled,true);
  assert.equal(suspended.buttons[1].disabled,false);
  const admin=actionButtons(cards[2]);
  assert.ok(admin.buttons.every(b=>b.disabled));
  assert.match(admin.hint,/حساب إداري محمي/);
  const deleted=actionButtons(cards[3]);
  assert.ok(deleted.buttons.every(b=>b.disabled));
  assert.match(deleted.hint,/حساب محذوف/);
  assert.match(active.deletion,/الحذف النهائي غير متاح/);
  assert.equal(fixture.requests.some(r=>r.method==='PATCH'),false);
  await active.buttons[0].fire('click');
  assert.equal(fixture.nodes.get('status-dialog').open,true);
  assert.equal(fixture.requests.some(r=>r.method==='PATCH'),false,
    'Opening dialog must never mutate accounts without password, reason and confirmation');
});

test('actions remain visible even if backend normalizes status/roles differently',async()=>{
  const fixture=createFixture([{id:'00000000-0000-4000-8000-000000000005',
    fullName:'Test Normalization',email:'user@example.test',role:' USER ',status:'ACTIVE'}]);
  await login(fixture);
  const buttons=actionButtons(fixture.nodes.get('users-cards').children[0]).buttons;
  assert.equal(buttons[0].disabled,false);
});
