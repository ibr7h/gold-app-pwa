import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {deviceLanguageForLocales} from '../auth-device-language';
import {translateUiText} from '../i18n-messages';

const file=(relative:string)=>readFileSync(fileURLToPath(new URL(relative,import.meta.url).href),'utf8');

describe('iPhone sign-in and registration follow device language',()=>{
 it('supports device Arabic, English and French including regional codes',()=>{
  expect(deviceLanguageForLocales(['ar-SA','en-US'])).toBe('ar');
  expect(deviceLanguageForLocales(['AR_sa'])).toBe('ar');
  expect(deviceLanguageForLocales(['fr-FR','en-US'])).toBe('fr');
  expect(deviceLanguageForLocales(['fr-CA'])).toBe('fr');
  expect(deviceLanguageForLocales(['en-GB','fr-FR'])).toBe('en');
 });
 it('uses English for other languages, not Arabic or a secondary locale',()=>{
  expect(deviceLanguageForLocales(['de-DE','ar-SA'])).toBe('en');
  expect(deviceLanguageForLocales(['es-MX','fr-FR'])).toBe('en');
  expect(deviceLanguageForLocales(['zh-Hans-CN'])).toBe('en');
  expect(deviceLanguageForLocales(['', 'fr-FR'])).toBe('fr');
  expect(deviceLanguageForLocales([])).toBe('ar');
 });
 it('uses navigator preferred locale without depending on stored app preference',()=>{
  const src=file('../auth-device-language.ts');
  expect(src).toContain('navigator.languages');
  expect(src).toContain('navigator.language');
  expect(src).not.toContain('localStorage');
  expect(src).not.toContain('storedLanguage');
 });
 it('isolates device-based auth locale from persisted signed-in preference',()=>{
  const provider=file('../i18n.tsx');
  const ws=file('../UserWorkspace.tsx');
  expect(provider).toContain("mode='app'");
  expect(provider).toContain("mode==='device'?deviceLanguage():mode==='auth'?authLanguage():storedLanguage()");
  expect(provider).toContain("mode==='auth'?AUTH_LANGUAGE_KEY:LANGUAGE_KEY");
  expect(provider).toContain("if(mode==='device'||");
  expect(provider).toContain("if(mode!=='app')return;");
  expect(ws).toContain("const mode=user||lockedAccount?'app':'auth';");
  expect(ws).toContain('<LanguageProvider key={mode} mode={mode}><LocalizedUserWorkspace/></LanguageProvider>');
 });
 it('protects directly entered /login and /register routes',()=>{
  expect(file('../../app/login.web.tsx')).toContain('<LanguageProvider mode="auth"><AuthForm/></LanguageProvider>');
  expect(file('../../app/register.web.tsx')).toContain('<LanguageProvider mode="auth"><AuthForm register/></LanguageProvider>');
 });
 it('honors correct locale and direction for login, registration and guest views',()=>{
  const form=file('../AuthForm.tsx');
  const css=file('../user.css');
  expect(form).toContain("import {useLanguage} from './i18n';");
  expect(form).toContain('<AuthLanguageSwitcher/>');
  const picker=file('../AuthLanguageSwitcher.tsx');
  expect(picker).toContain("setLanguage(option.value)");
  expect(picker).toContain("value:'ar'");
  expect(picker).toContain("value:'en'");
  expect(picker).toContain("value:'fr'");
  expect(form.match(/dir=\{direction\} lang=\{language\}/g)?.length).toBe(3);
  expect(form).not.toContain('dir="rtl" lang="ar"');
  expect(css).toContain('.gold-auth[dir="ltr"] .mockup-auth-card .form-label');
  expect(css).toContain('.gold-auth[dir="ltr"] .mockup-input-wrap .form-input:not([dir="ltr"])');
  expect(css).toContain('.gold-auth .mockup-eye-btn{');
 });
 it('has English and French translations for auth headings, fields and errors',()=>{
  const phrases=[
   'تطبيق ذهبي','إنشاء حساب مستخدم جديد','الاسم الكامل','البريد الإلكتروني',
   'كلمة المرور','تأكيد كلمة المرور','كلمتا المرور غير متطابقتين.',
   'جارٍ إنشاء الحساب…','تسجيل الدخول','دخول المستثمرين ومتابعي الأسعار',
   'البريد الإلكتروني أو رقم الجوال','إظهار كلمة المرور','إخفاء كلمة المرور',
   'نسيت كلمة المرور؟','المتابعة كزائر (تصفح الأسعار فقط)',
   'العودة لتسجيل الدخول','تعذر تحميل الأسعار الآن.'
  ];
  for(const lang of ['en','fr'] as const){
   for(const p of phrases)expect(translateUiText(p,lang),p).not.toMatch(/[\u0600-\u06FF]/);
  }
 });
});
