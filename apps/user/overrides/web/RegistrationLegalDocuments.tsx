import React,{useEffect,useRef,useState} from 'react';
import type {Language} from './i18n-messages';

export type RegistrationLegalKind='terms'|'privacy'|'risks';
type Localized=readonly [string,string,string];
type LegalSection={heading:Localized;body:Localized};
type LegalInfo={title:Localized;intro:Localized;sections:readonly LegalSection[]};
/** Review revision, not an effective date: confirm retention, cross-border safeguards and legal approval first. */
export const LEGAL_REVIEW_VERSION='2026-10-14-review.1';
/** Server-recognized Terms version, to be activated after legal approval. */
export const LEGAL_TERMS_VERSION='dhahabk-terms-2026-10-v1';
export const LEGAL_PUBLICATION_APPROVED=false;
export const LEGAL_DOMAIN='dhahabk.com';
export const LEGAL_EMAILS={privacy:'privacy@dhahabk.com',support:'support@dhahabk.com',info:'info@dhahabk.com'} as const;

const source={
  "terms": {
    "title": [
      "شروط الاستخدام",
      "Terms of Use",
      "Conditions d’utilisation"
    ],
    "intro": [
      "تنظّم هذه الشروط استخدام ذهبك (Dhahabk)، وهو تطبيق تقني للمعلومات والحسابات التقديرية المتعلقة بالذهب. اقرأها قبل إنشاء حسابك.",
      "These terms govern Dhahabk, a technology service for gold information and estimates. Please read them before creating an account.",
      "Ces conditions régissent Dhahabk, service numérique d’information et d’estimation de l’or. Veuillez les consulter avant de créer un compte."
    ],
    "sections": [
      [
        [
          "مقدم الخدمة ونطاقه",
          "Operator and scope",
          "Exploitant et périmètre"
        ],
        [
          "يطوّر ويشغّل ذهبك إبراهيم بن حمود بن علي النعمي، بصفته ممارس عمل حر في المملكة العربية السعودية في مجال برمجيات الحاسب الآلي وبرمجة وتطوير المواقع الإلكترونية. النطاق الرسمي: dhahabk.com. لا تمثل وثائق العمل الحر في البرمجة ترخيصًا لتجارة الذهب أو الوساطة المالية أو تقديم استشارات استثمارية منظمة.",
          "Dhahabk is developed and operated by Ibrahim bin Hamoud bin Ali Alneami, an independent software and website developer in Saudi Arabia. Official domain: dhahabk.com. Software freelancing credentials are not licences for gold trading, financial intermediation or regulated investment advice.",
          "Dhahabk est développé et exploité par Ibrahim bin Hamoud bin Ali Alneami, professionnel indépendant du logiciel et du développement web en Arabie saoudite. Domaine : dhahabk.com. Les autorisations de travail indépendant en informatique ne constituent pas une licence de négoce d’or, d’intermédiation financière ou de conseil en investissement réglementé."
        ]
      ],
      [
        [
          "قبول الشروط",
          "Acceptance",
          "Acceptation"
        ],
        [
          "إنشاء الحساب أو الاستمرار في استخدام الخدمات الخاضعة لهذه الشروط بعد عرضها وقبولها يُعد اتفاقًا على شروط الإصدار المعروض. تتاح سياسة الخصوصية وتنبيه المخاطر للقراءة بصورة مستقلة؛ ولا يعني قبول الشروط موافقة شاملة على المعالجات الاختيارية للبيانات.",
          "Creating an account or continuing to use a service after these terms are presented and accepted signifies agreement to the displayed version. The Privacy Policy and Risk Notice are separately available; acceptance does not constitute blanket consent to optional personal-data processing.",
          "La création d’un compte ou la poursuite de l’utilisation après présentation et acceptation vaut accord sur la version affichée. La politique de confidentialité et l’avis sur les risques sont consultables séparément ; cet accord ne constitue pas un consentement général aux traitements facultatifs."
        ]
      ],
      [
        [
          "الخدمات المتاحة",
          "Service features",
          "Fonctionnalités"
        ],
        [
          "يعرض ذهبك أسعارًا استرشادية للذهب ورسومًا تاريخية، وحاسبة للسعر التقديري، ومحافظ ومشتريات يسجلها المستخدم، وتنبيهات أسعار، وخدمة للتعرف على التجار القريبين. تسجيل قطعة أو فاتورة لا يُنشئ ملكية قانونية ولا يثبت صحتها. الخدمات والميزات قد تتغير بحسب الإصدار.",
          "Dhahabk provides indicative gold prices and history charts, an estimate calculator, user-entered portfolios and purchases, price alerts, and nearby-dealer discovery. Recording an item or invoice does not establish legal ownership or authenticate the document. Features may change between releases.",
          "Dhahabk propose des cours indicatifs et historiques, une calculatrice estimative, des portefeuilles et achats saisis par l’utilisateur, des alertes et la recherche de bijoutiers proches. Saisir un objet ou une facture ne prouve ni la propriété ni l’authenticité du document. Les fonctionnalités peuvent évoluer."
        ]
      ],
      [
        [
          "ليس وسيطًا في معاملات الذهب",
          "No gold brokerage or transaction guarantee",
          "Absence de courtage et de garantie"
        ],
        [
          "لا يبيع التطبيق الذهب أو يشتريه أو يحفظه نيابةً عن المستخدم في خدماته الحالية. ولا يعد السعر المعروض عرض بيع ملزمًا أو ضمانًا لإتمام صفقة. تُبرم أي معاملة فعلية مع التاجر المعني وفق شروطه والأنظمة المطبقة.",
          "The current service does not buy, sell or hold gold on the user's behalf. Displayed quotes are not binding offers or guaranteed execution prices. Any actual transaction is concluded with the relevant dealer under its terms and applicable law.",
          "Le service actuel n’achète, ne vend ni ne conserve d’or pour l’utilisateur. Les cours affichés ne sont ni des offres fermes ni des prix d’exécution garantis. Toute transaction réelle est conclue avec le vendeur selon ses conditions et le droit applicable."
        ]
      ],
      [
        [
          "الحساب والأمان",
          "Accounts and security",
          "Comptes et sécurité"
        ],
        [
          "يلتزم المستخدم بإدخال بيانات صحيحة وحماية كلمة المرور ورموز التحقق وجهازه، وإبلاغ الدعم عند الاشتباه في وصول غير مصرح به. قد نعلّق استخدام الحساب عند وجود مؤشرات معقولة على إساءة الاستخدام، مع احترام الحقوق النظامية.",
          "Users must provide accurate details, protect passwords, verification codes and devices, and report suspected unauthorised access. We may restrict accounts for reasonably suspected misuse, subject to mandatory legal rights.",
          "L’utilisateur fournit des données exactes, protège ses mots de passe, codes et appareils et signale tout accès suspect. Nous pouvons limiter un compte en cas de soupçon raisonnable d’abus, sous réserve des droits impératifs."
        ]
      ],
      [
        [
          "الأسعار والحاسبة والمحفظة",
          "Prices, estimates and portfolios",
          "Cours, estimations et portefeuilles"
        ],
        [
          "تتأثر الأسعار بالتداول وتوقيت المصدر والعيار والوزن والعملة والمصنعية والضرائب وحالة القطعة. يتحمل المستخدم مسؤولية مراجعة المدخلات والوثائق، والتأكد من السعر النهائي والأوزان مع التاجر. بيانات المحفظة سجل شخصي غير معتمد للتقييم أو إثبات الملكية.",
          "Prices depend on market timing, sources, purity, weight, currency, making charges, tax and item condition. Users should verify inputs, invoices and final prices with dealers. A portfolio is a personal record, not a certified appraisal or proof of ownership.",
          "Les cours varient selon le marché, la source, le titre, le poids, la devise, la façon, les taxes et l’état de l’objet. L’utilisateur vérifie les données, factures et prix finaux auprès du vendeur. Le portefeuille est un registre personnel, non une expertise certifiée ni une preuve de propriété."
        ]
      ],
      [
        [
          "التجار والروابط الخارجية",
          "Dealers and external links",
          "Vendeurs et liens externes"
        ],
        [
          "روابط الخرائط ومعلومات التجار تُقدَّم للتيسير فقط، ولا تمثل اعتمادًا لتاجر أو ضمانًا لأصالة المنتجات أو سلامة المعاملات. تخضع الخدمات الخارجية لشروطها وسياسات خصوصيتها.",
          "Dealer information and map links are for convenience only, not dealer endorsement or a guarantee of authenticity or transactions. Third-party services have their own terms and privacy policies.",
          "Les informations sur les vendeurs et les liens cartographiques sont fournis à titre pratique, sans agrément ni garantie d’authenticité ou de transaction. Les services tiers ont leurs propres conditions et politiques de confidentialité."
        ]
      ],
      [
        [
          "السلوك المحظور",
          "Prohibited conduct",
          "Utilisations interdites"
        ],
        [
          "يُحظر انتحال الهوية أو تقديم معلومات مضللة أو محاولة الوصول غير المصرح به أو تعطيل الخدمة أو التحايل على وسائل الحماية أو انتهاك حقوق الملكية الفكرية أو الأنظمة السارية.",
          "Impersonation, misleading submissions, unauthorised access, service disruption, bypassing security measures, infringement of intellectual property rights and unlawful uses are prohibited.",
          "L’usurpation d’identité, les informations trompeuses, les accès non autorisés, la perturbation du service, le contournement de la sécurité, les atteintes à la propriété intellectuelle et les usages illégaux sont interdits."
        ]
      ],
      [
        [
          "توافر الخدمة والمسؤولية",
          "Availability and liability",
          "Disponibilité et responsabilité"
        ],
        [
          "قد تتأخر البيانات أو التنبيهات أو تتوقف الخدمات بسبب السوق أو الشبكة أو الجهات الخارجية أو الصيانة. نعمل على معالجة الأعطال دون ضمان التوافر المستمر. ولا تستبعد هذه الشروط أي مسؤولية أو حق للمستهلك لا يجوز استبعاده نظامًا.",
          "Quotes, alerts or services may be delayed or unavailable because of markets, networks, third parties or maintenance. We work to remedy incidents but do not promise uninterrupted service. Nothing excludes liability or consumer rights that cannot lawfully be excluded.",
          "Les cours, alertes ou services peuvent être retardés ou indisponibles à cause du marché, du réseau, de tiers ou de la maintenance. Nous cherchons à résoudre les incidents sans garantir une disponibilité continue. Aucun droit impératif du consommateur ni responsabilité légale ne sont écartés."
        ]
      ],
      [
        [
          "حقوق المحتوى والتغييرات",
          "Content rights and revisions",
          "Droits sur le contenu et modifications"
        ],
        [
          "يحتفظ أصحاب الحقوق بحقوقهم في البرمجيات والهوية والمحتوى وبيانات السوق والخرائط. قد تُحدَّث هذه الشروط، ويُعرض رقم الإصدار وتاريخ النفاذ عند اعتمادها، مع طلب قبول جديد إذا استلزم التغيير ذلك نظامًا.",
          "Rights in software, branding, content, market data and maps remain with their respective owners. These terms may be revised; the approved version and effective date will be displayed, and renewed acceptance sought when required by law.",
          "Les droits sur les logiciels, marques, contenus, données de marché et cartes restent à leurs titulaires. Les conditions peuvent être mises à jour avec version et date d’effet ; une nouvelle acceptation sera demandée lorsque la loi l’impose."
        ]
      ],
      [
        [
          "القانون والتواصل",
          "Governing law and contact",
          "Droit applicable et contact"
        ],
        [
          "تُطبّق الأنظمة السارية في المملكة العربية السعودية، مع عدم الإخلال بقواعد الاختصاص والحقوق الإلزامية. للشكاوى والدعم: support@dhahabk.com، وللاستفسارات العامة: info@dhahabk.com.",
          "Applicable Saudi Arabian law governs, subject to mandatory rights and jurisdiction rules. Support and complaints: support@dhahabk.com; general enquiries: info@dhahabk.com.",
          "Le droit applicable en Arabie saoudite s’applique, sous réserve des règles de compétence et droits impératifs. Assistance et réclamations : support@dhahabk.com ; renseignements : info@dhahabk.com."
        ]
      ]
    ]
  },
  "privacy": {
    "title": [
      "سياسة الخصوصية",
      "Privacy policy",
      "Politique de confidentialité"
    ],
    "intro": [
      "توضح هذه السياسة كيفية معالجة البيانات الشخصية في تطبيق ذهبك، بما فيها البيانات المحفوظة على خوادم خارج المملكة. تُراجع تفاصيل التشغيل والاحتفاظ قبل اعتماد النسخة النهائية.",
      "This policy explains personal-data processing in Dhahabk, including hosting outside Saudi Arabia. Operational retention details must be approved before final publication.",
      "Cette politique explique les traitements de données personnelles dans Dhahabk, y compris l’hébergement hors d’Arabie saoudite. Les durées de conservation doivent être validées avant la publication définitive."
    ],
    "sections": [
      [
        [
          "جهة التحكم ووسائل التواصل",
          "Data controller and contacts",
          "Responsable du traitement"
        ],
        [
          "جهة التحكم: إبراهيم بن حمود بن علي النعمي، مقدم خدمة تقني مستقل في المملكة العربية السعودية، ومشغّل ذهبك (dhahabk.com). للاستفسارات والطلبات المتعلقة بالبيانات: privacy@dhahabk.com. للدعم الفني: support@dhahabk.com. العنوان البريدي النظامي: يُستكمل قبل الاعتماد.",
          "Controller: Ibrahim bin Hamoud bin Ali Alneami, independent technology-service operator in Saudi Arabia, operating Dhahabk (dhahabk.com). Data-rights requests: privacy@dhahabk.com; technical support: support@dhahabk.com. The registered postal contact address must be confirmed before approval.",
          "Responsable : Ibrahim bin Hamoud bin Ali Alneami, prestataire informatique indépendant en Arabie saoudite, exploitant Dhahabk (dhahabk.com). Droits sur les données : privacy@dhahabk.com ; assistance : support@dhahabk.com. L’adresse postale officielle doit être confirmée avant validation."
        ]
      ],
      [
        [
          "البيانات الشخصية التي نعالجها",
          "Personal data we process",
          "Données personnelles traitées"
        ],
        [
          "قد تشمل البيانات: الاسم والبريد والجوال والبلد والمدينة؛ معرّف الحساب وحالة التحقق وتجزئة كلمة المرور والجلسات؛ بيانات المحفظة والمشتريات والفواتير التي تدخلها؛ أهداف الأسعار والتنبيهات؛ آخر إحداثيات للموقع ودقتها ووقت تحديثها عند تفعيل الميزة؛ اشتراكات Push؛ وتفاصيل تقنية محدودة لأمن الجلسة ومنع إساءة الاستخدام.",
          "Data may include name, email, phone, country and city; account ID, verification state, password hash and sessions; user-entered portfolio, purchase and invoice data; price-alert targets; last enabled location coordinates, accuracy and update time; Web Push subscriptions; and limited technical data for security and abuse prevention.",
          "Les données peuvent comprendre nom, e-mail, téléphone, pays et ville ; identifiant du compte, vérification, empreinte du mot de passe et sessions ; achats, factures et portefeuilles saisis ; seuils d’alerte ; dernières coordonnées activées, précision et horodatage ; abonnements Push ; et données techniques limitées de sécurité."
        ]
      ],
      [
        [
          "المصدر والغرض والمسوغ",
          "Collection, purposes and legal grounds",
          "Collecte, finalités et bases juridiques"
        ],
        [
          "نحصل على البيانات مباشرةً عند التسجيل وإدخال السجلات والتفضيلات، ومن الجهاز عند منح الأذونات، ومن الطلبات التقنية لتأمين الخدمة. نعالج بيانات الحساب والجلسات لتقديم الخدمة والتحقق، والسجلات لمزامنتها، والبيانات التقنية لحماية الحساب والحد من الاحتيال وفق المسوغ النظامي المناسب. تتطلب الميزات الاختيارية مثل الموقع والإشعارات إذنًا أو موافقة مستقلة حيث يلزم.",
          "We obtain data through registration, user records and preferences, device permissions and technical requests. Account and session data enable the service and authentication, records are synchronised, and technical data protect accounts and prevent abuse under the applicable lawful basis. Optional location and notifications require separate permission or consent where applicable.",
          "Les données proviennent de l’inscription, des saisies, des préférences, des autorisations de l’appareil et des requêtes techniques. Elles servent au compte, à l’authentification, à la synchronisation, à la sécurité et à la prévention des abus selon le fondement juridique approprié. Localisation et notifications facultatives nécessitent une autorisation ou un consentement distinct lorsque requis."
        ]
      ],
      [
        [
          "بيانات التسجيل والتحقق",
          "Registration and verification",
          "Inscription et vérification"
        ],
        [
          "يشترط إنشاء الحساب البريد الإلكتروني ورقم الجوال، ويُرسل رمز التحقق عبر مزود بريد تقني. يحتفظ النظام بطلبات تسجيل مؤقتة وبصمات تجزئة تقنية لتقييد المحاولات؛ ولا يحصل المستخدم على جلسة دخول إلا بعد التحقق بنجاح. لا نطلب مشاركة رمز التحقق مع أحد.",
          "An account requires an email address and mobile number. An email provider sends verification codes. Temporary registration challenges and technical hashes limit abuse; no authenticated session is issued until verification succeeds. Never share your code.",
          "Le compte exige une adresse e-mail et un numéro mobile. Un prestataire envoie les codes de vérification. Les demandes temporaires et empreintes techniques limitent les abus ; aucune session authentifiée n’est créée avant vérification. Ne communiquez pas votre code."
        ]
      ],
      [
        [
          "المحافظ والمشتريات والتنبيهات",
          "Portfolios, purchases and alerts",
          "Portefeuilles, achats et alertes"
        ],
        [
          "نحتفظ بالبيانات التي تدخلها للمحافظ والمقتنيات والفواتير والأوزان والتكاليف وتنبيهات الأسعار في حسابك لمزامنتها وعرض ملخصاتك. هذه السجلات لأغراضك الشخصية، ويمكن أن تتضمن معلومات تكتبها بنفسك؛ لا تُدخل فيها بيانات لا لزوم لها أو بيانات حساسة لأشخاص آخرين.",
          "Your portfolio names, items, invoice details, weights, costs and price-alert settings are stored with your account for synchronisation and summaries. They are user-entered personal records; avoid unnecessary data or sensitive information about others.",
          "Les noms de portefeuilles, objets, factures, poids, coûts et réglages d’alertes que vous saisissez sont enregistrés dans votre compte pour la synchronisation. Évitez les données superflues ou sensibles concernant autrui."
        ]
      ],
      [
        [
          "الموقع الجغرافي والتجار القريبون",
          "Location and nearby dealers",
          "Géolocalisation et vendeurs proches"
        ],
        [
          "عند فتح «التجار القريبون» يطلب التطبيق الموقع بحسب إذن الجهاز، ويحدّث آخر إحداثيات محفوظة في حسابك إذا كان تفضيل الموقع مفعّلًا. لا يُنشئ ذلك سجل تحركات مستمرًا. عند تعطيل تفضيل الموقع تُزال إحداثيات الحساب المرتبطة بالميزة وفق آلية الخادم. قد تُمرَّر إحداثيات البحث لخدمات خرائط خارجية عند فتح روابطها باختيارك.",
          "Opening Nearby Dealers requests device location as permitted and refreshes the last coordinates stored with your account when the location preference is enabled. This does not create continuous movement history. Disabling the location preference removes associated account coordinates through the backend. Opening external map links may transmit search coordinates to the chosen map provider.",
          "L’accès aux vendeurs proches sollicite la localisation selon les permissions et actualise les dernières coordonnées du compte si l’option est activée, sans historique continu de déplacements. Désactiver l’option supprime les coordonnées associées sur le serveur. Ouvrir un lien cartographique externe peut transmettre les coordonnées au prestataire choisi."
        ]
      ],
      [
        [
          "الإشعارات والتفضيلات المحلية",
          "Notifications and local preferences",
          "Notifications et préférences locales"
        ],
        [
          "يتطلب إرسال Push إذن الجهاز واشتراكًا تقنيًا قد يُحفظ مع حسابك ويُمرر لمزود إشعارات النظام. يمكنك إيقاف الاشتراك. بعض تفضيلات اللغة والعملة والتقويم، وإعدادات الدخول السريع، تُخزن محليًا في جهازك. لا نستلم بصمات Face ID أو Touch ID الحيوية.",
          "Web Push requires device permission and a technical subscription that may be stored with your account and handled by your platform's push provider. You can disable it. Certain language, currency, calendar and quick-unlock preferences are stored locally. We do not receive Face ID or Touch ID biometric templates.",
          "Web Push exige une autorisation et un abonnement technique pouvant être enregistré au compte et traité par le prestataire de notification du système ; vous pouvez le désactiver. Certaines préférences de langue, devise, calendrier et déverrouillage sont locales. Nous ne recevons aucune donnée biométrique Face ID ou Touch ID."
        ]
      ],
      [
        [
          "مقدمو الخدمات والإفصاح",
          "Processors and disclosures",
          "Sous-traitants et communications"
        ],
        [
          "تشمل الخدمات المعروفة Render لاستضافة التطبيق وقاعدة البيانات، وResend لإرسال رموز التحقق، ومزودي إشعارات الأجهزة وخدمات الخرائط عند استخدام خصائصها، ومصادر أسعار الذهب. نعالج أو نشارك الحد الضروري للخدمة فقط، وقد نفصح عن بيانات إذا تطلب النظام ذلك. لا نفترض أن جميع الجهات تتلقى بيانات تعريف حسابك.",
          "Known providers include Render for app and database hosting, Resend for verification emails, device push services, maps when opened, and market-data sources. We share or process only data necessary for the respective feature or legal obligations; not every provider receives your account identity.",
          "Les prestataires connus comprennent Render (hébergement), Resend (codes par e-mail), les systèmes Push, les cartes ouvertes par l’utilisateur et les fournisseurs de cours. Seules les données nécessaires sont traitées ou communiquées, ou celles légalement requises ; tous les prestataires ne reçoivent pas l’identité du compte."
        ]
      ],
      [
        [
          "الاستضافة خارج المملكة",
          "Processing outside Saudi Arabia",
          "Traitement hors d’Arabie saoudite"
        ],
        [
          "قاعدة بيانات ذهبك الحالية مستضافة لدى Render في منطقة فرانكفورت، ألمانيا. وقد تُعالج بيانات فنية لدى مزودين آخرين في دول إضافية وفق إعداداتهم. يجب إتمام تقييم النقل الدولي والضمانات النظامية اللازمة والتحقق من بلدان بقية الجهات قبل اعتماد هذه السياسة.",
          "Dhahabk's current database is hosted by Render in Frankfurt, Germany. Technical data may also be processed in other countries by providers according to their configurations. Any required cross-border transfer assessment, safeguards and verification of other providers' processing locations must be completed before this policy is approved.",
          "La base de données actuelle de Dhahabk est hébergée par Render à Francfort, en Allemagne. D’autres prestataires peuvent traiter des données techniques dans d’autres pays selon leur configuration. L’évaluation des transferts internationaux, les garanties requises et les lieux des autres prestataires doivent être vérifiés avant validation."
        ]
      ],
      [
        [
          "مدة الاحتفاظ والحذف",
          "Retention and deletion",
          "Conservation et suppression"
        ],
        [
          "تُحتفظ بيانات الحساب والسجلات ما دامت مطلوبة لتقديم الخدمة أو للوفاء بالتزام نظامي مشروع؛ ولطلبات التسجيل المؤقتة مدة صلاحية قصيرة وتنظيف دوري. يمكن حذف بعض السجلات من داخل التطبيق، بينما يتطلب إغلاق الحساب أو حذف بياناته طلبًا إلى privacy@dhahabk.com والتحقق من هوية صاحبه. حذف التطبيق من جهازك لا يمحو بيانات الخادم. تفاصيل مدد سجلات الأمان والنسخ الاحتياطية يجب اعتمادها قبل النشر النهائي؛ لا نزعم وجود حذف تلقائي لجميع الحسابات.",
          "Account data and user records are retained while necessary to deliver the service or meet lawful obligations. Temporary registration challenges have limited validity and periodic cleanup. Some records can be deleted in-app; account closure or personal-data deletion requires a verified request to privacy@dhahabk.com. Uninstalling does not remove server data. Exact security-log and backup retention schedules must be approved before final publication; automatic deletion of all accounts is not currently claimed.",
          "Les comptes et registres sont conservés tant qu’ils sont nécessaires au service ou à une obligation légale. Les inscriptions provisoires expirent et font l’objet d’un nettoyage périodique. Certains enregistrements sont supprimables dans l’application ; la clôture du compte nécessite une demande vérifiée à privacy@dhahabk.com. La désinstallation n’efface pas les données serveur. Les durées précises des journaux et sauvegardes restent à valider."
        ]
      ],
      [
        [
          "أمن المعلومات",
          "Information security",
          "Sécurité des données"
        ],
        [
          "نستخدم اتصالات آمنة وتجزئة كلمات المرور وضوابط الوصول وإدارة الجلسات ووسائل حماية مناسبة لطبيعة البيانات. لا يمكن ضمان استحالة أي حادث أمني. احمِ كلمة المرور ورمز التحقق ولا تشاركهما.",
          "We use secure connections, password hashing, access controls, session management and security measures appropriate to the data. No online service can guarantee zero security incidents. Protect your password and verification codes.",
          "Nous utilisons des connexions sécurisées, l’empreinte des mots de passe, des contrôles d’accès et une gestion des sessions adaptés. Aucun service en ligne ne garantit l’absence totale d’incident. Protégez vos mots de passe et codes."
        ]
      ],
      [
        [
          "حقوقك وطرق ممارستها",
          "Your data rights",
          "Vos droits"
        ],
        [
          "وفق نظام حماية البيانات الشخصية السعودي، وبحسب شروطه واستثناءاته، لك حق العلم والوصول والحصول على نسخة وتصحيح البيانات وطلب إتلافها والعدول عن موافقة اختياريّة. أرسل طلبك إلى privacy@dhahabk.com؛ يُبتّ فيه ضمن المدة النظامية، ويجوز طلب إثبات الهوية. ويحق لك تقديم شكوى إلى الجهة المختصة وفق الإجراءات المعتمدة.",
          "Subject to Saudi Personal Data Protection Law requirements and exceptions, you may seek information, access, a copy, correction, lawful erasure and withdrawal of optional consent. Contact privacy@dhahabk.com; requests are handled within the applicable statutory timeframe and identity verification may be required. You may also complain to the competent authority.",
          "Sous réserve des conditions et exceptions de la loi saoudienne sur les données personnelles, vous pouvez demander information, accès, copie, rectification, effacement légal et retrait du consentement facultatif. Écrivez à privacy@dhahabk.com ; les délais légaux s’appliquent et une vérification d’identité peut être nécessaire. Une réclamation à l’autorité compétente reste possible."
        ]
      ],
      [
        [
          "التعديلات والاستخدام من قِبل القُصَّر",
          "Revisions and minors",
          "Modifications et mineurs"
        ],
        [
          "لا تُوجَّه خدمات ذهبك المالية المعلوماتية للأطفال. ينبغي استخدام القُصّر لها تحت إشراف الولي وحسب المتطلبات النظامية. قد نُحدّث السياسة عند تغير وظائف التطبيق أو طرق المعالجة؛ سنوضح الإصدار وتاريخ النفاذ ونطلب موافقات إضافية حيث يلزم.",
          "Dhahabk's financial-information tools are not intended for children. Minors should use the service only under appropriate guardian supervision and applicable law. Updates to processing practices may require a revised policy, effective date and additional permissions where legally necessary.",
          "Les outils d’information financière de Dhahabk ne s’adressent pas aux enfants. Leur utilisation par des mineurs doit respecter les règles et la supervision appropriées. Les changements de traitement peuvent entraîner une nouvelle politique, date d’effet ou autorisation supplémentaire."
        ]
      ]
    ]
  },
  "risks": {
    "title": [
      "تنبيه مخاطر الاستخدام",
      "Usage Risk Notice",
      "Avis sur les risques d’utilisation"
    ],
    "intro": [
      "أسعار الذهب والحاسبة والمحافظ والتنبيهات في ذهبك أدوات معلوماتية مساعدة؛ وليست نصيحة استثمارية أو عرضًا ملزمًا أو ضمانًا لعائد.",
      "Dhahabk quotes, estimates, portfolios and alerts are informational tools, not investment advice, binding offers or guaranteed returns.",
      "Les cours, estimations, portefeuilles et alertes de Dhahabk sont informatifs : ils ne constituent ni conseil en investissement, ni offre ferme, ni garantie de rendement."
    ],
    "sections": [
      [
        [
          "تقلب أسعار الذهب",
          "Gold price volatility",
          "Volatilité de l’or"
        ],
        [
          "قد ترتفع أسعار الذهب أو تنخفض سريعًا، وتتأثر بالتداول العالمي والعملات والعرض والطلب. لا يضمن السعر السابق نتيجة مستقبلية ولا إمكانية تنفيذ معاملة بالسعر المعروض.",
          "Gold prices can rise or fall quickly with global trading, exchange rates and market conditions. Past prices do not predict future results or guarantee a transaction at a displayed price.",
          "Le prix de l’or peut varier rapidement selon les marchés mondiaux, les devises et la conjoncture. Les cours passés ne préjugent pas de l’avenir et n’assurent aucune transaction au prix affiché."
        ]
      ],
      [
        [
          "السوق المغلق وتأخر البيانات",
          "Market closures and delayed data",
          "Marchés fermés et données différées"
        ],
        [
          "عند إغلاق السوق، قد يظهر آخر سعر مسجل للاستئناس لا سعر تداول مباشر. قد تتأخر البيانات أو تتعطل بسبب المصدر أو الشبكة، وقد تختلف فترات الرسم التاريخي بحسب توفر السجلات الفعلية.",
          "Outside market hours, the last recorded quote may appear as a reference, not a live tradable price. Sources or networks may fail, and charts depend on actual available historical data.",
          "Hors séance, le dernier cours enregistré est indicatif et non un cours négociable en direct. Les sources ou le réseau peuvent tomber en panne ; les graphiques reflètent les données historiques réellement disponibles."
        ]
      ],
      [
        [
          "الحاسبة والعيار والوزن",
          "Estimates, purity and weight",
          "Estimation, titre et poids"
        ],
        [
          "الحاسبة تعتمد على المعلومات المدخلة والعيار والوزن والمصنعية والضريبة. قد تختلف نقاوة القطعة الفعلية ووزن الأحجار والتكاليف عن التقدير. تحقّق من الميزان والفاتورة والعيار مع التاجر.",
          "The calculator depends on entered values, karat, weight, making charges and tax. Actual purity, stone weight and fees may differ. Verify weights, purity and invoice with the dealer.",
          "La calculatrice dépend des données saisies, du titre, du poids, de la façon et des taxes. La pureté réelle, les pierres et les frais peuvent différer. Vérifiez poids, titre et facture auprès du vendeur."
        ]
      ],
      [
        [
          "المصنعية وإعادة البيع",
          "Making charges and resale",
          "Façon et revente"
        ],
        [
          "قد لا تسترد المصنعية والضرائب والتكاليف الأخرى عند البيع، وقد تقل قيمة إعادة بيع المجوهرات عن تكلفتها أو تقييم المحفظة. لا تمثل القيمة التقديرية عرض شراء من تاجر.",
          "Making charges, taxes and other costs may not be recovered on resale. Jewellery resale value can be below purchase cost or portfolio estimates. An estimated value is not a dealer's purchase offer.",
          "Les frais de fabrication, taxes et autres coûts ne sont pas nécessairement récupérables à la revente. La valeur de revente peut être inférieure au coût ou à l’estimation. Une valeur indicative n’est pas une offre d’achat."
        ]
      ],
      [
        [
          "سعر الصرف والعملات",
          "Currency and exchange-rate risks",
          "Devises et taux de change"
        ],
        [
          "تحويل العملات في التطبيق استرشادي وقد يختلف عن السعر الذي يستخدمه البنك أو التاجر. تغيير عملة العرض لا يغيّر المبلغ الأصلي المسجل في الفاتورة أو شروط التنبيه.",
          "In-app currency conversions are indicative and may differ from bank or dealer rates. Changing display currency does not change an invoice's original amount or alert conditions.",
          "La conversion des devises est indicative et peut différer des taux bancaires ou du vendeur. Modifier la devise affichée ne change ni le montant d’origine d’une facture ni les conditions d’une alerte."
        ]
      ],
      [
        [
          "تنبيهات لا تصل أو تتأخر",
          "Missed or delayed alerts",
          "Alertes manquées ou retardées"
        ],
        [
          "وصول إشعارات السعر غير مضمون؛ فقد تتأخر أو تتوقف بسبب الإعدادات أو الشبكة أو النظام أو عدم توفر تحديث جديد. لا تعتمد عليها وحدها لاتخاذ قرار حساس للوقت.",
          "Price notifications are not guaranteed: device settings, connectivity, platform restrictions or absent price updates can delay or prevent delivery. Do not rely on alerts alone for time-sensitive decisions.",
          "La réception des alertes n’est pas garantie : paramètres de l’appareil, réseau, restrictions du système ou absence de nouveaux cours peuvent les retarder ou les empêcher. Ne vous y fiez pas seules pour une décision urgente."
        ]
      ],
      [
        [
          "السجلات الشخصية والمستندات",
          "Personal records and documents",
          "Registres personnels et documents"
        ],
        [
          "المحفظة والمشتريات والفواتير المدخلة سجلات شخصية لا تثبت الملكية أو أصالة الذهب والأحجار أو صحة المستندات. احتفظ بالأصول واطلب فحصًا مهنيًا عند الحاجة.",
          "User-entered portfolios, purchases and invoices do not prove ownership, authenticity of gold or stones, or document validity. Keep original documents and obtain qualified inspection when appropriate.",
          "Portefeuilles, achats et factures saisis ne prouvent ni la propriété, ni l’authenticité de l’or ou des pierres, ni la validité des documents. Conservez les originaux et faites expertiser les objets si nécessaire."
        ]
      ],
      [
        [
          "التجار والخدمات الخارجية",
          "Dealers and third-party services",
          "Vendeurs et services tiers"
        ],
        [
          "ظهور متجر أو رابط خرائط لا يضمن نظامية التاجر أو مستوى الخدمة أو سعره. تحقّق من هوية التاجر وشروط البيع والضمان والفاتورة قبل الدفع.",
          "A dealer listing or map link does not certify the dealer, its service or its prices. Verify the seller's identity, sale terms, warranty and invoice before payment.",
          "Une fiche de vendeur ou un lien cartographique ne certifie ni le professionnel, ni son service, ni ses prix. Vérifiez son identité, les conditions de vente, la garantie et la facture avant paiement."
        ]
      ],
      [
        [
          "المسؤولية عن القرار",
          "Your decision and legal rights",
          "Votre décision et vos droits"
        ],
        [
          "اتخذ قرارات الشراء والبيع بعد التحقق المستقل والاستشارة المتخصصة عند الحاجة. هذا التنبيه لا يلغي أي حق مقرر لك نظامًا ولا يعفي مقدم الخدمة من مسؤولية لا يجوز استبعادها.",
          "Make purchase or sale decisions after independent verification and professional advice where needed. This notice does not waive statutory rights or exclude liability that cannot legally be excluded.",
          "Prenez vos décisions après vérification indépendante et avis professionnel si nécessaire. Cet avis ne supprime aucun droit légal et n’écarte aucune responsabilité qui ne peut être exclue."
        ]
      ]
    ]
  }
} as const;
function normalize(kind:RegistrationLegalKind):LegalInfo{
 const document=source[kind];
 return {title:document.title,intro:document.intro,
  sections:document.sections.map(([heading,body])=>({heading,body}))};
}
const COPY:Record<RegistrationLegalKind,LegalInfo>={
 terms:normalize('terms'),privacy:normalize('privacy'),risks:normalize('risks')
};

function localized(value:Localized,language:Language){return value[language==='ar'?0:language==='en'?1:2];}
export function legalSectionCount(kind:RegistrationLegalKind){return COPY[kind].sections.length;}
export function legalSectionTitles(kind:RegistrationLegalKind,language:Language){
 return COPY[kind].sections.map(section=>localized(section.heading,language));
}

export function LegalDocumentLinks({language}:{language:Language}){
 const [kind,setKind]=useState<RegistrationLegalKind|null>(null);
 const close=React.useCallback(()=>setKind(null),[]);
 const header=localized(['الشروط والخصوصية والمخاطر','Legal information and privacy','Informations légales et confidentialité'],language);
 const subtitle=localized(['اطّلع على وثائق ذهبك الثلاث ووسائل التواصل الرسمية.','Review all three Dhahabk notices and official contacts.','Consultez les trois documents et les contacts officiels de Dhahabk.'],language);
 return <section className="dh-legal-access" data-no-translate lang={language} dir={language==='ar'?'rtl':'ltr'} aria-label={header}>
  <h3>{header}</h3><p>{subtitle}</p>
  <div className="dh-legal-access-buttons">
   {(['terms','privacy','risks'] as const).map(key=><button type="button" key={key}
    onClick={()=>setKind(key)}>{localized(COPY[key].title,language)}</button>)}
  </div>
  <p className="dh-legal-contact">{localized(['الدعم:','Support:','Assistance :'],language)} <a href="mailto:support@dhahabk.com" dir="ltr">support@dhahabk.com</a>
   {' · '}{localized(['الخصوصية:','Privacy:','Confidentialité :'],language)} <a href="mailto:privacy@dhahabk.com" dir="ltr">privacy@dhahabk.com</a></p>
  {kind&&<RegistrationLegalDocuments kind={kind} language={language} onClose={close}/>}
 </section>;
}

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
 const draft=localized(['مسودة للمراجعة القانونية — غير معتمدة للنشر النهائي','Legal review draft — not yet approved for final publication','Projet soumis à validation juridique — non encore approuvé'],language);
 const review=localized(['إصدار المراجعة','Review revision','Révision de travail'],language);
 return <div className="registration-legal-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="registration-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="registration-legal-title"
   dir={language==='ar'?'rtl':'ltr'} lang={language} data-no-translate>
   <header className="registration-legal-header">
    <div><p className="registration-legal-kicker">{draft} · {review}: {LEGAL_REVIEW_VERSION}</p><h2 id="registration-legal-title">{localized(doc.title,language)}</h2></div>
    <button ref={closeRef} type="button" className="registration-legal-close"
     aria-label={localized(['إغلاق','Close','Fermer'],language)} onClick={onClose}>×</button>
   </header>
   <div className="registration-legal-content" tabIndex={0}>
    <p className="registration-legal-intro">{localized(doc.intro,language)}</p>
    {doc.sections.map((section,index)=><section className="registration-legal-section" key={index}>
     <h3>{index+1}. {localized(section.heading,language)}</h3>
     <p>{localized(section.body,language)}</p>
    </section>)}
    <p className="registration-legal-contact" dir="auto">
     {kind==='privacy'?<a href="mailto:privacy@dhahabk.com">privacy@dhahabk.com</a>:
       <a href="mailto:support@dhahabk.com">support@dhahabk.com</a>}
     {' · '}<span dir="ltr">dhahabk.com</span>
    </p>
   </div>
   <footer className="registration-legal-footer">
    <button type="button" className="registration-legal-done" onClick={onClose}>
     {localized(['إغلاق الوثيقة','Close document','Fermer le document'],language)}
    </button>
   </footer>
  </section>
 </div>;
}
