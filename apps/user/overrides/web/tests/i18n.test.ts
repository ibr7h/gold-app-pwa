import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {LANGUAGE_META,LANGUAGE_OPTIONS,LANGUAGE_KEY,translateUiText,translateExact,translationCount} from '../i18n-messages';
import {amountToLocalizedWords} from '../amount-words-localized';
import {localizeFeedback} from '../i18n-feedback';

describe('Customer-facing connection messages in all supported languages',()=>{
 const messages=[
  'تعذر الاتصال حاليًا. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
  'يستغرق الاتصال وقتًا أطول من المعتاد. يرجى المحاولة بعد قليل.',
  'الخدمة غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.',
  'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  'انتهت جلسة الدخول. يرجى تسجيل الدخول مجددًا.',
  'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.',
  'تعذر إكمال الطلب. يرجى مراجعة البيانات والمحاولة مجددًا.'
 ];
 for(const language of ['en','fr'] as const){
  it('shows human-readable messages without Arabic or developer jargon in '+language,()=>{
   for(const message of messages){
    const output=localizeFeedback(message,language);
    expect(output).not.toMatch(/[\\u0600-\\u06FF]/);
    expect(output).not.toMatch(/API|HTTP|JSON|server|backend|CORS|token/i);
   }
  });
 }
});
describe('Dhahabk offline three-language localization',()=>{
 it('uses the approved commercial brand in Arabic, English and French without changing storage identity',()=>{
  expect(translateUiText('ذهبك','ar')).toBe('ذهبك');
  expect(translateUiText('ذهبك','en')).toBe('Dhahabk');
  expect(translateUiText('ذهبك','fr')).toBe('Dhahabk');
  expect(translateUiText('تطبيق ذهبك','en')).toBe('Dhahabk app');
  expect(translateUiText('تطبيق ذهبك','fr')).toBe('Application Dhahabk');
  expect(LANGUAGE_KEY).toBe('dhahabi:user:language');
 });
 it('supports reversible language selection and correct display direction',()=>{
  expect(LANGUAGE_OPTIONS).toEqual(['ar','en','fr']);
  expect(LANGUAGE_META.ar.dir).toBe('rtl');
  expect(LANGUAGE_META.en.dir).toBe('ltr');
  expect(LANGUAGE_META.fr.dir).toBe('ltr');
  expect(LANGUAGE_META.fr.intl).toBe('fr-FR');
  expect(LANGUAGE_KEY).toBe('dhahabi:user:language');
  expect(translationCount()).toBeGreaterThan(260);
 });
 it('translates navigation and key gold financial labels into both languages',()=>{
  expect(translateUiText('الحاسبة','en')).toBe('Calculator');
  expect(translateUiText('الحاسبة','fr')).toBe('Calculatrice');
  expect(translateUiText('لغة التطبيق','en')).toBe('App language');
  expect(translateUiText('لغة التطبيق','fr')).toBe("Langue de l'application");
  expect(translateUiText('تفاصيل السعر المقدر','en')).toBe('Estimated price breakdown');
  expect(translateUiText('تفاصيل السعر المقدر','fr')).toBe('Détail du prix estimé');
  expect(translateUiText('إعدادات الإشعارات','en')).toBe('Notification settings');
  expect(translateUiText('إعدادات الإشعارات','fr')).toBe('Paramètres des notifications');
 });
 it('does not translate unknown data, mobile numbers or user-entered portfolio names',()=>{
  expect(translateUiText('ذهب الأطفال في جازان','fr')).toBe('ذهب الأطفال في جازان');
  expect(translateUiText('0501234567','fr')).toBe('0501234567');
  expect(translateUiText('المحفظة','ar')).toBe('المحفظة');
  expect(translateExact('unk','en')).toBeNull();
 });
 it('translates Arabic-backed dynamic weight and purity labels without altering numeric values',()=>{
  expect(translateUiText('عيار 24','en')).toBe('Karat 24');
  expect(translateUiText('عيار 21','fr')).toBe('Carats 21');
  expect(translateUiText('  10 جرام  ','fr')).toBe('  10 grammes  ');
 });
 it('spells USD and SAR amounts in the selected language, not always as riyals',()=>{
  expect(amountToLocalizedWords(123.45,'USD','en')).toBe('Only one hundred twenty-three US dollars and forty-five cents.');
  expect(amountToLocalizedWords(1,'USD','en')).toBe('Only one US dollar.');
  expect(amountToLocalizedWords(71.8,'SAR','fr')).toBe('Seulement soixante et onze riyals saoudiens et quatre-vingts halalas.');
  expect(amountToLocalizedWords(21,'USD','fr')).toBe('Seulement vingt et un dollars américains.');
  expect(amountToLocalizedWords(12.3,'USD','ar')).toContain('دولار أمريكي');
  expect(amountToLocalizedWords(12.3,'SAR','ar')).toContain('ريال');
 });
 it('preserves total values, two-decimal words and rejects invalid amounts',()=>{
  expect(amountToLocalizedWords(0,'USD','en')).toBe('Only zero US dollars.');
  expect(amountToLocalizedWords(0,'USD','fr')).toBe('Seulement zéro dollar américain.');
  expect(amountToLocalizedWords(null,'USD','en')).toBe('');
  expect(amountToLocalizedWords(-1,'SAR','fr')).toBe('');
  expect(amountToLocalizedWords(Number.NaN,'USD','en')).toBe('');
 });
});

describe('Regression: no Arabic interface fragments in English or French',()=>{
 const labels=[
  'محفظة','مستخدم','محلات الذهب القريبة','أهلًا بك','لوحة أرقام الدخول السريع',
  'المقارنة','حركة السوق (عيار','24 ساعة','7 أيام','30 يومًا','الفترة الزمنية للرسم',
  'لا توجد تحديثات سعرية كافية لرسم الاتجاه.','بانتظار تحديثات فعلية إضافية من الخادم.',
  'أدخل رمز الدخول السريع لفتح ذهبك','تعذر التحقق بالبصمة. استخدم الرمز أو كلمة المرور.',
  'تحتاج التثبيت على الشاشة الرئيسية','خدمة الإرسال غير مهيأة بعد',
  'اشتراك المتصفح غير مسجل لدى ذهبك','العودة لتسجيل الدخول','تعذر تحميل الأسعار الآن.',
  'الاسم التجاري','النطاق استرشادي؛ يتغير تقريب الخريطة وقد تظهر محلات أبعد.',
  'الوزن الصافي (جم)','سعر الجرام المسجل (شامل)','جارٍ الفحص…',
  'إشعارات ذهبك تعتمد على خدمة Push الخاصة بالمتصفح وتعمل عند إغلاق الصفحة عندما يسمح النظام بذلك. يلزم الاتصال بالإنترنت لتلقي الرسالة.'
 ];
 for(const language of ['en','fr'] as const){
  it(`has translated financial, chart, login, location, notification and PIN content in ${language}`,()=>{
   for(const source of labels){
    const output=translateUiText(source,language);
    expect(output,source).not.toMatch(/[\u0600-\u06FF]/);
    expect(output,source).not.toBe(source);
   }
  });
  it(`translates complete dynamically assembled aria and push messages in ${language}`,()=>{
   for(const source of [
    'تم إدخال 2 من 6 أرقام','رمز غير صحيح. المحاولات المتبقية: 3',
    'إعادة الاختبار بعد 45 ثانية','استعراض أسعار الذهب عيار 24 زمنيًا',
    'حركة السوق (عيار 24)','سعر الجرام · عيار 21',
    'تحديث منذ 10 دقيقة','25 كم'
   ]){
    expect(translateUiText(source,language),source).not.toMatch(/[\u0600-\u06FF]/);
   }
  });
 }
 it('walks PIN lock, PIN setup and main app scopes including accessible value labels',()=>{
  const src=readFileSync(fileURLToPath(new URL('../i18n.tsx',import.meta.url).href),'utf8');
  expect(src).toContain("const ROOTS='.gold-web, .dh-quick-lock, .dh-pin-setup'");
  expect(src).toContain('document.querySelectorAll(ROOTS)');
  expect(src).toContain("'aria-valuetext'");
  expect(src).toContain("root.querySelectorAll('[dir],[data-language-root=\"true\"]')");
  expect(src).toContain("language==='ar'?(original||'rtl'):direction");
 });
});

describe('Extended iPhone Arabic-remnant regressions',()=>{
 const uiStrings=[
  '1. اختر عيار الذهب',
  'عيار 21 · السعر العالمي الاسترشادي، دون مصنعية أو ضريبة',
  'آخر تحديث: 11/10/2026',
  'أونصة 31.1g',
  'الذهب الذي تتابعه',
  'عملية شراء واحدة',
  'كم',
  'الوزن الصافي (جم)',
  'المصنعية / جرام',
  'القيمة السوقية التقديرية',
  'فتح ببصمة الجهاز',
  'تعذر التحقق بالبصمة. استخدم الرمز أو كلمة المرور.',
  'إعادة الاختبار بعد 31 ثانية',
  'سعر الجرام · عيار 24',
  'حركة السوق (عيار 24)',
  '25 كم',
  '37% من الوزن الإجمالي.'
 ];
 for(const language of ['en','fr'] as const){
  it('renders all sampled original Arabic UI messages in '+language,()=>{
   for(const text of uiStrings){
    const out=translateUiText(text,language);
    expect(out,text).not.toMatch(/[\u0600-\u06FF]/);
   }
  });
 }
 it('keeps unrecognized customer names untouched rather than auto-translating them',()=>{
  expect(translateUiText('اسم المشتري الفعلي في الحساب','en')).toBe('اسم المشتري الفعلي في الحساب');
  expect(translateUiText('ذهب الأطفال في جازان','fr')).toBe('ذهب الأطفال في جازان');
 });
 it('restores original RTL direction from any initial language and covers PIN overlay',()=>{
  const src=readFileSync(fileURLToPath(new URL('../i18n.tsx',import.meta.url).href),'utf8');
  expect(src).toContain('el===root?direction:');
  expect(src).toContain('.dh-quick-lock, .dh-pin-setup');
  expect(src).toContain("'aria-valuetext'");
 });
});

describe('Localized iPhone actions and portfolio summary regressions',()=>{
 const workspace=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
 const css=readFileSync(fileURLToPath(new URL('../user.css',import.meta.url).href),'utf8');
 it('has correct English and French labels for all three overlooked actions',()=>{
  const labels=[
   ['تسجيل شراء','Record purchase','Enregistrer un achat'],
   ['تنبيه جديد','New alert','Nouvelle alerte'],
   ['التحقق من تحديث التطبيق','Check for app updates','Rechercher des mises à jour'],
   ['محفظتي الذهبية','My gold portfolio',"Mon portefeuille d'or"],
   ['التفاصيل ←','Details','Détails'],
   ['إجمالي الوزن:','Total weight:','Poids total :'],
   ['جرام','gram','gramme']
  ] as const;
  for(const [ar,en,fr] of labels){
   expect(translateUiText(ar,'en')).toBe(en);
   expect(translateUiText(ar,'fr')).toBe(fr);
   expect(translateUiText(ar,'ar')).toBe(ar);
  }
 });
 it('supports both whole and decimal gram weights in the chosen locale',()=>{
  expect(translateUiText('154.00 جرام','en')).toBe('154.00 grams');
  expect(translateUiText('154.00 جرام','fr')).toBe('154.00 grammes');
  expect(translateUiText('154.00 جرام','ar')).toBe('154.00 جرام');
 });
 it('renders critical labels directly from selected locale instead of post-render DOM mutation',()=>{
  expect(workspace).toContain("const tr=(source:string)=>translateUiText(source,language)");
  for(const label of ['تسجيل شراء','تنبيه جديد','التحقق من تحديث التطبيق','محفظتي الذهبية','التفاصيل ←','إجمالي الوزن:','جرام']){
   expect(workspace).toContain("tr('"+label+"')");
  }
  expect(workspace).toContain("number(homePortfolio.weight)");
  expect(workspace).toContain("homePortfolio.percent");
  expect(workspace).toContain("money(Math.abs(homePortfolio.difference),priceCurrency)");
  expect(workspace).toContain("window.dispatchEvent(new Event('dhahabi:user-check-update'))");
 });
 it('keeps the portfolio amounts, decimal portions, and currency symbol together on small screens',()=>{
  expect(css).toContain('/* Keep large localized portfolio amounts intact on narrow iPhone screens. */');
  expect(css).toContain('flex-wrap:wrap!important;justify-content:space-between;row-gap:8px;');
  expect(css).toContain('.portfolio-mini-body .dh-money-fraction');
  expect(css).toContain('white-space:nowrap!important;');
 });
});

describe('Complete invoice details and optional purchase form localization',()=>{
 const form=readFileSync(fileURLToPath(new URL('../PurchaseFormFields.tsx',import.meta.url).href),'utf8');
 const workspace=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
 const css=readFileSync(fileURLToPath(new URL('../user.css',import.meta.url).href),'utf8');
 const invoiceLabels=[
  'بيانات الفاتورة','اختياري','اسم المتجر','عنوان المحل','اسم المشتري',
  'رقم الفاتورة','السجل التجاري','هاتف المتجر','حالة المشغول',
  'غير محدد','جديد','مستعمل','الدمغة','علامة الصانع',
  'وزن القطعة (جم)','وزن الأحجار (جم)','وصف القطعة','تفاصيل الأحجار',
  'اسم الحجر','نوع الحجر','لون الحجر','شكل الحجر','درجة النقاء/الجودة',
  'نوع القطع/التشطيب','العيوب إن وجدت','سلامة الحجر من الخدش أو الكسر',
  'لإكمال توثيق الفاتورة يُستحسن إضافة:',
  'هذه البيانات اختيارية لتسجيل مشترياتك السابقة.',
  'هذه بيانات مرجعية فقط؛ ولا تعني التحقق الرسمي من الفاتورة. احتفظ بالفاتورة الأصلية.'
 ];
 it('translates invoice details, Optional and all invoice fields in English and French',()=>{
  expect(translateUiText('بيانات الفاتورة','en')).toBe('Invoice details');
  expect(translateUiText('بيانات الفاتورة','fr')).toBe('Détails de la facture');
  expect(translateUiText('اختياري','en')).toBe('Optional');
  expect(translateUiText('اختياري','fr')).toBe('Facultatif');
  for(const lang of ['en','fr'] as const){
   for(const label of invoiceLabels)expect(translateUiText(label,lang),label).not.toMatch(/[\u0600-\u06FF]/);
  }
 });
 it('translates labels reactively inside PurchaseFormFields rather than relying on a DOM walker',()=>{
  expect(form).toContain("const {language,direction}=useLanguage()");
  expect(form).toContain("dir={direction} lang={language}");
  expect(form).toContain("<summary>{tr('بيانات الفاتورة')} <small>{tr('اختياري')}</small></summary>");
  for(const label of invoiceLabels.filter(v=>!['غير محدد','جديد','مستعمل'].includes(v))){
   expect(form,'missing direct translation for '+label).toContain("tr('"+label+"')");
  }
  for(const name of ['sellerName','sellerAddress','buyerName','invoiceNumber','sellerCommercialRegistration','stoneWeightGrams','itemDescription']){
   expect(form).toContain('name="'+name+'"');
  }
 });
 it('localizes purchase modal title and action buttons without changing submit and handlers',()=>{
  expect(workspace).toContain("<h2 id=\"dialog-title\">{tr(confirm?");
  expect(workspace).toContain("tr('إلغاء')");
  expect(workspace).toContain("tr(busy?'جارٍ الحفظ…':'حفظ')");
  expect(workspace).toContain('dir={direction} lang={language} aria-modal="true"');
  expect(workspace).toContain("<PurchaseFormFields key={dialog.purchase?.id||'new'}");
  expect(form).toContain('name="currency"');
  expect(form).toContain('name="invoiceTotal"');
  expect(form).toContain('name="vatRate"');
  expect(form).toContain('name="pricingMode"');
 });
 it('uses correct RTL Arabic and LTR English/French layout for invoice details',()=>{
  expect(css).toContain('/* Localized purchase/invoice modal: keep RTL Arabic and real LTR EN/FR layouts. */');
  expect(css).toContain('.dialog[dir="ltr"] .gold-purchase-form label');
  expect(css).toContain('.dialog[dir="ltr"] .gold-purchase-form input[type="date"]');
 });
});

describe('Concise gold-price disclaimer in all languages',()=>{
 it('shows only the costs-excluded note in Arabic, English and French',()=>{
  const ar='لا تشمل الأسعار المصنعية أو الضريبة أو هامش المتجر.';
  expect(translateUiText(ar,'ar')).toBe(ar);
  expect(translateUiText(ar,'en')).toBe('Prices exclude workmanship charges, taxes, and dealer margins.');
  expect(translateUiText(ar,'fr')).toBe('Les prix n’incluent pas les frais de fabrication, les taxes ni la marge du commerçant.');
 });
 it('renders the exact short notice without the old backend/source explanation',()=>{
  const source=readFileSync(fileURLToPath(new URL('../UserWorkspace.tsx',import.meta.url).href),'utf8');
  const catalog=readFileSync(fileURLToPath(new URL('../i18n-messages.ts',import.meta.url).href),'utf8');
  expect(source).toContain("const priceNote=<p className=\"fine\">{tr('لا تشمل الأسعار المصنعية أو الضريبة أو هامش المتجر.')}</p>;");
  expect(source).not.toContain('جميع الأسعار في هذه النسخة تأتي من Backend');
  expect(catalog).not.toContain('All prices come from Dhahabk');
  expect(catalog).not.toContain('Tous les prix proviennent du serveur Dhahabk');
 });
});

describe('Real purchase invoice aliases and localized backend errors',()=>{
 it('translates the actual short invoice captions and their legacy alternatives',()=>{
  const fields=[
   ['العنوان','Address','Adresse'],['المشتري','Buyer','Acheteur'],
   ['حالة القطعة','Item condition',"État de l'article"],
   ['جودة الحجر','Stone quality','Qualité de la pierre'],
   ['القطع والتشطيب','Cut and finish','Taille et finition'],
   ['عيوب الحجر','Stone defects','Défauts de la pierre'],
   ['سلامة الحجر','Stone integrity','État de la pierre'],
   ['وصف المشغول','Jewelry description','Description du bijou']
  ] as const;
  for(const [ar,en,fr] of fields){
   expect(translateUiText(ar,'en')).toBe(en);
   expect(translateUiText(ar,'fr')).toBe(fr);
   expect(translateUiText(ar,'ar')).toBe(ar);
  }
 });
 it('localizes real server failures, session expiry, validations, and generic request errors',()=>{
  const errors=[
   'تعذر تنفيذ الطلب.','تعذر إكمال العملية. حاول مرة أخرى.',
   'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.',
   'الخادم غير متاح حاليًا. حاول لاحقًا.',
   'انتهت الجلسة. سجّل الدخول مجددًا.',
   'ليست لديك صلاحية لهذه العملية.',
   'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
   'إحداثيات الموقع غير صالحة.'
  ];
  for(const error of errors)for(const lang of ['en','fr'] as const)
   expect(localizeFeedback(error,lang),error).not.toMatch(/[\u0600-\u06FF]/);
  expect(localizeFeedback('تعذر تنفيذ الطلب.','en')).toBe('Unable to complete the request.');
  expect(localizeFeedback('تعذر تنفيذ الطلب.','fr')).toBe('Impossible de traiter la demande.');
  expect(localizeFeedback('تعذر تنفيذ الطلب.','ar')).toBe('تعذر تنفيذ الطلب.');
 });
 it('handles unknown Arabic server text safely without leaking untranslated messages into English or French',()=>{
  const message='خطأ جديد غير معروف في الخادم';
  expect(localizeFeedback(message,'en')).toBe('Unable to complete the request. Please try again.');
  expect(localizeFeedback(message,'fr')).toBe('Impossible de traiter la demande. Veuillez réessayer.');
  expect(localizeFeedback(message,'ar')).toBe(message);
  expect(localizeFeedback('Invalid credentials','en')).toBe('Incorrect email or password.');
  expect(localizeFeedback('Invalid credentials','fr')).toBe('Adresse e-mail ou mot de passe incorrect.');
  expect(localizeFeedback(null,'en')).toBe('');
 });
 it('covers all primary customer-facing errors and warnings on iPhone screens',()=>{
  for(const [file,needle] of [
   ['../UserWorkspace.tsx','localizeFeedback(formError,language)'],
   ['../AuthForm.tsx','localizeFeedback(localError||error,language)'],
   ['../UserPersonalDetails.tsx','localizeFeedback(error,language)'],
   ['../NotificationSettings.tsx','localizeFeedback(error,language)'],
   ['../NearbyMarkets.tsx','localizeFeedback(failure,language)'],
   ['../QuickLockScreen.tsx','localizeFeedback(localError||remoteError,language)']
  ] as const){
   const source=readFileSync(fileURLToPath(new URL(file,import.meta.url).href),'utf8');
   expect(source,file).toContain(needle);
  }
 });
 it('keeps the entire invoice explanation readable, not a clipped dangling These fragment',()=>{
  const form=readFileSync(fileURLToPath(new URL('../PurchaseFormFields.tsx',import.meta.url).href),'utf8');
  const css=readFileSync(fileURLToPath(new URL('../user.css',import.meta.url).href),'utf8');
  const ar='هذه بيانات مرجعية فقط؛ ولا تعني التحقق الرسمي من الفاتورة. احتفظ بالفاتورة الأصلية.';
  expect(form).toContain("tr('"+ar+"')");
  for(const lang of ['en','fr'] as const)expect(translateUiText(ar,lang)).not.toMatch(/[\u0600-\u06FF]/);
  expect(css).toContain('/* Long English and French invoice guidance must wrap completely on iPhone. */');
  expect(css).toContain('overflow-wrap:break-word;word-break:normal;line-height:1.7');
 });
});


describe('Registration errors respect selected language',()=>{
 it('shows an actionable error for invalid Saudi phone instead of a generic failure',()=>{
  const text='أدخل رقم جوال صحيحًا، مثل 05xxxxxxxx أو رقمًا دوليًا يبدأ بعلامة +.';
  expect(localizeFeedback(text,'en')).toContain('Saudi mobile number');
  expect(localizeFeedback(text,'fr')).toContain('numéro saoudien');
  expect(localizeFeedback(text,'ar')).toContain('رقم جوال');
 });
 it('translates actual duplicate-email and OTP-delivery errors',()=>{
  expect(localizeFeedback('البريد الإلكتروني أو رقم الجوال مسجل بالفعل. استخدم تسجيل الدخول.','en')).toContain('already registered');
  expect(localizeFeedback('تعذر إرسال رمز التحقق. حاول لاحقًا.','fr')).toContain('code de vérification');
 });
});
