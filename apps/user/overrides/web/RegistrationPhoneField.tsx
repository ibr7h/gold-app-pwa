import React,{useEffect,useMemo,useRef,useState} from 'react';
import {countryDisplayName,countryFlag,countryOptions,internationalRegistrationPhone,PHONE_COUNTRIES,type PhoneCountry} from './phone-country';
import type {Language} from './i18n-messages';

const PREFERRED_COUNTRIES=['SA','AE','KW','BH','QA','OM','EG','JO','GB','US','FR'] as const;
const COUNTRY_PAGE_SIZE=24;

/** iPhone registration phone input: country selector stays left of the national number
 * in both RTL and LTR. Email verification, not phone ownership, activates the account.
 */
export function RegistrationPhoneField({value,countryIso,language,onChange}:{
 value:string;countryIso:string;language:Language;
 onChange:(local:string,countryIso:string)=>void;
}){
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState('');
 const [touched,setTouched]=useState(false);
 const [showAll,setShowAll]=useState(false);
 const [visibleCount,setVisibleCount]=useState(COUNTRY_PAGE_SIZE);
 const [focusIndex,setFocusIndex]=useState(0);
 const phoneRef=useRef<HTMLInputElement>(null);
 const searchRef=useRef<HTMLInputElement>(null);
 const t=(ar:string,en:string,fr:string)=>language==='en'?en:language==='fr'?fr:ar;
 const selected=PHONE_COUNTRIES.find(c=>c.iso===countryIso)||PHONE_COUNTRIES.find(c=>c.iso==='SA')!;

 // Intl.DisplayNames is computed once per locale, never on every search keystroke.
 const indexed=useMemo(()=>{
  const entries=countryOptions(language).map(country=>({
   country,
   label:countryDisplayName(country,language),
   search:(countryDisplayName(country,language)+' '+country.name+' '+country.dial+' '+country.iso).toLocaleLowerCase()
  }));
  return entries.sort((a,b)=>{
   const left=PREFERRED_COUNTRIES.indexOf(a.country.iso as typeof PREFERRED_COUNTRIES[number]);
   const right=PREFERRED_COUNTRIES.indexOf(b.country.iso as typeof PREFERRED_COUNTRIES[number]);
   return left<0&&right<0?0:left<0?1:right<0?-1:left-right;
  });
 },[language]);
 const filtered=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase();
  if(term)return indexed.filter(entry=>entry.search.includes(term));
  if(showAll)return indexed;
  return indexed.filter(entry=>PREFERRED_COUNTRIES.includes(entry.country.iso as typeof PREFERRED_COUNTRIES[number])||entry.country.iso===countryIso);
 },[indexed,query,showAll,countryIso]);
 const visible=filtered.slice(0,visibleCount);
 const e164=internationalRegistrationPhone(selected.iso,value);
 const status=!value.trim()?'empty':e164?'valid':touched?'invalid':'pending';

 useEffect(()=>{
  if(!open)return;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const onEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('keydown',onEscape);
  return()=>{
   document.body.style.overflow=previousOverflow;
   document.removeEventListener('keydown',onEscape);
  };
 },[open]);

 const resetList=()=>{
  setQuery('');setShowAll(false);setFocusIndex(0);setVisibleCount(COUNTRY_PAGE_SIZE);
 };
 const changeNumber=(input:string)=>{
  const normalized=input
   .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660))
   .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0))
   .replace(/[\u200e\u200f\u061c\u202a-\u202e]/g,'');
  const pasted=normalized.replace(/[\s()\-]/g,'');
  if(pasted.startsWith('+')||pasted.startsWith('00')){
   const full=pasted.startsWith('00')?'+'+pasted.slice(2):pasted;
   const match=[...PHONE_COUNTRIES].sort((a,b)=>b.dial.length-a.dial.length)
    .find(c=>full.startsWith(c.dial)&&(c.iso===countryIso||!PHONE_COUNTRIES.some(x=>x.iso===countryIso&&x.dial===c.dial)));
   if(match){onChange(full.slice(match.dial.length),match.iso);setTouched(false);return;}
  }
  onChange(normalized.slice(0,40),countryIso);setTouched(false);
 };
 const choose=(country:PhoneCountry)=>{
  onChange(value,country.iso);
  setOpen(false);resetList();setTouched(false);
  // Do not open the iPhone keyboard automatically after the country sheet closes.
 };
 return <div className="dh-intl-phone" dir="ltr" data-no-translate>
  <div className="dh-intl-phone-row">
   <button className="dh-intl-country-trigger" type="button"
    aria-label={t('اختر الدولة ورمز الاتصال','Choose country and calling code','Choisir le pays et son indicatif')}
    aria-expanded={open} aria-haspopup="dialog" aria-controls="dh-intl-country-panel"
    onClick={()=>{if(!open)resetList();setOpen(v=>!v);}}>
    <span className="dh-intl-country-flag" aria-hidden="true">{countryFlag(selected.iso)}</span>
    <span className="dh-intl-country-code" dir="ltr">{selected.dial}</span>
    <span className="dh-intl-chevron" aria-hidden="true">⌄</span>
   </button>
   <input ref={phoneRef} id="dh-register-phone" className="dh-intl-number" dir="ltr"
    inputMode="tel" type="tel" autoComplete="tel-national" required maxLength={40}
    value={value} aria-label={t('رقم الجوال','Mobile number','Numéro de mobile')}
    aria-describedby="dh-intl-phone-feedback" aria-invalid={status==='invalid'}
    placeholder={countryIso==='SA'?'5xxxxxxxx':t('الرقم المحلي','National number','Numéro national')}
    onBlur={()=>setTouched(true)} onChange={e=>changeNumber(e.target.value)}/>
  </div>
  {open&&<div className="dh-country-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
   <section id="dh-intl-country-panel" className="dh-intl-country-panel" role="dialog" aria-modal="true"
    aria-label={t('اختيار الدولة','Choose country','Choisir un pays')} dir={language==='ar'?'rtl':'ltr'}>
    <div className="dh-intl-country-header">
     <strong>{t('اختيار الدولة ورمز الاتصال','Choose country and calling code','Choisir le pays et son indicatif')}</strong>
     <button type="button" className="dh-intl-country-close" onClick={()=>setOpen(false)}
      aria-label={t('إغلاق','Close','Fermer')}>×</button>
    </div>
    <input ref={searchRef} className="dh-intl-country-search" type="search" role="combobox"
     aria-expanded={true} aria-controls="dh-intl-country-options" aria-autocomplete="list"
     placeholder={t('ابحث باسم الدولة أو رمز الاتصال','Search country or calling code','Rechercher un pays ou un indicatif')}
     value={query} onChange={e=>{setQuery(e.target.value);setFocusIndex(0);setVisibleCount(COUNTRY_PAGE_SIZE);}}
     onKeyDown={e=>{
      if(e.key==='ArrowDown'){e.preventDefault();setFocusIndex(i=>Math.min(visible.length-1,i+1));}
      if(e.key==='ArrowUp'){e.preventDefault();setFocusIndex(i=>Math.max(0,i-1));}
      if(e.key==='Enter'&&visible[focusIndex]){e.preventDefault();choose(visible[focusIndex].country);}
     }}/>
    <div id="dh-intl-country-options" className="dh-intl-country-options" role="listbox"
     aria-label={t('الدول ورموز الاتصال','Countries and calling codes','Pays et indicatifs')}>
     {visible.length===0?<p className="dh-intl-no-results">{t('لا توجد دولة مطابقة.','No matching country.','Aucun pays correspondant.')}</p>:
      visible.map((entry,i)=><button type="button" role="option"
       aria-selected={entry.country.iso===countryIso} key={entry.country.iso}
       className={'dh-intl-country-option'+(focusIndex===i?' dh-intl-active':'')}
       onClick={()=>choose(entry.country)}>
        <span className="dh-intl-option-flag" aria-hidden="true">{countryFlag(entry.country.iso)}</span>
        <span className="dh-intl-option-name">{entry.label}</span>
        <span className="dh-intl-option-dial" dir="ltr">{entry.country.dial}</span>
        {entry.country.iso===countryIso&&<span className="dh-intl-option-check" aria-hidden="true">✓</span>}
       </button>)}
     {!query&&!showAll&&<button type="button" className="dh-intl-country-more"
      onClick={()=>{setShowAll(true);setVisibleCount(COUNTRY_PAGE_SIZE);setFocusIndex(0);}}>
       {t('عرض جميع الدول','Show all countries','Afficher tous les pays')}
      </button>}
     {filtered.length>visible.length&&<button type="button" className="dh-intl-country-more"
      onClick={()=>setVisibleCount(n=>n+COUNTRY_PAGE_SIZE)}>
       {t('عرض المزيد','Show more','Afficher plus')}
      </button>}
    </div>
   </section>
  </div>}
  <p id="dh-intl-phone-feedback" className={'dh-intl-phone-feedback '+status}
   role={status==='invalid'?'alert':'status'} aria-live="polite">
   {status==='empty'?t('اختر الدولة ثم أدخل رقم الجوال.','Select your country, then enter your mobile number.','Choisissez le pays, puis saisissez votre numéro.'):
    status==='valid'?t('✓ تنسيق الرقم صحيح، وسيُتحقق من الحساب عبر البريد.','✓ Number format is valid; account verification is by email.','✓ Format du numéro valide ; le compte sera vérifié par e-mail.'):
    status==='pending'?t('أكمل رقم الجوال المحلي.','Complete the national mobile number.','Complétez le numéro de mobile national.'):
    t('تحقق من رقم الجوال ورمز الدولة المحدد.','Check the mobile number and selected country code.','Vérifiez le numéro et l’indicatif du pays.')}
  </p>
 </div>;
}
