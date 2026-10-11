import React from 'react';
import AuthForm from '../web/AuthForm';
import {LanguageProvider} from '../web/i18n';

// /register can be loaded directly; apply device locale regardless of app preference.
export default function RegisterWeb(){
 return <LanguageProvider mode="device"><AuthForm register/></LanguageProvider>;
}
