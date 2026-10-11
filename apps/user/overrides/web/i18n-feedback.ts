import {Language,translateUiText} from './i18n-messages';

/** Public, presentation-only message localization. Never changes API payloads or status codes.
 * Unknown Arabic server text is intentionally not echoed to an EN/FR interface:
 * it may be a new validation response or contain user data. Preserve only mapped,
 * reviewed messages and use a safe generic fallback otherwise.
 */
const backendEnglish:Record<string,readonly [string,string]>={
 'Invalid credentials':['Incorrect email or password.','Adresse e-mail ou mot de passe incorrect.'],
 'Email already exists':['This email is already registered. Please sign in.','Cette adresse e-mail est déjà enregistrée. Veuillez vous connecter.'],
 'Cannot delete a portfolio that has purchases':['Delete the purchases in this portfolio first.','Supprimez d’abord les achats de ce portefeuille.'],
 'User app role mismatch':['Only user accounts can sign in to this app.','Seuls les comptes utilisateurs peuvent se connecter à cette application.'],
 'Unauthorized':['Please sign in again.','Veuillez vous reconnecter.'],
 'Forbidden':['You do not have permission for this action.',"Vous n'êtes pas autorisé à effectuer cette action."],
 'Bad Request':['Please check the entered values.','Veuillez vérifier les valeurs saisies.'],
 'Internal server error':['The server is temporarily unavailable. Please try again later.','Le serveur est temporairement indisponible. Veuillez réessayer plus tard.']
};
const fallback={
 ar:'تعذر تنفيذ الطلب. حاول مرة أخرى.',
 en:'Unable to complete the request. Please try again.',
 fr:'Impossible de traiter la demande. Veuillez réessayer.'
} as const;

/** Used at the point of rendering to also cover errors saved before language switching. */
export function localizeFeedback(message:unknown,language:Language):string{
 if(typeof message!=='string'||!message.trim())return '';
 const raw=message.trim();
 const en=backendEnglish[raw];
 if(en)return language==='ar'?raw:en[language==='en'?0:1];
 const translated=translateUiText(raw,language);
 if(translated!==raw||language==='ar')return translated;
 if(/[\u0600-\u06FF]/.test(raw))return fallback[language];
 // Unrecognized English-language backend errors should not appear in a French UI.
 if(language==='fr'&&/[A-Za-z]/.test(raw))return fallback.fr;
 return raw;
}
