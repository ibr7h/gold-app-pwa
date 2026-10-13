/** Offline, human-reviewed gold education constants used by the User app.
 * No live prices, account details, taxes or speculative valuations.
 */
export type HelpLanguage='ar'|'en'|'fr';
export type HelpText=Readonly<{ar:string;en:string;fr:string}>;
export type HelpSection='purity'|'weight'|'gems'|'workmanship'|'buying'|'dhahabi';
export const localized=(text:HelpText,language:HelpLanguage)=>text[language];

export const helpNavMessages:ReadonlyArray<readonly [string,string,string]>=[
 ['دليل الذهب والعيارات والأحجار والمصنعية','Gold, karats, gemstones & making charges','Or, carats, pierres et fabrication']
];

/** A mark such as 916 represents parts per thousand and can differ slightly
 * from the theoretical karat fraction because of convention and rounding.
 * Common marks are not a substitute for local hallmark validation.
 */
export const karatReference=([
 {karat:24,perThousand:'999 / 999.9',percentage:99.9},
 {karat:22,perThousand:'916',percentage:22/24*100},
 {karat:21,perThousand:'875',percentage:87.5},
 {karat:18,perThousand:'750',percentage:75},
 {karat:14,perThousand:'585',percentage:14/24*100},
 {karat:10,perThousand:'417',percentage:10/24*100},
 {karat:9,perThousand:'375',percentage:37.5}
] as const);
export const ounceGrams=31.1034768;
export const gemCaratGrams=0.2;

export function theoreticalFineGold(grams:number,karat:number){
 return Number.isFinite(grams)&&grams>=0&&grams<=1000000&&Number.isFinite(karat)&&karat>=1&&karat<=24
  ?grams*karat/24:null;
}
export function theoreticalStoneCharge(carats:number,perCarat:number){
 if(!Number.isFinite(carats)||!Number.isFinite(perCarat)||carats<0||perCarat<0||carats>1000000||perCarat>100000000)return null;
 const total=carats*perCarat;
 return Number.isFinite(total)?total:null;
}
export function theoreticalGoldInvoice(weight:number,perGram:number,making:number,stones:number){
 const values=[weight,perGram,making,stones];
 if(values.some(x=>!Number.isFinite(x)||x<0||x>100000000))return null;
 const gold=weight*perGram,total=gold+making+stones;
 return Number.isFinite(total)?{gold,subtotal:total}:null;
}

export const helpReferences:ReadonlyArray<{name:HelpText;url:string}>=[
 {name:{ar:'مجلس الذهب العالمي — ذهب المجوهرات والنقاوة',en:'World Gold Council — gold jewellery and fineness',fr:'World Gold Council — bijoux en or et titre'},url:'https://www.gold.org/about-gold/about-gold-jewellery'},
 {name:{ar:'جمعية سوق لندن للسبائك — الأونصة الترويسية',en:'LBMA — the troy ounce',fr:'LBMA — l’once troy'},url:'https://www.lbma.org.uk/wonders-of-gold/items/the-troy-ounce'},
 {name:{ar:'معهد الأحجار الكريمة الأمريكي — معايير الألماس الأربعة',en:'GIA — the diamond 4Cs',fr:'GIA — les 4C du diamant'},url:'https://4cs.gia.edu/en-us/'},
 {name:{ar:'لجنة التجارة الفيدرالية الأمريكية — شراء الأحجار',en:'FTC — buying gemstones',fr:'FTC — achat de pierres précieuses'},url:'https://consumer.ftc.gov/articles/buying-gemstones-diamonds-and-pearls'},
 {name:{ar:'لجنة التجارة الفيدرالية الأمريكية — شراء الذهب',en:'FTC — buying gold jewellery',fr:'FTC — achat de bijoux en or'},url:'https://consumer.ftc.gov/articles/buying-platinum-gold-and-silver-jewelry'}
];
