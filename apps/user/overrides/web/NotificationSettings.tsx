import React,{useCallback,useEffect,useRef,useState} from 'react';
import {enablePush,disablePush,inspectPush,testPush,BrowserPushSnapshot} from './push-client';
import {humanStatus} from './push-status';
import {errorMessage} from './api';
import './user.css';

const asDate=(value:string|null)=>value&&Number.isFinite(Date.parse(value))
 ?new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'لا يوجد اختبار مسجل';
const stateNote:Record<string,string>={
 'unsupported':'استخدم متصفحًا يدعم Web Push على اتصال HTTPS. ستبقى التنبيهات ظاهرة داخل ذهبي حتى دون دعم Push.',
 'install-required':'على iPhone: افتح ذهبي في Safari، اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية». افتح التطبيق من الأيقونة وارجع إلى إعدادات الإشعارات.',
 'blocked':'أُوقف الإذن من خارج التطبيق. لا يمكن لذهبي تغييره نيابةً عنك؛ اتبع تعليمات جهازك أسفل الصفحة.',
 'permission-required':'لم تسمح بإشعارات هذا الموقع بعد. اختر «تفعيل الإشعارات» ووافق على طلب النظام.',
 'server-unavailable':'تعذر الاتصال بخدمة Push أو التحقق من الحساب. تحقق من اتصال الإنترنت ثم حدّث الحالة.',
 'not-configured':'لم يُفعّل مسؤول الخادم مفاتيح Web Push بعد. لا يتيح التطبيق اختبارًا مزيفًا في هذه الحالة.',
 'subscription-missing':'إذن الإشعارات متاح، لكن هذا المتصفح لم يسجّل اشتراكًا بعد.',
 'server-missing':'يوجد اشتراك في المتصفح لكنه غير معروف للخادم؛ اضغط «إصلاح الاشتراك».',
 'ready':'إذن المتصفح مسموح، واشتراك الجهاز مسجل لدى خادم ذهبي. يمكن اختبار إرسال رسالة فعلية.'
};

export default function NotificationSettings(){
 const [state,setState]=useState<BrowserPushSnapshot|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState(''),[error,setError]=useState('');
 const [awaitingConfirmation,setAwaitingConfirmation]=useState(false);
 const [userConfirmed,setUserConfirmed]=useState(false);
 const mounted=useRef(true);
 const refresh=useCallback(async()=>{
  try{
   const result=await inspectPush();
   if(mounted.current)setState(result);
  }catch(e){if(mounted.current)setError('تعذر قراءة حالة الإشعارات.');}
  finally{if(mounted.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  mounted.current=true;void refresh();
  const onFocus=()=>{if(document.visibilityState==='visible')void refresh();};
  window.addEventListener('focus',onFocus);
  window.addEventListener('online',onFocus);
  document.addEventListener('visibilitychange',onFocus);
  return()=>{mounted.current=false;window.removeEventListener('focus',onFocus);
   window.removeEventListener('online',onFocus);document.removeEventListener('visibilitychange',onFocus);};
 },[refresh]);
 const run=async(op:()=>Promise<void>,success:string)=>{
  if(busy)return;
  setBusy(true);setFeedback('');setError('');setUserConfirmed(false);
  try{await op();if(mounted.current)setFeedback(success);}
  catch(e){if(mounted.current)setError(e instanceof Error?e.message:errorMessage(e));}
  finally{await refresh();if(mounted.current)setBusy(false);}
 };
 const enabled=state?.health==='ready';
 const recoverable=state&&(['permission-required','subscription-missing','server-missing'].includes(state.health));
 const info=state?.health||'server-unavailable';
 return <div className="dh-push-settings" dir="rtl">
  <section className="approved-card dh-push-summary">
   <div className="approved-card-title"><span>حالة إشعارات الجهاز</span>
    <span className={'pill '+(enabled?'good':info==='blocked'?'warn':'')}>{loading?'جارٍ الفحص…':humanStatus(info)}</span>
   </div>
   <p className="approved-muted" role="status">{loading?'نتحقق من إذن المتصفح واشتراك Push والاتصال بالخادم…':stateNote[info]}</p>
   <dl className="dh-push-facts">
    <div><dt>إذن المتصفح</dt><dd>{state?.conditions.permission==='granted'?'مسموح':state?.conditions.permission==='denied'?'مرفوض':state?.conditions.permission==='default'?'لم يُطلب بعد':'غير متاح'}</dd></div>
    <div><dt>اشتراك المتصفح</dt><dd>{state?.conditions.localSubscribed?'موجود':'غير موجود'}</dd></div>
    <div><dt>الاشتراك لدى الخادم</dt><dd>{state?.conditions.serverRegistered?'مسجل':state?.conditions.serverReachable?'غير مسجل':'تعذر التحقق'}</dd></div>
    <div><dt>خدمة الإرسال</dt><dd>{state?.conditions.serverConfigured?'مهيأة':state?.conditions.serverReachable?'غير مهيأة':'تعذر التحقق'}</dd></div>
   </dl>
   <div className="dh-push-actions">
    {recoverable&&<button type="button" className="primary" disabled={busy||loading}
     onClick={()=>void run(()=>enablePush(state.config,info==='server-missing'), 'سُجل هذا الجهاز لدى خدمة إشعارات ذهبي.')}>
     {busy?'جارٍ التنفيذ…':info==='server-missing'?'إصلاح الاشتراك':'تفعيل الإشعارات'}
    </button>}
    {enabled&&<button className="primary" type="button" disabled={busy}
     onClick={()=>void run(async()=>{
      if(!state?.endpoint)throw new Error('اشتراك هذا الجهاز غير متاح.');
      const result=await testPush(state.endpoint);
      if(!result.accepted)throw new Error('لم يقبل مزود Push رسالة الاختبار ('+result.providerStatus+').');
      if(mounted.current){setAwaitingConfirmation(true);setUserConfirmed(false);}
     },'قبل مزود Push رسالة الاختبار. انتظر إشعار الجهاز؛ هذا لا يؤكد ظهوره.')}>
     إرسال إشعار اختبار حقيقي
    </button>}
    {enabled&&<button type="button" className="secondary" disabled={busy}
     onClick={()=>void run(disablePush,'تم إلغاء اشتراك الإشعارات على هذا الجهاز.')}>إيقاف إشعارات هذا الجهاز</button>}
    <button type="button" className="secondary" disabled={busy||loading} onClick={()=>{setLoading(true);void refresh();}}>
     إعادة فحص الحالة
    </button>
   </div>
   {feedback&&<p className="notice success" role="status">{feedback}</p>}
   {error&&<p className="notice error" role="alert">{error}</p>}
   {state?.message&&<p className="notice warning" role="status">{state.message}</p>}
   {awaitingConfirmation&&<div className="dh-push-confirm">
    <p>{userConfirmed?'أكدت أنت مشاهدة الإشعار على هذا الجهاز.':'هل ظهر إشعار ذهبي على جهازك؟ قد يتأخر أو تمنعه إعدادات النظام.'}</p>
    {!userConfirmed&&<button type="button" className="secondary" onClick={()=>setUserConfirmed(true)}>نعم، ظهر الإشعار</button>}
   </div>}
   <div className="dh-push-last"><span>آخر اختبار أُرسل:</span><strong>{asDate(state?.lastTestAt||null)}</strong></div>
   <div className="dh-push-last"><span>آخر قبول لدى مزود Push:</span><strong>{asDate(state?.lastAcceptedAt||null)}</strong></div>
   <p className="fine">قبول مزود Push للرسالة لا يضمن وصولها أو ظهورها على شاشة الجهاز. لا يمكن للتطبيق قراءة حالة وضع التركيز أو كتم إشعارات النظام بالكامل.</p>
  </section>
  <section className="approved-card dh-push-guide">
   <div className="approved-card-title">إرشادات جهازك</div>
   {state?.ios?<div>
    <h3>iPhone / iPad</h3>
    <p>تتطلب إشعارات الويب في iOS 16.4 فأحدث إضافة ذهبي للشاشة الرئيسية. افتحه من الأيقونة، ثم اسمح بالإشعارات عند طلبها. إذا كانت محظورة: الإعدادات ← الإشعارات ← ذهبي، وتحقق من السماح بالإشعارات وأوضاع التركيز.</p>
   </div>:<div>
    <h3>Android والكمبيوتر</h3>
    <p>في Chrome: إعدادات الموقع ← الإشعارات ← السماح. وتحقق أيضًا من إعدادات إشعارات النظام. على Android يمكن الاستقبال من Chrome الداعم دون اشتراط تثبيت PWA، وقد تؤثر قيود البطارية والاتصال.</p>
   </div>}
   <p className="fine">إشعارات ذهبي تعتمد على خدمة Push الخاصة بالمتصفح وتعمل عند إغلاق الصفحة عندما يسمح النظام بذلك. يلزم الاتصال بالإنترنت لتلقي الرسالة.</p>
  </section>
 </div>;
}
