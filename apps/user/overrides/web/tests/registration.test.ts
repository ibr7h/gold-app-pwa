import {beforeEach,describe,it,expect,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>memory.get(k)||null,setItem:async(k:string,v:string)=>{memory.set(k,v);},removeItem:async(k:string)=>{memory.delete(k);},multiRemove:async(keys:string[])=>keys.forEach(k=>memory.delete(k))}}));
import {activeSessionTokens,clearSession,errorMessage,ApiError,authenticate} from '../api';
import {beginRegistration,normalizeRegistrationPhone,registrationChallenge,registrationDigits,resendRegistration,registrationAvailable} from '../registration';
import {countryFlag,countryDisplayName,internationalRegistrationPhone,PHONE_COUNTRIES} from '../phone-country';
import {LEGAL_REVIEW_VERSION,LEGAL_TERMS_VERSION,LEGAL_PUBLICATION_APPROVED,LEGAL_DOMAIN,LEGAL_EMAILS,legalSectionCount,legalSectionTitles} from '../RegistrationLegalDocuments';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const challenge={registrationId:'8dea93b5-aa3e-4481-b81f-2fd688a70a8f',email:'new@example.test',channel:'email',expiresIn:599,resendAfterSeconds:59};
const response=(body:unknown,status=201)=>new Response(JSON.stringify(body),{status});
beforeEach(async()=>{vi.restoreAllMocks();await clearSession();});
describe('User phone and email registration',()=>{
 it('normalizes Saudi/international phones and Arabic/Persian digits without guessing missing countries',()=>{
  for(const phone of ['0501234567','501234567','٥٠١٢٣٤٥٦٧','٠٥٠١٢٣٤٥٦٧','۰۵۰۱۲۳۴۵۶۷','+966 50 123 4567','00966501234567'])expect(normalizeRegistrationPhone(phone)).toBe('+966501234567');
  expect(normalizeRegistrationPhone('+44 (7700) 900-123')).toBe('+447700900123');
  for(const phone of ['',undefined,'50123456','+966112345678','+0123456789','+9665012345678','x'.repeat(41)])expect(normalizeRegistrationPhone(phone)).toBeNull();
 });
 it('accepts nine-digit Saudi phone inputs and submits the correct international value',async()=>{
  const fetcher=vi.fn(async (_url:string,_options:RequestInit)=>response(challenge));vi.stubGlobal('fetch',fetcher);
  await beginRegistration('User','new@example.test','Password-fixture!','501234567');
  const body=JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body.phone).toBe('+966501234567');
 });
 it('does not enable legal acceptance against an older backend without version recording',async()=>{
  const good={enabled:true,channel:'email',codeLength:6,legalTermsVersion:LEGAL_TERMS_VERSION};
  vi.stubGlobal('fetch',vi.fn(async()=>response({...good,legalTermsVersion:undefined},200)));
  expect(await registrationAvailable()).toBe(false);
  vi.stubGlobal('fetch',vi.fn(async()=>response(good,200)));
  expect(await registrationAvailable()).toBe(true);
 });
 it('does not call the backend for a missing/invalid mobile number',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  await expect(beginRegistration('User','new@example.test','Password-fixture!',undefined)).rejects.toThrow('رقم جوال');
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('submits normalized phone, awaits email verification and never persists credentials or OTP',async()=>{
  const fetcher=vi.fn(async(_url:string,_options:RequestInit)=>response(challenge));vi.stubGlobal('fetch',fetcher);
  const result=await beginRegistration(' User ','new@example.test','Password-fixture!','٠٥٠١٢٣٤٥٦٧');
  const body=JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body).toEqual({email:'new@example.test',password:'Password-fixture!',fullName:'User',phone:'+966501234567'});
  expect(result.registrationId).toBe(challenge.registrationId);
  expect(()=>activeSessionTokens()).toThrow();expect(memory.size).toBe(0);
 });
 it('sends the reviewed Terms revision only after an explicit user acknowledgement',async()=>{
  const fetcher=vi.fn(async(_url:string,_options:RequestInit)=>response(challenge));vi.stubGlobal('fetch',fetcher);
  await beginRegistration('Test customer','new@example.test','Password-fixture!','0501234567',{version:LEGAL_TERMS_VERSION,noticesAcknowledged:true});
  const body=JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body).toMatchObject({legalTermsVersion:'dhahabk-terms-2026-10-v1',legalNoticesAcknowledged:true});
  expect(body).not.toHaveProperty('consentToMarketing');
 });
 it('rejects a token or plaintext code in the pre-verification response',()=>{
  for(const key of ['code','accessToken','refreshToken'])expect(()=>registrationChallenge({...challenge,[key]:'invalid-exposure'})).toThrow();
  expect(()=>registrationChallenge({accessToken:'unverified-session',refreshToken:'unverified-refresh'})).toThrow();
 });
 it('validates registration nonce and countdowns rather than trusting malformed server state',()=>{
  expect(registrationChallenge(challenge,1000)).toMatchObject({expiresAt:600000,resendAt:60000});
  for(const data of [{...challenge,registrationId:'guessable'},{...challenge,expiresIn:Infinity},{...challenge,expiresIn:601},{...challenge,resendAfterSeconds:-1},{...challenge,channel:'sms'}])expect(()=>registrationChallenge(data)).toThrow();
 });
 it('takes the fresh nonce returned by a resend, without any stored session',async()=>{
  const next={...challenge,registrationId:'41a760f7-8b35-40fa-a981-7630247e2d04'};
  vi.stubGlobal('fetch',vi.fn(async()=>response(next)));
  expect((await resendRegistration(challenge.registrationId)).registrationId).toBe(next.registrationId);
  expect(memory.size).toBe(0);
 });
 it('translates the actual nested backend error envelope for duplicate phones and wrong codes',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response({success:false,error:{message:'Email or mobile number already exists'}},409)));
  try{await beginRegistration('User','new@example.test','Password-fixture!','0501234567');throw new Error('Expected rejection');}
  catch(error){expect(error).toBeInstanceOf(ApiError);expect(errorMessage(error)).toContain('رقم الجوال مسجل');}
  expect(errorMessage(new ApiError('Invalid or expired verification code',400))).toContain('انتهت صلاحيته');
 });
 it('cannot accept a verification token response after registration was cancelled',async()=>{
  let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>release=resolve)));
  const pending=authenticate('/auth/register/verify',{registrationId:challenge.registrationId,code:'123456'});
  await clearSession(false);release(response({accessToken:'cancelled-fixture',refreshToken:'cancelled-refresh-fixture'}));
  await expect(pending).rejects.toThrow();expect(()=>activeSessionTokens()).toThrow();expect(memory.size).toBe(0);
 });
 it('supports six-digit Arabic/Persian code input without adding a demo code',()=>{
  expect(registrationDigits('٠١٢٣٤٥')).toBe('012345');
  expect(registrationDigits('۰۱۲۳۴۵')).toBe('012345');
  expect(registrationDigits('123 456')).toBe('123456');
 });
});


describe('Registration legal consent before email verification',()=>{
 it('does not enable sending the registration OTP without affirmative consent',()=>{
  const form=readFileSync(fileURLToPath(new URL('../AuthForm.tsx',import.meta.url).href),'utf8');
  expect(form).toContain('const [consentAccepted,setConsentAccepted]=useState(false)');
  expect(form).toContain('if(register&&!consentAccepted)');
  expect(form).toContain('disabled={isLoading||registrationEnabled!==true||!consentAccepted}');
  expect(form).toContain('id="dh-register-consent"');
  expect(form).toContain('type="checkbox"');
  expect(form).toContain('required aria-describedby="dh-register-consent-note"');
  expect(form).toContain("setConsentAccepted(event.target.checked)");
  expect(form.indexOf('if(register&&!consentAccepted)')).toBeLessThan(form.indexOf('await startRegistration('));
 });
 it('opens individual terms, privacy and risk notices without changing language or triggering submit',()=>{
  const form=readFileSync(fileURLToPath(new URL('../AuthForm.tsx',import.meta.url).href),'utf8');
  const legal=readFileSync(fileURLToPath(new URL('../RegistrationLegalDocuments.tsx',import.meta.url).href),'utf8');
  const css=readFileSync(fileURLToPath(new URL('../registration.css',import.meta.url).href),'utf8');
  for(const key of ['terms','privacy','risks'])expect(form).toContain("onClick={()=>setLegalKind('"+key+"')}");
  expect(form).toContain('onClose={closeLegal}');
  expect(legal).toContain("role=\"dialog\" aria-modal=\"true\"");
  expect(legal).toContain('data-no-translate');
  expect(legal).not.toContain('J’accepte');
  expect(legal).toContain("تنبيه مخاطر الاستخدام");
  expect(legal).toContain("Privacy policy");
  expect(legal).toContain("Conditions d’utilisation");
  expect(legal).toContain('event.key===\'Escape\'');
  expect(css).toContain('.gold-auth .registration-consent');
  expect(css).toContain('.gold-auth .registration-legal-backdrop');
  expect(css).toContain('max-height:min(83dvh,770px)');
 });
});

describe('Saudi Dhahabi legal notice review package',()=>{
 it('ships all three complete and localized review drafts without claiming legal approval',()=>{
  expect(LEGAL_REVIEW_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}-review\.\d+$/);
  expect(LEGAL_PUBLICATION_APPROVED).toBe(false);
  expect(LEGAL_DOMAIN).toBe('dhahabk.com');
  expect(LEGAL_EMAILS).toEqual({
   privacy:'privacy@dhahabk.com',support:'support@dhahabk.com',info:'info@dhahabk.com'
  });
  expect(legalSectionCount('terms')).toBeGreaterThanOrEqual(10);
  expect(legalSectionCount('privacy')).toBeGreaterThanOrEqual(12);
  expect(legalSectionCount('risks')).toBeGreaterThanOrEqual(8);
  for(const kind of ['terms','privacy','risks'] as const){
   const all=(['ar','en','fr'] as const).map(lang=>legalSectionTitles(kind,lang));
   expect(all[0].length).toBeGreaterThan(7);
   for(const titles of all){
    expect(titles.length).toBe(all[0].length);
    expect(titles.every(x=>x.length>8)).toBe(true);
   }
   for(const text of all[1].concat(all[2]))expect(text).not.toMatch(/[\u0600-\u06FF]/);
  }
 });
 it('describes the actual processor, German hosting and data rights without pretending deletion is automatic',()=>{
  const source=readFileSync(fileURLToPath(new URL('../RegistrationLegalDocuments.tsx',import.meta.url).href),'utf8');
  for(const fact of ['Frankfurt','Germany','Resend','Render','privacy@dhahabk.com','support@dhahabk.com','dhahabk.com','Face ID','Push'])expect(source).toContain(fact);
  expect(source).toContain('LEGAL_PUBLICATION_APPROVED=false');
  expect(source).toContain('retention schedules must be approved');
  expect(source).toContain('account closure or personal-data deletion requires a verified request');
  expect(source).toContain('registration-legal-section');
  expect(source).toContain('data-no-translate');
 });
 it('offers read-only access from registration, Help and Profile; does not replace the existing UI',()=>{
  const help=readFileSync(fileURLToPath(new URL('../GoldHelp.tsx',import.meta.url).href),'utf8');
  const workspace=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
  const registration=readFileSync(fileURLToPath(new URL('../AuthForm.tsx',import.meta.url).href),'utf8');
  const css=readFileSync(fileURLToPath(new URL('../registration.css',import.meta.url).href),'utf8');
  expect(help).toContain('<LegalDocumentLinks language={language}/>');
  expect(workspace).toContain('<LegalDocumentLinks language={language}/>');
  for(const k of ['terms','privacy','risks'])expect(registration).toContain("onClick={()=>setLegalKind('"+k+"')}");
  expect(registration).toContain('if(register&&!consentAccepted)');
  expect(registration).toContain('وأقر بالاطلاع');
  expect(css).toContain('.gold-auth .registration-legal-backdrop');
  expect(css).toContain('.gold-web.workspace .registration-legal-backdrop');
  expect(css).toContain('max-height:min(83dvh,770px)');
 });
});

describe('October 10 design restored with verified email activation',()=>{
 it('places the country flag and dial left of the mobile field, retaining searchable international codes',()=>{
  const phone=readFileSync(fileURLToPath(new URL('../RegistrationPhoneField.tsx',import.meta.url).href),'utf8');
  const form=readFileSync(fileURLToPath(new URL('../AuthForm.tsx',import.meta.url).href),'utf8');
  const css=readFileSync(fileURLToPath(new URL('../registration.css',import.meta.url).href),'utf8');
  expect(phone).toContain('dh-intl-country-flag');
  expect(phone).toContain('dh-intl-country-code');
  expect(phone).toContain('dh-intl-country-search');
  expect(phone).toContain('dh-intl-number');
  expect(phone).toContain('aria-haspopup="dialog"');
  expect(css).toContain('grid-template-columns:112px minmax(0,1fr)');
  expect(form).toContain('internationalRegistrationPhone(countryIso,phone)');
  expect(form).toContain("startRegistration(name,email,password,internationalPhone||undefined,{version:LEGAL_TERMS_VERSION,noticesAcknowledged:true})");
  expect(form).toContain('registerStep===\x27verify\x27');
  expect(form).toContain('<AuthLanguageSwitcher/>');
  expect(form).toContain('APP_DISPLAY_VERSION');
 });
 it('normalizes Saudi short, Saudi trunk, other international and pasted E.164 without double prefixes',()=>{
  expect(internationalRegistrationPhone('SA','501234567')).toBe('+966501234567');
  expect(internationalRegistrationPhone('SA','0501234567')).toBe('+966501234567');
  expect(internationalRegistrationPhone('SA','+966501234567')).toBe('+966501234567');
  expect(internationalRegistrationPhone('SA','٥٠١٢٣٤٥٦٧')).toBe('+966501234567');
  expect(internationalRegistrationPhone('GB','07700900123')).toBe('+447700900123');
  expect(internationalRegistrationPhone('FR','0612345678')).toBe('+33612345678');
  expect(internationalRegistrationPhone('GB','+966501234567')).toBeNull();
  expect(internationalRegistrationPhone('SA','0111234567')).toBeNull();
  expect(internationalRegistrationPhone('SA','50123456')).toBeNull();
 });
 it('retains 200+ country choices and localizable names',()=>{
  expect(PHONE_COUNTRIES.length).toBeGreaterThan(200);
  expect(countryFlag('SA')).toBe('🇸🇦');
  const france=PHONE_COUNTRIES.find(c=>c.iso==='FR')!;
  expect(countryDisplayName(france,'fr')).toContain('France');
 });
 it('limits initial country rows, searches localized names and exposes a bounded iPhone sheet',()=>{
  const field=readFileSync(fileURLToPath(new URL('../RegistrationPhoneField.tsx',import.meta.url).href),'utf8');
  const css=readFileSync(fileURLToPath(new URL('../registration.css',import.meta.url).href),'utf8');
  const selector=readFileSync(fileURLToPath(new URL('../AuthLanguageSwitcher.tsx',import.meta.url).href),'utf8');
  expect(field).toContain('COUNTRY_PAGE_SIZE=24');
  expect(field).toContain('filtered.slice(0,visibleCount)');
  expect(field).toContain('PREFERRED_COUNTRIES');
  expect(field).toContain('Intl.DisplayNames is computed once per locale');
  expect(field).toContain('className="dh-country-backdrop"');
  expect(field).toContain('aria-modal="true"');
  expect(css).toContain('position:fixed!important');
  expect(css).toContain('max-height:min(75dvh,680px)');
  expect(selector).toContain('dh-auth-language-label');
  expect(selector).toContain('aria-haspopup="menu"');
 });

});
