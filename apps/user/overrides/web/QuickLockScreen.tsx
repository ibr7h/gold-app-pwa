import React,{useEffect,useRef,useState} from 'react';
import type {User} from '../contexts/AuthContext.web';
import {PIN_LENGTH,type PinResult} from './quick-pin';
import {APP_DISPLAY_VERSION} from './app-version';

/** Native-like local lock screen. The browser's platform verification UI is invoked only on tap. */
function FaceMark(){
 return <svg viewBox="0 0 48 48" width="35" height="35" aria-hidden="true" fill="none" stroke="currentColor"
  strokeWidth="3.2" strokeLinecap="round"><path d="M15 5H9a4 4 0 0 0-4 4v6M33 5h6a4 4 0 0 1 4 4v6M5 33v6a4 4 0 0 0 4 4h6M43 33v6a4 4 0 0 1-4 4h-6M17 18v5M31 18v5M23 25h2M17 32c4 5 10 5 14 0"/></svg>;
}
function PinDots({length}:{length:number}){
 return <div className="dh-pin-dots" role="status" aria-label={'تم إدخال '+length+' من '+PIN_LENGTH+' أرقام'}>
  {Array.from({length:PIN_LENGTH},(_,i)=><span key={i} className={i<length?'filled':''}/>)}
 </div>;
}
function Keypad({onDigit,onDelete,disabled,biometric,onBiometric}:{onDigit:(d:string)=>void;onDelete:()=>void;disabled:boolean;biometric?:boolean;onBiometric?:()=>void}){
 return <div className="dh-pin-keypad" role="group" aria-label="لوحة أرقام الدخول السريع">
  {['1','2','3','4','5','6','7','8','9','bio','0','delete'].map(key=>{
   if(key==='bio')return biometric?<button type="button" disabled={disabled} className="dh-pin-special dh-pin-bio" aria-label="فتح ببصمة الجهاز" key={key} onClick={onBiometric}><FaceMark/></button>
    :<span key={key}/>;
   if(key==='delete')return <button type="button" disabled={disabled} className="dh-pin-special" aria-label="حذف آخر رقم" key={key} onClick={onDelete}>⌫</button>;
   return <button key={key} type="button" disabled={disabled} className="dh-pin-digit" onClick={()=>onDigit(key)} aria-label={'الرقم '+key}>{key}</button>;
  })}
 </div>;
}
export function QuickLockScreen({account,biometricEnabled,quickPinEnabled,loading,error:remoteError,onPin,onBiometric,onForgot}:{
 account:User;biometricEnabled:boolean;quickPinEnabled:boolean;loading:boolean;error:string|null;
 onPin:(pin:string)=>Promise<PinResult>;onBiometric:()=>Promise<boolean>;onForgot:()=>void;
}){
 const [digits,setDigits]=useState(''),[localError,setLocalError]=useState(''),[busy,setBusy]=useState(false),[blockedUntil,setBlockedUntil]=useState(0),[now,setNow]=useState(Date.now());
 const remainingSeconds=Math.max(0,Math.ceil((blockedUntil-now)/1000));
 const pending=useRef(false);
 const nickname=account.name?.trim()||account.email.split('@')[0]||'المستخدم';
 const commit=(value:string)=>{
  if(busy||loading||pending.current||remainingSeconds>0||!quickPinEnabled)return;
  if(value.length<PIN_LENGTH){setDigits(value);return;}
  if(value.length!==PIN_LENGTH)return;
  pending.current=true;setBusy(true);setDigits(value);setLocalError('');
  void onPin(value).then(r=>{
   if(!r.ok){
    if(r.waitSeconds>0){setNow(Date.now());setBlockedUntil(Date.now()+r.waitSeconds*1000);}
    setLocalError(r.waitSeconds>0?'محاولات كثيرة؛ أُوقف إدخال الرمز مؤقتًا. يمكنك استخدام كلمة المرور.':
     r.remaining>0?'رمز غير صحيح. المحاولات المتبقية: '+r.remaining:'تعذر فتح الجلسة؛ جرّب كلمة المرور.');
    setDigits('');
   }
  }).catch(()=>{setLocalError('تعذر التحقق من الرمز. حاول مرة أخرى.');setDigits('');})
   .finally(()=>{pending.current=false;setBusy(false);});
 };
 const add=(key:string)=>{if(!busy&&digits.length<PIN_LENGTH)commit(digits+key);};
 const erase=()=>{if(!busy)setDigits(x=>x.slice(0,-1));};
 useEffect(()=>{if(!blockedUntil)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[blockedUntil]);
 useEffect(()=>{
  const handler=(e:KeyboardEvent)=>{
   if(e.altKey||e.ctrlKey||e.metaKey||e.target instanceof HTMLInputElement)return;
   if(/^\d$/.test(e.key)){e.preventDefault();add(e.key);}
   if(e.key==='Backspace'){e.preventDefault();erase();}
  };
  window.addEventListener('keydown',handler);
  return()=>window.removeEventListener('keydown',handler);
 });
 return <main className="dh-quick-lock" dir="rtl" lang="ar" aria-busy={busy||loading}>
  <div className="dh-quick-lock-inner">
   <div className="dh-pin-brand"><img src="/gold-app-pwa/full/app_icon_user.jpg" alt="ذهبي"/><span>ذهبي</span></div>
   <div className="dh-pin-identity">
    <span className="dh-pin-avatar" aria-hidden="true">{nickname.slice(0,1).toUpperCase()}</span>
    <p>أهلًا بك</p><h1>{nickname}</h1>
    <small>{quickPinEnabled?'أدخل رمز الدخول السريع لفتح ذهبي':'اضغط على زر البصمة أو استخدم كلمة المرور'}</small>
   </div>
   {quickPinEnabled&&<PinDots length={digits.length}/>}
   <div className="dh-pin-feedback" role="alert">{localError||remoteError||' '}</div>
   {remainingSeconds>0&&<p className="dh-pin-security-note" role="status">يمكن المحاولة بعد {remainingSeconds} ثانية.</p>}
   <button className="dh-pin-forgot" type="button" onClick={onForgot}>نسيت رمز الدخول السريع؟ الدخول بكلمة المرور</button>
   {biometricEnabled&&quickPinEnabled&&<button className="dh-pin-biometric-action" type="button" disabled={busy||loading} onClick={()=>void onBiometric()}><FaceMark/> فتح ببصمة الجهاز</button>}
   {quickPinEnabled?<Keypad disabled={busy||loading||remainingSeconds>0} onDigit={add} onDelete={erase}
    biometric={biometricEnabled} onBiometric={()=>void onBiometric().catch(()=>setLocalError('تعذر التحقق بالبصمة.'))}/>
    :<div className="dh-pin-bio-only">{biometricEnabled?<button type="button" onClick={()=>void onBiometric()} disabled={busy||loading}><FaceMark/> فتح ببصمة الجهاز</button>:<p role="status">بصمة الجهاز غير متاحة حاليًا؛ استخدم كلمة المرور.</p>}</div>}
   <small className="dh-pin-security-note">يعمل رمز الدخول على هذا الجهاز فقط. يتطلب فتح البيانات جلسة صالحة في خادم ذهبي.</small>
   <small className="dh-pin-release" dir="ltr">{APP_DISPLAY_VERSION}</small>
  </div>
 </main>;
}
/** Setup and confirmation happen in-app; raw codes are never written to local storage. */
export function QuickPinSetup({onSave,onClose,mode,onAuthorize,onDisable}:{onSave:(pin:string)=>Promise<void>;onClose:()=>void;mode:'enable'|'change'|'disable';onAuthorize:(password:string)=>Promise<void>;onDisable:()=>Promise<void>}){
 const [stage,setStage]=useState<'authorize'|'enter'|'confirm'>('authorize');
 const [password,setPassword]=useState('');
 const dialog=useRef<HTMLElement>(null);
 const [first,setFirst]=useState(''),[digits,setDigits]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef(false);
 const commit=(value:string)=>{
  if(busy||pending.current||stage==='authorize')return;
  setDigits(value);
  if(value.length!==PIN_LENGTH)return;
  if(stage==='enter'){
   setFirst(value);setDigits('');setStage('confirm');setError('');return;
  }
  if(value!==first){setError('الرمزان غير متطابقين؛ أدخل رمزًا جديدًا.');setFirst('');setDigits('');setStage('enter');return;}
  pending.current=true;setBusy(true);
  void onSave(value).then(onClose).catch(e=>{
   setError(e instanceof Error?e.message:'تعذر حفظ الرمز.');setDigits('');setFirst('');setStage('authorize');
  }).finally(()=>{pending.current=false;setBusy(false);});
 };
 const authorize=async(e:React.FormEvent)=>{
  e.preventDefault();if(busy||pending.current)return;pending.current=true;setBusy(true);setError('');
  try{await onAuthorize(password);setPassword('');if(mode==='disable'){await onDisable();onClose();}else setStage('enter');}
  catch(e){setError(e instanceof Error?e.message:'تعذر تأكيد كلمة المرور.');setPassword('');}
  finally{pending.current=false;setBusy(false);}
 };
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  return()=>previous?.focus();
 },[]);
 useEffect(()=>{
  const handler=(e:KeyboardEvent)=>{
   if(e.key==='Escape'&&!busy){e.preventDefault();onClose();return;}
   if(e.key==='Tab'){
    const elements=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)');
    if(!elements?.length)return;const first=elements[0],last=elements[elements.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
   if(stage!=='authorize'&&!e.altKey&&!e.ctrlKey&&!e.metaKey){
    if(/^\d$/.test(e.key)){e.preventDefault();if(digits.length<PIN_LENGTH)commit(digits+e.key);}
    if(e.key==='Backspace'){e.preventDefault();if(!busy)setDigits(x=>x.slice(0,-1));}
   }
  };
  window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
 });
 return <div className="dh-pin-setup-backdrop" role="presentation">
  <section className="dh-pin-setup" ref={dialog} role="dialog" aria-modal="true" aria-label="إعداد رمز الدخول السريع" dir="rtl">
   <div className="dh-pin-setup-head"><h2>{mode==='change'?'تغيير رمز الدخول':mode==='disable'?'إيقاف رمز الدخول':'تفعيل الدخول السريع'}</h2>
    <button type="button" aria-label="إغلاق إعداد الرمز" onClick={onClose} disabled={busy}>×</button></div>
   <p>{stage==='authorize'?'أكد كلمة مرور حسابك لحماية إعدادات الدخول السريع.':stage==='enter'?'اختر رمزًا من ٦ أرقام لا تستخدمه في خدمات أخرى.':'أعد إدخال الرمز نفسه لتأكيده.'}</p>
   {stage!=='authorize'&&<PinDots length={digits.length}/>}
   <p className="dh-pin-feedback" role="alert">{error||' '}</p>
   {stage==='authorize'?<form onSubmit={e=>void authorize(e)} className="dh-pin-password-form">
    <label>كلمة مرور حساب ذهبي<input type="password" required autoFocus autoComplete="current-password" value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label>
    <button type="submit" disabled={busy}>{busy?'جارٍ التأكيد…':mode==='disable'?'تأكيد وإيقاف الرمز':'تأكيد والمتابعة'}</button>
   </form>:<Keypad disabled={busy} onDigit={d=>{if(digits.length<PIN_LENGTH)commit(digits+d);}}
    onDelete={()=>setDigits(x=>x.slice(0,-1))}/>}
   <button type="button" className="dh-pin-setup-cancel" onClick={onClose} disabled={busy}>إلغاء</button>
  </section>
 </div>;
}
