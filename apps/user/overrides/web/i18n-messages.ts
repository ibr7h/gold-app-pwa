import {chartRangeMessages} from './i18n-chart-ranges';
import {marketPushMessages} from './i18n-market-push';
import {helpNavMessages} from './gold-help-content';
import {followupUiMessages} from './i18n-followup';
import {invoiceAndErrorMessages} from './i18n-invoice-errors';
import {uncoveredUiMessages,secondaryUiMessages} from './i18n-coverage';
/** Human-reviewed terminology for Dhahabi User interface. No network translation. */
export type Language='ar'|'en'|'fr';
export const LANGUAGE_KEY='dhahabi:user:language';
export const LANGUAGE_OPTIONS:readonly Language[]=['ar','en','fr'];
export const LANGUAGE_META={
 ar:{label:'العربية',nativeLabel:'العربية',dir:'rtl',intl:'ar-SA'},
 en:{label:'English',nativeLabel:'English',dir:'ltr',intl:'en-US'},
 fr:{label:'Français',nativeLabel:'Français',dir:'ltr',intl:'fr-FR'}
} as const;
const entries:ReadonlyArray<readonly [string,string,string]>=[
 [
  "الرئيسية",
  "Home",
  "Accueil"
 ],
 [
  "الأسعار",
  "Prices",
  "Cours"
 ],
 [
  "الحاسبة",
  "Calculator",
  "Calculatrice"
 ],
 [
  "المحفظة",
  "Portfolio",
  "Portefeuille"
 ],
 [
  "المزيد",
  "More",
  "Plus"
 ],
 [
  "المشتريات",
  "Purchases",
  "Achats"
 ],
 [
  "التنبيهات",
  "Alerts",
  "Alertes"
 ],
 [
  "إعدادات الإشعارات",
  "Notification settings",
  "Paramètres des notifications"
 ],
 [
  "التجار القريبون",
  "Nearby gold dealers",
  "Bijoutiers à proximité"
 ],
 [
  "الملف الشخصي",
  "Profile",
  "Profil"
 ],
 [
  "المساعدة",
  "Help",
  "Aide"
 ],
 [
  "المستخدم",
  "User",
  "Utilisateur"
 ],
 [
  "ذهبي",
  "Dhahabi",
  "Dhahabi"
 ],
 [
  "تسجيل الدخول",
  "Sign in",
  "Connexion"
 ],
 [
  "تسجيل الخروج",
  "Sign out",
  "Déconnexion"
 ],
 [
  "إنشاء الحساب",
  "Create account",
  "Créer un compte"
 ],
 [
  "إعدادات إشعارات الجهاز",
  "Device notification settings",
  "Paramètres de notification de l'appareil"
 ],
 [
  "حساب المستخدم",
  "User account",
  "Compte utilisateur"
 ],
 [
  "قائمة التنقل",
  "Navigation menu",
  "Menu de navigation"
 ],
 [
  "القائمة الرئيسية",
  "Main menu",
  "Menu principal"
 ],
 [
  "التنقل السريع",
  "Quick navigation",
  "Navigation rapide"
 ],
 [
  "مرحبًا بعودتك",
  "Welcome back",
  "Bon retour"
 ],
 [
  "أضف اسمك",
  "Add your name",
  "Ajoutez votre nom"
 ],
 [
  "نجهّز ذهبي لك…",
  "Preparing Dhahabi…",
  "Préparation de Dhahabi…"
 ],
 [
  "قد يستغرق التشغيل الأول بضع ثوانٍ.",
  "First launch may take a few seconds.",
  "Le premier lancement peut prendre quelques secondes."
 ],
 [
  "تحديث الأسعار",
  "Refresh prices",
  "Actualiser les prix"
 ],
 [
  "جارٍ التحديث…",
  "Refreshing…",
  "Actualisation…"
 ],
 [
  "إعادة المحاولة",
  "Try again",
  "Réessayer"
 ],
 [
  "جارٍ تحميل بيانات حسابك…",
  "Loading account data…",
  "Chargement des données du compte…"
 ],
 [
  "فتح الملف الشخصي",
  "Open profile",
  "Ouvrir le profil"
 ],
 [
  "فتح التنبيهات",
  "Open alerts",
  "Ouvrir les alertes"
 ],
 [
  "فتح قائمة التنقل",
  "Open navigation menu",
  "Ouvrir le menu"
 ],
 [
  "العودة للرئيسية",
  "Back to home",
  "Retour à l'accueil"
 ],
 [
  "إغلاق القائمة",
  "Close menu",
  "Fermer le menu"
 ],
 [
  "السوق العالمي مغلق",
  "Global market closed",
  "Marché mondial fermé"
 ],
 [
  "آخر سعر محفوظ",
  "Last saved quote",
  "Dernier cours enregistré"
 ],
 [
  "آخر سعر مسجل",
  "Last recorded price",
  "Dernier cours enregistré"
 ],
 [
  "مباشر",
  "Live",
  "En direct"
 ],
 [
  "غير متاح",
  "Unavailable",
  "Indisponible"
 ],
 [
  "سعر الذهب الآن",
  "Gold price now",
  "Cours de l'or actuel"
 ],
 [
  "سعر الذهب الآن عيار 24",
  "24K gold price now",
  "Cours actuel de l'or 24 carats"
 ],
 [
  "آخر سعر مسجل عيار 24",
  "Last recorded 24K price",
  "Dernier cours 24 carats"
 ],
 [
  "آخر سعر مسجل - عيار 24",
  "Last recorded price — 24K",
  "Dernier cours enregistré — 24 carats"
 ],
 [
  "سعر الذهب الآن - عيار 24",
  "Gold price now — 24K",
  "Cours actuel de l'or — 24 carats"
 ],
 [
  "عيار 24 · سعر الجرام",
  "24K · price per gram",
  "24 carats · prix par gramme"
 ],
 [
  "آخر تحديث:",
  "Last updated:",
  "Dernière mise à jour :"
 ],
 [
  "آخر فحص:",
  "Last checked:",
  "Dernière vérification :"
 ],
 [
  "لا تداول حاليًا",
  "No current trading",
  "Pas de cotation en cours"
 ],
 [
  "اليوم",
  "today",
  "aujourd'hui"
 ],
 [
  "سعر الشراء:",
  "Buy price:",
  "Prix d'achat :"
 ],
 [
  "سعر البيع:",
  "Sell price:",
  "Prix de vente :"
 ],
 [
  "السعر العالمي الاسترشادي",
  "Indicative global spot price",
  "Cours mondial indicatif"
 ],
 [
  "الخدمات السريعة",
  "Quick services",
  "Accès rapide"
 ],
 [
  "حاسبة الذهب",
  "Gold calculator",
  "Calculateur d'or"
 ],
 [
  "أسعار اليوم",
  "Today's prices",
  "Cours du jour"
 ],
 [
  "أقرب تاجر",
  "Nearest dealer",
  "Bijoutier le plus proche"
 ],
 [
  "محفظتي الذهبية",
  "My gold portfolio",
  "Mon portefeuille d'or"
 ],
 [
  "التفاصيل ←",
  "Details",
  "Détails"
 ],
 [
  "إجمالي الوزن:",
  "Total weight:",
  "Poids total :"
 ],
 [
  "الفرق عن تكلفة الشراء",
  "Change vs. purchase cost",
  "Écart par rapport au coût d'achat"
 ],
 [
  "سعر محدّث من الخادم",
  "Server-updated quote",
  "Cours actualisé par le serveur"
 ],
 [
  "سعر الأونصة المشتق من عيار 24",
  "24K-derived ounce price",
  "Prix de l'once estimé à partir du 24 carats"
 ],
 [
  "أسعار الجرام بحسب العيار",
  "Price per gram by purity",
  "Prix au gramme par carat"
 ],
 [
  "العملة",
  "Currency",
  "Devise"
 ],
 [
  "العيار",
  "Purity",
  "Carat"
 ],
 [
  "الشراء",
  "Buy",
  "Achat"
 ],
 [
  "البيع",
  "Sell",
  "Vente"
 ],
 [
  "الرسم الزمني للأسعار",
  "Price history chart",
  "Historique des cours"
 ],
 [
  "الوزن (جرام)",
  "Weight (grams)",
  "Poids (grammes)"
 ],
 [
  "سعر الجرام الأساسي حسب العيار المحدد",
  "Base price per gram for selected purity",
  "Prix de base au gramme pour le carat choisi"
 ],
 [
  "السعر العالمي الاسترشادي، دون مصنعية أو ضريبة",
  "Indicative global price, excluding workmanship and tax",
  "Cours mondial indicatif, hors fabrication et taxes"
 ],
 [
  "ضريبة 15% (اختيارية)",
  "15% VAT (optional)",
  "TVA de 15 % (facultative)"
 ],
 [
  "الضريبة = (قيمة الذهب + إجمالي المصنعية) × 15%.",
  "Tax = (gold value + workmanship) × 15%.",
  "Taxe = (valeur de l'or + fabrication) × 15 %."
 ],
 [
  "تفاصيل السعر المقدر",
  "Estimated price breakdown",
  "Détail du prix estimé"
 ],
 [
  "قيمة الذهب الخام",
  "Raw gold value",
  "Valeur de l'or brut"
 ],
 [
  "إجمالي المصنعية",
  "Total workmanship",
  "Total des frais de fabrication"
 ],
 [
  "الضريبة التقديرية",
  "Estimated tax",
  "Taxe estimée"
 ],
 [
  "الإجمالي النهائي",
  "Final total",
  "Total final"
 ],
 [
  "الإجمالي كتابة",
  "Total in words",
  "Total en lettres"
 ],
 [
  "إجمالي الوزن المسجل",
  "Total recorded weight",
  "Poids total enregistré"
 ],
 [
  "محفظة جديدة",
  "New portfolio",
  "Nouveau portefeuille"
 ],
 [
  "محافظك",
  "Your portfolios",
  "Vos portefeuilles"
 ],
 [
  "تسجيل شراء",
  "Record purchase",
  "Enregistrer un achat"
 ],
 [
  "إنشاء محفظة",
  "Create portfolio",
  "Créer un portefeuille"
 ],
 [
  "لم يتم تحميل المحافظ بعد.",
  "Portfolios have not loaded yet.",
  "Les portefeuilles ne sont pas encore chargés."
 ],
 [
  "لا توجد محافظ بعد. أنشئ محفظتك الأولى.",
  "No portfolios yet. Create your first portfolio.",
  "Aucun portefeuille. Créez votre premier portefeuille."
 ],
 [
  "لم تُسجّل مشتريات بعد. أضف عملية شراء لعرض القيمة.",
  "No purchases recorded. Add a purchase to view its value.",
  "Aucun achat enregistré. Ajoutez un achat pour voir sa valeur."
 ],
 [
  "القيمة الحالية",
  "Current value",
  "Valeur actuelle"
 ],
 [
  "الفرق عن الشراء",
  "Change vs. purchase",
  "Écart par rapport à l'achat"
 ],
 [
  "لا توجد مشتريات في هذه المحفظة حتى الآن.",
  "No purchases in this portfolio yet.",
  "Aucun achat dans ce portefeuille pour le moment."
 ],
 [
  "التكلفة الفعلية للجرام",
  "Actual cost per gram",
  "Coût réel par gramme"
 ],
 [
  "تكلفة الشراء الإجمالية",
  "Total purchase cost",
  "Coût total d'achat"
 ],
 [
  "القيمة السوقية التقديرية",
  "Estimated market value",
  "Valeur de marché estimée"
 ],
 [
  "سجل المشتريات",
  "Purchase history",
  "Historique des achats"
 ],
 [
  "لم يتم تحميل المشتريات بعد.",
  "Purchases have not loaded yet.",
  "Les achats ne sont pas encore chargés."
 ],
 [
  "لا توجد مشتريات مسجلة.",
  "No purchases recorded.",
  "Aucun achat enregistré."
 ],
 [
  "الوزن",
  "Weight",
  "Poids"
 ],
 [
  "المصنعية والضريبة والأحجار",
  "Workmanship, tax and stones",
  "Fabrication, taxes et pierres"
 ],
 [
  "الفاتورة",
  "Invoice",
  "Facture"
 ],
 [
  "التاجر",
  "Dealer",
  "Bijoutier"
 ],
 [
  "تعديل",
  "Edit",
  "Modifier"
 ],
 [
  "حذف",
  "Delete",
  "Supprimer"
 ],
 [
  "تنبيهات الأسعار",
  "Price alerts",
  "Alertes de prix"
 ],
 [
  "تنبيه جديد",
  "New alert",
  "Nouvelle alerte"
 ],
 [
  "لم يتم تحميل التنبيهات بعد.",
  "Alerts have not loaded yet.",
  "Les alertes ne sont pas encore chargées."
 ],
 [
  "لا توجد تنبيهات. أضف السعر الذي تريد متابعته.",
  "No alerts. Add a target price to track.",
  "Aucune alerte. Ajoutez un prix cible à suivre."
 ],
 [
  "نشط",
  "Active",
  "Active"
 ],
 [
  "متوقف",
  "Paused",
  "En pause"
 ],
 [
  "تحقق الشرط",
  "Triggered",
  "Déclenchée"
 ],
 [
  "إيقاف",
  "Pause",
  "Suspendre"
 ],
 [
  "إعادة تفعيل",
  "Reactivate",
  "Réactiver"
 ],
 [
  "تفعيل",
  "Activate",
  "Activer"
 ],
 [
  "الأمان والدخول",
  "Security and sign-in",
  "Sécurité et connexion"
 ],
 [
  "اختر طريقة فتح ذهبي الآمنة على هذا الجهاز.",
  "Choose how to unlock Dhahabi on this device.",
  "Choisissez comment déverrouiller Dhahabi sur cet appareil."
 ],
 [
  "رمز الدخول السريع",
  "Quick access PIN",
  "Code d'accès rapide"
 ],
 [
  "شاشة قفل ولوحة أرقام على هذا الجهاز",
  "Lock screen and PIN pad on this device",
  "Écran de verrouillage et pavé numérique sur cet appareil"
 ],
 [
  "تفعيل رمز الدخول السريع",
  "Enable quick access PIN",
  "Activer le code d'accès rapide"
 ],
 [
  "تغيير رمز الدخول السريع",
  "Change quick access PIN",
  "Modifier le code d'accès rapide"
 ],
 [
  "خدمة بصمة الوجه/الإصبع",
  "Face ID / Touch ID",
  "Face ID / Touch ID"
 ],
 [
  "خدمة بصمة الوجه والإصبع",
  "Biometric authentication",
  "Authentification biométrique"
 ],
 [
  "قفل ذهبي الآن",
  "Lock Dhahabi now",
  "Verrouiller Dhahabi"
 ],
 [
  "كيف يعمل الدخول السريع؟",
  "How does quick access work?",
  "Comment fonctionne l'accès rapide ?"
 ],
 [
  "نسيت رمز الدخول؟",
  "Forgot your PIN?",
  "Code oublié ?"
 ],
 [
  "الحساب والخدمات",
  "Account and services",
  "Compte et services"
 ],
 [
  "الذهب الذي تتابعه",
  "Your tracked gold",
  "Votre or suivi"
 ],
 [
  "عمليات الشراء المسجلة",
  "Recorded purchases",
  "Achats enregistrés"
 ],
 [
  "الأهداف والتنبيهات المحفوظة",
  "Saved targets and alerts",
  "Objectifs et alertes enregistrés"
 ],
 [
  "الأذونات والاشتراكات",
  "Permissions and subscriptions",
  "Autorisations et abonnements"
 ],
 [
  "التحقق من تحديث التطبيق",
  "Check for app updates",
  "Rechercher des mises à jour"
 ],
 [
  "البحث عن إصدار أحدث",
  "Look for a newer version",
  "Rechercher une nouvelle version"
 ],
 [
  "خدماتي",
  "My services",
  "Mes services"
 ],
 [
  "التجار القريبون",
  "Nearby dealers",
  "Bijoutiers à proximité"
 ],
 [
  "استكشاف محلات الذهب من موقعك",
  "Find gold stores near you",
  "Trouver des bijouteries près de vous"
 ],
 [
  "المشتريات والفواتير",
  "Purchases and invoices",
  "Achats et factures"
 ],
 [
  "مراجعة المشتريات المسجلة",
  "Review saved purchases",
  "Consulter vos achats"
 ],
 [
  "متابعة أهداف الأسعار",
  "Track price targets",
  "Suivre les prix cibles"
 ],
 [
  "الإعدادات والمساعدة",
  "Settings and help",
  "Paramètres et aide"
 ],
 [
  "السماح بالإشعارات واختبارها",
  "Allow and test notifications",
  "Autoriser et tester les notifications"
 ],
 [
  "إجابات عن الأسئلة الشائعة",
  "Frequently asked questions",
  "Questions fréquentes"
 ],
 [
  "التفضيلات",
  "Preferences",
  "Préférences"
 ],
 [
  "لغة التطبيق",
  "App language",
  "Langue de l'application"
 ],
 [
  "لغة الواجهة الحالية",
  "Current interface language",
  "Langue actuelle de l'interface"
 ],
 [
  "العربية",
  "العربية",
  "العربية"
 ],
 [
  "الإنجليزية",
  "English",
  "Anglais"
 ],
 [
  "الفرنسية",
  "French",
  "Français"
 ],
 [
  "عملة عرض الأسعار",
  "Display currency",
  "Devise d'affichage"
 ],
 [
  "اختيار عملة عرض الأسعار",
  "Choose display currency",
  "Choisir la devise d'affichage"
 ],
 [
  "حساب ذهبي",
  "Dhahabi account",
  "Compte Dhahabi"
 ],
 [
  "عرض الملف الشخصي وتعديل بياناتي",
  "View profile and edit details",
  "Afficher et modifier mes informations"
 ],
 [
  "حسابي",
  "My account",
  "Mon compte"
 ],
 [
  "البيانات الشخصية",
  "Personal details",
  "Informations personnelles"
 ],
 [
  "تحديث معلومات الحساب الأساسية",
  "Update your basic account details",
  "Mettre à jour vos informations personnelles"
 ],
 [
  "تعديل البيانات الشخصية",
  "Edit personal details",
  "Modifier les informations personnelles"
 ],
 [
  "جارٍ تحميل البيانات الشخصية…",
  "Loading personal details…",
  "Chargement des informations personnelles…"
 ],
 [
  "الاسم الكامل",
  "Full name",
  "Nom complet"
 ],
 [
  "البريد الإلكتروني",
  "Email",
  "Adresse e-mail"
 ],
 [
  "رقم الجوال",
  "Mobile number",
  "Numéro de mobile"
 ],
 [
  "المدينة",
  "City",
  "Ville"
 ],
 [
  "غير مضاف",
  "Not provided",
  "Non renseigné"
 ],
 [
  "غير مضافة",
  "Not provided",
  "Non renseignée"
 ],
 [
  "تعديل الاسم الكامل",
  "Edit full name",
  "Modifier le nom complet"
 ],
 [
  "تعديل المدينة",
  "Edit city",
  "Modifier la ville"
 ],
 [
  "حفظ",
  "Save",
  "Enregistrer"
 ],
 [
  "جارٍ الحفظ…",
  "Saving…",
  "Enregistrement…"
 ],
 [
  "إلغاء",
  "Cancel",
  "Annuler"
 ],
 [
  "إغلاق",
  "Close",
  "Fermer"
 ],
 [
  "تسجيل الدخول للاستفادة من كامل الخدمات",
  "Sign in to use all features",
  "Connectez-vous pour profiter de toutes les fonctionnalités"
 ],
 [
  "تصفح أسعار الذهب كزائر",
  "Browse gold prices as a guest",
  "Consultez les cours de l'or en invité"
 ],
 [
  "أسعار الجرام الحالية",
  "Current gold prices per gram",
  "Cours actuels de l'or au gramme"
 ],
 [
  "جارٍ تحميل الأسعار…",
  "Loading prices…",
  "Chargement des cours…"
 ],
 [
  "إنشاء حساب مستخدم جديد",
  "Create a new user account",
  "Créer un nouveau compte"
 ],
 [
  "كلمة المرور",
  "Password",
  "Mot de passe"
 ],
 [
  "تأكيد كلمة المرور",
  "Confirm password",
  "Confirmer le mot de passe"
 ],
 [
  "إظهار كلمة المرور",
  "Show password",
  "Afficher le mot de passe"
 ],
 [
  "إخفاء كلمة المرور",
  "Hide password",
  "Masquer le mot de passe"
 ],
 [
  "لديك حساب؟",
  "Already have an account?",
  "Vous avez déjà un compte ?"
 ],
 [
  "دخول المستثمرين ومتابعي الأسعار",
  "Sign in to track your gold",
  "Connectez-vous pour suivre votre or"
 ],
 [
  "الدخول بالبصمة الحيوية",
  "Sign in with biometrics",
  "Connexion biométrique"
 ],
 [
  "أو بصمة الإصبع المسجلة",
  "Or your registered fingerprint",
  "Ou votre empreinte enregistrée"
 ],
 [
  "أو بالبريد الإلكتروني أو رقم الجوال",
  "Or with email or mobile number",
  "Ou par e-mail ou numéro de mobile"
 ],
 [
  "الدخول بالبريد الإلكتروني أو رقم الجوال",
  "Sign in with email or mobile number",
  "Connexion par e-mail ou numéro de mobile"
 ],
 [
  "البريد الإلكتروني أو رقم الجوال",
  "Email or mobile number",
  "E-mail ou numéro de mobile"
 ],
 [
  "الدخول السريع من إعدادات الحساب",
  "Quick access in account settings",
  "Accès rapide dans les paramètres du compte"
 ],
 [
  "نسيت كلمة المرور؟",
  "Forgot password?",
  "Mot de passe oublié ?"
 ],
 [
  "جارٍ تسجيل الدخول…",
  "Signing in…",
  "Connexion en cours…"
 ],
 [
  "المتابعة كزائر (تصفح الأسعار فقط)",
  "Continue as guest (prices only)",
  "Continuer en invité (cours uniquement)"
 ],
 [
  "ليس لديك حساب؟",
  "No account yet?",
  "Pas encore de compte ?"
 ],
 [
  "المحفظة",
  "Portfolio",
  "Portefeuille"
 ],
 [
  "الوزن الصافي (جم)",
  "Net weight (g)",
  "Poids net (g)"
 ],
 [
  "التاريخ",
  "Date",
  "Date"
 ],
 [
  "حساب السعر",
  "Calculate price",
  "Calcul du prix"
 ],
 [
  "شامل التكاليف",
  "All-inclusive",
  "Tout compris"
 ],
 [
  "تفصيل السعر",
  "Itemized price",
  "Prix détaillé"
 ],
 [
  "المبلغ المدفوع",
  "Amount paid",
  "Montant payé"
 ],
 [
  "سعر الجرام",
  "Price per gram",
  "Prix par gramme"
 ],
 [
  "المصنعية",
  "Workmanship",
  "Fabrication"
 ],
 [
  "قيمة الأحجار",
  "Stone value",
  "Valeur des pierres"
 ],
 [
  "طريقة الضريبة",
  "Tax method",
  "Mode de taxation"
 ],
 [
  "بنسبة مئوية",
  "Percentage",
  "Pourcentage"
 ],
 [
  "إدخال مبلغ الضريبة يدويًا",
  "Enter tax amount manually",
  "Saisir la taxe manuellement"
 ],
 [
  "نسبة الضريبة (%)",
  "Tax rate (%)",
  "Taux de taxe (%)"
 ],
 [
  "قيمة الضريبة",
  "Tax amount",
  "Montant de taxe"
 ],
 [
  "غير محدد",
  "Not specified",
  "Non précisé"
 ],
 [
  "اختياري",
  "Optional",
  "Facultatif"
 ],
 [
  "الإجمالي المسجل",
  "Recorded total",
  "Total enregistré"
 ],
 [
  "تكلفة الجرام",
  "Cost per gram",
  "Coût par gramme"
 ],
 [
  "أدخل الوزن والسعر",
  "Enter weight and price",
  "Saisissez le poids et le prix"
 ],
 [
  "قيمة الذهب:",
  "Gold value:",
  "Valeur de l'or :"
 ],
 [
  "إضافات:",
  "Extras:",
  "Frais annexes :"
 ],
 [
  "ضريبة:",
  "Tax:",
  "Taxe :"
 ],
 [
  "بيانات الفاتورة",
  "Invoice details",
  "Détails de la facture"
 ],
 [
  "اسم المتجر",
  "Store name",
  "Nom de la boutique"
 ],
 [
  "عنوان المحل",
  "Store address",
  "Adresse de la boutique"
 ],
 [
  "اسم المشتري",
  "Buyer name",
  "Nom de l'acheteur"
 ],
 [
  "رقم الفاتورة",
  "Invoice number",
  "Numéro de facture"
 ],
 [
  "السجل التجاري",
  "Business registration",
  "Immatriculation commerciale"
 ],
 [
  "هاتف المتجر",
  "Store phone",
  "Téléphone de la boutique"
 ],
 [
  "حالة المشغول",
  "Item condition",
  "État de l'article"
 ],
 [
  "مستعمل",
  "Used",
  "Occasion"
 ],
 [
  "جديد",
  "New",
  "Neuf"
 ],
 [
  "الدمغة",
  "Hallmark",
  "Poinçon"
 ],
 [
  "علامة الصانع",
  "Maker's mark",
  "Marque du fabricant"
 ],
 [
  "وزن القطعة (جم)",
  "Item weight (g)",
  "Poids de l'article (g)"
 ],
 [
  "وزن الأحجار (جم)",
  "Stone weight (g)",
  "Poids des pierres (g)"
 ],
 [
  "وصف القطعة",
  "Item description",
  "Description de l'article"
 ],
 [
  "تفاصيل الأحجار",
  "Stone details",
  "Détails des pierres"
 ],
 [
  "اسم الحجر",
  "Stone name",
  "Nom de la pierre"
 ],
 [
  "نوع الحجر",
  "Stone type",
  "Type de pierre"
 ],
 [
  "لون الحجر",
  "Stone color",
  "Couleur de la pierre"
 ],
 [
  "شكل الحجر",
  "Stone shape",
  "Forme de la pierre"
 ],
 [
  "درجة النقاء/الجودة",
  "Purity / quality",
  "Pureté / qualité"
 ],
 [
  "نوع القطع/التشطيب",
  "Cut / finish",
  "Taille / finition"
 ],
 [
  "العيوب إن وجدت",
  "Defects, if any",
  "Défauts éventuels"
 ],
 [
  "سلامة الحجر من الخدش أو الكسر",
  "Stone free of damage",
  "Absence de rayures ou cassures"
 ],
 [
  "رقم الجوال",
  "Mobile number",
  "Numéro de téléphone"
 ],
 [
  "تحديث",
  "Refresh",
  "Actualiser"
 ],
 [
  "حالة إشعارات الجهاز",
  "Device notification status",
  "État des notifications"
 ],
 [
  "إذن المتصفح",
  "Browser permission",
  "Autorisation du navigateur"
 ],
 [
  "مسموح",
  "Allowed",
  "Autorisé"
 ],
 [
  "مرفوض",
  "Denied",
  "Refusé"
 ],
 [
  "لم يُطلب بعد",
  "Not requested",
  "Non demandé"
 ],
 [
  "اشتراك المتصفح",
  "Browser subscription",
  "Abonnement du navigateur"
 ],
 [
  "موجود",
  "Present",
  "Présent"
 ],
 [
  "غير موجود",
  "Not found",
  "Absent"
 ],
 [
  "الاشتراك لدى الخادم",
  "Server subscription",
  "Abonnement serveur"
 ],
 [
  "مسجل",
  "Registered",
  "Enregistré"
 ],
 [
  "غير مسجل",
  "Not registered",
  "Non enregistré"
 ],
 [
  "تعذر التحقق",
  "Could not verify",
  "Vérification impossible"
 ],
 [
  "خدمة الإرسال",
  "Push service",
  "Service Push"
 ],
 [
  "مهيأة",
  "Configured",
  "Configuré"
 ],
 [
  "غير مهيأة",
  "Not configured",
  "Non configuré"
 ],
 [
  "تفعيل الإشعارات",
  "Enable notifications",
  "Activer les notifications"
 ],
 [
  "إصلاح الاشتراك",
  "Repair subscription",
  "Réparer l'abonnement"
 ],
 [
  "جارٍ التنفيذ…",
  "Working…",
  "Opération en cours…"
 ],
 [
  "إرسال إشعار اختبار حقيقي",
  "Send real test notification",
  "Envoyer une notification test réelle"
 ],
 [
  "إيقاف إشعارات هذا الجهاز",
  "Disable notifications on this device",
  "Désactiver sur cet appareil"
 ],
 [
  "إعادة فحص الحالة",
  "Check status again",
  "Revérifier l'état"
 ],
 [
  "نعم، ظهر الإشعار",
  "Yes, I saw it",
  "Oui, je l'ai reçue"
 ],
 [
  "إرشادات جهازك",
  "Device instructions",
  "Instructions pour votre appareil"
 ],
 [
  "خرائط Google",
  "Google Maps",
  "Google Maps"
 ],
 [
  "خرائط Apple",
  "Apple Maps",
  "Plans Apple"
 ],
 [
  "أسواق الذهب القريبة",
  "Nearby gold markets",
  "Bijouteries à proximité"
 ],
 [
  "حسب موقعك",
  "Based on your location",
  "Selon votre position"
 ],
 [
  "نطاق البحث التقريبي",
  "Approximate search radius",
  "Rayon de recherche approximatif"
 ],
 [
  "جارٍ تحديد موقعك والبحث عن محلات الذهب القريبة…",
  "Locating and searching nearby gold stores…",
  "Recherche des bijouteries à proximité…"
 ],
 [
  "تأكيد الحذف",
  "Confirm deletion",
  "Confirmer la suppression"
 ],
 [
  "هل تريد حذف",
  "Do you want to delete",
  "Voulez-vous supprimer"
 ],
 [
  "محفظة فارغة",
  "Empty portfolio",
  "Portefeuille vide"
 ],
 [
  "عملية شراء واحدة",
  "One purchase",
  "Un achat"
 ],
 [
  "اسم المحفظة",
  "Portfolio name",
  "Nom du portefeuille"
 ],
 [
  "تنبيه جديد",
  "New alert",
  "Nouvelle alerte"
 ],
 [
  "تعديل التنبيه",
  "Edit alert",
  "Modifier l'alerte"
 ],
 [
  "تعديل سجل الشراء",
  "Edit purchase record",
  "Modifier l'achat"
 ],
 [
  "تعديل اسم المحفظة",
  "Rename portfolio",
  "Renommer le portefeuille"
 ],
 [
  "السعر المستهدف",
  "Target price",
  "Prix cible"
 ],
 [
  "الشرط",
  "Condition",
  "Condition"
 ],
 [
  "يرتفع إلى الهدف أو أكثر",
  "Rises to target or above",
  "Atteint ou dépasse le prix cible"
 ],
 [
  "ينخفض إلى الهدف أو أقل",
  "Falls to target or below",
  "Atteint ou passe sous le prix cible"
 ],
 [
  "إيقاف",
  "Pause",
  "Suspendre"
 ],
 [
  "حذف",
  "Delete",
  "Supprimer"
 ],
 [
  "جارٍ الحذف…",
  "Deleting…",
  "Suppression…"
 ],
 [
  "العملة",
  "Currency",
  "Devise"
 ],
 [
  "العيار",
  "Karat",
  "Carat"
 ],
 [
  "الإنجليزية",
  "English",
  "Anglais"
 ],
 [
  "الفرنسية",
  "French",
  "Français"
 ]
];
const extendedEntries:ReadonlyArray<readonly [string,string,string]>=[
 [
  "تُطبّق على الرئيسية والحاسبة والمحفظة والأسعار والمشتريات والتنبيهات، وتحفظ على هذا الجهاز",
  "Applied to home, calculator, portfolio, prices, purchases and alerts; saved on this device.",
  "S'applique à l'accueil, la calculatrice, le portefeuille, les cours, les achats et les alertes ; enregistré sur cet appareil."
 ],
 [
  "تحويل المبالغ المسجلة استرشادي من أسعار الذهب، دون تغيير الفواتير وشروط التنبيه.",
  "Conversions are indicative estimates based on gold quotes; invoices and alert conditions are unchanged.",
  "Les conversions sont indicatives et dérivées des cours de l'or ; factures et conditions d'alerte inchangées."
 ],
 [
  "لا تشمل الأسعار المصنعية أو الضريبة أو هامش المتجر.",
  "Prices exclude workmanship charges, taxes, and dealer margins.",
  "Les prix n’incluent pas les frais de fabrication, les taxes ni la marge du commerçant."
 ],
 [
  "بعض مشترياتك بعملات لا تتوفر لها بيانات تحويل موثوقة؛ راجع التفاصيل حسب عملة التسجيل.",
  "Some purchases use currencies without reliable conversion data. See their original currencies in the details.",
  "Certains achats utilisent des devises sans taux de conversion fiable. Consultez leur devise d'origine dans les détails."
 ],
 [
  "تقدير قيمة بعض المشتريات غير متاح لغياب سعر سوق موثوق.",
  "Some purchases cannot be valued without a reliable market quote.",
  "Certains achats ne peuvent être évalués sans cours fiable."
 ],
 [
  "عندما يصل السعر إلى هدفك، يرسل ذهبي إشعار Push إلى أجهزتك المسجلة، حتى إن كانت الصفحة مغلقة وفق دعم الجهاز.",
  "Dhahabi sends a push notification to your registered devices when the target price is reached, even with the page closed when the device allows it.",
  "Dhahabi envoie une notification Push à vos appareils enregistrés lorsque le prix cible est atteint, même si la page est fermée lorsque l'appareil le permet."
 ],
 [
  "القيمة تقديرية بحسب آخر سعر متاح للعيار والعملة. المبالغ معروضة بعملة التفضيلات عند توفر تحويل موثوق، دون تعديل الفواتير الأصلية. تحويل الريال والدولار استرشادي من أسعار الذهب وليس سعر صرف بنكي. الفرق لا يشمل رسوم أو فروقات إعادة البيع.",
  "Values are estimated from the latest available quote by purity and currency. Amounts appear in your preferred display currency when a reliable conversion is available; original invoices remain unchanged. The indicative SAR/USD conversion is derived from gold quotes, not a bank FX rate. Resale costs and spreads are excluded.",
  "Valeurs estimées à partir du dernier cours disponible par carat et devise. Les montants utilisent votre devise d'affichage si la conversion est fiable ; les factures d'origine restent inchangées. Le taux SAR/USD indicatif provient des cours de l'or, non d'un taux bancaire. Frais et marges de revente exclus."
 ],
 [
  "تعذر تحديث الأسعار من الخادم. المعروض آخر سعر متاح، وليس سعرًا مباشرًا.",
  "Could not refresh prices. Showing the last available quote, not a live quote.",
  "Impossible d'actualiser les cours. Dernier cours disponible affiché, non en direct."
 ],
 [
  "تم حفظ التغيير على الخادم.",
  "Changes saved to server.",
  "Modifications enregistrées sur le serveur."
 ],
 [
  "لا توجد مقارنة كافية اليوم",
  "Not enough data for today's comparison",
  "Données insuffisantes pour comparer aujourd'hui"
 ],
 [
  "تم حفظ رمز الدخول السريع لهذا الجهاز.",
  "Quick access PIN saved on this device.",
  "Code d'accès rapide enregistré sur cet appareil."
 ],
 [
  "أُوقف رمز الدخول السريع على هذا الجهاز.",
  "Quick access PIN disabled on this device.",
  "Code d'accès rapide désactivé sur cet appareil."
 ],
 [
  "أُوقفت بصمة الجهاز في ذهبي.",
  "Device biometrics disabled in Dhahabi.",
  "Authentification biométrique désactivée dans Dhahabi."
 ],
 [
  "تم تفعيل تحقق الجهاز. قد يطلب النظام بصمة أو رمز الجهاز؛ بعض المتصفحات تحتاج رمز ذهبي أو كلمة المرور بعد إعادة فتح التطبيق.",
  "Device verification enabled. Your system may ask for biometrics or the device passcode. Some browsers still require your Dhahabi PIN or password after reopening.",
  "Vérification de l'appareil activée. Le système peut demander votre biométrie ou votre code. Certains navigateurs exigent encore le code ou mot de passe Dhahabi après réouverture."
 ],
 [
  "تعذر قفل التطبيق. تحقق من جلسة الدخول.",
  "Could not lock the app. Check your session.",
  "Impossible de verrouiller l'application. Vérifiez votre session."
 ],
 [
  "عند الضغط على زر البصمة؛ حسب دعم المتصفح",
  "When tapping the biometric button, if supported by your browser",
  "En appuyant sur le bouton biométrique, selon le navigateur"
 ],
 [
  "غير مدعومة في هذا المتصفح",
  "Not supported by this browser",
  "Non pris en charge par ce navigateur"
 ],
 [
  "يمكنك فتح ذهبي برمز من ٦ أرقام. تُحفظ الجلسة مشفّرة وتجزئة الرمز محليًا؛ ولا تُخزّن بيانات بصمتك. يظهر القفل عند إعادة فتح التطبيق بجلسة محفوظة أو بعد العودة من الخلفية بدقيقة. وقد يطلب النظام تحقق Face ID أو Touch ID بحسب دعم المتصفح.",
  "Unlock Dhahabi with a six-digit PIN. Your encrypted session and a hashed PIN are stored locally; biometric details are never stored. The lock appears when reopening a saved session or returning from the background. Face ID or Touch ID may be required when supported.",
  "Déverrouillez Dhahabi avec un code à six chiffres. La session chiffrée et l'empreinte numérique du code sont conservées localement ; les données biométriques ne le sont jamais. Le verrou apparaît après réouverture ou retour de l'arrière-plan. Face ID ou Touch ID peuvent être demandés."
 ],
 [
  "سجّل الدخول بكلمة مرور حسابك لاستعادة الوصول، ثم أعد إعداد الدخول السريع. إذا انتهت الجلسة يلزم تسجيل الدخول الكامل.",
  "Sign in with your account password to regain access, then set up quick access again. An expired session requires full sign-in.",
  "Connectez-vous avec le mot de passe de votre compte puis reconfigurez l'accès rapide. Une session expirée exige une connexion complète."
 ],
 [
  "اكتب اسمًا من حرفين إلى ٨٠ حرفًا، ومدينة لا تزيد على ٨٠ حرفًا.",
  "Enter a name between 2 and 80 characters and a city of no more than 80 characters.",
  "Saisissez un nom de 2 à 80 caractères et une ville de 80 caractères maximum."
 ],
 [
  "لتغيير البريد الإلكتروني أو رقم الجوال يلزم مسار تحقق منفصل.",
  "Changing your email or mobile number requires a separate verification process.",
  "La modification de l'e-mail ou du numéro de mobile nécessite une vérification distincte."
 ],
 [
  "سنسجل الإجمالي كما دفعته تمامًا، ونحسب التكلفة الفعلية لكل جرام. لا نضيف مصنعية أو ضريبة مرة أخرى.",
  "We record the total exactly as paid and calculate the effective cost per gram. Workmanship and tax are not added again.",
  "Nous enregistrons exactement le montant payé et calculons le coût réel par gramme. Fabrication et taxes ne sont pas ajoutées une seconde fois."
 ],
 [
  "تحقق من طريقة تطبيق الضريبة في فاتورتك. السلع الاستثمارية المؤهلة قد تختلف ضريبتها عن المشغولات؛ لا يفترض التطبيق نسبة موحدة.",
  "Check how tax is applied on your invoice. Eligible investment gold may be taxed differently from jewelry; the app does not assume one rate.",
  "Vérifiez l'application de la taxe sur votre facture. L'or d'investissement éligible peut être taxé différemment des bijoux ; aucun taux unique n'est supposé."
 ],
 [
  "هذه بيانات مرجعية أدخلتها أنت؛ لا تعني توثيق الفاتورة رسميًا. احتفظ بصورة الفاتورة الأصلية.",
  "These details are provided by you and do not officially validate an invoice. Keep the original invoice.",
  "Ces informations sont fournies par vous et ne constituent pas une validation officielle. Conservez la facture d'origine."
 ],
 [
  "هذه البيانات اختيارية لتسجيل مشترياتك السابقة.",
  "These details are optional when recording earlier purchases.",
  "Ces informations sont facultatives pour enregistrer vos achats antérieurs."
 ],
 [
  "لا يوجد اختبار مسجل",
  "No test recorded",
  "Aucun test enregistré"
 ],
 [
  "استخدم متصفحًا يدعم Web Push على اتصال HTTPS. ستبقى التنبيهات ظاهرة داخل ذهبي حتى دون دعم Push.",
  "Use an HTTPS browser that supports Web Push. In-app alerts remain visible even without Push support.",
  "Utilisez un navigateur HTTPS prenant en charge Web Push. Les alertes internes restent visibles même sans Push."
 ],
 [
  "على iPhone: افتح ذهبي في Safari، اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية». افتح التطبيق من الأيقونة وارجع إلى إعدادات الإشعارات.",
  "On iPhone, open Dhahabi in Safari, tap Share, then Add to Home Screen. Open the installed icon and return to notification settings.",
  "Sur iPhone, ouvrez Dhahabi dans Safari, touchez Partager puis Ajouter à l'écran d'accueil. Lancez l'icône installée et revenez aux notifications."
 ],
 [
  "أُوقف الإذن من خارج التطبيق. لا يمكن لذهبي تغييره نيابةً عنك؛ اتبع تعليمات جهازك أسفل الصفحة.",
  "Notification permission was blocked outside the app. Dhahabi cannot change it for you; follow your device instructions below.",
  "L'autorisation a été bloquée hors de l'application. Dhahabi ne peut pas la modifier ; suivez les instructions ci-dessous."
 ],
 [
  "لم تسمح بإشعارات هذا الموقع بعد. اختر «تفعيل الإشعارات» ووافق على طلب النظام.",
  "Notifications are not allowed yet. Select Enable notifications and approve the system prompt.",
  "Les notifications ne sont pas encore autorisées. Sélectionnez Activer les notifications et acceptez la demande système."
 ],
 [
  "تعذر الاتصال بخدمة Push أو التحقق من الحساب. تحقق من اتصال الإنترنت ثم حدّث الحالة.",
  "Could not connect to Push or verify your account. Check your connection, then refresh.",
  "Connexion Push ou vérification du compte impossible. Vérifiez Internet puis actualisez."
 ],
 [
  "لم يُفعّل مسؤول الخادم مفاتيح Web Push بعد. لا يتيح التطبيق اختبارًا مزيفًا في هذه الحالة.",
  "The server has not enabled Web Push keys yet. The app will not simulate a successful test.",
  "Les clés Web Push ne sont pas encore activées sur le serveur. Aucun faux test ne sera affiché."
 ],
 [
  "إذن الإشعارات متاح، لكن هذا المتصفح لم يسجّل اشتراكًا بعد.",
  "Notifications are permitted, but this browser has no registered subscription.",
  "Les notifications sont autorisées, mais ce navigateur n'a pas encore d'abonnement."
 ],
 [
  "يوجد اشتراك في المتصفح لكنه غير معروف للخادم؛ اضغط «إصلاح الاشتراك».",
  "A browser subscription exists but is unknown to the server. Choose Repair subscription.",
  "Un abonnement existe dans le navigateur mais pas sur le serveur. Choisissez Réparer l'abonnement."
 ],
 [
  "إذن المتصفح مسموح، واشتراك الجهاز مسجل لدى خادم ذهبي. يمكن اختبار إرسال رسالة فعلية.",
  "Browser permission and server subscription are ready. You can test a real notification.",
  "L'autorisation et l'abonnement serveur sont actifs. Vous pouvez tester une véritable notification."
 ],
 [
  "نتحقق من إذن المتصفح واشتراك Push والاتصال بالخادم…",
  "Checking browser permission, Push subscription and server connection…",
  "Vérification des autorisations, de l'abonnement Push et du serveur…"
 ],
 [
  "آخر اختبار أُرسل:",
  "Last test sent:",
  "Dernier test envoyé :"
 ],
 [
  "آخر قبول لدى مزود Push:",
  "Last Push provider acceptance:",
  "Dernière acceptation du service Push :"
 ],
 [
  "قبول مزود Push للرسالة لا يضمن وصولها أو ظهورها على شاشة الجهاز. لا يمكن للتطبيق قراءة حالة وضع التركيز أو كتم إشعارات النظام بالكامل.",
  "Push acceptance does not guarantee delivery or display. The app cannot fully inspect Focus or system notification mute settings.",
  "L'acceptation par Push ne garantit pas la livraison ou l'affichage. L'application ne peut pas vérifier complètement les réglages Concentration ou Muet."
 ],
 [
  "على الآيفون: فعّل «خدمات الموقع» واسمح لـ Safari أو لتطبيق ذهبي بالوصول إلى موقعك من إعدادات الجهاز.",
  "On iPhone, enable Location Services and allow Safari or Dhahabi to access your location in device settings.",
  "Sur iPhone, activez les services de localisation et autorisez Safari ou Dhahabi à accéder à votre position."
 ],
 [
  "النطاق استرشادي؛ يتغير تقريب الخريطة وقد تظهر محلات أبعد.",
  "Radius is approximate. Map zoom may vary and more distant shops may appear.",
  "Le rayon est indicatif. Le zoom peut varier et des boutiques plus éloignées peuvent apparaître."
 ],
 [
  "لا يوجد تحديث موثوق",
  "No reliable update",
  "Aucune mise à jour fiable"
 ],
 [
  "تم قبول رسالة الاختبار من مزود Push. انتظر إشعار الجهاز؛ هذا لا يؤكد ظهوره.",
  "Push provider accepted the test. Watch for the device notification; acceptance does not confirm delivery.",
  "Le service Push a accepté le test. Attendez la notification ; cela ne confirme pas sa livraison."
 ],
 [
  "سُجل هذا الجهاز لدى خدمة إشعارات ذهبي.",
  "This device has been registered for Dhahabi notifications.",
  "Cet appareil est enregistré pour les notifications Dhahabi."
 ],
 [
  "تم إلغاء اشتراك الإشعارات على هذا الجهاز.",
  "Notifications have been disabled on this device.",
  "Les notifications ont été désactivées sur cet appareil."
 ],
 [
  "هل ظهر إشعار ذهبي على جهازك؟ قد يتأخر أو تمنعه إعدادات النظام.",
  "Did Dhahabi's notification appear? It may be delayed or blocked by system settings.",
  "La notification Dhahabi est-elle apparue ? Elle peut être retardée ou bloquée par le système."
 ],
 [
  "تم تأكيد ظهور الإشعار على هذا الجهاز.",
  "Notification display was confirmed on this device.",
  "L'affichage de la notification a été confirmé sur cet appareil."
 ],
 [
  "سيُطبّق الشرط الجديد عند الفحص القادم. إذا كان السعر يحقق الشرط الآن، فقد يصلك إشعار.",
  "The updated condition takes effect at the next check. You may be notified if the current price already meets it.",
  "La nouvelle condition prend effet à la prochaine vérification. Une notification peut arriver si le prix répond déjà à la condition."
 ],
 [
  "سيبقى التنبيه متوقفًا بعد حفظ التعديل حتى تفعّله بنفسك.",
  "The alert remains paused until you reactivate it.",
  "L'alerte reste en pause jusqu'à sa réactivation."
 ],
 [
  "هذا التنبيه تحقق شرطه سابقًا، وسيظل كذلك بعد التعديل حتى تضغط «إعادة تفعيل».",
  "This alert was triggered earlier and stays triggered until you reactivate it.",
  "Cette alerte a déjà été déclenchée et le restera jusqu'à sa réactivation."
 ],
 [
  "هذا الإجراء نهائي، ولا يمكن التراجع عن الحذف من التطبيق.",
  "Deletion is permanent and cannot be undone in the app.",
  "Cette suppression est définitive et irréversible depuis l'application."
 ]
];
const lookup=new Map<string,readonly [string,string]>(
 [...entries,...extendedEntries,...uncoveredUiMessages,...secondaryUiMessages,...followupUiMessages,...invoiceAndErrorMessages,...chartRangeMessages,...marketPushMessages,...helpNavMessages].map(([ar,en,fr])=>[ar,[en,fr] as const])
);
export const translationCount=()=>lookup.size;
export function translateExact(text:string,lang:Language):string|null{
 if(lang==='ar')return text;
 const value=lookup.get(text);
 return value?(lang==='en'?value[0]:value[1]):null;
}
export function translateUiText(input:string,lang:Language):string{
 if(lang==='ar'||!/[\u0600-\u06FF]/.test(input))return input;
 const m=input.match(/^(\s*)([\s\S]*?)(\s*)$/);
 if(!m)return input;
 const core=m[2],direct=translateExact(core,lang);
 if(direct!==null)return m[1]+direct+m[3];
 // Dynamic fragments: keep original numbers/currencies, never translate user-entered data.
 const dynamic:Array<[RegExp,(match:RegExpMatchArray)=>string]>=[
  [/^عيار\s*(\d+)(.*)$/,a=>(lang==='en'?'Karat ':'Carats ')+a[1]+(a[2]||'')],
  [/^([0-9٠-٩][0-9٠-٩.,٬٫]*)\s*جرام$/,a=>a[1]+(lang==='en'?' grams':' grammes')],
  [/^(\d+)\s*عمليات شراء$/,a=>a[1]+(lang==='en'?' purchases':' achats')],
  [/^الوزن\s*[:：]\s*(.+)$/,a=>(lang==='en'?'Weight: ':'Poids : ')+a[1]],
  [/^إجمالي الوزن:\s*(.+)$/,a=>(lang==='en'?'Total weight: ':'Poids total : ')+a[1]],
  [/^عيار (\d+) · سعر الجرام$/,a=>(lang==='en'?'Karat ':'Carats ')+a[1]+(lang==='en'?' · price per gram':' · prix par gramme')],
  [/^آخر تحديث:\s*(.+)$/,a=>(lang==='en'?'Last updated: ':'Dernière mise à jour : ')+a[1]],
  [/^آخر فحص:\s*(.+)$/,a=>(lang==='en'?'Last checked: ':'Dernière vérification : ')+a[1]]
 ];
 const composite:Array<[RegExp,(match:RegExpMatchArray)=>string]>=[
  [/^تم إدخال (\d+) من (\d+) أرقام$/,a=>lang==='en'?`Entered ${a[1]} of ${a[2]} digits`:`${a[1]} chiffres saisis sur ${a[2]}`],
  [/^رمز غير صحيح\. المحاولات المتبقية:\s*(\d+)$/,a=>lang==='en'?`Incorrect PIN. ${a[1]} attempts remaining.`:`Code incorrect. ${a[1]} tentatives restantes.`],
  [/^إعادة الاختبار بعد (\d+) ثانية$/,a=>lang==='en'?`Retry test in ${a[1]} seconds`:`Retester dans ${a[1]} secondes`],
  [/^استعراض أسعار الذهب عيار (\d+) زمنيًا$/,a=>lang==='en'?`Browse ${a[1]}K gold price history`:`Consulter l'historique de l'or ${a[1]} carats`],
  [/^حركة السوق \(عيار (\d+)\)$/,a=>lang==='en'?`Market trend (karat ${a[1]})`:`Évolution du marché (${a[1]} carats)`],
  [/^سعر الجرام · عيار (\d+)$/,a=>lang==='en'?`Price per gram · ${a[1]}K`:`Prix au gramme · ${a[1]} carats`],
  [/^تحديث منذ (\d+) (دقيقة|ساعة)$/,a=>lang==='en'?`Updated ${a[1]} ${a[2]==='ساعة'?'hours':'minutes'} ago`:`Mis à jour il y a ${a[1]} ${a[2]==='ساعة'?'heures':'minutes'}`],
  [/^(\d+) كم$/,a=>`${a[1]} km`],
  [/^آخر تحديث: (.+)$/,a=>(lang==='en'?'Last updated: ':'Dernière mise à jour : ')+a[1]],
  [/^آخر فحص: (.+)$/,a=>(lang==='en'?'Last checked: ':'Dernière vérification : ')+a[1]],
  [/^([0-9٠-٩.,]+)% من الوزن الإجمالي\.$/,a=>a[1]+(lang==='en'?'% of gross weight.':' % du poids brut.')],
  [/^% من الوزن الإجمالي\.$/,()=>lang==='en'?'% of gross weight.':'% du poids brut.'],
  [/^([0-9٠-٩.,]+) جرام ·$/,a=>a[1]+(lang==='en'?' grams ·':' grammes ·')],
  [/^عيار (\d+) · السعر العالمي الاسترشادي، دون مصنعية أو ضريبة$/,a=>(lang==='en'?'Karat ':'Carats ')+a[1]+(lang==='en'?' · Indicative global price, excluding fees and taxes':' · Cours mondial indicatif, hors fabrication et taxes')],
  [/^(.+) · آخر سعر مسجل$/,a=>a[1]+(lang==='en'?' · last recorded quote':' · dernier cours enregistré')],
  [/^(\d+)\. اختر عيار الذهب$/,a=>a[1]+(lang==='en'?' . Choose gold purity':' . Choisir le carat de l’or')]
 ];
 for(const [re,fn] of composite){const match=core.match(re);if(match)return m[1]+fn(match)+m[3];}
 for(const [re,fn] of dynamic){const match=core.match(re);if(match)return m[1]+fn(match)+m[3];}
 return input;
}
