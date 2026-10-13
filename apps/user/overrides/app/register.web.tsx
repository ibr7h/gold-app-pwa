import React from 'react';
import AuthForm from '../web/AuthForm';
import {LanguageProvider} from '../web/i18n';

// /register defaults to device locale but lets the user override it with the globe.
export default function RegisterWeb(){
 return <LanguageProvider mode="auth"><AuthForm register/></LanguageProvider>;
}
