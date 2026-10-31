import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath,URL} from 'node:url';
import {biometricUnlockFeedback,BIOMETRIC_UNLOCK_MESSAGES as msg} from '../biometric-unlock-feedback';
import {localizeFeedback} from '../i18n-feedback';
const read=(p:string)=>readFileSync(fileURLToPath(new URL(p,import.meta.url)),'utf8');

describe('Face ID failure reporting without bypassing server authorization',()=>{
 it('distinguishes canceled WebAuthn from unsupported platform, timeouts, missing PRF and vault failure',()=>{
  expect(biometricUnlockFeedback({name:'NotAllowedError'})).toBe(msg.canceled);
  expect(biometricUnlockFeedback({name:'AbortError'})).toBe(msg.canceled);
  expect(biometricUnlockFeedback({name:'SecurityError'})).toBe(msg.device);
  expect(biometricUnlockFeedback({name:'NotSupportedError'})).toBe(msg.device);
  expect(biometricUnlockFeedback({name:'BiometricUnlockTimeoutError'})).toBe(msg.timeout);
  expect(biometricUnlockFeedback(new Error('تعذر الحصول على مفتاح التشفير من بصمة الجهاز.'))).toBe(msg.prf);
  expect(biometricUnlockFeedback(new Error('متصفحك يحتاج رمز الدخول أو كلمة المرور بعد إعادة فتح التطبيق.'))).toBe(msg.vault);
  expect(biometricUnlockFeedback({name:'OperationError'},'vault')).toBe(msg.vault);
  expect(biometricUnlockFeedback(new Error('Unexpected API response'),'server')).toBe(msg.server);
 });
 it('explains the server vs offline vs replaced session, never claiming a successful unlock',()=>{
  expect(biometricUnlockFeedback({status:401,message:'Device grant revoked'})).toBe(msg.expired);
  expect(biometricUnlockFeedback({status:401,message:'Session replaced by a sign-in on another device'})).toBe(msg.replaced);
  expect(biometricUnlockFeedback({status:503})).toBe(msg.offline);
  expect(biometricUnlockFeedback({message:'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.'})).toBe(msg.offline);
 });
 it('does not leak server exception strings, token fragments or identifiers',()=>{
  const token='private-access-token-value';
  const result=biometricUnlockFeedback(new Error(token));
  expect(result).toBe(msg.fallback);
  expect(result).not.toContain(token);
 });
 it('provides reviewed translations instead of generic language fallback',()=>{
  for(const message of [msg.canceled,msg.device,msg.prf,msg.vault,msg.expired,msg.server,msg.offline,msg.timeout,msg.fallback]){
   expect(localizeFeedback(message,'en')).toMatch(/[A-Za-z]/);
   expect(localizeFeedback(message,'fr')).toMatch(/[A-Za-zÀ-ÿ]/);
   expect(localizeFeedback(message,'en')).not.toBe('Unable to complete the request. Please try again.');
   expect(localizeFeedback(message,'fr')).not.toBe('Impossible de traiter la demande. Veuillez réessayer.');
  }
 });
 it('shows the AuthContext reason before the generic QuickLockScreen fallback',()=>{
  const screen=read('../QuickLockScreen.tsx');
  const auth=read('../../contexts/AuthContext.web.tsx');
  const local=read('../local-biometric.ts');
  expect(screen).toContain('localizeFeedback(remoteError||localError,language)');
  expect(auth).toContain('setError(biometricUnlockFeedback(e,phase))');
  expect(auth).toContain('verifyQuickUnlock(c.accountId,tokens,()=>attempt===version.current)');
  expect(local).toContain("if(c.prfSalt&&!secret)throw new Error('تعذر الحصول على مفتاح التشفير من بصمة الجهاز.')");
 });
});
