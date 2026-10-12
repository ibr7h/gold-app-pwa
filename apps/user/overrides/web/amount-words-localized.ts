import type {Language} from './i18n-messages';
import {amountToDisplayCurrencyWords} from './arabic-amount-words';

const enSmall=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const enTens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function enBelowThousand(n:number):string{
 if(n<20)return enSmall[n];
 if(n<100)return enTens[Math.floor(n/10)]+(n%10?'-'+enSmall[n%10]:'');
 return enSmall[Math.floor(n/100)]+' hundred'+(n%100?' '+enBelowThousand(n%100):'');
}
function enWords(n:number):string{
 if(n===0)return 'zero';
 const chunks=['','thousand','million','billion','trillion'];
 const result:string[]=[];
 let i=0;
 while(n>0){const p=n%1000;if(p)result.unshift(enBelowThousand(p)+(chunks[i]?' '+chunks[i]:''));n=Math.floor(n/1000);i++;}
 return result.join(' ');
}

const frSmall=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
const frTens:{[k:number]:string}={20:'vingt',30:'trente',40:'quarante',50:'cinquante',60:'soixante'};
function frBelowHundred(n:number):string{
 if(n<=16)return frSmall[n];
 if(n<20)return 'dix-'+frSmall[n-10];
 if(n<70){
  const base=Math.floor(n/10)*10,rest=n%10;
  return frTens[base]+(rest===0?'':rest===1?' et un':'-'+frBelowHundred(rest));
 }
 if(n<80){
  return n===71?'soixante et onze':'soixante-'+frBelowHundred(n-60);
 }
 if(n===80)return 'quatre-vingts';
 return 'quatre-vingt-'+frBelowHundred(n-80);
}
function frBelowThousand(n:number):string{
 if(n<100)return frBelowHundred(n);
 const hundreds=Math.floor(n/100),rest=n%100;
 const prefix=hundreds===1?'cent':frSmall[hundreds]+' cent'+(rest===0?'s':'');
 return prefix+(rest?' '+frBelowHundred(rest):'');
}
function frWords(n:number):string{
 if(n===0)return 'zéro';
 const groups=[
  {unit:'',plural:''},
  {unit:'mille',plural:'mille'},
  {unit:'million',plural:'millions'},
  {unit:'milliard',plural:'milliards'},
  {unit:'billion',plural:'billions'}
 ];
 let level=0;const result:string[]=[];
 while(n>0){
  const chunk=n%1000;
  if(chunk){
   const scale=groups[level];
   const phrase=level===1&&chunk===1?'mille':
    level>1?frBelowThousand(chunk)+' '+(chunk>1?scale.plural:scale.unit):
    frBelowThousand(chunk)+(level===1?' mille':'');
   result.unshift(phrase);
  }
  n=Math.floor(n/1000);level++;
 }
 return result.join(' ');
}

/** Display-only verbalization. The invoice, alert and quote amounts are never changed. */
export function amountToLocalizedWords(value:number|null|undefined,currency:'SAR'|'USD'|'EUR',language:Language):string{
 if(language==='ar')return amountToDisplayCurrencyWords(value,currency);
 if(value==null||!Number.isFinite(value)||value<0)return '';
 const minorTotal=Math.round((value+Number.EPSILON)*100);
 if(!Number.isSafeInteger(minorTotal)||minorTotal>99999999999999)return '';
 const whole=Math.floor(minorTotal/100),minor=minorTotal%100;
 const words=language==='en'?enWords:frWords;
 if(language==='en'){
  const major=currency==='USD'?'US dollar':currency==='EUR'?'euro':'Saudi riyal',small=currency==='SAR'?'halala':'cent';
  return 'Only '+words(whole)+' '+major+(whole===1?'':'s')+(minor?' and '+words(minor)+' '+small+(minor===1?'':'s'):'')+'.';
 }
 const major=currency==='USD'?(whole>1?'dollars américains':'dollar américain'):
  currency==='EUR'?(whole>1?'euros':'euro'):(whole>1?'riyals saoudiens':'riyal saoudien');
 const small=currency==='SAR'?'halala':'centime';
 return 'Seulement '+words(whole)+' '+major+(minor?' et '+words(minor)+' '+small+(minor>1?'s':''):'')+'.';
}
