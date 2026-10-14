import React,{createContext,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {LANGUAGE_KEY,LANGUAGE_META,Language,translateUiText} from './i18n-messages';
import {deviceLanguage} from './auth-device-language';

const AUTH_LANGUAGE_KEY='dhahabi:user:auth-language';
function authLanguage():Language{
 try{const stored=window.localStorage.getItem(AUTH_LANGUAGE_KEY);
  if(stored==='ar'||stored==='en'||stored==='fr')return stored;
 }catch{/* Storage can be unavailable on Safari. */}
 return deviceLanguage();
}

type LocaleController={language:Language;setLanguage:(lang:Language)=>void;direction:'rtl'|'ltr'};
const LocaleContext=createContext<LocaleController|null>(null);
let runtimeLanguage:Language='ar';

export function storedLanguage():Language{
 try{
  const stored=window.localStorage.getItem(LANGUAGE_KEY);
  return stored==='en'||stored==='fr'?stored:'ar';
 }catch{return 'ar';}
}
export function activeLocale():string{return LANGUAGE_META[runtimeLanguage].intl;}
export function activeLanguage():Language{return runtimeLanguage;}

/** Keep source text for reversibility: switching en→fr→ar must not translate translations. */
type Original={original:string;rendered:string};
const textMemory=new WeakMap<Text,Original>();
const attrMemory=new WeakMap<Element,Map<string,Original>>();
const directionMemory=new WeakMap<Element,string|null>();
const attrs=['placeholder','title','aria-label','aria-valuetext','aria-description','alt'] as const;

function localizeRoot(root:Element,language:Language){
 const direction=LANGUAGE_META[language].dir;
 // Preserve explicit LTR fields (prices, passwords, account identifiers) while
 // restoring original RTL layout containers after switching back to Arabic.
 for(const el of [root,...Array.from(root.querySelectorAll('[dir],[data-language-root="true"]'))]){
  if(!directionMemory.has(el))directionMemory.set(el,el.getAttribute('dir'));
  const original=directionMemory.get(el);
  if(original==='rtl'||el===root){
   const desired=el===root?direction:(language==='ar'?(original||'rtl'):direction);
   if(el.getAttribute('dir')!==desired)el.setAttribute('dir',desired);
  }
 }
 root.setAttribute('lang',language);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode as Text;
  if(!node.parentElement||node.parentElement.closest('script,style,textarea,[data-no-translate]'))continue;
  const current=node.nodeValue||'';
  const entry=textMemory.get(node);
  const original=entry&&current===entry.rendered?entry.original:current;
  const translated=translateUiText(original,language);
  if(current!==translated)node.nodeValue=translated;
  textMemory.set(node,{original,rendered:translated});
 }
 for(const el of [root,...Array.from(root.querySelectorAll('*'))]){
  // Country and language pickers provide their own translations.
  if(el.closest('[data-no-translate]'))continue;
  for(const attr of attrs){
   const current=el.getAttribute(attr);
   if(current===null)continue;
   const map=attrMemory.get(el)||new Map<string,Original>();
   const prev=map.get(attr);
   const original=prev&&current===prev.rendered?prev.original:current;
   const translated=translateUiText(original,language);
   if(current!==translated)el.setAttribute(attr,translated);
   map.set(attr,{original,rendered:translated});attrMemory.set(el,map);
  }
 }
}

export function LanguageProvider({children,mode='app'}:{children:React.ReactNode;mode?:'app'|'device'|'auth'}){
 const [language,setLanguageState]=useState<Language>(()=>mode==='device'?deviceLanguage():mode==='auth'?authLanguage():storedLanguage());
 runtimeLanguage=language;
 const setLanguage=(next:Language)=>{
  if(mode==='device'||(next!=='ar'&&next!=='en'&&next!=='fr'))return;
  runtimeLanguage=next;
  setLanguageState(next);
  try{window.localStorage.setItem(mode==='auth'?AUTH_LANGUAGE_KEY:LANGUAGE_KEY,next);}catch{/* iOS private mode may deny storage. */}
  window.dispatchEvent(new Event('dhahabi:user-language-changed'));
 };
 const value=useMemo<LocaleController>(()=>({language,setLanguage,direction:LANGUAGE_META[language].dir}),[language]);
 const observerRef=useRef<MutationObserver|null>(null);
 useLayoutEffect(()=>{
  const html=document.documentElement;
  html.setAttribute('lang',language);
  html.setAttribute('dir',LANGUAGE_META[language].dir);
  document.title=language==='ar'?'ذهبي':language==='en'?'Dhahabi':'Dhahabi';
  const observe=()=>observerRef.current?.observe(document.body,{
   subtree:true,childList:true,characterData:true,attributes:true,
   attributeFilter:['placeholder','title','aria-label','aria-valuetext','aria-description','alt']
  });
  const refresh=()=>{
   observerRef.current?.disconnect();
   document.querySelectorAll('.gold-web, .dh-quick-lock, .dh-pin-setup').forEach(el=>localizeRoot(el,language));
   observe();
  };
  // Coalesce frequent DOM changes into one translation pass per paint.
  let pendingFrame=0;
  const observer=new MutationObserver(records=>{
   const relevant=records.some(record=>{
    const target=record.target instanceof Element?record.target:record.target.parentElement;
    return !!target?.closest('.gold-web, .dh-quick-lock, .dh-pin-setup');
   });
   if(!relevant||pendingFrame)return;
   pendingFrame=window.requestAnimationFrame(()=>{pendingFrame=0;refresh();});
  });
  observerRef.current=observer;
  refresh();
  return()=>{
   if(pendingFrame)window.cancelAnimationFrame(pendingFrame);
   observer.disconnect();
   if(observerRef.current===observer)observerRef.current=null;
  };
 },[language]);
 useEffect(()=>{
  if(mode!=='app')return;
  try{window.localStorage.setItem(LANGUAGE_KEY,language);}catch{/* no persistent storage */}
 },[language,mode]);
 return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

const fallbackLocale:LocaleController={language:'ar',setLanguage:()=>{},direction:'rtl'};
export function useLanguage():LocaleController{
 // Currency primitives are also rendered independently in component tests and snapshots.
 return useContext(LocaleContext)||fallbackLocale;
}
