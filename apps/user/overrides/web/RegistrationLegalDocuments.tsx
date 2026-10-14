import React,{useEffect,useRef} from 'react';
import type {Language} from './i18n-messages';

export type RegistrationLegalKind='terms'|'privacy'|'risks';
type Localized=readonly [string,string,string];
type LegalInfo={title:Localized;intro:Localized;points:readonly Localized[]};

const COPY:Record<RegistrationLegalKind,LegalInfo>={
 terms:{
  title:['شروط الاستخدام','Terms of use',"Conditions d’utilisation"],
  intro:[
   'توضح هذه المسودة قواعد استخدام أدوات وخدمات تطبيق ذهبي. يرجى مراجعتها قبل إنشاء الحساب.',
   'This preview draft explains the use of Dhahabi features and tools. Please review it before creating an account.',
   "Cette version préliminaire précise l’utilisation des fonctionnalités de Dhahabi. Veuillez la lire avant de créer un compte."
  ],
  points:[
   ['استخدم بيانات صحيحة عند التسجيل، وحافظ على سرية بيانات الدخول ورموز التحقق.','Provide accurate registration details and protect your credentials and verification codes.',"Saisissez des informations exactes et protégez vos identifiants et codes de vérification."],
   ['استخدم خدمات الأسعار والحاسبة والمحفظة والتنبيهات والعروض بطريقة مشروعة ومسؤولة.','Use price data, the calculator, portfolio, alerts and offers lawfully and responsibly.',"Utilisez les prix, la calculatrice, le portefeuille, les alertes et les offres de façon légale et responsable."],
   ['قد تتغير المعلومات أو تتأخر، ولا يُعد عرض سعر أو نتيجة حساب ضمانًا لإتمام صفقة بالسعر المعروض.','Information may change or be delayed; a displayed price or estimate does not guarantee a transaction at that price.',"Les informations peuvent évoluer ou être différées ; aucun prix affiché ni calcul ne garantit une transaction à ce prix."],
   ['لا تستخدم التطبيق لنشر معلومات مضللة أو للتحايل على الحسابات أو إساءة استخدام خدمات الآخرين.','Do not submit misleading information, bypass account protections or misuse the service.',"Ne diffusez pas de fausses informations et ne contournez pas la sécurité des comptes ou des services."]
  ]
 },
 privacy:{
  title:['سياسة الخصوصية','Privacy policy','Politique de confidentialité'],
  intro:[
   'وصف أولي للبيانات اللازمة لتشغيل نسخة المستخدم؛ يحتاج إلى اعتماد نهائي يطابق ممارسات الخدمة الفعلية.',
   'A preliminary description of data used by the User app; final approval must match actual service operations.',
   "Description préliminaire des données utilisées par l’application ; la version définitive doit refléter le fonctionnement réel du service."
  ],
  points:[
   ['يُستخدم الاسم والبريد الإلكتروني ورقم الجوال لإدارة الحساب والتحقق من التسجيل والتواصل المرتبط بالخدمة.','Name, email and mobile number are used to manage the account, verify registration and support service communications.',"Le nom, l’adresse e-mail et le numéro mobile servent à gérer le compte, vérifier l’inscription et communiquer au sujet du service."],
   ['يمكن معالجة بيانات المحفظة والمشتريات والتنبيهات التي تدخلها لإظهارها ومزامنتها في حسابك.','Portfolio, purchase and alert information you enter may be processed to display and synchronize it with your account.',"Les données saisies dans le portefeuille, les achats et les alertes peuvent être traitées afin de les afficher et synchroniser."],
   ['لا يُطلب الموقع الجغرافي إلا عند استخدام ميزة تحتاج إليه، وبحسب إذن الجهاز وإعداداتك.','Location is requested only for features that need it, subject to your device permission and settings.',"La localisation n’est demandée que pour les fonctions qui en ont besoin, selon vos autorisations et réglages."],
   ['قد تُعالج بيانات تقنية لازمة لتشغيل الجلسة والتحديثات والإشعارات. يجب استكمال مدة الاحتفاظ والجهات المستقبلة ووسائل ممارسة الحقوق قبل الإطلاق الرسمي.','Technical data needed for sessions, updates and notifications may be processed. Retention periods, recipients and rights-contact details must be finalized before public launch.',"Des données techniques peuvent être traitées pour les sessions, les mises à jour et les notifications. La durée de conservation, les destinataires et les contacts relatifs aux droits doivent être précisés avant le lancement public."]
  ]
 },
 risks:{
  title:['تنبيه مخاطر الاستخدام','Usage risk notice',"Avis sur les risques d’utilisation"],
  intro:[
   'المعلومات والحسابات والتنبيهات في ذهبي أدوات مساعدة وليست توصية شراء أو بيع.',
   'Dhahabi price information, calculations and alerts are supporting tools, not buy or sell recommendations.',
   "Les prix, calculs et alertes de Dhahabi sont des outils d’aide, et non des recommandations d’achat ou de vente."
  ],
  points:[
   ['أسعار الذهب والعملات قد تتقلب سريعًا، وقد تختلف أسعار التجار بسبب المصنعية والضرائب والعيار وحالة القطعة.','Gold and currency prices can change rapidly. Dealer prices may differ due to workmanship, taxes, purity and item condition.',"Les prix de l’or et des devises fluctuent. Les prix des bijoutiers dépendent notamment de la façon, des taxes, du titre et de l’état du bijou."],
   ['قد تكون البيانات متأخرة أو غير متاحة عند إغلاق السوق أو تعطل مصادر الأسعار أو الاتصال.','Data may be delayed or unavailable during market closure or when price sources or connectivity fail.',"Les données peuvent être différées ou indisponibles lorsque les marchés sont fermés ou en cas de panne des sources ou du réseau."],
   ['الحاسبة وتحويل العملات تقديريان، ويجب تأكيد الأسعار والأوزان والمصنعية مع التاجر قبل أي معاملة.','Calculations and currency conversions are estimates; confirm price, weight and fees with the dealer before a transaction.',"Les calculs et conversions sont indicatifs ; vérifiez le prix, le poids et les frais auprès du vendeur avant toute transaction."],
   ['قد تتأخر التنبيهات أو لا تصل بسبب إعدادات الجهاز أو الشبكة؛ لا تعتمد عليها وحدها لاتخاذ قرارات مالية.','Alerts may be delayed or not delivered due to device or network conditions; do not rely on them alone for financial decisions.',"Les alertes peuvent être retardées ou manquées en raison du réseau ou de l’appareil ; ne les utilisez pas seules pour décider financièrement."]
  ]
 }
};

function localized(value:Localized,language:Language){return value[language==='ar'?0:language==='en'?1:2];}

export function RegistrationLegalDocuments({kind,language,onClose}:{
 kind:RegistrationLegalKind;language:Language;onClose:()=>void;
}){
 const closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const before=document.activeElement as HTMLElement|null;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();}
   if(event.key==='Tab'){
    const dialog=closeRef.current?.closest('[role="dialog"]');
    const focusable=Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')||[]);
    if(!focusable.length)return;
    if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus();}
    else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus();}
   }
  };
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  document.addEventListener('keydown',onKey);
  closeRef.current?.focus({preventScroll:true});
  return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',onKey);before?.focus?.({preventScroll:true});};
 },[onClose]);
 const doc=COPY[kind];
 const draft=localized(['مسودة للمعاينة — تُراجع قبل الإطلاق الرسمي','Preview draft — review before public launch','Version provisoire — à valider avant le lancement public'],language);
 return <div className="registration-legal-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="registration-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="registration-legal-title"
   dir={language==='ar'?'rtl':'ltr'} lang={language} data-no-translate>
   <header className="registration-legal-header">
    <div><p className="registration-legal-kicker">{draft}</p><h2 id="registration-legal-title">{localized(doc.title,language)}</h2></div>
    <button ref={closeRef} type="button" className="registration-legal-close"
     aria-label={localized(['إغلاق','Close','Fermer'],language)} onClick={onClose}>×</button>
   </header>
   <div className="registration-legal-content" tabIndex={0}>
    <p className="registration-legal-intro">{localized(doc.intro,language)}</p>
    <ul>{doc.points.map((point,index)=><li key={index}>{localized(point,language)}</li>)}</ul>
   </div>
   <footer className="registration-legal-footer">
    <button type="button" className="registration-legal-done" onClick={onClose}>
     {localized(['العودة إلى التسجيل','Back to registration',"Retour à l’inscription"],language)}
    </button>
   </footer>
  </section>
 </div>;
}
