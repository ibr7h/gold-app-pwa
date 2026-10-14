import React,{useEffect,useState} from 'react';
import {Money} from './price-display';
import {router} from 'expo-router';
import {useAuth} from '../contexts/AuthContext';
import {API_BASE} from './api';
import './user.css';
import {canShowBiometricLogin} from './biometric-visibility';
import {useLanguage} from './i18n';
import {localizeFeedback} from './i18n-feedback';
import {registrationAvailable,registrationDigits} from './registration';
import {internationalRegistrationPhone} from './phone-country';
import {RegistrationPhoneField} from './RegistrationPhoneField';
import {RegistrationLegalDocuments,LEGAL_TERMS_VERSION,type RegistrationLegalKind} from './RegistrationLegalDocuments';
import {AuthLanguageSwitcher} from './AuthLanguageSwitcher';
import {PasswordRecovery} from './PasswordRecovery';
import {APP_DISPLAY_VERSION} from './app-version';
import './registration.css';

type RegistrationAuth=ReturnType<typeof useAuth>&{
 startRegistration:(name:string,email:string,password:string,phone?:string,legal?:{version:string;noticesAcknowledged:true})=>Promise<boolean>;
 registrationExpiresAt:number;registrationResendAt:number;
};
type AuthIconName='fingerprint'|'mail'|'phone'|'lock'|'eye'|'eyeOff'|'login'|'guest'|'userPlus'|'back';
function MockupFingerprintIcon(){
 const d='M48 256C48 141.1 141.1 48 256 48c63.1 0 119.6 28.1 157.8 72.5c8.6 10.1 23.8 11.2 33.8 2.6s11.2-23.8 2.6-33.8C403.3 34.6 333.7 0 256 0C114.6 0 0 114.6 0 256l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40zm458.5-52.9c-2.7-13-15.5-21.3-28.4-18.5s-21.3 15.5-18.5 28.4c2.9 13.9 4.5 28.3 4.5 43.1l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c0-18.1-1.9-35.8-5.5-52.9zM256 80c-19 0-37.4 3-54.5 8.6c-15.2 5-18.7 23.7-8.3 35.9c7.1 8.3 18.8 10.8 29.4 7.9c10.6-2.9 21.8-4.4 33.4-4.4c70.7 0 128 57.3 128 128l0 24.9c0 25.2-1.5 50.3-4.4 75.3c-1.7 14.6 9.4 27.8 24.2 27.8c11.8 0 21.9-8.6 23.3-20.3c3.3-27.4 5-55 5-82.7l0-24.9c0-97.2-78.8-176-176-176zM150.7 148.7c-9.1-10.6-25.3-11.4-33.9-.4C93.7 178 80 215.4 80 256l0 24.9c0 24.2-2.6 48.4-7.8 71.9C68.8 368.4 80.1 384 96.1 384c10.5 0 19.9-7 22.2-17.3c6.4-28.1 9.7-56.8 9.7-85.8l0-24.9c0-27.2 8.5-52.4 22.9-73.1c7.2-10.4 8-24.6-.2-34.2zM256 160c-53 0-96 43-96 96l0 24.9c0 35.9-4.6 71.5-13.8 106.1c-3.8 14.3 6.7 29 21.5 29c9.5 0 17.9-6.2 20.4-15.4c10.5-39 15.9-79.2 15.9-119.7l0-24.9c0-28.7 23.3-52 52-52s52 23.3 52 52l0 24.9c0 36.3-3.5 72.4-10.4 107.9c-2.7 13.9 7.7 27.2 21.8 27.2c10.2 0 19-7 21-17c7.7-38.8 11.6-78.3 11.6-118.1l0-24.9c0-53-43-96-96-96zm24 96c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 24.9c0 59.9-11 119.3-32.5 175.2l-5.9 15.3c-4.8 12.4 1.4 26.3 13.8 31s26.3-1.4 31-13.8l5.9-15.3C267.9 411.9 280 346.7 280 280.9l0-24.9z';
 return <svg className="mockup-fingerprint-icon" width="40" height="40" fill="#001F3F" viewBox="0 0 512 512" aria-hidden="true"><path d={d}/></svg>;
}

function AuthIcon({name,size=20}:{name:AuthIconName;size?:number}){
 const paths:Record<AuthIconName,string[]>={
  fingerprint:['M12 11a3 3 0 0 1 3 3c0 3-1 6-2 8','M9 14a3 3 0 0 1 6 0','M7 14a5 5 0 0 1 10 0c0 2-.4 4-1.2 6','M5 14a7 7 0 0 1 14 0c0 2.8-.5 5.2-1.6 7.5','M8 8.5a6 6 0 0 1 8 0','M6 10a8 8 0 0 1 12 0'],
  mail:['M4 6h16v12H4Z','m4 7 8 6 8-6'],
  phone:['M6 3h4l1 5-2 2a14 14 0 0 0 5 5l2-2 5 1v4c0 2-2 3-4 2C9 18 5 14 3 7c-1-2 1-4 3-4Z'],
  lock:['M7 11h10v9H7Z','M9 11V8a3 3 0 0 1 6 0v3'],
  eye:['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  eyeOff:['m3 3 18 18','M10.6 10.6A2 2 0 0 0 13.4 13.4','M9.8 5.2A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.1 3.1','M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 3.1-.5'],
  login:['M10 17l5-5-5-5','M15 12H3','M15 3h5v18h-5'],
  guest:['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  userPlus:['M15 19a6 6 0 0 0-12 0','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z','M18 8v6','M15 11h6'],
  back:['m15 18-6-6 6-6']
 };
 return <svg className="auth-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name].map((d,i)=><path key={i} d={d}/>)}</svg>;
}

interface GuestPrice{karat:number;buyPrice:string;currency:string}
function GuestPrices({onBack}:{onBack:()=>void}){
 const {language,direction}=useLanguage();
 const [rows,setRows]=useState<GuestPrice[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{try{
  const data=await Promise.all([24,22,21,18].map(async karat=>{const r=await fetch(API_BASE+'/prices/latest?currency=SAR&karat='+karat,{cache:'no-store'});if(!r.ok)throw new Error();return r.json();}));
  if(active)setRows(data);
 }catch{if(active)setError('تعذر تحميل الأسعار الآن.');}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[]);
 const money=(v:string)=><Money amount={Number(v)} currency="SAR"/>;
 return <main className="gold-web gold-auth approved-auth auth-mockup" dir={direction} lang={language}>
  <section className="mockup-login-container guest-price-view">
   <button className="guest-back" type="button" onClick={onBack}><AuthIcon name="back"/>العودة لتسجيل الدخول</button>
   <img className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt={t('أيقونة تطبيق ذهبك','Dhahabk app icon',"Icône de l’application Dhahabk")}/>
   <h1 className="mockup-app-title">{t('تطبيق ذهبك','Dhahabk','Dhahabk')}</h1>
   <p className="mockup-app-subtitle">تصفح أسعار الذهب كزائر</p>
      <section className="mockup-auth-card guest-card">
    <h2>أسعار الجرام الحالية</h2>
    {loading&&<p className="guest-status">جارٍ تحميل الأسعار…</p>}
    {error&&<p className="error-banner">{localizeFeedback(error,language)}</p>}
    {!loading&&!error&&<div className="guest-price-grid">{rows.map(row=><article key={row.karat}><span>عيار {row.karat}</span><strong>{money(row.buyPrice)}</strong></article>)}</div>}
    <button className="gold-btn mockup-primary-btn" type="button" onClick={onBack}><AuthIcon name="login"/>تسجيل الدخول للاستفادة من كامل الخدمات</button>
   </section>
  </section>
 </main>;
}

export default function AuthForm({register=false}:{register?:boolean}){
 const {language,direction}=useLanguage();
 const t=(ar:string,en:string,fr:string)=>language==='en'?en:language==='fr'?fr:ar;
 const {user,isLoading,error,login,startRegistration,registerStep,registerEmail,verifyRegistration,resendRegisterCode,cancelRegistration,registrationExpiresAt,registrationResendAt,clearError,biometricAvailable,biometricEnrolled,biometricEnabled,loginWithBiometric}=useAuth() as RegistrationAuth;
 const showBiometricLogin=canShowBiometricLogin({biometricAvailable,biometricEnrolled,biometricEnabled});
 const [email,setEmail]=useState(''),[phone,setPhone]=useState(''),[countryIso,setCountryIso]=useState('SA'),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[name,setName]=useState(''),[visible,setVisible]=useState(false),[confirmVisible,setConfirmVisible]=useState(false),[localError,setLocalError]=useState(''),[guest,setGuest]=useState(false),[recovery,setRecovery]=useState(false);
 const [code,setCode]=useState(''),[clock,setClock]=useState(Date.now()),[registrationEnabled,setRegistrationEnabled]=useState<boolean|null>(null);
 const [consentAccepted,setConsentAccepted]=useState(false),[legalKind,setLegalKind]=useState<RegistrationLegalKind|null>(null);
 const closeLegal=React.useCallback(()=>setLegalKind(null),[]);
 useEffect(()=>{if(!register)return;let active=true;
  void registrationAvailable().then(available=>{if(active)setRegistrationEnabled(available);}).catch(()=>{if(active)setRegistrationEnabled(false);});
  return()=>{active=false;};
 },[register]);
 useEffect(()=>{if(!register||registerStep!=='verify')return;
  setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer);
 },[register,registerStep]);
 const resendWait=Math.max(0,Math.ceil((registrationResendAt-clock)/1000));
 const codeRemaining=Math.max(0,Math.ceil((registrationExpiresAt-clock)/1000));
 useEffect(()=>{if(user)router.replace('/');},[user]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(isLoading)return;clearError();setLocalError('');
  if(register&&password!==confirm){setLocalError('كلمتا المرور غير متطابقتين.');return;}
  if(register&&!consentAccepted){setLocalError(t('يجب قبول شروط الاستخدام والإقرار بالاطلاع على سياسة الخصوصية وتنبيه المخاطر للمتابعة.','Please accept the Terms of Use and acknowledge the Privacy Policy and Usage Risk Notice to continue.',"Veuillez accepter les conditions d’utilisation et reconnaître avoir consulté la politique de confidentialité et l’avis sur les risques."));return;}
  const internationalPhone=register?internationalRegistrationPhone(countryIso,phone):null;
  if(register&&!internationalPhone){setLocalError('تحقق من رقم الجوال ورمز الدولة المحدد.');return;}
  if(new TextEncoder().encode(password).length>72){setLocalError('كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.');return;}
  try{
   if(register){
    if(registrationEnabled!==true)return;
    if(await startRegistration(name,email,password,internationalPhone||undefined,{version:LEGAL_TERMS_VERSION,noticesAcknowledged:true})){setPassword('');setConfirm('');setCode('');setClock(Date.now());}
   }else await login(email,password);
  }catch{}
 };
 const submitCode=async(e:React.FormEvent)=>{e.preventDefault();if(isLoading)return;clearError();setLocalError('');
  if(!/^\d{6}$/.test(code)){setLocalError('أدخل رمز التحقق المكوّن من 6 أرقام.');return;}
  await verifyRegistration(code);
 };
 const resendCode=async()=>{if(isLoading||resendWait>0)return;clearError();setLocalError('');
  if(await resendRegisterCode()){setCode('');setClock(Date.now());}
 };
 const biometric=async()=>{clearError();setLocalError('');if(!showBiometricLogin){return;}const ok=await loginWithBiometric();if(!ok)setLocalError('تعذر تسجيل الدخول بالبصمة الحيوية.');};
 // Browser and iOS own the passkey sheet. Never request it before an explicit tap.
 // WebAuthn authenticates the previously enrolled device; this does not enroll passkeys automatically.
 if(guest&&!register)return <GuestPrices onBack={()=>setGuest(false)}/>;
  if(recovery&&!register)return <PasswordRecovery initialEmail={email} onBack={()=>{setRecovery(false);setLocalError('');clearError();}}/>;
 if(register)return <main className="gold-web gold-auth approved-auth auth-mockup" dir={direction} lang={language}>
  <section className="mockup-login-container">
   <AuthLanguageSwitcher/>
   <div className="emblem-circle"><span className="emblem-text">ذ</span></div>
   <h1 className="mockup-app-title">{t('تطبيق ذهبك','Dhahabk','Dhahabk')}</h1>
   <p className="mockup-app-subtitle">{registerStep==='verify'?t('تأكيد البريد الإلكتروني','Verify your email','Vérifiez votre adresse e-mail'):t('إنشاء حساب مستخدم جديد','Create a new user account','Créer un compte utilisateur')}</p>
   <p className="dh-auth-reference-version" dir="ltr">{APP_DISPLAY_VERSION}</p>
      <section className="mockup-auth-card">
    {registerStep==='verify'?<form onSubmit={submitCode} aria-busy={isLoading} className="registration-verification">
     <h2>{t('تحقق من بريدك الإلكتروني','Verify your email','Vérifiez votre adresse e-mail')}</h2>
     <p>{t('أدخل رمز التحقق المرسل إلى','Enter the verification code sent to','Saisissez le code de vérification envoyé à')}</p><p className="registration-email" dir="ltr">{registerEmail}</p>
     <label className="form-group"><span className="form-label">{t('رمز التحقق','Verification code','Code de vérification')}</span>
      <input className="form-input registration-code-input" dir="ltr" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} required autoFocus placeholder="000000" onChange={e=>setCode(registrationDigits(e.target.value))}/></label>
     <p className="registration-timer" role="timer">{codeRemaining>0?t('صلاحية الرمز: ','Code expires in: ','Expiration du code : ')+Math.floor(codeRemaining/60)+':'+String(codeRemaining%60).padStart(2,'0'):t('انتهت صلاحية الرمز. اطلب رمزًا جديدًا.','The code has expired. Request a new one.','Le code a expiré. Demandez-en un nouveau.')}</p>
     <p className="registration-hint">{t('تحقق من البريد غير المرغوب فيه أيضًا. لا تشارك الرمز مع أي شخص.','Check your spam folder too. Never share this code.','Vérifiez aussi vos courriers indésirables. Ne partagez jamais ce code.')}</p>
     {(localError||error)&&<p className="error-banner" role="alert">{localizeFeedback(localError||error,language)}</p>}
     <button className="gold-btn mockup-primary-btn" disabled={isLoading||codeRemaining<=0}><AuthIcon name="mail"/><span>{isLoading?t('جارٍ التحقق…','Verifying…','Vérification…'):t('تأكيد الرمز وإنشاء الحساب','Verify code and create account','Vérifier le code et créer le compte')}</span></button>
     <button type="button" className="registration-resend" disabled={isLoading||resendWait>0} onClick={()=>void resendCode()}>{resendWait>0?t('إعادة الإرسال بعد ','Resend in ','Renvoyer dans ')+resendWait+t(' ثانية',' seconds',' secondes'):t('إعادة إرسال رمز التحقق','Resend verification code','Renvoyer le code de vérification')}</button>
     <button type="button" className="registration-back" disabled={isLoading} onClick={()=>{cancelRegistration();setCode('');setLocalError('');}}>{t('تعديل بيانات التسجيل','Edit registration details','Modifier les informations d’inscription')}</button>
    </form>:<form onSubmit={submit} aria-busy={isLoading}>
     <label className="form-group"><span className="form-label">الاسم الكامل</span><div className="mockup-input-wrap"><input className="form-input" value={name} autoComplete="name" maxLength={80} placeholder="الاسم الكامل" onChange={e=>setName(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="userPlus"/></span></div></label>
     <label className="form-group"><span className="form-label">البريد الإلكتروني</span><div className="mockup-input-wrap"><input className="form-input" type="email" dir="ltr" autoComplete="email" value={email} required placeholder="user@gold.app" onChange={e=>setEmail(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="mail"/></span></div></label>
     <div className="form-group dh-intl-form-group">
      <label className="form-label" htmlFor="dh-register-phone">{t('رقم الجوال','Mobile number','Numéro de mobile')}</label>
      <RegistrationPhoneField value={phone} countryIso={countryIso} language={language}
       onChange={(next,iso)=>{setPhone(next);setCountryIso(iso);setLocalError('');}}/>
     </div>
     <label className="form-group"><span className="form-label">كلمة المرور</span><div className="mockup-input-wrap"><input className="form-input" type={visible?'text':'password'} autoComplete="new-password" required minLength={8} value={password} placeholder="••••••••" onChange={e=>setPassword(e.target.value)}/><button type="button" className="mockup-eye-btn" onClick={()=>setVisible(!visible)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}><AuthIcon name={visible?'eyeOff':'eye'}/></button></div></label>
     <label className="form-group"><span className="form-label">تأكيد كلمة المرور</span><div className="mockup-input-wrap"><input className="form-input" type={confirmVisible?'text':'password'} autoComplete="new-password" required minLength={8} value={confirm} placeholder="أعد كتابة كلمة المرور" onChange={e=>setConfirm(e.target.value)}/><button type="button" className="mockup-eye-btn" onClick={()=>setConfirmVisible(!confirmVisible)} aria-label={confirmVisible?t('إخفاء تأكيد كلمة المرور','Hide confirmation password','Masquer la confirmation du mot de passe'):t('إظهار تأكيد كلمة المرور','Show confirmation password','Afficher la confirmation du mot de passe')}><AuthIcon name={confirmVisible?'eyeOff':'eye'}/></button></div></label>
     <div className="registration-consent" role="group" aria-label={t('الموافقة على شروط التسجيل','Registration consent','Consentement à l’inscription')}>
      <input type="checkbox" id="dh-register-consent" checked={consentAccepted}
       onChange={event=>{setConsentAccepted(event.target.checked);setLocalError('');}}
       required aria-describedby="dh-register-consent-note"/>
      <div className="registration-consent-copy">
       <label htmlFor="dh-register-consent">{t('أوافق على ','I agree to the ','J’accepte les ')}</label>
       <button type="button" className="registration-legal-link" onClick={()=>setLegalKind('terms')}>{t('شروط الاستخدام','Terms of Use',"conditions d’utilisation")}</button>
       {t('، وأقر بالاطلاع على ',' and acknowledge the ',' et reconnais avoir consulté la ')}
       <button type="button" className="registration-legal-link" onClick={()=>setLegalKind('privacy')}>{t('سياسة الخصوصية','Privacy Policy','politique de confidentialité')}</button>
       {t(' و',' and the ',' ainsi que l’')}
       <button type="button" className="registration-legal-link" onClick={()=>setLegalKind('risks')}>{t('تنبيه مخاطر الاستخدام','Usage Risk Notice',"avis sur les risques d’utilisation")}</button>
      </div>
     </div>
     <p id="dh-register-consent-note" className="registration-consent-note">{t('قبول الشروط والإقرار بالاطلاع مطلوبان قبل إرسال رمز التحقق بالبريد.','Terms acceptance and notice acknowledgement are required before email verification.',"L’acceptation des conditions et la prise de connaissance des documents sont requises avant la vérification par e-mail.")}</p>
     {(localError||error)&&<p className="error-banner" role="alert">{localizeFeedback(localError||error,language)}</p>}
     {registrationEnabled===false&&<p className="error-banner" role="status">{t('التحقق بالبريد غير متاح حاليًا. حاول لاحقًا.','Email verification is currently unavailable. Please try later.','La vérification par e-mail est actuellement indisponible. Réessayez plus tard.')}</p>}
     <button className="gold-btn mockup-primary-btn" disabled={isLoading||registrationEnabled!==true||!consentAccepted}><AuthIcon name="mail"/><span>{isLoading?t('جارٍ إرسال رمز التحقق…','Sending verification code…','Envoi du code de vérification…'):registrationEnabled===null?t('جارٍ التحقق من الخدمة…','Checking verification service…','Vérification du service…'):t('إرسال رمز التحقق بالبريد','Send email verification code','Envoyer le code par e-mail')}</span></button>
     <div className="mockup-register-link">لديك حساب؟ <button type="button" onClick={()=>{cancelRegistration();clearError();router.replace('/login');}}>تسجيل الدخول</button></div>
    </form>}
   </section>
  </section>
  {legalKind&&<RegistrationLegalDocuments kind={legalKind} language={language} onClose={closeLegal}/>}
 </main>;
 return <main className="gold-web gold-auth approved-auth auth-mockup" dir={direction} lang={language}>
  <section className="mockup-login-container">
   <AuthLanguageSwitcher/>
   <img className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt={t('أيقونة تطبيق ذهبك','Dhahabk app icon',"Icône de l’application Dhahabk")}/>
   <h1 className="mockup-app-title">{t('تطبيق ذهبك','Dhahabk','Dhahabk')}</h1>
   <p className="mockup-app-subtitle">دخول المستثمرين ومتابعي الأسعار</p>
      <section className="mockup-auth-card">
    {showBiometricLogin&&<button className="mockup-biometric" type="button" onClick={()=>void biometric()} aria-label="الدخول بالبصمة الحيوية">
     <span className="mockup-biometric-circle"><MockupFingerprintIcon/></span>
     <strong>الدخول بالبصمة الحيوية</strong>
     <small>Face ID أو بصمة الإصبع المسجلة</small>
    </button>}
    <div className="mockup-divider"><span>{showBiometricLogin?'أو بالبريد الإلكتروني أو رقم الجوال':'الدخول بالبريد الإلكتروني أو رقم الجوال'}</span></div>
    {(localError||error)&&<p className="error-banner" role="alert">{localizeFeedback(localError||error,language)}</p>}
    <form onSubmit={submit} aria-busy={isLoading}>
     <label className="form-group"><span className="form-label">البريد الإلكتروني أو رقم الجوال</span><div className="mockup-input-wrap"><input className="form-input" type="text" dir="ltr" autoComplete="username" value={email} required placeholder="البريد الإلكتروني أو 05xxxxxxxx" onChange={e=>setEmail(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="mail"/></span></div></label>
     <label className="form-group"><span className="form-label">كلمة المرور</span><div className="mockup-input-wrap"><input className="form-input" type={visible?'text':'password'} autoComplete="current-password" value={password} required placeholder="••••••••" onChange={e=>setPassword(e.target.value)}/><button type="button" className="mockup-eye-btn" onClick={()=>setVisible(!visible)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}><AuthIcon name={visible?'eyeOff':'eye'}/></button></div></label>
     <div className="mockup-login-options"><label className="mockup-remember"><input type="checkbox" disabled/><span>الدخول السريع من إعدادات الحساب</span></label><button type="button" className="mockup-forgot" onClick={()=>{setRecovery(true);setLocalError('');clearError();}}>{t('نسيت كلمة المرور؟','Forgot password?','Mot de passe oublié ?')}</button></div>
     <button className="gold-btn mockup-primary-btn" disabled={isLoading}><AuthIcon name="login"/><span>{isLoading?'جارٍ تسجيل الدخول…':'تسجيل الدخول'}</span></button>
     <button type="button" className="gold-btn-outline mockup-guest-btn" onClick={()=>setGuest(true)}><AuthIcon name="guest"/><span>المتابعة كزائر (تصفح الأسعار فقط)</span></button>
     <div className="mockup-register-link">ليس لديك حساب؟ <button type="button" onClick={()=>{clearError();router.replace('/register');}}>إنشاء حساب مستخدم جديد</button></div>
    </form>
   </section>
  </section>
 </main>;
}
