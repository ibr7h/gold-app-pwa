import React,{useEffect,useState} from 'react';
import {router} from 'expo-router';
import {useAuth} from '../contexts/AuthContext';
import './user.css';
const DEMO_EMAIL='demo@gold.app';
const DEMO_PASSWORD='Demo123!';
export default function AuthForm({register=false}:{register?:boolean}){
 const {user,isLoading,error,login,startRegistration,clearError}=useAuth();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[name,setName]=useState(''),[visible,setVisible]=useState(false),[localError,setLocalError]=useState('');
 useEffect(()=>{if(user)router.replace('/');},[user]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(isLoading)return;clearError();setLocalError('');
  if(register&&password!==confirm){setLocalError('كلمتا المرور غير متطابقتين.');return;}
  if(new TextEncoder().encode(password).length>72){setLocalError('كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.');return;}
  try{if(register)await startRegistration(name,email,password);else await login(email,password);}catch{}
 };
 return <main className="gold-web gold-auth approved-auth" dir="rtl" lang="ar">
  <section className="approved-login-shell">
   <div className="role-pills" aria-label="نوع الحساب"><span className="role-pill active">مستخدم</span><span className="role-pill disabled">تاجر معتمد · قريبًا</span><span className="role-pill disabled">مسؤول · قريبًا</span></div>
   <div className="emblem-circle" aria-hidden="true"><span>ذ</span></div>
   <h1>تطبيق ذهبي</h1>
   <p className="auth-tagline">{register?'إنشاء حساب مستخدم جديد':'دخول المستثمرين ومتابعي الأسعار'}</p>
   <section className="auth-card approved-auth-card">
    <div className="biometric-disabled" aria-disabled="true"><span className="fingerprint-mark">◎</span><strong>الدخول بالبصمة الحيوية</strong><small>غير مفعّل في نسخة الويب الحالية</small></div>
    <div className="auth-separator"><span>{register?'بيانات الحساب':'أو بالبريد الإلكتروني'}</span></div>
    <form onSubmit={submit} aria-busy={isLoading}>
     {register&&<label className="form-group"><span className="form-label">الاسم الكامل</span><input className="form-input" value={name} autoComplete="name" maxLength={80} placeholder="الاسم الكامل" onChange={e=>setName(e.target.value)}/></label>}
     <label className="form-group"><span className="form-label">البريد الإلكتروني</span><input className="form-input" type="email" dir="ltr" autoComplete="email" value={email} required placeholder="user@gold.app" onChange={e=>setEmail(e.target.value)}/></label>
     <label className="form-group"><span className="form-label">كلمة المرور</span><div className="password-row"><input className="form-input" type={visible?'text':'password'} autoComplete={register?'new-password':'current-password'} required minLength={register?8:undefined} value={password} placeholder="••••••••" onChange={e=>setPassword(e.target.value)}/><button type="button" className="text-button password-toggle" onClick={()=>setVisible(!visible)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{visible?'إخفاء':'إظهار'}</button></div></label>
     {register&&<label className="form-group"><span className="form-label">تأكيد كلمة المرور</span><input className="form-input" type={visible?'text':'password'} autoComplete="new-password" required minLength={8} value={confirm} placeholder="أعد كتابة كلمة المرور" onChange={e=>setConfirm(e.target.value)}/><small className="approved-muted">8 أحرف على الأقل.</small></label>}
     {(localError||error)&&<p className="notice error" role="alert">{localError||error}</p>}
     {!register&&<div className="auth-inline-options"><span className="remember-placeholder">✓ جلسة آمنة</span><span className="disabled-link">نسيت كلمة المرور؟ قريبًا</span></div>}
     <button className="gold-btn primary full" disabled={isLoading}>{isLoading?'جارٍ التحقق…':register?'إنشاء الحساب':'تسجيل الدخول'}</button>
     <button type="button" className="gold-btn-outline full" disabled={isLoading} onClick={()=>{clearError();router.replace(register?'/login':'/register');}}>{register?'لدي حساب بالفعل':'إنشاء حساب مستخدم جديد'}</button>
     {!register&&<div className="demo-box"><strong>حساب تجريبي للاختبار</strong><div className="demo-credentials"><code>{DEMO_EMAIL}</code><code>{DEMO_PASSWORD}</code></div><button type="button" className="secondary" disabled={isLoading} onClick={()=>{clearError();setLocalError('');setEmail(DEMO_EMAIL);setPassword(DEMO_PASSWORD);}}>استخدام بيانات الحساب التجريبي</button><p className="fine">لا تستخدم بيانات ذهب حقيقية في الحساب المشترك.</p></div>}
    </form>
    <p className="fine auth-policy">الحساب الجديد بصلاحية مستخدم. صلاحيات التاجر والمدير تُمنح من الإدارة.</p>
   </section>
   <footer className="auth-footer">© 2026 Ibrahim Alneami — All Rights Reserved</footer>
  </section>
 </main>;
}
