import React,{useEffect,useState} from 'react';
import {router} from 'expo-router';
import {useAuth} from '../contexts/AuthContext';
import './user.css';
export default function AuthForm({register=false}:{register?:boolean}){
 const {user,isLoading,error,login,startRegistration,clearError}=useAuth();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[name,setName]=useState(''),[visible,setVisible]=useState(false),[localError,setLocalError]=useState('');
 useEffect(()=>{if(user)router.replace('/');},[user]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(isLoading)return;clearError();setLocalError('');
  if(register&&password!==confirm){setLocalError('كلمتا المرور غير متطابقتين.');return;}
  if(new TextEncoder().encode(password).length>72){setLocalError('كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.');return;}
  try{if(register)await startRegistration(name,email,password);else await login(email,password);}catch{}
 };
 return <main className="gold-web gold-auth" dir="rtl" lang="ar"><section className="auth-intro"><span className="brand-mark">ذ</span><p className="eyebrow">ذهبي · حساب المستخدم</p><h1>ذهبك،<br/>بصورة أوضح.</h1><p>سجّل مقتنياتك، نظّم محافظك، وتابع أسعار الذهب وتنبيهاتك من مكان واحد.</p></section>
 <section className="auth-card"><h2>{register?'إنشاء حساب':'مرحبًا بعودتك'}</h2><p className="muted">{register?'ابدأ بحساب مستخدم جديد.':'سجّل الدخول لمتابعة حسابك.'}</p><form onSubmit={submit} aria-busy={isLoading}>
 {register&&<label>الاسم<input value={name} autoComplete="name" maxLength={80} onChange={e=>setName(e.target.value)}/></label>}
 <label>البريد الإلكتروني<input type="email" dir="ltr" autoComplete="email" value={email} required placeholder="name@example.com" onChange={e=>setEmail(e.target.value)}/></label>
 <label>كلمة المرور<div className="password-row"><input type={visible?'text':'password'} autoComplete={register?'new-password':'current-password'} required minLength={register?8:undefined} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="text-button" onClick={()=>setVisible(!visible)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{visible?'إخفاء':'إظهار'}</button></div></label>
 {register&&<label>تأكيد كلمة المرور<input type={visible?'text':'password'} autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)}/><small className="muted">8 أحرف على الأقل.</small></label>}
 {(localError||error)&&<p className="notice error" role="alert">{localError||error}</p>}
 <button className="primary full" disabled={isLoading}>{isLoading?'جارٍ التحقق…':register?'إنشاء الحساب':'تسجيل الدخول'}</button>
 <button type="button" className="text-button full" disabled={isLoading} onClick={()=>{clearError();router.replace(register?'/login':'/register');}}>{register?'لدي حساب بالفعل':'إنشاء حساب جديد'}</button>
 </form><p className="fine">الحساب الجديد بصلاحية مستخدم. صلاحيات التاجر والمدير تُمنح من الإدارة.</p></section><footer className="auth-footer">© 2026 Ibrahim Alneami — All Rights Reserved</footer></main>;
}
