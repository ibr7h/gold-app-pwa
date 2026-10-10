/** Arabic financial spelling for the calculator's displayed currency.
 * Derived from the supplied taf.html's Arabic number and currency rules.
 * The numeric calculator quote remains authoritative; this is view-only.
 */
type Unit={single:string;dual:string;plural:string;accusative:string;gender:'masc'|'fem'};
import type {PriceCurrency} from './price-currency-preference';
type CurrencyWords={main:Unit;sub:Unit};
const CURRENCIES:Record<PriceCurrency,CurrencyWords>={
 SAR:{
  main:{single:'ريال سعودي',dual:'ريالان سعوديان',plural:'ريالات سعودية',accusative:'ريالاً سعودياً',gender:'masc'},
  sub:{single:'هللة',dual:'هللتان',plural:'هللات',accusative:'هللةً',gender:'fem'},
 },
 USD:{
  main:{single:'دولار أمريكي',dual:'دولاران أمريكيان',plural:'دولارات أمريكية',accusative:'دولاراً أمريكياً',gender:'masc'},
  sub:{single:'سنت',dual:'سنتان',plural:'سنتات',accusative:'سنتاً',gender:'masc'},
 },
};
const tens=['','عشرة','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const hundreds=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
const scales=[
 {single:'',dual:'',plural:''},
 {single:'ألف',dual:'ألفان',plural:'آلاف'},
 {single:'مليون',dual:'مليونان',plural:'ملايين'},
 {single:'مليار',dual:'ملياران',plural:'مليارات'},
 {single:'تريليون',dual:'تريليونان',plural:'تريليونات'},
];

function belowHundred(n:number,feminine:boolean):string{
 if(n===0)return '';
 if(n<=10){
  if(n===1)return feminine?'واحدة':'واحد';
  if(n===2)return feminine?'اثنتان':'اثنان';
  const units=feminine
   ?['','','','ثلاث','أربع','خمس','ست','سبع','ثمان','تسع','عشر']
   :['','','','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة'];
  return units[n];
 }
 if(n<=19){
  if(n===11)return feminine?'إحدى عشرة':'أحد عشر';
  if(n===12)return feminine?'اثنتا عشرة':'اثنا عشر';
  const units=feminine
   ?['','','','ثلاث','أربع','خمس','ست','سبع','ثمان','تسع']
   :['','','','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة'];
  return units[n%10]+' '+(feminine?'عشرة':'عشر');
 }
 const u=n%10, t=Math.floor(n/10);
 if(!u)return tens[t];
 const unit=u===1?(feminine?'إحدى':'واحد')
  :u===2?(feminine?'اثنتان':'اثنان')
  :feminine?['','','','ثلاث','أربع','خمس','ست','سبع','ثمان','تسع'][u]
            :['','','','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة'][u];
 return unit+' و'+tens[t];
}
function belowThousand(n:number,feminine:boolean):string{
 if(n===0)return '';
 const h=Math.floor(n/100),remainder=n%100;
 const words:string[]=[];
 if(h)words.push(hundreds[h]);
 if(remainder)words.push(belowHundred(remainder,feminine));
 return words.join(' و');
}
function integerWords(n:number,feminine:boolean):string{
 if(n===0)return 'صفر';
 const chunks:number[]=[];
 while(n>0){chunks.push(n%1000);n=Math.floor(n/1000);}
 const words:string[]=[];
 for(let i=chunks.length-1;i>=0;i--){
  const group=chunks[i];
  if(!group)continue;
  if(i===0)words.push(belowThousand(group,feminine));
  else if(group===1)words.push(scales[i].single);
  else if(group===2)words.push(scales[i].dual);
  else if(group<=10)words.push(belowThousand(group,false)+' '+scales[i].plural);
  else words.push(belowThousand(group,false)+' '+scales[i].single);
 }
 return words.join(' و');
}
function currencyUnit(n:number,unit:Unit):string{
 if(n===1)return unit.single;
 if(n===2)return unit.dual;
 const rem=n%100;
 if(rem>=3&&rem<=10)return unit.plural;
 if(rem>=11&&rem<=99)return unit.accusative;
 return unit.single;
}
function currencyPhrase(n:number,unit:Unit):string{
 if(n===0)return '';
 if(n===1)return unit.single;
 if(n===2)return unit.dual;
 return integerWords(n,unit.gender==='fem')+' '+currencyUnit(n,unit);
}
/** Spell precisely the price the user sees (two decimals), with no FX conversion.
 * Invalid or unavailable quotes return null rather than a fabricated amount.
 */
export function tafqeetCurrency(total:number|null|undefined,currency:PriceCurrency):string|null{
 const words=CURRENCIES[currency];
 if(!words||total==null||!Number.isFinite(total)||total<0||total>=1_000_000_000_000_000)return null;
 const displayed=new Intl.NumberFormat('en-US',{
  useGrouping:false,minimumFractionDigits:2,maximumFractionDigits:2,
 }).format(total);
 const [integerPart,subPart='00']=displayed.split('.');
 const integer=Number(integerPart),fraction=Number(subPart);
 if(!Number.isSafeInteger(integer)||!Number.isInteger(fraction)||fraction<0||fraction>99)return null;
 const parts:string[]=[];
 if(integer>0)parts.push(currencyPhrase(integer,words.main));
 else if(fraction===0)parts.push('صفر '+words.main.single);
 if(fraction>0)parts.push(currencyPhrase(fraction,words.sub));
 return 'فقط '+parts.join(' و')+' لا غير';
}
/** Compatibility with earlier SAR calculator tests and any imports. */
export function tafqeetSar(total:number|null|undefined):string|null{
 return tafqeetCurrency(total,'SAR');
}
