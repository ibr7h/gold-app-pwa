import React,{useEffect,useRef,useState} from 'react';
import type {User} from '../contexts/AuthContext.web';
import {PIN_LENGTH,type PinResult} from './quick-pin';
import {useLanguage} from './i18n';
import {localizeFeedback} from './i18n-feedback';

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
export function QuickLockScreen({account,biometricEnabled,quickPinEnabled,loading,error:remoteError,onPin,onBiometric,onForgot,onOfflineTools}:{
 account:User;biometricEnabled:boolean;quickPinEnabled:boolean;loading:boolean;error:string|null;
 onPin:(pin:string)=>Promise<PinResult>;onBiometric:()=>Promise<boolean>;onForgot:()=>void;
 onOfflineTools?:()=>void;
}){
 const {language,direction}=useLanguage();
 const [digits,setDigits]=useState(''),[localError,setLocalError]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef(false);
 const biometric=()=>{
  if(pending.current||busy||loading)return;
  pending.current=true;setBusy(true);setDigits('');setLocalError('');
  void onBiometric().then(ok=>{if(!ok)setLocalError('لم تفتح البصمة الجلسة. جرّب الرمز أو الدخول بكلمة المرور.');})
   .catch(()=>setLocalError('تعذر التحقق بالبصمة. استخدم الرمز أو كلمة المرور.'))
   .finally(()=>{pending.current=false;setBusy(false);});
 };
 const nickname=account.name?.trim()||account.email.split('@')[0]||'المستخدم';
 const commit=(value:string)=>{
  if(busy||loading||pending.current||!quickPinEnabled)return;
  if(value.length<PIN_LENGTH){setDigits(value);return;}
  if(value.length!==PIN_LENGTH)return;
  pending.current=true;setBusy(true);setDigits(value);setLocalError('');
  void onPin(value).then(r=>{
   if(!r.ok){
    setLocalError(r.waitSeconds>0?'محاولات كثيرة؛ أُوقف إدخال الرمز مؤقتًا لمدة ١٥ دقيقة. استخدم كلمة المرور.':
     r.remaining>0?'رمز غير صحيح. المحاولات المتبقية: '+r.remaining:'تعذر فتح الجلسة؛ جرّب كلمة المرور.');
    setDigits('');
   }
  }).catch(()=>{setLocalError('تعذر التحقق من الرمز. حاول مرة أخرى.');setDigits('');})
   .finally(()=>{pending.current=false;setBusy(false);});
 };
 const add=(key:string)=>{if(!busy&&digits.length<PIN_LENGTH)commit(digits+key);};
 const erase=()=>{if(!busy)setDigits(x=>x.slice(0,-1));};
 useEffect(()=>{
  const handler=(e:KeyboardEvent)=>{
   if(e.altKey||e.ctrlKey||e.metaKey||e.target instanceof HTMLInputElement||loading)return;
   if(/^\d$/.test(e.key)){e.preventDefault();add(e.key);}
   if(e.key==='Backspace'){e.preventDefault();erase();}
  };
  window.addEventListener('keydown',handler);
  return()=>window.removeEventListener('keydown',handler);
 });
 return <main className="dh-quick-lock" dir={direction} lang={language} aria-busy={busy||loading}>
  <div className="dh-quick-lock-inner">
   <div className="dh-pin-brand"><img src="/gold-app-pwa/full/app_icon_user.jpg" alt={language==='ar'?'ذهبك':'Dhahabk'}/><span>{language==='ar'?'ذهبك':'Dhahabk'}</span></div>
   <div className="dh-pin-identity">
    <span className="dh-pin-avatar" aria-hidden="true">{nickname.slice(0,1).toUpperCase()}</span>
    <p>أهلًا بك</p><h1>{nickname}</h1>
    <small>{quickPinEnabled?'أدخل رمز الدخول السريع لفتح ذهبك':'اضغط على زر البصمة أو استخدم كلمة المرور'}</small>
   </div>
   {quickPinEnabled&&<PinDots length={digits.length}/>}
   <div className="dh-pin-feedback" role="alert">{localizeFeedback(localError||remoteError,language)||' '}</div>
   <button className="dh-pin-forgot" type="button" onClick={onForgot}>نسيت رمز الدخول السريع؟ الدخول بكلمة المرور</button>
   {quickPinEnabled?<Keypad disabled={busy||loading} onDigit={add} onDelete={erase}
    biometric={biometricEnabled} onBiometric={biometric}/>
    :<div className="dh-pin-bio-only">{!biometricEnabled&&<p role="status">بصمة الجهاز غير متاحة حاليًا؛ استخدم كلمة المرور.</p>}</div>}
   {biometricEnabled&&<div className={'dh-pin-bio-only'+(quickPinEnabled?' dh-pin-bio-compact':'')}><button type="button" onClick={biometric} disabled={busy||loading}><FaceMark/> فتح ببصمة الجهاز</button></div>}
   <small className="dh-pin-security-note">يعمل رمز الدخول على هذا الجهاز فقط. يتطلب فتح البيانات جلسة صالحة في خادم ذهبك.</small>
   {onOfflineTools&&<button className="dh-pin-forgot" type="button" disabled={busy||loading} onClick={onOfflineTools}>{language==='en'?'Offline calculator and saved prices':language==='fr'?'Calculatrice hors connexion et cours enregistrés':'الحاسبة والأسعار المحفوظة دون اتصال'}</button>}
     </div>
 </main>;
}
/** Setup and confirmation happen in-app; raw codes are never written to local storage. */
export function QuickPinSetup({onSave,onClose,mode}:{onSave:(pin:string,currentPin?:string,password?:string)=>Promise<void>;onClose:()=>void;mode:'enable'|'change'|'disable'|'reconnect'|'recover'}){
 const {language,direction}=useLanguage();
 const initialStage=mode==='enable'||mode==='recover'?'enter':'current';
 const [stage,setStage]=useState<'current'|'enter'|'confirm'>(initialStage);
 const [currentPin,setCurrentPin]=useState('');
 const [password,setPassword]=useState('');
 const [first,setFirst]=useState(''),[digits,setDigits]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef(false);
 const commit=(value:string)=>{
  if(busy||pending.current)return;
  setDigits(value);
  if(value.length!==PIN_LENGTH)return;
  if(stage==='current'&&mode!=='disable'&&mode!=='reconnect'){
   setCurrentPin(value);setDigits('');setStage('enter');setError('');return;
  }
  if(stage==='enter'){
   setFirst(value);setDigits('');setStage('confirm');setError('');return;
  }
  if(mode!=='disable'&&mode!=='reconnect'&&value!==first){setError('الرمزان غير متطابقين؛ أدخل رمزًا جديدًا.');setFirst('');setDigits('');setStage('enter');return;}
  if(mode==='recover'&&!password){setError('أدخل كلمة مرور حسابك لإعادة تعيين الرمز.');setDigits('');return;}
  pending.current=true;setBusy(true);
  void onSave(mode==='disable'||mode==='reconnect'?'':value,
   mode==='disable'||mode==='reconnect'?value:currentPin||undefined,
   mode==='recover'?password:undefined).then(onClose).catch(e=>{
   setError(e instanceof Error?e.message:'تعذر حفظ الرمز.');setDigits('');setFirst('');setCurrentPin('');setPassword('');setStage(initialStage);
  }).finally(()=>{pending.current=false;setBusy(false);});
 };
 return <div className="dh-pin-setup-backdrop" role="presentation">
  <section className="dh-pin-setup" role="dialog" aria-modal="true" aria-label="إعداد رمز الدخول السريع" dir={direction} lang={language}>
   <div className="dh-pin-setup-head"><h2>{mode==='disable'?'إيقاف رمز الدخول':mode==='change'?'تغيير رمز الدخول':mode==='reconnect'?'تأكيد رمز الدخول المحفوظ':mode==='recover'?'استعادة رمز الدخول السريع':'تفعيل الدخول السريع'}</h2>
    <button type="button" aria-label="إغلاق إعداد الرمز" onClick={onClose} disabled={busy}>×</button></div>
   <p>{stage==='current'?'أدخل رمز الدخول الحالي لتأكيد هويتك.':stage==='enter'?'اختر رمزًا من ٦ أرقام لا تستخدمه في خدمات أخرى.':'أعد إدخال الرمز نفسه لتأكيده.'}</p>
   {mode==='recover'&&<div className="dh-pin-recover-password">
    <label htmlFor="dh-recover-account-password">كلمة مرور حساب ذهبك</label>
    <input id="dh-recover-account-password" type="password" autoComplete="current-password"
     value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}
     placeholder="أدخل كلمة مرور الحساب"/>
    <small>سيُتحقق من كلمة المرور عبر حسابك، ويُستبدل الرمز المحلي فقط. يلزم تفعيل بصمة الجهاز مجددًا بعد الاستعادة.</small>
   </div>}
   <PinDots length={digits.length}/>
   <p className="dh-pin-feedback" role="alert">{localizeFeedback(error,language)||' '}</p>
   <Keypad disabled={busy} onDigit={d=>{if(digits.length<PIN_LENGTH)commit(digits+d);}}
    onDelete={()=>setDigits(x=>x.slice(0,-1))}/>
   <button type="button" className="dh-pin-setup-cancel" onClick={onClose} disabled={busy}>إلغاء</button>
  </section>
 </div>;
}
