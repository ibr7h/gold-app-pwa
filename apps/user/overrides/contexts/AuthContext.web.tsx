import React,{createContext,useContext,useEffect,useState} from 'react';
import {onSessionEnded,lockSession} from '../web/api';
import {UserAuthController} from '../web/user-auth';
import type {PinResult} from '../web/quick-pin';
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
  lockedAccount: User | null;
  quickPinEnabled: boolean;
  sessionPersistent: boolean;
  enableQuickPin:(pin:string)=>Promise<void>;
  disableQuickPin:()=>Promise<void>;
  authorizeSecurity:(password:string)=>Promise<void>;
  unlockWithPin:(pin:string)=>Promise<PinResult>;
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
 const [controller]=useState(()=>new UserAuthController());
 const [state,setState]=useState(controller.state);
 useEffect(()=>{
  const unsubscribe=controller.subscribe(setState);
  const ended=onSessionEnded(()=>controller.endSession());
  const visibility=()=>controller.visibility(document.visibilityState==='hidden');
  const changed=(e:StorageEvent)=>{
   if(e.key==='dhahabi_user_session_vault_v1'||e.key==='dhahabi_user_refresh_token'){
    lockSession();controller.endSession();
   }
  };
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('storage',changed);
  void controller.boot();
  return()=>{unsubscribe();ended();controller.dispose();
   document.removeEventListener('visibilitychange',visibility);window.removeEventListener('storage',changed);};
 },[controller]);
 const unsupported=async()=>{return false;};
 const value:AuthContextType={...state,isLoggedIn:!!state.user,
  login:(email,password)=>controller.login(email,password),
  logout:()=>controller.logout(),clearError:()=>controller.clearError(),
  enableQuickPin:pin=>controller.enableQuickPin(pin),disableQuickPin:()=>controller.disableQuickPin(),
  authorizeSecurity:password=>controller.authorizeSecurity(password),unlockWithPin:pin=>controller.unlockWithPin(pin),
  biometricType:'fingerprint',enableBiometric:()=>controller.enableBiometric(),disableBiometric:()=>controller.disableBiometric(),
  loginWithBiometric:()=>controller.loginWithBiometric(),checkBiometricAvailability:()=>controller.checkBiometricAvailability(),
  lockWithBiometric:()=>controller.lock(),
  resetStep:'email',resetEmail:'',resetCode:'',sendResetCode:unsupported,verifyResetCode:unsupported,
  resetPassword:unsupported,resendResetCode:unsupported,cancelReset:()=>{},
  registerStep:'form',registerEmail:'',registerCode:'',
  startRegistration:async(name,email,password)=>{try{await controller.login(email,password,name);return true;}catch{return false;}},
  verifyRegistration:unsupported,resendRegisterCode:unsupported,cancelRegistration:()=>{},
  updateName:unsupported,changePassword:unsupported};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('AuthProvider required');return ctx;}
