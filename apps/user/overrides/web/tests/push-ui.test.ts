import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const source=(name:string)=>readFileSync(new URL('../'+name,import.meta.url).pathname,'utf8');
describe('User Push UX guards',()=>{
 it('shows backend, permission and subscription status separately',()=>{
  const s=source('NotificationSettings.tsx');
  expect(s).toContain('إذن المتصفح');
  expect(s).toContain('اشتراك المتصفح');
  expect(s).toContain('الاشتراك لدى الخادم');
  expect(s).toContain('خدمة الإرسال');
  expect(s).toContain('آخر قبول لدى مزود Push');
  expect(s).toContain('هذا لا يؤكد ظهوره');
 });
 it('does not prompt permission on mount and requires a real button interaction',()=>{
  const c=source('push-client.ts');
  expect(c).toContain('await Notification.requestPermission()');
  expect(c).toContain("serverRegistered:!!server?.registered");
  expect(c).toContain("api('/push/subscriptions'");
  expect(c).toContain("api<{accepted:boolean");
  expect(c).toContain('revokePushBeforeLogout');
  expect(source('UserWorkspace.tsx')).toContain('onClick={signOut}');
 });
 it('supports actual remote Push messages and scoped click navigation',()=>{
  const sw=readFileSync(join(process.env.GITHUB_WORKSPACE||process.cwd(),'apps/user/scripts/user-service-worker.js'),'utf8');
  expect(sw).toContain("self.addEventListener('push'");
  expect(sw).toContain('self.registration.showNotification');
  expect(sw).toContain("self.addEventListener('notificationclick'");
  expect(sw).toContain("url.pathname.startsWith(BASE)");
 });
});
