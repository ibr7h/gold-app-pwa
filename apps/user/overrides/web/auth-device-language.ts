import type {Language} from './i18n-messages';

/** Browser/PWA language is derived from the device's first preferred locale.
 * Unsupported device languages use English, and only an unavailable navigator
 * uses Arabic (the existing server-side Arabic baseline).
 * The saved signed-in application language is intentionally not consulted.
 */
export function deviceLanguageForLocales(locales:readonly string[]):Language{
 const primary=locales.find(locale=>typeof locale==='string'&&locale.trim().length>0);
 if(!primary)return 'ar';
 const base=primary.trim().replace(/_/g,'-').split('-')[0].toLowerCase();
 if(base==='ar')return 'ar';
 if(base==='fr')return 'fr';
 return 'en';
}

export function deviceLanguage():Language{
 if(typeof navigator==='undefined')return 'ar';
 const preferred=Array.isArray(navigator.languages)?[...navigator.languages]:[];
 if(!preferred.some(x=>typeof x==='string'&&x.trim())&&navigator.language)preferred.push(navigator.language);
 return deviceLanguageForLocales(preferred);
}
