export type PushHealth='unsupported'|'install-required'|'blocked'|'permission-required'|'server-unavailable'|'not-configured'|'subscription-missing'|'server-missing'|'ready';
export interface PushConditions {supported:boolean;iosInstallRequired:boolean;permission:'default'|'granted'|'denied'|'unavailable';serverReachable:boolean;serverConfigured:boolean;localSubscribed:boolean;serverRegistered:boolean}
export function classifyPush(c:PushConditions):PushHealth{
 if(c.iosInstallRequired)return 'install-required';
 if(!c.supported)return 'unsupported';
 if(c.permission==='denied')return 'blocked';
 if(!c.serverReachable)return 'server-unavailable';
 if(!c.serverConfigured)return 'not-configured';
 if(c.permission!=='granted')return 'permission-required';
 if(!c.localSubscribed)return 'subscription-missing';
 if(!c.serverRegistered)return 'server-missing';
 return 'ready';
}
export function humanStatus(s:PushHealth):string{
 return {
  'unsupported':'غير مدعومة في هذا المتصفح','install-required':'تحتاج التثبيت على الشاشة الرئيسية',
  'blocked':'محظورة من إعدادات الجهاز أو المتصفح','permission-required':'تحتاج السماح بالإشعارات',
  'server-unavailable':'تعذر التحقق من الخادم','not-configured':'خدمة الإرسال غير مهيأة بعد',
  'subscription-missing':'تحتاج تسجيل اشتراك هذا الجهاز',
  'server-missing':'اشتراك المتصفح غير مسجل لدى ذهبي',
  'ready':'مفعّلة ومشتركة في خادم ذهبي'
 }[s];
}
