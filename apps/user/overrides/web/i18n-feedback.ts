import {Language,translateUiText} from './i18n-messages';

/** Public, presentation-only message localization. Never changes API payloads or status codes.
 * Unknown Arabic server text is intentionally not echoed to an EN/FR interface:
 * it may be a new validation response or contain user data. Preserve only mapped,
 * reviewed messages and use a safe generic fallback otherwise.
 */
const backendEnglish:Record<string,readonly [string,string]>={
 'Invalid credentials':['Incorrect email or password.','Adresse e-mail ou mot de passe incorrect.'],
 'البريد الإلكتروني أو رقم الجوال مسجل بالفعل. استخدم تسجيل الدخول.':['This email or mobile number is already registered. Please sign in.','Cet e-mail ou ce numéro de mobile est déjà enregistré. Connectez-vous.'],
 'أدخل رقم جوال صحيحًا.':['Enter a valid mobile number.','Saisissez un numéro de mobile valide.'],
 'تحقق من رقم الجوال ورمز الدولة المحدد.':['Check the mobile number and selected country calling code.','Vérifiez le numéro de mobile et l’indicatif du pays sélectionné.'],
 'أدخل رقم جوال صحيحًا، مثل 05xxxxxxxx أو رقمًا دوليًا يبدأ بعلامة +.':['Enter a valid Saudi mobile number: 05xxxxxxxx, 5xxxxxxxx or +9665xxxxxxxx.','Saisissez un numéro saoudien valide : 05xxxxxxxx, 5xxxxxxxx ou +9665xxxxxxxx.'],
 'كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.':['The password is too long (maximum 72 bytes).','Le mot de passe est trop long (72 octets maximum).'],
 'التحقق بالبريد غير متاح حاليًا. حاول لاحقًا.':['Email verification is currently unavailable. Please try later.','La vérification par e-mail est actuellement indisponible. Réessayez plus tard.'],
 'تعذر إرسال رمز التحقق. حاول لاحقًا.':['Could not send the verification code. Please try later.','Impossible d’envoyer le code de vérification. Réessayez plus tard.'],
 'رمز التحقق غير صحيح أو انتهت صلاحيته.':['The verification code is incorrect or has expired.','Le code de vérification est incorrect ou a expiré.'],
 'انتهت جلسة التسجيل. أعد إدخال بياناتك لطلب رمز جديد.':['Your registration session has expired. Start again for a new code.','Votre session d’inscription a expiré. Recommencez pour obtenir un nouveau code.'],
 'محاولات كثيرة. انتظر قبل طلب رمز جديد.':['Too many attempts. Wait before requesting another code.','Trop de tentatives. Attendez avant de demander un nouveau code.'],
 'انتظر دقيقة قبل طلب رمز تحقق آخر.':['Please wait one minute before requesting another verification code.','Veuillez patienter une minute avant de demander un nouveau code.'],
 'استجابة التحقق غير مكتملة. حاول لاحقًا.':['The verification response is incomplete. Please try again.','La réponse de vérification est incomplète. Réessayez.'],
 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.':['Could not connect to the service. Check your connection and try again.','Connexion au service impossible. Vérifiez votre connexion et réessayez.'],
 'كلمتا المرور غير متطابقتين.':['The passwords do not match.','Les mots de passe ne correspondent pas.'],
 'أدخل رمز التحقق المكوّن من 6 أرقام.':['Enter the six-digit verification code.','Saisissez le code de vérification à six chiffres.'],
 'Email already exists':['This email is already registered. Please sign in.','Cette adresse e-mail est déjà enregistrée. Veuillez vous connecter.'],
 'Cannot delete a portfolio that has purchases':['Delete the purchases in this portfolio first.','Supprimez d’abord les achats de ce portefeuille.'],
 'User app role mismatch':['Only user accounts can sign in to this app.','Seuls les comptes utilisateurs peuvent se connecter à cette application.'],
 'Unauthorized':['Please sign in again.','Veuillez vous reconnecter.'],
 'Forbidden':['You do not have permission for this action.',"Vous n'êtes pas autorisé à effectuer cette action."],
 'Bad Request':['Please check the entered values.','Veuillez vérifier les valeurs saisies.'],
 'Internal server error':['The server is temporarily unavailable. Please try again later.','Le serveur est temporairement indisponible. Veuillez réessayer plus tard.']
};
const fallback={
 ar:'تعذر تنفيذ الطلب. حاول مرة أخرى.',
 en:'Unable to complete the request. Please try again.',
 fr:'Impossible de traiter la demande. Veuillez réessayer.'
} as const;

/** Used at the point of rendering to also cover errors saved before language switching. */
export function localizeFeedback(message:unknown,language:Language):string{
 if(typeof message!=='string'||!message.trim())return '';
 const raw=message.trim();
 const en=backendEnglish[raw];
 if(en)return language==='ar'?raw:en[language==='en'?0:1];
 const translated=translateUiText(raw,language);
 if(translated!==raw||language==='ar')return translated;
 if(/[\u0600-\u06FF]/.test(raw))return fallback[language];
 // Unrecognized English-language backend errors should not appear in a French UI.
 if(language==='fr'&&/[A-Za-z]/.test(raw))return fallback.fr;
 return raw;
}
