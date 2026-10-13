import React from 'react';
import AuthForm from '../web/AuthForm';
import {LanguageProvider} from '../web/i18n';

// Direct /login defaults to the device locale unless the user chose an auth language.
export default function LoginWeb(){
 return <LanguageProvider mode="auth"><AuthForm/></LanguageProvider>;
}
