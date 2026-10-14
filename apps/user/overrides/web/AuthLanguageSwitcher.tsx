import React,{useEffect,useRef,useState} from 'react';
import {useLanguage} from './i18n';
import type {Language} from './i18n-messages';

const OPTIONS:readonly {value:Language;label:string}[]=[
 {value:'ar',label:'العربية'},{value:'en',label:'English'},{value:'fr',label:'Français'}
];

/** Keep the auth language independent of signed-in settings and visible as a single control. */
export function AuthLanguageSwitcher(){
 const {language,setLanguage}=useLanguage();
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const label=language==='ar'?'اللغة':language==='fr'?'Langue':'Language';
 const current=OPTIONS.find(option=>option.value===language)!.label;

 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);

 return <div className="dh-auth-language" ref={root} data-no-translate>
  <button type="button" className="dh-auth-language-trigger" aria-label={label+': '+current}
   aria-expanded={open} aria-haspopup="menu" aria-controls="dh-auth-language-menu"
   onClick={()=>setOpen(value=>!value)}>
   <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21M12 3c-3 3-4.5-6-4.5-9S9 18 12 21"/>
   </svg>
   <span className="dh-auth-language-label">{current}</span>
   <span className="dh-auth-language-chevron" aria-hidden="true">⌄</span>
  </button>
  {open&&<div id="dh-auth-language-menu" className="dh-auth-language-menu" role="menu" aria-label={label} dir={language==='ar'?'rtl':'ltr'}>
   {OPTIONS.map(option=><button type="button" key={option.value} role="menuitemradio"
    aria-checked={language===option.value} lang={option.value} onClick={()=>{setLanguage(option.value);setOpen(false);}}>
     <span>{option.label}</span><span aria-hidden="true">{language===option.value?'✓':''}</span>
    </button>)}
  </div>}
 </div>;
}
