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
  return stored==='ar'||stored==='en'||stored==='fr'?stored:'ar';
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

const ROOTS='.gold-web, .dh-quick-lock, .dh-pin-setup';

function localizeText(node:Text,language:Language){
 if(!node.parentElement||node.parentElement.closest('script,style,textarea,[data-no-translate]'))return;
 const current=node.nodeValue||'';
 const entry=textMemory.get(node);
 const original=entry&&current===entry.rendered?entry.original:current;
 const translated=translateUiText(original,language);
 if(current!==translated)node.nodeValue=translated;
 textMemory.set(node,{original,rendered:translated});
}
function localizeAttributes(el:Element,language:Language){
 if(el.closest('[data-no-translate]'))return;
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
/** Translation only; must not set dir/lang on a nested React-owned element. */
function localizeSubtree(root:Element,language:Language){
 if(root.closest('[data-no-translate]'))return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode())localizeText(walker.currentNode as Text,language);
 localizeAttributes(root,language);
 root.querySelectorAll('*').forEach(el=>localizeAttributes(el,language));
}
function localizeRoot(root:Element,language:Language){
 const direction=LANGUAGE_META[language].dir;
 for(const el of [root,...Array.from(root.querySelectorAll('[dir],[data-language-root="true"]'))]){
  if(!directionMemory.has(el))directionMemory.set(el,el.getAttribute('dir'));
  const original=directionMemory.get(el);
  if(original==='rtl'||el===root){
   const desired=el===root?direction:(language==='ar'?(original||'rtl'):direction);
   if(el.getAttribute('dir')!==desired)el.setAttribute('dir',desired);
  }
 }
 if(root.getAttribute('lang')!==language)root.setAttribute('lang',language);
 localizeSubtree(root,language);
}
/** Apply only the touched nodes instead of retranslating the entire screen per mutation. */
function localizeChanges(records:readonly MutationRecord[],language:Language){
 const changedElements=new Set<Element>();
 const changedText=new Set<Text>();
 for(const record of records){
  if(record.type==='characterData'){
   const node=record.target as Text;
   if(node.parentElement?.closest(ROOTS))changedText.add(node);
  }else if(record.type==='attributes'){
   const el=record.target as Element;
   if(el.closest(ROOTS))changedElements.add(el);
  }else{
   record.addedNodes.forEach(node=>{
    if(node.nodeType===Node.TEXT_NODE){
     const text=node as Text;
     if(text.parentElement?.closest(ROOTS))changedText.add(text);
    }else if(node.nodeType===Node.ELEMENT_NODE){
     const el=node as Element;
     if(el.matches(ROOTS))changedElements.add(el);
     else if(el.closest(ROOTS)||el.querySelector(ROOTS))changedElements.add(el);
    }
   });
  }
 }
 for(const el of changedElements){
  if(!el.isConnected)continue;
  if(el.matches(ROOTS))localizeRoot(el,language);
  else if(el.closest(ROOTS))localizeSubtree(el,language);
  else el.querySelectorAll(ROOTS).forEach(root=>localizeRoot(root,language));
 }
 for(const node of changedText){
  if(node.isConnected)localizeText(node,language);
 }
}

export function LanguageProvider({children,mode='app'}:{children:React.ReactNode;mode?:'app'|'device'|'auth'}){
 const [language,setLanguageState]=useState<Language>(()=>mode==='device'?deviceLanguage():mode==='auth'?authLanguage():storedLanguage());
 runtimeLanguage=language;
 const setLanguage=(next:Language)=>{
  if(mode==='device'||(next!=='ar'&&next!=='en'&&next!=='fr'))return;
  if(language===next)return;
  runtimeLanguage=next;
  setLanguageState(next);
  // An explicit choice applies to sign-in, signed-in screens and the updater.
  // Never let two storage keys pull the same PWA back to different locales.
  try{
   window.localStorage.setItem(LANGUAGE_KEY,next);
   window.localStorage.setItem(AUTH_LANGUAGE_KEY,next);
  }catch{/* iOS private mode may deny storage. */}
  window.dispatchEvent(new Event('dhahabi:user-language-changed'));
 };
 const value=useMemo<LocaleController>(()=>({language,setLanguage,direction:LANGUAGE_META[language].dir}),[language]);
 const observerRef=useRef<MutationObserver|null>(null);
 useLayoutEffect(()=>{
  const html=document.documentElement;
  html.setAttribute('lang',language);
  html.setAttribute('dir',LANGUAGE_META[language].dir);
  document.title=language==='ar'?'ذهبك':language==='en'?'Dhahabk':'Dhahabk';
  const observe=()=>observerRef.current?.observe(document.body,{
   subtree:true,childList:true,characterData:true,attributes:true,
   attributeFilter:['placeholder','title','aria-label','aria-valuetext','aria-description','alt']
  });
  // A full pass is justified when the locale changes, not for every clock
  // update, new price or React re-render (a major iPhone performance issue).
  const refresh=()=>{
   observerRef.current?.disconnect();
   document.querySelectorAll(ROOTS).forEach(el=>localizeRoot(el,language));
   observe();
  };
  let pendingFrame=0;
  const changes:MutationRecord[]=[];
  const observer=new MutationObserver(records=>{
   const relevant=records.filter(record=>{
    const target=record.target instanceof Element?record.target:record.target.parentElement;
    if(target?.closest(ROOTS))return true;
    return record.type==='childList'&&Array.from(record.addedNodes).some(node=>
     node instanceof Element&&(node.matches(ROOTS)||!!node.querySelector(ROOTS)));
   });
   if(!relevant.length)return;
   changes.push(...relevant);
   if(pendingFrame)return;
   pendingFrame=window.requestAnimationFrame(()=>{
    pendingFrame=0;
    observerRef.current?.disconnect();
    localizeChanges(changes.splice(0),language);
    observe();
   });
  });
  observerRef.current=observer;
  refresh();
  return()=>{
   if(pendingFrame)window.cancelAnimationFrame(pendingFrame);
   changes.length=0;
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
