import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../public/', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const html = read('index.html');
const js = read('app.js');
const css = read('styles.css');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

test('admin bundle parses and every referenced element exists once', () => {
  assert.doesNotThrow(() => new Script(js));
  const ids = Array.from(html.matchAll(/id="([^"]+)"/g), match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of js.matchAll(/byId\('([a-z-]+)'\)/g)) {
    assert.ok(ids.includes(id), 'Missing element: ' + id);
  }
});

test('admin scope and UI are isolated from customer and trader', () => {
  assert.equal(manifest.scope, '/gold-app-pwa/admin/');
  assert.equal(manifest.start_url, '/gold-app-pwa/admin/');
  assert.match(sw, /dhahabk-admin-controls-v7/);
  assert.match(html, /ذهبك للإدارة/);
  assert.match(css, /#001F3F/);
});

test('admin bearer tokens remain in memory and user-supplied rows use textContent', () => {
  assert.doesNotMatch(js, /localStorage|sessionStorage|innerHTML|insertAdjacentHTML/);
  assert.match(js, /user\.role\s*!==\s*'admin'/);
  assert.match(js, /td\.textContent/);
});

test('no fabricated admin metrics or unrelated merchant/price controls', () => {
  assert.match(js, /\/admin\/summary/);
  assert.match(js, /\/admin\/users/);
  assert.doesNotMatch(js, /\/admin\/(?:approve|suspend|delete|invite)/);
  assert.match(html, /بانتظار الخادم/);
});

test('original UI.zip admin visual baseline and navigation are present', () => {
  for (const label of ['بوابة الإدارة المركزية', 'إدارة المستخدمين والصلاحيات', 'رموز دعوة التجار المعتمدين', 'تحليلات وإحصائيات النظام', 'إعدادات المنصة والربط البرمجي']) {
    assert.ok(html.includes(label), 'Missing original UI admin screen label: ' + label);
  }
  assert.match(css, /#0c1626/);
  assert.match(html, /class="bottom-nav admin-nav"/);
  assert.match(html, /fa-solid fa-shield-halved/);
  assert.equal((html.match(/class="nav-item"/g)||[]).length, 4); // 5 tabs; overview starts selected
  assert.doesNotMatch(html, /admin2026|admin@gold\.app|GOLD2026|goldapi-[0-9a-z]+|tRPC|SSL 256-bit/i);
});
test('no active actions without admin-only server endpoints', () => {
  assert.match(html, /توليد وتفعيل الرمز<\/button>/);
  assert.match(html, /توليد وتفعيل الرمز<\/button>/);
  assert.match(html, /disabled><i class="fa-solid fa-key"/);
  assert.doesNotMatch(html, /onclick=|onerror=|<script>.*function handleAdminLogin/s);
});

test('admin login strictly requires email OTP and never uses the generic login endpoint',()=>{
  assert.match(html,/id="otp-view"/);
  assert.match(html,/id="otp-code"/);
  assert.match(html,/autocomplete="one-time-code"/);
  assert.match(js,/\/auth\/admin\/login/);
  assert.match(js,/\/auth\/admin\/verify/);
  assert.match(js,/\/auth\/admin\/resend/);
  assert.doesNotMatch(js,/request\('\/auth\/login'/);
  assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage/);
});

test('admin OTP errors preserve the backend error envelope instead of generic failure',()=>{
  assert.match(js,/result\?\.error \|\| result/);
  assert.match(js,/payload\?\.message/);
  assert.match(js,/رمز الحالة/);
  assert.match(js,/\/auth\/admin\/verify/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|innerHTML/);
});

test('real account metrics identify user accounts rather than claiming all roles',()=>{
  assert.match(html,/حسابات المستخدمين/);
  assert.doesNotMatch(html,/إجمالي المستخدمين/);
  assert.match(js,/\/admin\/summary/);
  assert.match(js,/\/admin\/users\?/);
});

test('status action and audit are limited to Admin and require explicit confirmation',()=>{
 assert.match(js,/\/admin\/users\/'\+encodeURIComponent\(target\.id\)\+'\/status'/);
 assert.match(js,/\/admin\/audit\?page=/);
 assert.match(js,/\['user','merchant'\]\.includes\(item\.role\)/);
 assert.match(js,/adminPassword:/);
 assert.match(html,/id="status-dialog"/);
 assert.match(html,/id="status-reason"/);
 assert.match(html,/id="status-admin-password"/);
 assert.match(html,/id="status-confirm"/);
 assert.match(html,/id="audit-list"/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|innerHTML|insertAdjacentHTML/);
});
