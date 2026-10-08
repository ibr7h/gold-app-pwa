import React,{useEffect,useState} from 'react';
import {router} from 'expo-router';
import {useAuth} from '../contexts/AuthContext';
import {API_BASE} from './api';
import './user.css';

type AuthIconName='fingerprint'|'mail'|'lock'|'eye'|'eyeOff'|'login'|'guest'|'userPlus'|'back';
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
   <section className="mockup-auth-card">
    <button className="mockup-biometric" type="button" onClick={()=>void biometric()} aria-label="الدخول بالبصمة الحيوية">
     <img className="mockup-app-icon biometric-identical-icon" src="/gold-app-pwa/full/app_icon_user.jpg" alt="" aria-hidden="true"/>
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
