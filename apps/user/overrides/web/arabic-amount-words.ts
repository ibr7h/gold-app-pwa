/**
 * Arabic Saudi-riyal amount in words, with two-decimal halala precision.
 * Pure display function: all calculations stay numeric in calculatorQuote().
 */
const units=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة'];
const teens=['عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const tens=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const hundreds=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];

function belowThousand(value:number):string{
 if(value===0)return '';
 const h=Math.floor(value/100),remainder=value%100;
 const segments:string[]=[];
 if(h)segments.push(hundreds[h]);
 if(remainder){
  const one=remainder%10;
  const t=Math.floor(remainder/10);
  if(remainder<10)segments.push(units[remainder]);
  else if(remainder<20)segments.push(teens[remainder-10]);
  else segments.push(one?units[one]+' و'+tens[t]:tens[t]);
 }
 return segments.join(' و');
}
export function numberToArabicWords(value:number):string{
 if(!Number.isSafeInteger(value)||value<0||value>999999999999)return '';
 if(value===0)return 'صفر';
 const scales:[string,string,string][]=[
  ['','',''],['ألف','ألفان','آلاف'],['مليون','مليونان','ملايين'],['مليار','ملياران','مليارات']
 ];
 const chunks:string[]=[];
 let rest=value,level=0;
 while(rest>0){
  const group=rest%1000;
  if(group){
   if(!level)chunks.unshift(belowThousand(group));
   else {
    const [one,two,many]=scales[level];
    chunks.unshift(group===1?one:group===2?two:group>=3&&group<=10?belowThousand(group)+' '+many:belowThousand(group)+' '+one);
   }
  }
  rest=Math.floor(rest/1000);level++;
 }
 return chunks.join(' و');
}


const feminineUnits=['','واحدة','اثنتان','ثلاث','أربع','خمس','ست','سبع','ثمان','تسع'];
const feminineTeens=['عشر','إحدى عشرة','اثنتا عشرة','ثلاث عشرة','أربع عشرة','خمس عشرة','ست عشرة','سبع عشرة','ثماني عشرة','تسع عشرة'];
function halalaCountWords(n:number):string{
 if(n<10)return feminineUnits[n];
 if(n<20)return feminineTeens[n-10];
 const rest=n%10,decade=Math.floor(n/10);
 return rest?feminineUnits[rest]+' و'+tens[decade]:tens[decade];
}

function unitName(amount:number,type:'riyals'|'halalas'):string{
 const end=amount%100;
 const count=end%10;
 if(type==='riyals'){
  if(amount===1)return 'ريال سعودي واحد';
  if(amount===2)return 'ريالان سعوديان';
  return numberToArabicWords(amount)+' '+(end>=3&&end<=10?'ريالات سعودية':'ريالًا سعوديًا');
 }
 if(amount===1)return 'هللة واحدة';
 if(amount===2)return 'هللتان';
 return halalaCountWords(amount)+' '+(end>=3&&end<=10?'هللات':'هللة');
}

export function amountToSaudiRiyalWords(amount:number|null|undefined):string{
 if(amount===null||amount===undefined||!Number.isFinite(amount)||amount<0)return '';
 // Keep two-decimal output aligned with the displayed total; never round inputs to the quote.
 const halalaTotal=Math.round((amount+Number.EPSILON)*100);
 if(!Number.isSafeInteger(halalaTotal)||halalaTotal>99999999999999)return '';
 const riyals=Math.floor(halalaTotal/100),halalas=halalaTotal%100;
 const parts=[riyals===0?'صفر ريال سعودي':unitName(riyals,'riyals')];
 if(halalas)parts.push(unitName(halalas,'halalas'));
 return 'فقط '+parts.join(' و')+' لا غير';
}


/** Spell out the chosen DISPLAY currency; never label USD amounts as Saudi riyals. */
export function amountToDisplayCurrencyWords(amount:number|null|undefined,currency:'SAR'|'USD'|'EUR'):string{
 if(currency==='SAR')return amountToSaudiRiyalWords(amount);
 if(amount===null||amount===undefined||!Number.isFinite(amount)||amount<0)return '';
 const centsTotal=Math.round((amount+Number.EPSILON)*100);
 if(!Number.isSafeInteger(centsTotal)||centsTotal>99999999999999)return '';
 const dollars=Math.floor(centsTotal/100),cents=centsTotal%100;
 const major=currency==='EUR'?' يورو':' دولار أمريكي';
 const minor=currency==='EUR'?' سنت يورو':' سنت أمريكي';
 return 'فقط '+numberToArabicWords(dollars)+major+(cents?' و'+numberToArabicWords(cents)+minor:'')+' لا غير';
}
