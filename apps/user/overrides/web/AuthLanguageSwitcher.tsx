import React,{useEffect,useRef,useState} from 'react';
import {useLanguage} from './i18n';
import type {Language} from './i18n-messages';

/** A discreet auth-only globe: the initial locale follows the device,
 * with an explicit accessible override independent from signed-in settings.
 */
export function AuthLanguageSwitcher(){
 const {language,setLanguage}=useLanguage();
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const aria=language==='ar'?'تغيير اللغة':language==='fr'?'Changer de langue':'Change language';
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 const options:readonly {value:Language;label:string}[]=[
  {value:'ar',label:'العربية'},{value:'en',label:'English'},{value:'fr',label:'Français'}
 ];
 return <div className="dh-auth-language" ref={root}>
  <button type="button" className="dh-auth-language-trigger" aria-label={aria}
   aria-expanded={open} aria-haspopup="menu" onClick={()=>setOpen(v=>!v)}>
   <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21M12 3c-3 3-4.5 6-4.5 9S9 18 12 21"/>
   </svg>
   <span className="dh-auth-language-code">{language.toUpperCase()}</span>
  </button>
  {open&&<div className="dh-auth-language-menu" role="menu" aria-label={aria} dir="auto">
   {options.map(option=><button type="button" key={option.value} role="menuitemradio"
    aria-checked={language===option.value} lang={option.value} onClick={()=>{setLanguage(option.value);setOpen(false);}}>
     <span>{option.label}</span>{language===option.value&&<span aria-hidden="true">✓</span>}
    </button>)}
  </div>}
 </div>;
}
