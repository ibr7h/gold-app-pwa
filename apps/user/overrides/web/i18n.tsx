import React,{createContext,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {LANGUAGE_KEY,LANGUAGE_META,Language,translateUiText} from './i18n-messages';

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

export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,setLanguageState]=useState<Language>(storedLanguage);
 runtimeLanguage=language;
 const setLanguage=(next:Language)=>{
  if(next!=='ar'&&next!=='en'&&next!=='fr')return;
  runtimeLanguage=next;
  setLanguageState(next);
  try{window.localStorage.setItem(LANGUAGE_KEY,next);}catch{/* iOS private mode may deny storage. */}
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
  const observer=new MutationObserver(refresh);
  observerRef.current=observer;
  refresh();
  return()=>{observer.disconnect();if(observerRef.current===observer)observerRef.current=null;};
 },[language]);
 useEffect(()=>{try{window.localStorage.setItem(LANGUAGE_KEY,language);}catch{/* no persistent storage */}},[language]);
 return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

const fallbackLocale:LocaleController={language:'ar',setLanguage:()=>{},direction:'rtl'};
export function useLanguage():LocaleController{
 // Currency primitives are also rendered independently in component tests and snapshots.
 return useContext(LocaleContext)||fallbackLocale;
}
