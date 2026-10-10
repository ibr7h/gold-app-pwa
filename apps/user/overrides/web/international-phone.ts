import {AsYouType,getCountries,getCountryCallingCode,getExampleNumber,type CountryCode} from 'libphonenumber-js';
import {parsePhoneNumberFromString,validatePhoneNumberLength} from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/examples.mobile.json';

export type PhoneCountry=CountryCode;
export type PhoneStatus='empty'|'incomplete'|'valid'|'invalid';
export interface InternationalPhone {
 country:CountryCode;
 callingCode:string;
 display:string;
 e164:string|null;
 status:PhoneStatus;
 message:string;
 template:string;
}
export const PHONE_COUNTRIES=getCountries();
const countrySet=new Set<string>(PHONE_COUNTRIES);
const arabic=new Intl.DisplayNames(['ar'],{type:'region'});
const english=new Intl.DisplayNames(['en'],{type:'region'});
export const preferredCountries=['SA','AE','KW','BH','QA','OM','EG','JO','GB','US','CA','FR','IN','PK'] as CountryCode[];
export function isPhoneCountry(value:string):value is CountryCode{return countrySet.has(value);}
export function countryName(code:CountryCode,locale:'ar'|'en'='ar'){
 return (locale==='ar'?arabic:english).of(code)||code;
}
export function countryFlag(code:CountryCode){
 return [...code].map(ch=>String.fromCodePoint(127397+ch.charCodeAt(0))).join('');
}
export function callingCode(code:CountryCode){return '+'+getCountryCallingCode(code);}
export function searchCountries(query:string){
 const q=normalizeDigits(query).trim().toLocaleLowerCase().replace(/\s+/g,' ');
 const sorted=[...PHONE_COUNTRIES].sort((a,b)=>{
  const ia=preferredCountries.indexOf(a),ib=preferredCountries.indexOf(b);
  if(ia>=0||ib>=0)return (ia<0?999:ia)-(ib<0?999:ib);
  return countryName(a).localeCompare(countryName(b),'ar');
 });
 if(!q)return sorted;
 return sorted.filter(c=>[countryName(c),countryName(c,'en'),c,callingCode(c)].some(x=>x.toLocaleLowerCase().includes(q)));
}
export function normalizeDigits(raw:string){
 return raw.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660))
           .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06f0))
           .replace(/[\u200e\u200f\u061c\u202a-\u202e]/g,'');
}
export function phoneExample(country:CountryCode){
 try {return getExampleNumber(country,examples)?.formatNational()||'رقم الهاتف';}
 catch{return 'رقم الهاتف';}
}
export function readInternationalPhone(raw:string,country:CountryCode):InternationalPhone{
 const cleaned=normalizeDigits(raw).replace(/[^\d+ ()\-.]/g,'').trim();
 // International prefixes 00 and the common legacy unprefixed Saudi 9665...
 const normalized=cleaned.startsWith('00')?'+'+cleaned.slice(2)
  :country==='SA'&&/^9665\d/.test(cleaned)?'+'+cleaned:cleaned;
 const international=normalized.startsWith('+');
 const formatter=new AsYouType(international?undefined:country);
 const display=formatter.input(normalized);
 const parsed=normalized?parsePhoneNumberFromString(normalized,international?undefined:country):undefined;
 // An international prefix identifies a calling-code zone first; for shared
 // codes (+1, +7) the selected country is preserved until it is identifiable.
 const detected=(parsed?.country||formatter.getCountry());
 const current=detected&&isPhoneCountry(detected)?detected:country;
 let message='',status:PhoneStatus='empty',e164:string|null=null;
 if(normalized){
  const length=validatePhoneNumberLength(normalized,international?undefined:country);
  if(length==='TOO_LONG'||length==='INVALID_COUNTRY'||length==='NOT_A_NUMBER'){
   status='invalid';message='الرقم غير صالح للدولة أو رمز الاتصال المحدد.';
  }else if(!parsed||length==='TOO_SHORT'||length==='INVALID_LENGTH'||!parsed.isPossible()){
   status='incomplete';message='أكمل رقم الهاتف بحسب تنسيق الدولة.';
  }else if(parsed.isValid()){
   status='valid';e164=parsed.number;message='رقم بتنسيق صحيح (لم يتم إثبات ملكيته).';
  }else{
   status='invalid';message='تحقق من أرقام الهاتف ورمز الدولة.';
  }
 }
 return {
  country:current,
  callingCode:callingCode(current),
  display,
  e164,
  status,
  message,
  template:formatter.getTemplate()||'',
 };
}
export function isInternationalPhoneValid(number:string,country:CountryCode){
 const result=readInternationalPhone(number,country);
 return result.status==='valid'?result.e164:null;
}
