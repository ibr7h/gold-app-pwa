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
  assert.match(sw, /dhahabk-admin-v2/);
  assert.match(html, /ذهبك للإدارة/);
  assert.match(css, /#001F3F/);
});

test('admin bearer tokens remain in memory and user-supplied rows use textContent', () => {
  assert.doesNotMatch(js, /localStorage|sessionStorage|innerHTML|insertAdjacentHTML/);
  assert.match(js, /user\.role\s*!==\s*'admin'/);
  assert.match(js, /td\.textContent/);
});

test('no fabricated admin metrics or write controls in stage one', () => {
  assert.match(js, /\/admin\/summary/);
  assert.match(js, /\/admin\/users/);
  assert.doesNotMatch(js, /\/admin\/(?:approve|suspend|delete|invite)/);
  assert.match(html, /بانتظار الخادم/);
});
