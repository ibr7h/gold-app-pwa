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
  assert.match(sw, /dhahabk-admin-/);
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
 assert.match(js,/\['user','merchant'\]\.includes\(normalizedRole\)/);
 assert.match(js,/adminPassword:/);
 assert.match(html,/id="status-dialog"/);
 assert.match(html,/id="status-reason"/);
 assert.match(html,/id="status-admin-password"/);
 assert.match(html,/id="status-confirm"/);
 assert.match(html,/id="audit-list"/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|innerHTML|insertAdjacentHTML/);
});

test('all accounts expose explicit action visibility and protected statuses',()=>{
 assert.match(js,/account-controls-row/);
 assert.match(js,/button\.disabled=!canManage/);
 assert.match(js,/\['user','merchant'\]\.includes\(normalizedRole\)/);
 assert.match(js,/normalizedRole==='admin'/);
 assert.match(js,/normalizedStatus==='deleted'/);
 assert.match(js,/إيقاف/);
 assert.match(js,/تنشيط/);
 assert.match(js,/الحذف النهائي غير متاح/);
 assert.match(html,/إصدار الإدارة: __ADMIN_DISPLAY_VERSION__/);
});
test('iPhone cannot be stuck on stale cache-first admin.js after update',()=>{
 assert.match(html,/app\.js\?admin-__ADMIN_BUILD_SHA__/);
 assert.match(html,/styles\.css\?admin-__ADMIN_BUILD_SHA__/);
 assert.match(sw,/dhahabk-admin-/);
 assert.match(sw,/cache:'no-store'/);
 assert.doesNotMatch(js,/serviceWorker\.register/);
 assert.match(html,/id="admin-check-update-login"/);
 assert.match(html,/id="admin-check-update-settings"/);
 assert.ok(sw.includes("BASE+'app.js?admin-__ADMIN_BUILD_SHA__'"));
});

test('admin email field reserves the physical left icon space on iPhone RTL layout',()=>{
  assert.match(html, /<label[^>]*for="email">البريد الإلكتروني الإداري<\/label>/);
  assert.match(html, /id="email"[^>]*type="email"[^>]*dir="ltr"/);
  assert.match(html, /id="email"[^>]*autocapitalize="off"/);
  assert.match(css, /\.input-with-icon>\.form-input\{padding-left:50px;padding-right:16px\}/);
  assert.match(css, /#email\{direction:ltr;text-align:left\}/);
  assert.match(css, /#password\{text-align:right\}/);
  assert.match(css, /pointer-events:none/);
  assert.doesNotMatch(css, /\.input-with-icon>\.form-input\{padding-inline-end:/);
});

test('Admin splash follows UI.zip royal visual language and never bypasses login',()=>{
  assert.match(html,/id="admin-splash"/);
  assert.match(html,/class="admin-splash-inner"/);
  assert.match(html,/assets\/icon\.svg/);
  const splash=html.match(/<section id="admin-splash"[\s\S]*?<\/section>/)?.[0];
  assert.ok(splash,'Splash must be present before the login form');
  assert.match(splash,/<svg[^>]*viewBox="0 0 24 24"/);
  assert.equal((splash.match(/<svg /g)||[]).length,2,'Crown and gem should render without a network icon font');
  assert.doesNotMatch(splash,/<a\b|<button\b|دخول التطبيق|تخطي كزائر/);
  assert.match(html,/بوابة الإدارة المركزية/);
  assert.ok(css.includes('radial-gradient(circle at center,#072e5c 0%,#0c1626 100%)'));
  assert.ok(html.includes('<style id="admin-first-paint">'));
  assert.ok(html.indexOf('id="admin-first-paint"') < html.indexOf('href="styles.css?admin-__ADMIN_BUILD_SHA__"'));
  assert.ok(html.includes('background:#0c1626'));
  assert.ok(html.includes('@keyframes admin-splash-dismiss'));
  assert.ok(!css.includes('@import url('));
  assert.ok(html.includes(`all.min.css" media="print" onload="this.media='all'"`));
  assert.ok(html.includes(`fonts.googleapis.com/css2`));
  assert.match(css,/@keyframes admin-splash-dismiss/);
  assert.match(css,/animation:admin-splash-dismiss 3\.2s/);
  assert.match(css,/visibility:hidden;pointer-events:none/);
  assert.match(css,/@keyframes admin-splash-dismiss-reduced/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css,/animation:none;display:none/);
  assert.doesNotMatch(html,/تخطي كزائر|href="02_login.html"/);
  assert.match(js,/\/auth\/admin\/verify/);
  assert.match(sw,/dhahabk-admin-/);
  assert.match(html,/app\.js\?admin-__ADMIN_BUILD_SHA__/);
  assert.match(html,/styles\.css\?admin-__ADMIN_BUILD_SHA__/);
});

test('Admin version metadata and updater match approved User PWA update mechanism',()=>{
 const updater = read('admin-update-client.js');
 const meta = JSON.parse(read('version.json'));
 assert.equal(meta.version,'admin-__ADMIN_BUILD_SHA__');
 assert.equal(meta.displayVersion,'__ADMIN_DISPLAY_VERSION__');
 assert.match(html,/id="admin-update-notice"/);
 assert.match(html,/admin-update-client\.js\?admin-__ADMIN_BUILD_SHA__/);
 assert.match(html,/id="admin-check-update-login"/);
 assert.match(html,/id="admin-check-update-settings"/);
 assert.equal((html.match(/__ADMIN_DISPLAY_VERSION__/g)||[]).length,3);
 assert.match(updater,/version\.json\?t=/);
 assert.match(updater,/cache:'no-store'/);
 assert.match(updater,/updateViaCache: 'none'/);
 assert.match(updater,/visibilitychange/);
 assert.match(updater,/controllerchange/);
 assert.match(updater,/SKIP_WAITING/);
 assert.match(updater,/تحديث الآن/);
 assert.match(updater,/لاحقًا/);
 assert.match(sw,/event\.data\?\.type==='SKIP_WAITING'/);
 assert.match(sw,/const BASE='\/gold-app-pwa\/admin\/'/);
 assert.match(sw,/key\.startsWith\(PREFIX\)/);
 assert.match(sw,/version\.json/);
 assert.match(sw,/cache:'no-store'/);
 const install=sw.split("self.addEventListener('install'")[1].split("self.addEventListener('activate'")[0];
 assert.doesNotMatch(install,/skipWaiting/);
 assert.doesNotMatch(updater,/localStorage\.(?:clear|removeItem)|indexedDB\.deleteDatabase/);
 assert.doesNotMatch(sw,/gold-app-pwa\/trader\/|gold-app-pwa\/full\//);
});
