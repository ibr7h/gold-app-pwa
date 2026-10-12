/* Source of truth: all iPhone PWA updater UI texts in Arabic, English and French.
   Loaded before pwa-update.js; language preference is shared with the React app. */
(() => {
  'use strict';
  const messages = {
  "ar": {
    "updateAria": "تحديث تطبيق ذهبي",
    "available": "يتوفر تحديث جديد لذهبي",
    "info": "يمكن تثبيت الإصدار الجديد مع الاحتفاظ بحسابك وبياناتك.",
    "updateNow": "تحديث الآن",
    "later": "لاحقًا",
    "installing": "جارٍ تثبيت التحديث…",
    "retry": "إعادة المحاولة",
    "previousIncomplete": "لم يكتمل التحديث السابق. تحقق من الاتصال وأعد المحاولة.",
    "installFailed": "تعذر تثبيت التحديث الآن. حاول مرة أخرى عند توفر الاتصال.",
    "offline": "لا يوجد اتصال بالإنترنت للتحقق من التحديثات.",
    "current": "تطبيق ذهبي محدّث إلى آخر إصدار",
    "verifyFailed": "تعذر التحقق من التحديثات. حاول مرة أخرى."
  },
  "en": {
    "updateAria": "Update Dhahabi app",
    "available": "A new Dhahabi update is available",
    "info": "Install the new version without losing your account or data.",
    "updateNow": "Update now",
    "later": "Later",
    "installing": "Installing update…",
    "retry": "Try again",
    "previousIncomplete": "The previous update did not complete. Check your connection and try again.",
    "installFailed": "Could not install the update. Try again when you have an internet connection.",
    "offline": "No internet connection to check for updates.",
    "current": "Dhahabi is up to date",
    "verifyFailed": "Could not check for updates. Please try again."
  },
  "fr": {
    "updateAria": "Mettre à jour Dhahabi",
    "available": "Une mise à jour de Dhahabi est disponible",
    "info": "Installez la nouvelle version sans perdre votre compte ni vos données.",
    "updateNow": "Mettre à jour",
    "later": "Plus tard",
    "installing": "Installation de la mise à jour…",
    "retry": "Réessayer",
    "previousIncomplete": "La mise à jour précédente n’a pas abouti. Vérifiez votre connexion et réessayez.",
    "installFailed": "Impossible d’installer la mise à jour. Réessayez avec une connexion Internet.",
    "offline": "Aucune connexion Internet pour rechercher des mises à jour.",
    "current": "Dhahabi est à jour",
    "verifyFailed": "Impossible de rechercher des mises à jour. Réessayez."
  }
};
  const currentLanguage = () => {
    let stored = '';
    try { stored = localStorage.getItem('dhahabi:user:language') || ''; } catch {}
    if (stored === 'ar' || stored === 'en' || stored === 'fr') return stored;
    const html = (document.documentElement.lang || 'ar').slice(0,2).toLowerCase();
    return html === 'en' || html === 'fr' ? html : 'ar';
  };
  window.DhahabiUpdateLocale = Object.freeze({
    language: currentLanguage,
    direction: () => currentLanguage() === 'ar' ? 'rtl' : 'ltr',
    t: key => messages[currentLanguage()]?.[key] || messages.ar[key] || key
  });
})();
