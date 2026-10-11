import React from 'react';
import AuthForm from '../web/AuthForm';
import {LanguageProvider} from '../web/i18n';

// Direct /login route must initialize from device, not the last signed-in preference.
export default function LoginWeb(){
 return <LanguageProvider mode="device"><AuthForm/></LanguageProvider>;
}
