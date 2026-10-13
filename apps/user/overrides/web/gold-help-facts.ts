import type {HelpSection,HelpText} from './gold-help-content';

export type GuideCard={id:string;section:HelpSection;heading:HelpText;points:readonly HelpText[]};
export const guideText={
 title:{ar:'أساسيات الذهب',en:'Gold essentials',fr:'L’essentiel sur l’or'},
 subtitle:{ar:'العيار • الوزن • الأحجار • المصنعية',en:'Karat · weight · gemstones · making charges',fr:'Titre · poids · pierres · fabrication'},
 purity:{ar:'العيارات ونسبة الذهب',en:'Gold karats and fineness',fr:'Titres et pureté de l’or'},
 weight:{ar:'أوزان الذهب',en:'Gold weight units',fr:'Unités de poids de l’or'},
 gems:{ar:'الأحجار الكريمة والألماس',en:'Gemstones and diamonds',fr:'Pierres précieuses et diamants'},
 workmanship:{ar:'المصنعية وتفاصيل السعر',en:'Making charges and pricing',fr:'Fabrication et composition du prix'},
 buying:{ar:'قبل الشراء وإعادة البيع',en:'Buying and resale',fr:'Achat et revente'},
 dhahabi:{ar:'استخدام تطبيق ذهبي',en:'Using Dhahabi',fr:'Utiliser Dhahabi'},
 karatCol:{ar:'العيار',en:'Karat',fr:'Titre'},
 purityCol:{ar:'نسبة الذهب تقريبًا',en:'Approx. gold content',fr:'Teneur approximative'},
 hallmarkCol:{ar:'الدمغة الشائعة',en:'Common fineness mark',fr:'Poinçon de titre courant'},
 unitCol:{ar:'الوحدة',en:'Unit',fr:'Unité'},
 gramsCol:{ar:'ما يعادلها بالجرام',en:'Equivalent in grams',fr:'Équivalent en grammes'},
 gemCol:{ar:'المعيار',en:'Criterion',fr:'Critère'},
 gemMeaning:{ar:'ما الذي يحدده؟',en:'What it measures',fr:'Ce qu’il mesure'},
 ounce:{ar:'الأونصة الترويسية',en:'Troy ounce',fr:'Once troy'},
 gram:{ar:'جرام',en:'Gram',fr:'Gramme'},
 kilogram:{ar:'كيلوجرام',en:'Kilogram',fr:'Kilogramme'},
 tola:{ar:'تولة شائعة',en:'Common tola',fr:'Tola courant'},
 carat:{ar:'قيراط حجر',en:'Gemstone carat',fr:'Carat de pierre'},
 cut:{ar:'القطع',en:'Cut',fr:'Taille'},
 color:{ar:'اللون',en:'Colour',fr:'Couleur'},
 clarity:{ar:'النقاء',en:'Clarity',fr:'Pureté'},
 caratWeight:{ar:'الوزن بالقيراط',en:'Carat weight',fr:'Poids en carats'},
 cutMeaning:{ar:'نِسب الحجر وجودة صقله وانعكاس الضوء',en:'Proportions, finish and light performance',fr:'Proportions, finition et brillance'},
 colorMeaning:{ar:'درجة اللون وفق مقياس التقييم',en:'Colour grade on a grading scale',fr:'Grade de couleur sur une échelle'},
 clarityMeaning:{ar:'الشوائب الداخلية والعيوب السطحية',en:'Inclusions and surface blemishes',fr:'Inclusions et défauts de surface'},
 caratMeaning:{ar:'كتلة الحجر؛ لا تعني نقاوة الذهب',en:'Mass of the stone, not gold purity',fr:'Masse de la pierre, pas le titre de l’or'},
 invoice:{ar:'مثال فاتورة مبسّط',en:'Example of an itemized bill',fr:'Exemple de facture détaillée'},
 part:{ar:'البند',en:'Item',fr:'Poste'},
 amount:{ar:'القيمة',en:'Amount',fr:'Montant'},
 goldValue:{ar:'الذهب: 10 جم × 300',en:'Gold: 10 g × 300',fr:'Or : 10 g × 300'},
 making:{ar:'أجرة الصياغة',en:'Making charge',fr:'Frais de fabrication'},
 stones:{ar:'قيمة الأحجار',en:'Gemstone charge',fr:'Prix des pierres'},
 total:{ar:'المجموع قبل الضرائب',en:'Total before tax',fr:'Total hors taxes'},
 fictional:{ar:'الأرقام افتراضية للتوضيح وليست أسعار السوق.',en:'Illustrative amounts, not live market prices.',fr:'Montants fictifs, pas des cours du marché.'},
 tax:{ar:'تُضاف الضرائب والرسوم النظامية إن انطبقت، بحسب نوع السلعة والبلد.',en:'Applicable taxes and statutory fees depend on product and jurisdiction.',fr:'Les taxes et frais applicables dépendent du produit et du pays.'},
 fineTitle:{ar:'حساب الذهب الخالص',en:'Fine-gold calculator',fr:'Calcul de l’or fin'},
 fineInput:{ar:'وزن سبيكة الذهب (جم)',en:'Gold-alloy weight (g)',fr:'Poids de l’alliage d’or (g)'},
 fineResult:{ar:'الذهب الخالص نظريًا',en:'Theoretical fine gold',fr:'Or fin théorique'},
 otherResult:{ar:'المعادن المضافة نظريًا',en:'Other alloy metals',fr:'Autres métaux de l’alliage'},
 fineNote:{ar:'النتيجة نظرية: 24 عيار يُعامل حسابيًا كنقاوة كاملة، أما الواقع فقد يكون 999 أو 999.9 بالألف.',en:'The calculation treats 24K as ideal purity; actual products may be marked 999 or 999.9.',fr:'Le calcul assimile 24 carats à l’or pur idéal ; les produits peuvent être titrés 999 ou 999,9.'},
 stoneTitle:{ar:'حساب وزن الحجر وقيمته',en:'Gemstone weight and price example',fr:'Poids et prix indicatif d’une pierre'},
 stoneInput:{ar:'وزن الحجر (ct)',en:'Stone weight (ct)',fr:'Poids de la pierre (ct)'},
 stoneRate:{ar:'السعر المتفق عليه للقيراط',en:'Agreed price per carat',fr:'Prix convenu par carat'},
 stoneGrams:{ar:'الوزن بالجرام',en:'Weight in grams',fr:'Poids en grammes'},
 stoneResult:{ar:'قيمة الحجر حسب السعر المدخل',en:'Charge at the entered rate',fr:'Prix calculé au tarif saisi'},
 stoneNote:{ar:'لا يوجد سعر موحّد لقيراط الأحجار؛ هذا الحساب لا يقيّم جودة الحجر أو أصالته.',en:'There is no universal gemstone price per carat; this does not assess quality or authenticity.',fr:'Aucun prix universel par carat ; ce calcul ne détermine ni la qualité ni l’authenticité.'},
 check:{ar:'افحص هذه البنود قبل الدفع',en:'Check before you pay',fr:'À vérifier avant de payer'},
 sources:{ar:'مراجع متخصصة',en:'Specialist references',fr:'Références spécialisées'},
 caution:{ar:'معلومات تثقيفية لا تُغني عن الفحص المهني والفاتورة والأنظمة المحلية.',en:'Educational information; professional testing, documentation and local rules still apply.',fr:'Informations pédagogiques ; l’expertise, la facture et les règles locales restent nécessaires.'}
} satisfies Record<string,HelpText>;

export const guideCards:readonly GuideCard[]=[
 {id:'karat',section:'purity',heading:{ar:'معنى عيار الذهب',en:'What a gold karat means',fr:'Signification du titre en carats'},points:[
  {ar:'العيار نسبة الذهب في السبيكة من 24 جزءًا.',en:'Karat expresses gold content out of 24 parts.',fr:'Le carat exprime la part d’or sur 24.'},
  {ar:'22 عيار ≈ 91.67% ذهب؛ 21 عيار = 87.5%؛ 18 عيار = 75%.',en:'22K ≈ 91.67% gold; 21K = 87.5%; 18K = 75%.',fr:'22 carats ≈ 91,67 % d’or ; 21 = 87,5 % ; 18 = 75 %.'},
  {ar:'ارتفاع العيار يعني نقاوة أعلى، لا مصنعية أفضل بالضرورة.',en:'Higher karat means more gold, not necessarily better workmanship.',fr:'Un titre supérieur signifie plus d’or, pas forcément une meilleure fabrication.'}
 ]},
 {id:'marks',section:'purity',heading:{ar:'أرقام الدمغات',en:'Fineness stamps',fr:'Poinçons de titre'},points:[
  {ar:'999 أو 999.9: ذهب مرتفع النقاوة؛ 916: قريب من 22 عيارًا.',en:'999 or 999.9: high-purity gold; 916: approximately 22K.',fr:'999 ou 999,9 : or très pur ; 916 : environ 22 carats.'},
  {ar:'875: عيار 21؛ 750: عيار 18؛ 585: عيار 14.',en:'875: 21K; 750: 18K; 585: 14K.',fr:'875 : 21 carats ; 750 : 18 ; 585 : 14.'},
  {ar:'الدمغة تُفحص مع بيانات البائع؛ وجود الرقم لا يثبت الأصالة وحده.',en:'Check stamps with seller records; a number alone is not proof.',fr:'Vérifiez le poinçon et le vendeur ; le chiffre seul ne suffit pas.'}
 ]},
 {id:'colors',section:'purity',heading:{ar:'ألوان الذهب',en:'Gold colours',fr:'Couleurs de l’or'},points:[
  {ar:'الأصفر: يتأثر بنسب المعادن المضافة إلى الذهب.',en:'Yellow tone varies with the alloying metals.',fr:'Le jaune dépend de la composition de l’alliage.'},
  {ar:'الأبيض: سبائك فاتحة اللون، وقد تُغطّى بطبقة روديوم.',en:'White gold uses pale alloys and may have rhodium plating.',fr:'L’or blanc contient des alliages clairs, parfois rhodiés.'},
  {ar:'الوردي: غالبًا ترتفع فيه نسبة النحاس؛ اللون لا يحدد العيار.',en:'Rose gold commonly contains more copper; colour does not prove karat.',fr:'L’or rose contient souvent plus de cuivre ; la couleur ne prouve pas le titre.'}
 ]},
 {id:'fine',section:'purity',heading:{ar:'وزن الذهب الخالص',en:'Fine-gold weight',fr:'Poids d’or fin'},points:[
  {ar:'الذهب الخالص نظريًا = وزن السبيكة × (العيار ÷ 24).',en:'Fine gold ≈ alloy weight × (karat ÷ 24).',fr:'Or fin ≈ poids de l’alliage × (carats ÷ 24).'},
  {ar:'مثال: 10 جم عيار 18 = 7.5 جم ذهب خالص نظريًا.',en:'Example: 10 g of 18K alloy ≈ 7.5 g fine gold.',fr:'Exemple : 10 g d’alliage 18 carats ≈ 7,5 g d’or fin.'},
  {ar:'يجب استبعاد وزن الأحجار والأجزاء غير الذهبية أولًا.',en:'Exclude gemstones and non-gold parts from alloy weight first.',fr:'Exclure d’abord le poids des pierres et éléments non aurifères.'}
 ]},
 {id:'ounce',section:'weight',heading:{ar:'الأونصة في سوق الذهب',en:'Gold market ounce',fr:'L’once du marché de l’or'},points:[
  {ar:'الأونصة الترويسية = 31.1034768 جرامًا بالضبط.',en:'One troy ounce = exactly 31.1034768 grams.',fr:'Une once troy = exactement 31,1034768 grammes.'},
  {ar:'تختلف عن الأونصة العادية (نحو 28.3495 جم).',en:'Not the same as a standard ounce (~28.3495 g).',fr:'À distinguer de l’once usuelle (~28,3495 g).'}
 ]},
 {id:'regional',section:'weight',heading:{ar:'التولة والمثقال',en:'Tola and mithqal',fr:'Tola et mithqal'},points:[
  {ar:'التولة المتداولة في بعض الأسواق ≈ 11.6638 جم.',en:'A commonly traded tola ≈ 11.6638 g.',fr:'Une tola courante ≈ 11,6638 g.'},
  {ar:'المثقال وحدة تقليدية قد يختلف وزنها حسب البلد والعرف.',en:'The traditional mithqal varies by country and local practice.',fr:'Le poids du mithqal traditionnel varie selon le pays et l’usage.'},
  {ar:'للمقارنة الدقيقة، اعتمد الوزن المكتوب بالجرام في الفاتورة.',en:'Use invoice weight in grams for reliable comparisons.',fr:'Comparez toujours le poids en grammes inscrit sur la facture.'}
 ]},
 {id:'net-gem',section:'weight',heading:{ar:'وزن الذهب دون الأحجار',en:'Gold-only metal weight',fr:'Poids du métal hors pierres'},points:[
  {ar:'الوزن الإجمالي قد يشمل الأحجار وأجزاء غير ذهبية.',en:'Gross weight can include stones and non-gold parts.',fr:'Le poids total peut comprendre pierres et éléments non aurifères.'},
  {ar:'مثال: 12 جم إجمالي − 2 جم أحجار = 10 جم سبيكة ذهب.',en:'Example: 12 g total − 2 g stones = 10 g gold alloy.',fr:'Exemple : 12 g au total − 2 g de pierres = 10 g d’alliage d’or.'},
  {ar:'اطلب فصل الأوزان في الفاتورة متى أمكن.',en:'Ask the jeweller to itemize the weights.',fr:'Demandez la ventilation des poids sur la facture.'}
 ]},
 {id:'gem-carat',section:'gems',heading:{ar:'قيراط الأحجار وعيار الذهب',en:'Gemstone carat versus gold karat',fr:'Carat de pierre et titre de l’or'},points:[
  {ar:'قيراط الحجر (ct) وحدة وزن: 1 قيراط = 0.2 جم = 100 نقطة.',en:'Stone carat (ct) measures mass: 1 ct = 0.2 g = 100 points.',fr:'Le carat d’une pierre mesure sa masse : 1 ct = 0,2 g = 100 points.'},
  {ar:'0.50 قيراط حجر = 0.10 جم؛ أما عيار 18 فهو نسبة ذهب.',en:'A 0.50 ct gem weighs 0.10 g; 18K describes gold purity.',fr:'Une pierre de 0,50 ct pèse 0,10 g ; 18 carats décrit le titre de l’or.'}
 ]},
 {id:'diamond-4cs',section:'gems',heading:{ar:'معايير الألماس الأربعة 4Cs',en:'Diamond grading: the 4Cs',fr:'Les 4C du diamant'},points:[
  {ar:'الوزن بالقيراط، اللون، النقاء، وجودة القطع.',en:'Carat weight, colour, clarity and cut.',fr:'Poids en carats, couleur, pureté et taille.'},
  {ar:'حجران بالوزن نفسه قد يختلف سعرهما كثيرًا.',en:'Equal carat weight does not guarantee equal value.',fr:'Un même poids ne garantit pas une même valeur.'},
  {ar:'التقرير المخبري يوثّق صفات محددة ولا يضمن سعر إعادة البيع.',en:'A grading report documents attributes, not a resale guarantee.',fr:'Un rapport décrit la pierre, sans garantir son prix de revente.'}
 ]},
 {id:'stone-pricing',section:'gems',heading:{ar:'تسعير الأحجار',en:'Gemstone pricing',fr:'Prix des pierres'},points:[
  {ar:'افصل قيمة الحجر عن وزن الذهب والمصنعية.',en:'Keep gemstone charges separate from gold and labour.',fr:'Séparez le prix des pierres, de l’or et de la fabrication.'},
  {ar:'عند الاتفاق على سعر للقيراط: القيمة = قيراط الحجر × سعر القيراط.',en:'If quoted per carat: charge = carats × agreed rate.',fr:'Si le prix est au carat : coût = carats × tarif convenu.'},
  {ar:'لا يوجد سعر موحّد للقيراط؛ تختلف القيمة بالنوع والجودة.',en:'No universal per-carat price: type and quality matter.',fr:'Aucun prix universel par carat : type et qualité comptent.'}
 ]},
 {id:'gem-origin',section:'gems',heading:{ar:'طبيعي أم مخبري أم مقلّد؟',en:'Natural, lab-grown or imitation?',fr:'Naturelle, de laboratoire ou imitation ?'},points:[
  {ar:'الطبيعي تكوّن في الطبيعة؛ المخبري صُنع بطرق تقنية.',en:'Natural stones form in nature; lab-grown stones are made under controlled conditions.',fr:'Une pierre naturelle s’est formée dans la nature ; une pierre de laboratoire est créée artificiellement.'},
  {ar:'المقلّد يشبه مظهر الحجر دون أن يكون من مادته نفسها.',en:'An imitation looks similar but is not the same material.',fr:'Une imitation reproduit l’aspect sans être la même matière.'},
  {ar:'اسأل عن المعالجات والشهادة والإفصاح كتابةً.',en:'Ask for treatment disclosure and any grading report in writing.',fr:'Demandez par écrit les traitements et les rapports disponibles.'}
 ]},
 {id:'labour',section:'workmanship',heading:{ar:'ما المقصود بالمصنعية؟',en:'What are making charges?',fr:'Que sont les frais de fabrication ?'},points:[
  {ar:'أجرة تصميم القطعة وصياغتها وتشطيبها وتركيب الأحجار.',en:'Covers design, fabrication, finishing and setting stones.',fr:'Couvre conception, fabrication, finition et sertissage.'},
  {ar:'ترتفع بالدقة والعمل اليدوي والتفاصيل والعلامة التجارية.',en:'Affected by craftsmanship, complexity, labour and brand.',fr:'Dépend du savoir-faire, de la complexité, du travail et de la marque.'},
  {ar:'المصنعية ليست جزءًا من وزن الذهب أو نقاوته.',en:'Making fees do not increase metal weight or purity.',fr:'La fabrication n’augmente ni le poids ni le titre de l’or.'}
 ]},
 {id:'making-model',section:'workmanship',heading:{ar:'طرق احتساب المصنعية',en:'How making charges are quoted',fr:'Modes de facturation de la fabrication'},points:[
  {ar:'مبلغ لكل جرام، أو أجرة ثابتة للقطعة، أو ضمن سعر شامل.',en:'Per gram, fixed per piece or included in an all-in price.',fr:'Au gramme, à la pièce ou inclus dans un prix global.'},
  {ar:'قارن السعر النهائي لقطع متقاربة في العيار والوزن.',en:'Compare the final cost for similar karat and weight.',fr:'Comparez le coût final à titre et poids équivalents.'},
  {ar:'اطلب فصل سعر الذهب والمصنعية والأحجار والضريبة.',en:'Request separate metal, making, gemstone and tax lines.',fr:'Exigez le détail : or, fabrication, pierres et taxes.'}
 ]},
 {id:'hollow',section:'workmanship',heading:{ar:'الذهب المجوف والخفيف',en:'Hollow and lightweight jewellery',fr:'Bijoux creux et légers'},points:[
  {ar:'قد تبدو القطعة كبيرة رغم خفة وزنها بسبب التجويف.',en:'A hollow design can look large despite low metal weight.',fr:'Une pièce creuse peut paraître volumineuse sans être lourde.'},
  {ar:'افحص سماكة القطعة ومتانتها وإمكانية إصلاحها.',en:'Check wall thickness, durability and repair options.',fr:'Vérifiez l’épaisseur, la résistance et la réparation.'},
  {ar:'السعر يُقارن بالوزن الفعلي لا بالحجم الظاهري.',en:'Compare actual weight, not apparent size.',fr:'Comparez le poids réel, pas le volume apparent.'}
 ]},
 {id:'hidden-premium',section:'workmanship',heading:{ar:'أسباب اختلاف سعر القطعة',en:'Why two quotes differ',fr:'Pourquoi les devis diffèrent'},points:[
  {ar:'السعر اللحظي وفرق البيع والشراء وهامش المحل.',en:'Quote timing, buy/sell spread and retailer margin.',fr:'Instant de cotation, écart achat/vente et marge.'},
  {ar:'العلامة التجارية ودقة الصياغة والضمان وخدمة ما بعد البيع.',en:'Brand, workmanship, warranty and after-sales service.',fr:'Marque, qualité de fabrication, garantie et service.'},
  {ar:'أسعار الأحجار والشهادات والتغليف قد ترفع الإجمالي.',en:'Gemstones, grading reports and packaging can add cost.',fr:'Pierres, rapports et emballage peuvent majorer le total.'}
 ]},
 {id:'invoice',section:'buying',heading:{ar:'بنود الفاتورة',en:'What to check on the invoice',fr:'Mentions utiles sur la facture'},points:[
  {ar:'بيانات البائع ووصف القطعة وعيار الذهب ووزنه.',en:'Seller, item description, gold purity and metal weight.',fr:'Vendeur, description, titre et poids du métal.'},
  {ar:'سعر الجرام والمصنعية والأحجار والضرائب والإجمالي.',en:'Per-gram rate, making, stones, tax and grand total.',fr:'Prix au gramme, fabrication, pierres, taxes et total.'},
  {ar:'شروط الاستبدال والصيانة والضمان حسب المتجر والأنظمة.',en:'Return, servicing and warranty terms, subject to local rules.',fr:'Conditions de retour, entretien et garantie selon la réglementation.'}
 ]},
 {id:'resell',section:'buying',heading:{ar:'لماذا تخسر عند إعادة البيع؟',en:'Why resale is often lower',fr:'Pourquoi la revente rapporte moins'},points:[
  {ar:'التاجر قد يشتري بسعر أقل من سعر بيعه للمستهلك.',en:'Dealer buyback rates are usually below retail selling rates.',fr:'Le prix de reprise est souvent inférieur au prix de détail.'},
  {ar:'المصنعية وهامش المتجر غالبًا لا يستردان بالكامل.',en:'Making fees and retail margins are often not recovered.',fr:'Fabrication et marge sont rarement récupérées intégralement.'},
  {ar:'الأحجار قد تُقيّم منفصلة أو لا تُشترى بالسعر الأصلي.',en:'Stones may be valued separately and below original retail price.',fr:'Les pierres peuvent être reprises séparément à un autre prix.'}
 ]},
 {id:'gold-vs-plate',section:'buying',heading:{ar:'ذهب عيار أم ذهب مطلي؟',en:'Gold alloy or plated jewellery?',fr:'Alliage d’or ou bijou plaqué ?'},points:[
  {ar:'المشغول الذهبي يُصنع من سبيكة لها عيار محدد.',en:'Gold jewellery is made from an alloy of stated purity.',fr:'Un bijou en or est fabriqué dans un alliage de titre déclaré.'},
  {ar:'المطلي يحمل طبقة ذهب فوق معدن آخر؛ محتواه الذهبي أقل.',en:'Gold plating coats another metal and has much less gold.',fr:'Le plaqué recouvre un autre métal et contient moins d’or.'},
  {ar:'اسأل عن نوع المنتج والدمغة ولا تعتمد على اللون.',en:'Check description and markings, not colour alone.',fr:'Vérifiez description et poinçons, pas seulement la couleur.'}
 ]},
 {id:'taxes',section:'buying',heading:{ar:'الضرائب والرسوم',en:'Taxes and fees',fr:'Taxes et frais'},points:[
  {ar:'قد تختلف معاملة المجوهرات عن بعض منتجات الذهب الاستثماري.',en:'Jewellery and eligible investment gold can be treated differently.',fr:'Bijoux et or d’investissement admissible peuvent être traités différemment.'},
  {ar:'لا تعتمد نسبة ضريبة موحدة على كل أنواع الذهب.',en:'Do not assume a single tax rule for every gold product.',fr:'Ne supposez pas un taux unique pour tous les produits en or.'},
  {ar:'راجع الفاتورة والأنظمة السارية في بلد الشراء.',en:'Check the itemized invoice and local regulations.',fr:'Vérifiez la facture détaillée et la réglementation locale.'}
 ]},
 {id:'app-prices',section:'dhahabi',heading:{ar:'ماذا يعرض سعر ذهبي؟',en:'What does the Dhahabi price show?',fr:'Que montre le cours Dhahabi ?'},points:[
  {ar:'سعر عالمي استرشادي حسب العيار وعملة العرض.',en:'An indicative reference price by karat and display currency.',fr:'Un cours indicatif selon le titre et la devise.'},
  {ar:'لا يشمل بالضرورة المصنعية والأحجار وهامش المحل والضريبة.',en:'May exclude making fees, stones, margin and tax.',fr:'Peut exclure fabrication, pierres, marge et taxes.'},
  {ar:'عند إغلاق السوق لا تُولّد أسعار جديدة لمجرد مرور الوقت.',en:'Closed markets do not create new price observations.',fr:'Les fermetures ne produisent pas de nouvelles cotations.'}
 ]},
 {id:'app-tools',section:'dhahabi',heading:{ar:'الحاسبة والمحفظة والتنبيهات',en:'Calculator, portfolio and alerts',fr:'Calculatrice, portefeuille et alertes'},points:[
  {ar:'الحاسبة تقديرية؛ أدخل العيار والوزن والتكاليف الإضافية.',en:'Calculator estimates require karat, weight and extra charges.',fr:'L’estimation utilise titre, poids et frais ajoutés.'},
  {ar:'المحفظة تحفظ قيمة الشراء بعملتها الأصلية.',en:'Portfolio purchases remain in their original currency.',fr:'Les achats du portefeuille gardent leur devise d’origine.'},
  {ar:'التنبيهات تتطلب تفعيل إذن الجهاز والاشتراك.',en:'Push alerts require device permission and subscription.',fr:'Les alertes Push exigent permission et abonnement de l’appareil.'}
 ]},
 {id:'app-chart',section:'dhahabi',heading:{ar:'قراءة الرسم الزمني',en:'Reading the price chart',fr:'Lire le graphique des cours'},points:[
  {ar:'الخط يعرض سجلات الأسعار الفعلية المتاحة للفترة.',en:'The chart displays available recorded price history.',fr:'Le graphique affiche les cours réellement enregistrés.'},
  {ar:'المتوسط اليومي التاريخي ليس سعرًا لحظيًا ولا سعر إغلاق رسميًا.',en:'A historical daily average is not a spot quote or official close.',fr:'Une moyenne quotidienne historique n’est ni un cours instantané ni un cours officiel de clôture.'},
  {ar:'علامات افتتاح وإغلاق الجلسة ترتبط بقراءات مسجلة.',en:'Open/close markers refer to recorded observations.',fr:'Les repères d’ouverture/fermeture renvoient aux relevés enregistrés.'}
 ]}
];

export const guideChecklist:readonly HelpText[]=[
 {ar:'قارن العيار والوزن الفعلي قبل مقارنة الأسعار.',en:'Compare karat and actual gold weight first.',fr:'Comparez d’abord le titre et le poids réel.'},
 {ar:'تحقق من الدمغة وبيانات البائع والفاتورة المفصلة.',en:'Check markings, seller details and the itemized bill.',fr:'Vérifiez poinçons, vendeur et facture détaillée.'},
 {ar:'افصل تكلفة الأحجار والمصنعية عن سعر الذهب.',en:'Separate gemstone and making costs from gold value.',fr:'Séparez pierres et fabrication du coût de l’or.'},
 {ar:'اسأل عن سياسة إعادة الشراء والاستبدال.',en:'Ask about buyback and return conditions.',fr:'Demandez les conditions de reprise et de retour.'}
];
