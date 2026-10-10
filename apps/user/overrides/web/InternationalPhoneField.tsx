import React,{useEffect,useMemo,useRef,useState} from 'react';
import {callingCode,countryFlag,countryName,phoneExample,readInternationalPhone,searchCountries,type PhoneCountry,type InternationalPhone} from './international-phone';
type Props={value:string;country:PhoneCountry;onChange:(phone:string,country:PhoneCountry,parsed:InternationalPhone)=>void;onCountryChange:(country:PhoneCountry)=>void};
export default function InternationalPhoneField({value,country,onChange,onCountryChange}:Props){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[touched,setTouched]=useState(false),[activeIndex,setActiveIndex]=useState(0);
 const rootRef=useRef<HTMLDivElement|null>(null),inputRef=useRef<HTMLInputElement|null>(null);
 const options=useMemo(()=>searchCountries(query),[query]);
 const parsed=useMemo(()=>readInternationalPhone(value,country),[value,country]);
 useEffect(()=>{
  if(!open)return;
  const off=(e:PointerEvent)=>{if(!rootRef.current?.contains(e.target as Node))setOpen(false);};
  document.addEventListener('pointerdown',off);
  return()=>document.removeEventListener('pointerdown',off);
 },[open]);
 const choose=(next:PhoneCountry)=>{
  setOpen(false);setQuery('');setActiveIndex(0);
  if(next!==country){
   // Avoid silently reinterpreting an existing phone number on country changes.
   onCountryChange(next);onChange('',next,readInternationalPhone('',next));setTouched(false);
  }
  inputRef.current?.focus({preventScroll:true});
 };
 const edit=(ev:React.ChangeEvent<HTMLInputElement>)=>{
  const next=readInternationalPhone(ev.target.value,country);
  if(next.country!==country)onCountryChange(next.country);
  onChange(next.display,next.country,next);setTouched(true);
 };
 const keyCountry=(ev:React.KeyboardEvent<HTMLInputElement>)=>{
  if(ev.key==='Escape'){ev.preventDefault();setOpen(false);}
  else if(ev.key==='ArrowDown'){ev.preventDefault();setActiveIndex(i=>Math.min(options.length-1,i+1));}
  else if(ev.key==='ArrowUp'){ev.preventDefault();setActiveIndex(i=>Math.max(0,i-1));}
  else if(ev.key==='Enter'&&options[activeIndex]){ev.preventDefault();choose(options[activeIndex]);}
 };
 const validity=parsed.status==='valid'?'valid':(touched&&parsed.status==='invalid')?'invalid':(touched&&parsed.status==='incomplete')?'pending':'';
 return <div className="dh-intl-phone" ref={rootRef} dir="rtl">
  <div className="dh-intl-phone-row">
   <button type="button" className="dh-intl-country-trigger"
    aria-label={'اختر دولة رقم الهاتف، حاليًا '+countryName(country)+' '+callingCode(country)}
    aria-haspopup="listbox" aria-expanded={open} aria-controls="dh-intl-country-options"
    onClick={()=>{setOpen(v=>!v);setQuery('');setActiveIndex(0);}}>
    <span className="dh-intl-country-flag" aria-hidden="true">{countryFlag(country)}</span>
    <span className="dh-intl-country-code" dir="ltr">{callingCode(country)}</span>
    <span className="dh-intl-chevron" aria-hidden="true">⌄</span>
   </button>
   <input ref={inputRef} id="dh-register-phone" className="dh-intl-number" type="tel" dir="ltr"
    inputMode="tel" autoComplete="tel-national" required
    aria-label="رقم الهاتف الدولي" aria-invalid={validity==='invalid'}
    aria-describedby="dh-intl-phone-feedback"
    value={value} maxLength={28} placeholder={phoneExample(country)}
    onChange={edit} onBlur={()=>setTouched(true)}/>
  </div>
  {open&&<div className="dh-intl-country-panel" aria-label="اختيار الدولة ورمز الاتصال">
    <input className="dh-intl-country-search" autoFocus type="search" role="combobox"
     aria-controls="dh-intl-country-options" aria-autocomplete="list" aria-expanded={open}
     value={query} onChange={e=>{setQuery(e.target.value);setActiveIndex(0);}}
     onKeyDown={keyCountry} placeholder="ابحث باسم الدولة أو الرمز (+966)…"/>
    <div id="dh-intl-country-options" className="dh-intl-country-options" role="listbox" aria-label="الدول المتاحة">
     {options.length===0?<p className="dh-intl-no-results">لم نعثر على دولة مطابقة.</p>
      :options.map((code,i)=><button key={code} type="button" role="option"
       aria-selected={code===country} className={'dh-intl-country-option'+(activeIndex===i?' dh-intl-active':'')}
       onClick={()=>choose(code)}>
       <span aria-hidden="true">{countryFlag(code)}</span>
       <span>{countryName(code)}</span>
       <span className="dh-intl-option-dial" dir="ltr">{callingCode(code)}</span>
      </button>)}
    </div>
   </div>}
  <p id="dh-intl-phone-feedback" className={'dh-intl-phone-feedback '+validity}
   role={validity==='invalid'?'alert':'status'} aria-live="polite">
   {parsed.status==='empty'?'رمز '+callingCode(country)+' · اكتب الرقم المحلي أو الصق رقمًا يبدأ بـ +'
    :parsed.status==='valid'?'✓ '+parsed.message
    :validity==='invalid'?'! '+parsed.message
    :parsed.status==='incomplete'?'التنسيق آلي · '+parsed.message:parsed.message}
  </p>
  {value&&parsed.status!=='valid'&&parsed.template&&<p className="dh-intl-phone-mask" aria-hidden="true" dir="ltr">{parsed.template.replace(/x/g,'·')}</p>}
 </div>;
}
