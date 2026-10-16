import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

// Guard rails for Admin-only releases: prevent a reinstall/update prompt in User
// from a role-specific commit and prevent cross-app SW/cache collisions.
const root=new URL('../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const adminManifest=JSON.parse(read('apps/admin/public/manifest.webmanifest'));
const adminSw=read('apps/admin/public/sw.js');
const adminUpdater=read('apps/admin/public/admin-update-client.js');
const adminQuick=read('apps/admin/public/admin-quick-unlock.js');
const userSw=read('apps/user/scripts/user-service-worker.js');
const userUpdater=read('apps/user/scripts/user-update-client.js');
const deploy=read('.github/workflows/deploy-pages.yml');
const verify=read('scripts/verify-published.mjs');

test('Admin and User installation identities and SW scopes cannot overlap',()=>{
  assert.equal(adminManifest.id,'/gold-app-pwa/admin/');
  assert.equal(adminManifest.scope,'/gold-app-pwa/admin/');
  assert.equal(adminManifest.start_url,'/gold-app-pwa/admin/');
  assert.match(deploy,/"id": "\/gold-app-pwa\/full\/"/);
  assert.match(deploy,/"scope": "\/gold-app-pwa\/full\/"/);
  assert.match(adminSw,/const BASE='\/gold-app-pwa\/admin\/'/);
  assert.match(userSw,/const BASE = '\/gold-app-pwa\/full\/'/);
  assert.match(adminUpdater,/scope:\s*BASE/);
  assert.match(userUpdater,/scope:\s*BASE/);
});

test('Admin update and cache maintenance are never global to the origin',()=>{
  assert.match(adminSw,/const PREFIX='dhahabk-admin-'/);
  assert.match(userSw,/const PREFIX = 'dhahabi-full-'/);
  assert.match(adminSw,/key\.startsWith\(PREFIX\)/);
  assert.match(userSw,/key\.startsWith\(PREFIX\)/);
  for(const script of [adminUpdater,userUpdater,adminQuick]){
    assert.doesNotMatch(script,/localStorage\.clear\s*\(|sessionStorage\.clear\s*\(|indexedDB\.deleteDatabase\s*\(/);
  }
  assert.match(adminQuick,/const STORAGE='dhahabk_admin_secure_v1'/);
  assert.doesNotMatch(userUpdater,/dhahabk_admin_secure_v1/);
});

test('Admin-only repository commits do not change the User release fingerprint',()=>{
  assert.match(deploy,/user_commit="\$\(git rev-list -1 HEAD -- apps\/user\/ scripts\/verify-user-export\.py 'gold-app 17 apr 15-19 adimin icon\.zip'\)"/);
  assert.match(deploy,/printf 'USER_BUILD_SHA=%s\\n'/);
  assert.match(deploy,/os\.environ\['USER_BUILD_SHA'\]/);
  assert.match(deploy,/\$\{USER_BUILD_SHA\}/);
  assert.match(deploy,/full-\$\{USER_BUILD_SHA\}/);
  assert.doesNotMatch(deploy,/GITHUB_SHA::8|GITHUB_SHA:0:8|os\.environ\['GITHUB_SHA'\]/);
  assert.match(verify,/process\.env\.USER_BUILD_SHA/);
  assert.doesNotMatch(verify,/process\.env\.GITHUB_SHA/);
});
