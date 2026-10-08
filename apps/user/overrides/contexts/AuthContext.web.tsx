import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
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
 const loadMe=async()=>{const me=await api('/auth/me');if(!me?.userId||!me?.email)throw new ApiError('Invalid user');
  if(me.role!=='user'){await clearSession();throw new ApiError('User app role mismatch',403);}
  const verified={id:me.userId,email:me.email,role:'user'} as User;
  await saveVerifiedUser({id:verified.id!,email:verified.email,role:'user'}).catch(()=>{});
  return verified;};
 useEffect(()=>{let active=true;const boot=version.current;const unsubscribe=onSessionEnded(()=>{version.current++;setUser(null);setLoading(false);});
  (async()=>{try{
   if(await hasSession()){
    // Show a previously server-verified identity without waiting for a potentially cold backend.
    // Protected data and mutations still require fresh server authentication.
    const cached=await getVerifiedCachedUser();
    if(active&&version.current===boot&&cached){setUser(cached);setLoading(false);}
    const me=await loadMe();
    if(active&&version.current===boot)setUser(me);
   }
  }catch(e){
   if(active&&version.current===boot)setError(errorMessage(e));
  }finally{
   if(active&&version.current===boot)setLoading(false);
  }})();
  return()=>{active=false;unsubscribe();};},[]);
 const login=async(email:string,password:string)=>{setLoading(true);setError(null);const current=++version.current;
  try{await authenticate('/auth/login',{email:email.trim(),password});const me=await loadMe();if(current===version.current)setUser(me);}catch(e){setError(errorMessage(e));throw e;}finally{setLoading(false);}};
 const startRegistration=async(name:string,email:string,password:string)=>{setLoading(true);setError(null);const current=++version.current;
  try{await authenticate('/auth/register',{email:email.trim(),password,fullName:name.trim()||undefined});const me=await loadMe();if(current===version.current)setUser(me);return true;}catch(e){setError(errorMessage(e));return false;}finally{setLoading(false);}};
 const unsupported=async()=>{setError('هذه الميزة غير متاحة من الخادم حاليًا.');return false;};
 const value:AuthContextType={user,isLoggedIn:!!user,isLoading,error,login,logout:()=>{version.current++;setUser(null);void clearSession();},clearError:()=>setError(null),
 biometricType:'none',biometricAvailable:false,biometricEnrolled:false,biometricEnabled:false,enableBiometric:async()=>{},disableBiometric:async()=>{},loginWithBiometric:unsupported,checkBiometricAvailability:async()=>{},
 resetStep:'email',resetEmail:'',resetCode:'',sendResetCode:unsupported,verifyResetCode:unsupported,resetPassword:unsupported,resendResetCode:unsupported,cancelReset:()=>{},
 registerStep:'form',registerEmail:'',registerCode:'',startRegistration,verifyRegistration:unsupported,resendRegisterCode:unsupported,cancelRegistration:()=>{},updateName:unsupported,changePassword:unsupported};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('AuthProvider required');return ctx;}
