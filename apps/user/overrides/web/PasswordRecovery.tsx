import React,{useEffect,useState} from 'react';
import {useLanguage} from './i18n';
import {AuthLanguageSwitcher} from './AuthLanguageSwitcher';
import {registrationDigits} from './registration';
import {ApiError,errorMessage,publicRecoveryRequest} from './api';
import {localizeFeedback} from './i18n-feedback';
import './registration.css';

type Step='email'|'code'|'complete';
type ResetResponse={requestId:string;expiresIn:number;resendAfterSeconds:number;message:string};
const validId=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function PasswordRecovery({onBack,initialEmail=''}:{onBack:()=>void;initialEmail?:string}){
 const {language,direction}=useLanguage();
 const t=(ar:string,en:string,fr:string)=>language==='en'?en:language==='fr'?fr:ar;
 const [step,setStep]=useState<Step>('email');
 const [email,setEmail]=useState(initialEmail.includes('@')?initialEmail:'');
 const [code,setCode]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [requestId,setRequestId]=useState(''),[expiresAt,setExpiresAt]=useState(0),[resendAt,setResendAt]=useState(0);
 const [clock,setClock]=useState(Date.now()),[busy,setBusy]=useState(false),[ready,setReady]=useState<boolean|null>(null),[error,setError]=useState('');
 const [visible,setVisible]=useState(false);
 useEffect(()=>{let active=true;void publicRecoveryRequest('/auth/password-reset/config').then(value=>{
  if(active)setReady(value?.enabled===true&&value?.channel==='email'&&value?.codeLength===6);
 }).catch(()=>{if(active)setReady(false)});return()=>{active=false};},[]);
 useEffect(()=>{if(step!=='code')return;const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer)},[step]);
 const wait=Math.max(0,Math.ceil((resendAt-clock)/1000));
 const remaining=Math.max(0,Math.ceil((expiresAt-clock)/1000));
 const request=async(event?:React.FormEvent)=>{
  event?.preventDefault();if(busy||ready!==true||!email.includes('@'))return;
  setBusy(true);setError('');
  try{
   const data=await publicRecoveryRequest('/auth/password-reset/request',{email:email.trim()}) as ResetResponse;
   if(!validId(data?.requestId)||!Number.isFinite(data?.expiresIn)||data.expiresIn>600||data.expiresIn<=0
     ||!Number.isFinite(data?.resendAfterSeconds)||data.resendAfterSeconds<0||data.resendAfterSeconds>60)
    throw new ApiError('استجابة الاستعادة غير مكتملة.');
   setRequestId(data.requestId);setExpiresAt(Date.now()+data.expiresIn*1000);
   setResendAt(Date.now()+data.resendAfterSeconds*1000);setClock(Date.now());setCode('');setStep('code');
  }catch(e){setError(localizeFeedback(errorMessage(e),language));}finally{setBusy(false);}
 };
 const complete=async(event:React.FormEvent)=>{
  event.preventDefault();if(busy||remaining<=0)return;setError('');
  if(password!==confirm){setError(t('كلمتا المرور غير متطابقتين.','Passwords do not match.','Les mots de passe ne correspondent pas.'));return;}
  if(new TextEncoder().encode(password).length>72){setError(t('كلمة المرور طويلة جدًا.','Password is too long.','Le mot de passe est trop long.'));return;}
  if(!/^\d{6}$/.test(code)){setError(t('أدخل رمزًا من 6 أرقام.','Enter a 6-digit code.','Saisissez un code à 6 chiffres.'));return;}
  setBusy(true);
  try{
   const result=await publicRecoveryRequest('/auth/password-reset/confirm',{requestId,code,newPassword:password});
   if(result?.success!==true)throw new ApiError('تعذر تغيير كلمة المرور.');
   setStep('complete');setPassword('');setConfirm('');setCode('');setRequestId('');
  }catch(e){setError(localizeFeedback(errorMessage(e),language));}finally{setBusy(false);}
 };
 return <main className="gold-web gold-auth approved-auth auth-mockup" dir={direction} lang={language}>
  <section className="mockup-login-container">
   <AuthLanguageSwitcher/>
   <img className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt="ذهبي"/>
   <h1 className="mockup-app-title">{t('تطبيق ذهبي','Dhahabi','Dhahabi')}</h1>
   <p className="mockup-app-subtitle">{t('استعادة كلمة المرور','Reset password','Récupérer le mot de passe')}</p>
   <section className="mockup-auth-card password-recovery">
    {step==='email'&&<form onSubmit={request} aria-busy={busy}>
     <h2>{t('نسيت كلمة المرور؟','Forgot your password?','Mot de passe oublié ?')}</h2>
     <p>{t('أدخل البريد الإلكتروني المسجل في حسابك لإرسال رمز استعادة.','Enter your account email to request a recovery code.','Saisissez l’adresse e-mail de votre compte pour recevoir un code.')}</p>
     <label className="form-group"><span className="form-label">{t('البريد الإلكتروني','Email address','Adresse e-mail')}</span><input className="form-input" dir="ltr" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
     {error&&<p className="error-banner" role="alert">{error}</p>}
     {ready===false&&<p className="error-banner" role="status">{t('استعادة كلمة المرور غير متاحة حاليًا.','Password recovery is currently unavailable.','La récupération du mot de passe est actuellement indisponible.')}</p>}
     <button className="gold-btn mockup-primary-btn" disabled={busy||ready!==true}>{busy?t('جارٍ الإرسال…','Sending…','Envoi…'):t('إرسال رمز الاستعادة','Send recovery code','Envoyer le code')}</button>
    </form>}
    {step==='code'&&<form onSubmit={complete} aria-busy={busy}>
     <h2>{t('تحقق من بريدك','Check your email','Consultez votre messagerie')}</h2>
     <p>{t('إذا كان البريد مرتبطًا بحساب، فستصلك رسالة برمز الاستعادة. تحقق أيضًا من البريد غير المرغوب فيه.','If an account exists for this address, a recovery code will arrive. Check spam too.','Si un compte existe pour cette adresse, vous recevrez un code. Vérifiez aussi les courriers indésirables.')}</p>
     <p className="registration-email" dir="ltr">{email}</p>
     <label className="form-group"><span className="form-label">{t('رمز التحقق','Recovery code','Code de récupération')}</span><input className="form-input registration-code-input" dir="ltr" inputMode="numeric" autoComplete="one-time-code" value={code} minLength={6} maxLength={6} required onChange={e=>setCode(registrationDigits(e.target.value))} placeholder="000000"/></label>
     <p className="registration-timer" role="timer">{remaining>0?t('صلاحية الرمز: ','Code expires in: ','Expiration du code : ')+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):t('انتهت صلاحية الرمز. اطلب رمزًا جديدًا.','Code expired. Request another.','Code expiré. Demandez-en un autre.')}</p>
     <label className="form-group"><span className="form-label">{t('كلمة المرور الجديدة','New password','Nouveau mot de passe')}</span><input className="form-input" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <label className="form-group"><span className="form-label">{t('تأكيد كلمة المرور','Confirm password','Confirmez le mot de passe')}</span><input className="form-input" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
     <label className="password-recovery-toggle"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/>{t('إظهار كلمة المرور','Show password','Afficher le mot de passe')}</label>
     {error&&<p className="error-banner" role="alert">{error}</p>}
     <button className="gold-btn mockup-primary-btn" disabled={busy||remaining<=0}>{busy?t('جارٍ التحقق…','Verifying…','Vérification…'):t('تغيير كلمة المرور','Reset password','Réinitialiser le mot de passe')}</button>
     <button className="registration-resend" type="button" disabled={busy||wait>0} onClick={()=>void request()}>{wait>0?t('إعادة الإرسال بعد ','Resend in ','Renvoyer dans ')+wait+t(' ثانية',' seconds',' secondes'):t('إرسال رمز جديد','Send new code','Envoyer un nouveau code')}</button>
     <button className="registration-back" type="button" disabled={busy} onClick={()=>{setStep('email');setError('');setCode('');setPassword('');setConfirm('')}}>{t('تعديل البريد الإلكتروني','Edit email','Modifier l’adresse e-mail')}</button>
    </form>}
    {step==='complete'&&<div className="password-recovery-complete" role="status">
     <h2>{t('تم تغيير كلمة المرور','Password changed','Mot de passe modifié')}</h2>
     <p>{t('يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة. ستحتاج الأجهزة الأخرى إلى تسجيل الدخول مرة أخرى.','Sign in with your new password. Other devices will need to sign in again.','Connectez-vous avec votre nouveau mot de passe. Les autres appareils devront se reconnecter.')}</p>
     <button className="gold-btn mockup-primary-btn" type="button" onClick={onBack}>{t('العودة لتسجيل الدخول','Back to sign in','Retour à la connexion')}</button>
    </div>}
    {step!=='complete'&&<button className="registration-back" type="button" onClick={onBack}>{t('العودة لتسجيل الدخول','Back to sign in','Retour à la connexion')}</button>}
   </section>
  </section>
 </main>;
}
