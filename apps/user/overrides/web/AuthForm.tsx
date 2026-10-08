import React,{useEffect,useState} from 'react';
import {router} from 'expo-router';
import {useAuth} from '../contexts/AuthContext';
import {API_BASE} from './api';
import './user.css';
import {APP_DISPLAY_VERSION} from './app-version';

type AuthIconName='fingerprint'|'mail'|'lock'|'eye'|'eyeOff'|'login'|'guest'|'userPlus'|'back';
function MockupFingerprintIcon(){
 const d='M48 256C48 141.1 141.1 48 256 48c63.1 0 119.6 28.1 157.8 72.5c8.6 10.1 23.8 11.2 33.8 2.6s11.2-23.8 2.6-33.8C403.3 34.6 333.7 0 256 0C114.6 0 0 114.6 0 256l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40zm458.5-52.9c-2.7-13-15.5-21.3-28.4-18.5s-21.3 15.5-18.5 28.4c2.9 13.9 4.5 28.3 4.5 43.1l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c0-18.1-1.9-35.8-5.5-52.9zM256 80c-19 0-37.4 3-54.5 8.6c-15.2 5-18.7 23.7-8.3 35.9c7.1 8.3 18.8 10.8 29.4 7.9c10.6-2.9 21.8-4.4 33.4-4.4c70.7 0 128 57.3 128 128l0 24.9c0 25.2-1.5 50.3-4.4 75.3c-1.7 14.6 9.4 27.8 24.2 27.8c11.8 0 21.9-8.6 23.3-20.3c3.3-27.4 5-55 5-82.7l0-24.9c0-97.2-78.8-176-176-176zM150.7 148.7c-9.1-10.6-25.3-11.4-33.9-.4C93.7 178 80 215.4 80 256l0 24.9c0 24.2-2.6 48.4-7.8 71.9C68.8 368.4 80.1 384 96.1 384c10.5 0 19.9-7 22.2-17.3c6.4-28.1 9.7-56.8 9.7-85.8l0-24.9c0-27.2 8.5-52.4 22.9-73.1c7.2-10.4 8-24.6-.2-34.2zM256 160c-53 0-96 43-96 96l0 24.9c0 35.9-4.6 71.5-13.8 106.1c-3.8 14.3 6.7 29 21.5 29c9.5 0 17.9-6.2 20.4-15.4c10.5-39 15.9-79.2 15.9-119.7l0-24.9c0-28.7 23.3-52 52-52s52 23.3 52 52l0 24.9c0 36.3-3.5 72.4-10.4 107.9c-2.7 13.9 7.7 27.2 21.8 27.2c10.2 0 19-7 21-17c7.7-38.8 11.6-78.3 11.6-118.1l0-24.9c0-53-43-96-96-96zm24 96c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 24.9c0 59.9-11 119.3-32.5 175.2l-5.9 15.3c-4.8 12.4 1.4 26.3 13.8 31s26.3-1.4 31-13.8l5.9-15.3C267.9 411.9 280 346.7 280 280.9l0-24.9z';
 return <svg className="mockup-fingerprint-icon" width="40" height="40" fill="#001F3F" viewBox="0 0 512 512" aria-hidden="true"><path d={d}/></svg>;
}

function AuthIcon({name,size=20}:{name:AuthIconName;size?:number}){
 const paths:Record<AuthIconName,string[]>={
  fingerprint:['M12 11a3 3 0 0 1 3 3c0 3-1 6-2 8','M9 14a3 3 0 0 1 6 0','M7 14a5 5 0 0 1 10 0c0 2-.4 4-1.2 6','M5 14a7 7 0 0 1 14 0c0 2.8-.5 5.2-1.6 7.5','M8 8.5a6 6 0 0 1 8 0','M6 10a8 8 0 0 1 12 0'],
  mail:['M4 6h16v12H4Z','m4 7 8 6 8-6'],
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
 const [rows,setRows]=useState<GuestPrice[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{try{
  const data=await Promise.all([24,22,21,18].map(async karat=>{const r=await fetch(API_BASE+'/prices/latest?currency=SAR&karat='+karat,{cache:'no-store'});if(!r.ok)throw new Error();return r.json();}));
  if(active)setRows(data);
 }catch{if(active)setError('تعذر تحميل الأسعار الآن.');}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[]);
 const money=(v:string)=>new Intl.NumberFormat('ar-SA',{maximumFractionDigits:2}).format(Number(v))+' ر.س';
 return <main className="gold-web gold-auth approved-auth auth-mockup" dir="rtl" lang="ar">
  <section className="mockup-login-container guest-price-view">
   <button className="guest-back" type="button" onClick={onBack}><AuthIcon name="back"/>العودة لتسجيل الدخول</button>
   <img className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt="أيقونة تطبيق ذهبي"/>
   <h1 className="mockup-app-title">تطبيق ذهبي</h1>
   <p className="mockup-app-subtitle">تصفح أسعار الذهب كزائر</p>
   <p className="app-version-stamp" dir="ltr">{APP_DISPLAY_VERSION}</p>
   <section className="mockup-auth-card guest-card">
    <h2>أسعار الجرام الحالية</h2>
    {loading&&<p className="guest-status">جارٍ تحميل الأسعار…</p>}
    {error&&<p className="error-banner">{error}</p>}
    {!loading&&!error&&<div className="guest-price-grid">{rows.map(row=><article key={row.karat}><span>عيار {row.karat}</span><strong>{money(row.buyPrice)}</strong></article>)}</div>}
    <button className="gold-btn mockup-primary-btn" type="button" onClick={onBack}><AuthIcon name="login"/>تسجيل الدخول للاستفادة من كامل الخدمات</button>
   </section>
  </section>
 </main>;
}

export default function AuthForm({register=false}:{register?:boolean}){
 const {user,isLoading,error,login,startRegistration,clearError,biometricAvailable,loginWithBiometric}=useAuth();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[name,setName]=useState(''),[visible,setVisible]=useState(false),[localError,setLocalError]=useState(''),[guest,setGuest]=useState(false);
 useEffect(()=>{if(user)router.replace('/');},[user]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(isLoading)return;clearError();setLocalError('');
  if(register&&password!==confirm){setLocalError('كلمتا المرور غير متطابقتين.');return;}
  if(new TextEncoder().encode(password).length>72){setLocalError('كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.');return;}
  try{if(register)await startRegistration(name,email,password);else await login(email,password);}catch{}
 };
 const biometric=async()=>{clearError();setLocalError('');if(!biometricAvailable){setLocalError('البصمة الحيوية غير مفعلة في نسخة الويب الحالية.');return;}const ok=await loginWithBiometric();if(!ok)setLocalError('تعذر تسجيل الدخول بالبصمة الحيوية.');};
 if(guest&&!register)return <GuestPrices onBack={()=>setGuest(false)}/>;
 if(register)return <main className="gold-web gold-auth approved-auth auth-mockup" dir="rtl" lang="ar">
  <section className="mockup-login-container">
   <div className="emblem-circle"><span className="emblem-text">ذ</span></div>
   <h1 className="mockup-app-title">تطبيق ذهبي</h1>
   <p className="mockup-app-subtitle">إنشاء حساب مستخدم جديد</p>
   <p className="app-version-stamp" dir="ltr">{APP_DISPLAY_VERSION}</p>
   <section className="mockup-auth-card">
    <form onSubmit={submit} aria-busy={isLoading}>
     <label className="form-group"><span className="form-label">الاسم الكامل</span><div className="mockup-input-wrap"><input className="form-input" value={name} autoComplete="name" maxLength={80} placeholder="الاسم الكامل" onChange={e=>setName(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="userPlus"/></span></div></label>
     <label className="form-group"><span className="form-label">البريد الإلكتروني</span><div className="mockup-input-wrap"><input className="form-input" type="email" dir="ltr" autoComplete="email" value={email} required placeholder="user@gold.app" onChange={e=>setEmail(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="mail"/></span></div></label>
     <label className="form-group"><span className="form-label">كلمة المرور</span><div className="mockup-input-wrap"><input className="form-input" type={visible?'text':'password'} autoComplete="new-password" required minLength={8} value={password} placeholder="••••••••" onChange={e=>setPassword(e.target.value)}/><button type="button" className="mockup-eye-btn" onClick={()=>setVisible(!visible)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}><AuthIcon name={visible?'eyeOff':'eye'}/></button></div></label>
     <label className="form-group"><span className="form-label">تأكيد كلمة المرور</span><div className="mockup-input-wrap"><input className="form-input" type={visible?'text':'password'} autoComplete="new-password" required minLength={8} value={confirm} placeholder="أعد كتابة كلمة المرور" onChange={e=>setConfirm(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="lock"/></span></div></label>
     {(localError||error)&&<p className="error-banner" role="alert">{localError||error}</p>}
     <button className="gold-btn mockup-primary-btn" disabled={isLoading}><AuthIcon name="userPlus"/><span>{isLoading?'جارٍ إنشاء الحساب…':'إنشاء الحساب'}</span></button>
     <div className="mockup-register-link">لديك حساب؟ <button type="button" onClick={()=>{clearError();router.replace('/login');}}>تسجيل الدخول</button></div>
    </form>
   </section>
  </section>
 </main>;
 return <main className="gold-web gold-auth approved-auth auth-mockup" dir="rtl" lang="ar">
  <section className="mockup-login-container">
   <img className="mockup-app-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt="أيقونة تطبيق ذهبي"/>
   <h1 className="mockup-app-title">تطبيق ذهبي</h1>
   <p className="mockup-app-subtitle">دخول المستثمرين ومتابعي الأسعار</p>
   <p className="app-version-stamp" dir="ltr">{APP_DISPLAY_VERSION}</p>
   <section className="mockup-auth-card">
    <button className="mockup-biometric" type="button" onClick={()=>void biometric()} aria-label="الدخول بالبصمة الحيوية">
     <span className="mockup-biometric-circle"><MockupFingerprintIcon/></span>
     <strong>الدخول بالبصمة الحيوية</strong>
     <small>Face ID أو بصمة الإصبع المسجلة</small>
    </button>
    <div className="mockup-divider"><span>أو بالبريد الإلكتروني</span></div>
    {(localError||error)&&<p className="error-banner" role="alert">{localError||error}</p>}
    <form onSubmit={submit} aria-busy={isLoading}>
     <label className="form-group"><span className="form-label">البريد الإلكتروني</span><div className="mockup-input-wrap"><input className="form-input" type="email" dir="ltr" autoComplete="email" value={email} required placeholder="user@gold.app" onChange={e=>setEmail(e.target.value)}/><span className="mockup-field-icon"><AuthIcon name="mail"/></span></div></label>
     <label className="form-group"><span className="form-label">كلمة المرور</span><div className="mockup-input-wrap"><input className="form-input" type={visible?'text':'password'} autoComplete="current-password" value={password} required placeholder="••••••••" onChange={e=>setPassword(e.target.value)}/><button type="button" className="mockup-eye-btn" onClick={()=>setVisible(!visible)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}><AuthIcon name={visible?'eyeOff':'eye'}/></button></div></label>
     <div className="mockup-login-options"><label className="mockup-remember"><input type="checkbox" defaultChecked readOnly/><span>تذكرني</span></label><button type="button" className="mockup-forgot" onClick={()=>setLocalError('استعادة كلمة المرور لم تُفعّل في الخادم بعد.')}>نسيت كلمة المرور؟</button></div>
     <button className="gold-btn mockup-primary-btn" disabled={isLoading}><AuthIcon name="login"/><span>{isLoading?'جارٍ تسجيل الدخول…':'تسجيل الدخول'}</span></button>
     <button type="button" className="gold-btn-outline mockup-guest-btn" onClick={()=>setGuest(true)}><AuthIcon name="guest"/><span>المتابعة كزائر (تصفح الأسعار فقط)</span></button>
     <div className="mockup-register-link">ليس لديك حساب؟ <button type="button" onClick={()=>{clearError();router.replace('/register');}}>إنشاء حساب مستخدم جديد</button></div>
    </form>
   </section>
  </section>
 </main>;
}
