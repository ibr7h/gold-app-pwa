/**
 * Translate failed iOS WebAuthn / vault / server-renewal attempts into
 * safe, actionable UI messages. No credential IDs, JWTs, PINs, or provider
 * diagnostics are written to the page, logs, or telemetry.
 */
type FailureLike={name?:unknown;message?:unknown;status?:unknown};
export type BiometricUnlockPhase='device'|'vault'|'server';
export const BIOMETRIC_UNLOCK_MESSAGES={
 canceled:'لم يكتمل طلب بصمة الجهاز أو أُلغي. جرّب البصمة مرة أخرى أو استخدم رمز الدخول.',
 device:'اعتماد بصمة الجهاز غير متاح أو تغير. افتح التطبيق بالرمز ثم أعد تفعيل البصمة من إعدادات الأمان.',
 prf:'تم تأكيد هوية الجهاز، لكن تعذر استخراج مفتاح فتح الجلسة. استخدم رمز الدخول ثم أعد تفعيل البصمة من إعدادات الأمان.',
 vault:'تعذر فتح الجلسة المشفرة بالبصمة. استخدم رمز الدخول، ثم أعد تفعيل البصمة من إعدادات الأمان.',
 expired:'انتهى توثيق الجهاز لدى الخادم. سجّل الدخول بكلمة المرور لإعادة توثيقه، ثم فعّل البصمة مجددًا.',
 server:'تعذر إكمال التحقق من الجلسة لدى الخادم. استخدم رمز الدخول أو كلمة المرور.',
 offline:'تعذر الاتصال بخادم ذهبك لإكمال الدخول بالبصمة. تحقق من الإنترنت وحاول مجددًا.',
 timeout:'انتهت مهلة فتح الجلسة بالبصمة. جرّب مجددًا أو ادخل بكلمة المرور.',
 replaced:'تم تسجيل الدخول إلى حسابك من جهاز أو تطبيق آخر. انتهت الجلسة هنا؛ سجّل الدخول بكلمة المرور لاستعادة الوصول.',
 fallback:'تعذر إكمال فتح الجلسة بالبصمة. جرّب رمز الدخول السريع أو الدخول بكلمة المرور.'
} as const;

export function biometricUnlockFeedback(error:unknown,phase:BiometricUnlockPhase='device'):string {
 const e=(error&&typeof error==='object'?error:{}) as FailureLike;
 const name=typeof e.name==='string'?e.name:'';
 const message=typeof e.message==='string'?e.message:'';
 const status=typeof e.status==='number'?e.status:0;
 if(name==='BiometricUnlockTimeoutError')return BIOMETRIC_UNLOCK_MESSAGES.timeout;
 if(name==='NotAllowedError'||name==='AbortError')return BIOMETRIC_UNLOCK_MESSAGES.canceled;
 if(name==='SecurityError'||name==='InvalidStateError'||name==='NotSupportedError')return BIOMETRIC_UNLOCK_MESSAGES.device;
 if(message==='Session replaced by a sign-in on another device')return BIOMETRIC_UNLOCK_MESSAGES.replaced;
 if(message.includes('مفتاح التشفير من بصمة الجهاز'))return BIOMETRIC_UNLOCK_MESSAGES.prf;
 if(phase==='vault'&&(name==='OperationError'||name==='DataError'))return BIOMETRIC_UNLOCK_MESSAGES.vault;
 if(message.includes('متصفحك يحتاج رمز الدخول')||
    message.includes('الجلسة المشفرة')||message.includes('تسلسل الاعتماد'))return BIOMETRIC_UNLOCK_MESSAGES.vault;
 if(message.includes('تعذر الاتصال بالخادم')||name==='NetworkError')return BIOMETRIC_UNLOCK_MESSAGES.offline;
 if(status===401||status===403)return BIOMETRIC_UNLOCK_MESSAGES.expired;
 if(status>=500)return BIOMETRIC_UNLOCK_MESSAGES.offline;
 if(phase==='server')return BIOMETRIC_UNLOCK_MESSAGES.server;
 if(phase==='vault')return BIOMETRIC_UNLOCK_MESSAGES.vault;
 if(message.includes('هوية الجهاز')||message.includes('اعتماد الجهاز')||
    message.includes('جهة التحقق')||message.includes('توقيع الجهاز'))return BIOMETRIC_UNLOCK_MESSAGES.device;
 return BIOMETRIC_UNLOCK_MESSAGES.fallback;
}
