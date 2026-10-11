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
const lookup=new Map<string,readonly [string,string]>(
 entries.map(([ar,en,fr])=>[ar,[en,fr] as const])
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
  [/^(\d+)\s*جرام$/,a=>a[1]+(lang==='en'?' grams':' grammes')],
  [/^(\d+)\s*عمليات شراء$/,a=>a[1]+(lang==='en'?' purchases':' achats')],
  [/^الوزن\s*[:：]\s*(.+)$/,a=>(lang==='en'?'Weight: ':'Poids : ')+a[1]],
  [/^إجمالي الوزن:\s*(.+)$/,a=>(lang==='en'?'Total weight: ':'Poids total : ')+a[1]],
  [/^عيار (\d+) · سعر الجرام$/,a=>(lang==='en'?'Karat ':'Carats ')+a[1]+(lang==='en'?' · price per gram':' · prix par gramme')],
  [/^آخر تحديث:\s*(.+)$/,a=>(lang==='en'?'Last updated: ':'Dernière mise à jour : ')+a[1]],
  [/^آخر فحص:\s*(.+)$/,a=>(lang==='en'?'Last checked: ':'Dernière vérification : ')+a[1]]
 ];
 for(const [re,fn] of dynamic){const match=core.match(re);if(match)return m[1]+fn(match)+m[3];}
 return input;
}
