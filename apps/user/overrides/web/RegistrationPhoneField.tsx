import React,{useEffect,useMemo,useRef,useState} from 'react';
import {countryDisplayName,countryFlag,countryOptions,internationalRegistrationPhone,PHONE_COUNTRIES,type PhoneCountry} from './phone-country';
import type {Language} from './i18n-messages';

/** Restores the October 10 country flag / dial code LEFT of the national number.
 * Uses the current email-verified registration API; this field does not verify
 * ownership of the phone number or create an account.
 */
export function RegistrationPhoneField({value,countryIso,language,onChange}:{
 value:string;countryIso:string;language:Language;
 onChange:(local:string,countryIso:string)=>void;
}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[touched,setTouched]=useState(false),[focusIndex,setFocusIndex]=useState(0);
 const root=useRef<HTMLDivElement>(null),phoneRef=useRef<HTMLInputElement>(null),searchRef=useRef<HTMLInputElement>(null);
 const t=(ar:string,en:string,fr:string)=>language==='en'?en:language==='fr'?fr:ar;
 const countries=useMemo(()=>countryOptions(language),[language]);
 const selected=PHONE_COUNTRIES.find(c=>c.iso===countryIso)||PHONE_COUNTRIES.find(c=>c.iso==='SA')!;
 const filtered=useMemo(()=>{
  const q=query.trim().toLocaleLowerCase();
  const preferred=['SA','AE','KW','BH','QA','OM','EG','JO','GB','US','FR'];
  const sorted=[...countries].sort((a,b)=>{
   const ia=preferred.indexOf(a.iso),ib=preferred.indexOf(b.iso);
   return ia<0&&ib<0?0:ia<0?1:ib<0?-1:ia-ib;
  });
  return q?sorted.filter(c=>(countryDisplayName(c,language)+' '+c.name+' '+c.dial+' '+c.iso).toLocaleLowerCase().includes(q)):sorted;
 },[query,countries,language]);
 const e164=internationalRegistrationPhone(selected.iso,value);
 const nonempty=value.trim().length>0;
 const status=!nonempty?'empty':e164?'valid':touched?'invalid':'pending';

 useEffect(()=>{
  if(!open)return;
  const closeOutside=(event:PointerEvent)=>{
   if(!root.current?.contains(event.target as Node))setOpen(false);
  };
  const closeEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',closeOutside);
  document.addEventListener('keydown',closeEscape);
  searchRef.current?.focus({preventScroll:true});
  return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeEscape);};
 },[open]);

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
   if(match){
    onChange(full.slice(match.dial.length),match.iso);
    setTouched(false);return;
   }
  }
  onChange(normalized.slice(0,40),countryIso);setTouched(false);
 };
 const choose=(country:PhoneCountry)=>{
  // Keep a typed national number and revalidate it under the newly selected dial code.
  onChange(value,country.iso);setOpen(false);setQuery('');setFocusIndex(0);setTouched(false);
  phoneRef.current?.focus({preventScroll:true});
 };
 return <div className="dh-intl-phone" ref={root} dir="ltr">
  <div className="dh-intl-phone-row">
   <button className="dh-intl-country-trigger" type="button" aria-label={t('اختر الدولة ورمز الاتصال','Choose country and calling code','Choisir le pays et son indicatif')}
    aria-expanded={open} aria-haspopup="listbox" aria-controls="dh-intl-country-options"
    onClick={()=>{setOpen(v=>!v);setQuery('');setFocusIndex(0);}}>
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
  {open&&<div className="dh-intl-country-panel" dir={language==='ar'?'rtl':'ltr'}>
   <input ref={searchRef} className="dh-intl-country-search" type="search" role="combobox"
    aria-expanded={open} aria-controls="dh-intl-country-options" aria-autocomplete="list"
    placeholder={t('ابحث عن الدولة أو رمز الاتصال','Search country or calling code','Rechercher un pays ou un indicatif')}
    value={query} onChange={e=>{setQuery(e.target.value);setFocusIndex(0);}}
    onKeyDown={e=>{
     if(e.key==='ArrowDown'){e.preventDefault();setFocusIndex(i=>Math.min(filtered.length-1,i+1));}
     if(e.key==='ArrowUp'){e.preventDefault();setFocusIndex(i=>Math.max(0,i-1));}
     if(e.key==='Enter'&&filtered[focusIndex]){e.preventDefault();choose(filtered[focusIndex]);}
    }}/>
   <div id="dh-intl-country-options" className="dh-intl-country-options" role="listbox"
    aria-label={t('الدول ورموز الاتصال','Countries and calling codes','Pays et indicatifs')}>
    {filtered.length===0?<p className="dh-intl-no-results">{t('لا توجد دولة مطابقة.','No matching country.','Aucun pays correspondant.')}</p>:
     filtered.map((c,i)=><button type="button" role="option" aria-selected={c.iso===countryIso}
      className={'dh-intl-country-option'+(focusIndex===i?' dh-intl-active':'')}
      key={c.iso} onClick={()=>choose(c)}>
       <span aria-hidden="true">{countryFlag(c.iso)}</span>
       <span>{countryDisplayName(c,language)}</span>
       <span className="dh-intl-option-dial" dir="ltr">{c.dial}</span>
      </button>)}
   </div>
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
