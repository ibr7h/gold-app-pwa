import {Language,translateUiText} from './i18n-messages';

/** Public, presentation-only message localization. Never changes API payloads or status codes.
 * Unknown Arabic server text is intentionally not echoed to an EN/FR interface:
 * it may be a new validation response or contain user data. Preserve only mapped,
 * reviewed messages and use a safe generic fallback otherwise.
 */
const backendEnglish:Record<string,readonly [string,string]>={
 'تعذر تحديث سعر الذهب باليورو. لا يوجد سعر يورو موثوق متاح الآن.':['Could not update the EUR gold price. No reliable EUR quote is available now.','Impossible d’actualiser le cours de l’or en euros. Aucun cours EUR fiable n’est disponible actuellement.'],
 'تعذر تحميل الرسم التاريخي باليورو. سعر الذهب الحالي مستقل عن بيانات الرسم.':['Could not load the EUR history chart. The current gold quote is independent of chart data.','Impossible de charger l’historique en euros. Le cours actuel de l’or est indépendant des données du graphique.'],
 'تعذر تحديث تحويل اليورو. لا يوجد سعر يورو موثوق متاح الآن.':['Could not update EUR conversion. No reliable EUR quote is available now.','Impossible d’actualiser la conversion en euros. Aucun cours EUR fiable n’est disponible actuellement.'],
 'لم يكتمل طلب بصمة الجهاز أو أُلغي. جرّب البصمة مرة أخرى أو استخدم رمز الدخول.':['Face ID verification was canceled or not completed. Try again or use your PIN.','La vérification Face ID a été annulée ou incomplète. Réessayez ou utilisez votre code.'],
 'اعتماد بصمة الجهاز غير متاح أو تغير. افتح التطبيق بالرمز ثم أعد تفعيل البصمة من إعدادات الأمان.':['The saved Face ID credential is unavailable or changed. Unlock with your PIN, then re-enable Face ID in security settings.','L\'identifiant Face ID est indisponible ou a changé. Déverrouillez avec votre code puis réactivez Face ID dans les paramètres de sécurité.'],
 'تم تأكيد هوية الجهاز، لكن تعذر استخراج مفتاح فتح الجلسة. استخدم رمز الدخول ثم أعد تفعيل البصمة من إعدادات الأمان.':['Your device verified you, but did not provide the session unlock key. Use your PIN, then re-enable Face ID in security settings.','L’appareil vous a identifié, mais n’a pas fourni la clé de déverrouillage. Utilisez votre code puis réactivez Face ID.'],
 'تعذر فتح الجلسة المشفرة بالبصمة. استخدم رمز الدخول، ثم أعد تفعيل البصمة من إعدادات الأمان.':['Face ID could not open the encrypted session. Use your PIN, then re-enable Face ID in security settings.','Face ID n’a pas pu ouvrir la session chiffrée. Utilisez votre code puis réactivez Face ID dans les paramètres de sécurité.'],
 'تعذر إكمال التحقق من الجلسة لدى الخادم. استخدم رمز الدخول أو كلمة المرور.':['Could not verify the session with the server. Use your quick PIN or password.','Impossible de vérifier la session auprès du serveur. Utilisez votre code rapide ou mot de passe.'],
 'انتهى توثيق الجهاز لدى الخادم. سجّل الدخول بكلمة المرور لإعادة توثيقه، ثم فعّل البصمة مجددًا.':['Server device authorization has expired. Sign in with your password to verify this device, then re-enable Face ID.','L’autorisation de cet appareil a expiré. Connectez-vous avec votre mot de passe, puis réactivez Face ID.'],
 'تعذر الاتصال بخادم ذهبك لإكمال الدخول بالبصمة. تحقق من الإنترنت وحاول مجددًا.':['Could not reach the Dhahabk server to complete Face ID sign-in. Check your connection and try again.','Impossible de joindre le serveur Dhahabk pour terminer la connexion Face ID. Vérifiez votre connexion.'],
 'انتهت مهلة فتح الجلسة بالبصمة. جرّب مجددًا أو ادخل بكلمة المرور.':['Face ID session unlock timed out. Try again or sign in with your password.','Le déverrouillage Face ID a expiré. Réessayez ou connectez-vous avec votre mot de passe.'],
 'تعذر إكمال فتح الجلسة بالبصمة. جرّب رمز الدخول السريع أو الدخول بكلمة المرور.':['Could not complete Face ID sign-in. Try your quick PIN or password.','Connexion Face ID incomplète. Essayez votre code d’accès rapide ou votre mot de passe.'],
 'Invalid credentials':['Incorrect email or password.','Adresse e-mail ou mot de passe incorrect.'],
 'تم تسجيل الدخول إلى حسابك من جهاز أو تطبيق آخر. انتهت الجلسة هنا؛ سجّل الدخول بكلمة المرور لاستعادة الوصول.':['Your account was signed in on another device or app. This session has ended. Sign in with your password to regain access.','Votre compte a été connecté sur un autre appareil ou une autre application. Cette session est terminée. Reconnectez-vous avec votre mot de passe.'],
 'Session replaced by a sign-in on another device':['Your session ended because the account was signed in on another device. Please sign in again.','Votre session a pris fin suite à une connexion sur un autre appareil. Veuillez vous reconnecter.'],
 'استعادة كلمة المرور غير متاحة الآن. حاول لاحقًا.':['Password recovery is unavailable. Try again later.','La récupération du mot de passe est indisponible. Réessayez plus tard.'],
 'رمز الاستعادة غير صحيح أو انتهت صلاحيته.':['The recovery code is incorrect or has expired.','Le code de récupération est incorrect ou a expiré.'],
 'استجابة الاستعادة غير مكتملة.':['The recovery response is incomplete.','La réponse de récupération est incomplète.'],
 'تعذر تغيير كلمة المرور.':['Could not change the password.','Impossible de modifier le mot de passe.'],
 'تم تغيير كلمة المرور. سجّل الدخول مجددًا.':['Password changed. Please sign in again.','Mot de passe modifié. Veuillez vous reconnecter.'],
 'انتهت الجلسة. سجّل الدخول مجددًا.':['Your session has expired. Please sign in again.','Votre session a expiré. Veuillez vous reconnecter.'],
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
