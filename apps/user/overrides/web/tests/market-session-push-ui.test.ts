import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {describe,it,expect} from 'vitest';
import {translateUiText} from '../i18n-messages';
const source=(p:string)=>readFileSync(fileURLToPath(new URL('../'+p,import.meta.url)),'utf8');
describe('Market opening and closing Push preferences',()=>{
 it('requires an existing Push device subscription and explicit separate consent',()=>{
  const c=source('push-client.ts'),ui=source('NotificationSettings.tsx');
  expect(c).toContain('export async function setMarketSessionPushEnabled');
  expect(c).toContain("if(!sub)throw new Error");
  expect(c).toContain("marketSessionEnabled:enabled");
  expect(ui).toContain("aria-pressed={!!state?.marketSessionEnabled}");
  expect(ui).toContain("setMarketSessionPushEnabled(!state?.marketSessionEnabled)");
  expect(ui).toContain("enabled&&<div className=\"dh-market-session-settings\"");
  expect(c).not.toContain('Notification.requestPermission()\n const sub=await currentSubscription(false)');
 });
 it('synchronizes the language and price display currency without requesting extra permission',()=>{
  const c=source('push-client.ts'),w=source('UserWorkspace.tsx');
  expect(w).toContain('syncMarketPushPreferences(language,priceCurrency)');
  expect(c).toContain('marketSessionEnabled:enabled');
  expect(c).toContain('preferredLanguage:language,displayCurrency:currency');
  expect(c).toContain("Notification.permission!=='granted'");
 });
 it('all new Push market preferences are fully translated into three languages',()=>{
  for(const key of ['تنبيهات افتتاح وإغلاق سوق الذهب','تفعيل تنبيهات السوق','إيقاف تنبيهات السوق',
    'تنبيهات السوق مفعّلة لهذا الجهاز.','تنبيهات السوق متوقفة لهذا الجهاز.',
    'يتطلب استقبال التنبيه موافقة النظام واشتراك Push والاتصال بالإنترنت.']){
    expect(translateUiText(key,'en'),key).not.toBe(key);
    expect(translateUiText(key,'fr'),key).not.toBe(key);
  }
 });
 it('service worker preserves the payload language and routes to prices on either origin',()=>{
  const worker=readFileSync(fileURLToPath(new URL('../../scripts/user-service-worker.js',import.meta.url)),'utf8');
  expect(worker).toContain("const lang=['ar','en','fr'].includes(payload.lang)?payload.lang:'ar'");
  expect(worker).toContain("lang,dir:lang==='ar'?'rtl':'ltr'");
  expect(worker).toContain("requested.startsWith('#')?BASE+requested:requested");
  expect(worker).toContain("url.pathname.startsWith(BASE)");
 });
});
