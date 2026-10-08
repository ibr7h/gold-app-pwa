import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
import {localBiometricSupported,readLocalCredential,enrollLocalCredential,forgetLocalCredential,verifyLocalCredential,type LocalCredential} from '../web/local-biometric';
import {api,authenticate,clearSession,hasSession,getVerifiedCachedUser,saveVerifiedUser,onSessionEnded,errorMessage,ApiError} from '../web/api';
export type UserRole = 'user' | 'admin' | 'trader';
export type BiometricType = 'face' | 'fingerprint' | 'none';
export type ResetStep = 'email' | 'code' | 'newPassword' | 'success';
export type RegisterStep = 'form' | 'verify' | 'success';

export interface User {
  id?: string | number;
  openId?: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  biometricType: BiometricType;
  biometricAvailable: boolean;
  biometricEnrolled: boolean;
  biometricEnabled: boolean;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  checkBiometricAvailability: () => Promise<void>;
  lockWithBiometric: () => Promise<boolean>;
  resetStep: ResetStep;
  resetEmail: string;
  resetCode: string;
  sendResetCode: (email: string) => Promise<boolean>;
  verifyResetCode: (code: string) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<boolean>;
  resendResetCode: () => Promise<boolean>;
  cancelReset: () => void;
  registerStep: RegisterStep;
  registerEmail: string;
  registerCode: string;
  startRegistration: (name: string, email: string, password: string) => Promise<boolean>;
  verifyRegistration: (code: string) => Promise<boolean>;
  resendRegisterCode: () => Promise<boolean>;
  cancelRegistration: () => void;
  updateName: (newName: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}



const AuthContext=createContext<AuthContextType|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[isLoading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const version=useRef(0);
 const [biometricAvailable,setBiometricAvailable]=useState(false);
 const [biometricEnrolled,setBiometricEnrolled]=useState(false);
 const [biometricEnabled,setBiometricEnabled]=useState(false);
 const [lockedAccount,setLockedAccount]=useState<User|null>(null);
 const enrollment=useRef<LocalCredential|null>(null);
 const loadMe=async()=>{const me=await api('/auth/me');if(!me?.userId||!me?.email)throw new ApiError('Invalid user');
  if(me.role!=='user'){await clearSession();throw new ApiError('User app role mismatch',403);}
  const verified={id:me.userId,email:me.email,role:'user'} as User;
  await saveVerifiedUser({id:verified.id!,email:verified.email,role:'user'}).catch(()=>{});
  return verified;};
 const refreshBiometricState=async(me:User|null):Promise<boolean>=>{
  const c=await readLocalCredential();
  const supported=await localBiometricSupported();
  const matched=!!(c&&me&&c.accountId===String(me.id));
  enrollment.current=matched?c:null;
  setBiometricAvailable(supported);
  setBiometricEnrolled(matched);
  setBiometricEnabled(matched&&supported);
  return matched;
 };
 useEffect(()=>{let active=true;const boot=version.current;const unsubscribe=onSessionEnded(()=>{
  version.current++;enrollment.current=null;setLockedAccount(null);setBiometricEnabled(false);setBiometricEnrolled(false);setUser(null);setLoading(false);
 });
  (async()=>{try{
   const session=await hasSession();
   if(!session){if(active&&version.current===boot)await refreshBiometricState(null);return;}
   const cached=await getVerifiedCachedUser();
   const c=await readLocalCredential();
   if(c){
    const supported=await localBiometricSupported();
    if(active&&version.current===boot){setBiometricAvailable(supported);setBiometricEnrolled(true);setBiometricEnabled(supported);}
    if(cached&&String(cached.id)===c.accountId){
     // Never show cached account data until the user actively unlocks with device verification.
     if(active&&version.current===boot){enrollment.current=c;setLockedAccount(cached);setUser(null);setLoading(false);}
     return;
    }
   }
   if(active&&version.current===boot&&cached){setUser(cached);setLoading(false);}
   const me=await loadMe();
   if(!active||version.current!==boot)return;
   if(c&&c.accountId===String(me.id)){
    enrollment.current=c;setLockedAccount(me);setUser(null);setBiometricEnrolled(true);
    setBiometricEnabled(await localBiometricSupported());
   }else{
    setUser(me);
    setBiometricEnrolled(false);setBiometricEnabled(false);
   }
  }catch(e){
   if(active&&version.current===boot)setError(errorMessage(e));
  }finally{
   if(active&&version.current===boot)setLoading(false);
  }})();
  return()=>{active=false;unsubscribe();};},[]);
 const login=async(email:string,password:string)=>{setLoading(true);setError(null);const current=++version.current;
  try{await authenticate('/auth/login',{email:email.trim(),password});const me=await loadMe();if(current===version.current){
   setLockedAccount(null);setUser(me);await refreshBiometricState(me);
  }}catch(e){setError(errorMessage(e));throw e;}finally{setLoading(false);}};
 const startRegistration=async(name:string,email:string,password:string)=>{setLoading(true);setError(null);const current=++version.current;
  try{await authenticate('/auth/register',{email:email.trim(),password,fullName:name.trim()||undefined});const me=await loadMe();if(current===version.current){
   setLockedAccount(null);setUser(me);await refreshBiometricState(me);
  }return true;}catch(e){setError(errorMessage(e));return false;}finally{setLoading(false);}};
 const enableBiometric=async()=>{if(!user?.id||user.role!=='user')throw new Error('سجّل الدخول أولًا قبل تفعيل بصمة الجهاز.');
  const accountId=String(user.id);
  const c=await enrollLocalCredential(accountId,user.email);
  enrollment.current=c;setBiometricAvailable(true);setBiometricEnrolled(true);setBiometricEnabled(true);
 };
 const disableBiometric=async()=>{await forgetLocalCredential();enrollment.current=null;setBiometricEnrolled(false);setBiometricEnabled(false);setLockedAccount(null);};
 const lockWithBiometric=async():Promise<boolean>=>{
  if(!user||!biometricEnabled||!enrollment.current||!await hasSession())return false;
  setLockedAccount(user);setUser(null);return true;
 };
 const loginWithBiometric=async():Promise<boolean>=>{
  const c=enrollment.current;
  if(!c||!lockedAccount||c.accountId!==String(lockedAccount.id)||!biometricEnabled)return false;
  const current=++version.current;setError(null);setLoading(true);
  try{
   // Challenge is freshly signed on the device; signature, RP ID and user verification are verified locally.
   await verifyLocalCredential(c);
   if(!await hasSession())throw new ApiError('انتهت الجلسة. سجّل الدخول بكلمة المرور.',401);
   const me=await loadMe();
   if(String(me.id)!==c.accountId)throw new ApiError('الحساب الحالي لا يطابق بصمة الجهاز.',403);
   if(current===version.current){setLockedAccount(null);setUser(me);}
   return current===version.current;
  }catch(e){
   if(current===version.current)setError(e instanceof Error?e.message:'تعذر تأكيد هوية الجهاز.');
   return false;
  }finally{if(current===version.current)setLoading(false);}
 };
 const checkBiometricAvailability=async()=>{setBiometricAvailable(await localBiometricSupported());};
 const logout=()=>{version.current++;setLockedAccount(null);setUser(null);enrollment.current=null;setBiometricEnrolled(false);setBiometricEnabled(false);void clearSession();};
 const unsupported=async()=>{setError('هذه الميزة غير متاحة من الخادم حاليًا.');return false;};
 const value:AuthContextType={user,isLoggedIn:!!user,isLoading,error,login,logout,clearError:()=>setError(null),
 biometricType:'fingerprint',biometricAvailable,biometricEnrolled,biometricEnabled,enableBiometric,disableBiometric,loginWithBiometric,checkBiometricAvailability,lockWithBiometric,
 resetStep:'email',resetEmail:'',resetCode:'',sendResetCode:unsupported,verifyResetCode:unsupported,resetPassword:unsupported,resendResetCode:unsupported,cancelReset:()=>{},
 registerStep:'form',registerEmail:'',registerCode:'',startRegistration,verifyRegistration:unsupported,resendRegisterCode:unsupported,cancelRegistration:()=>{},updateName:unsupported,changePassword:unsupported};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('AuthProvider required');return ctx;}
