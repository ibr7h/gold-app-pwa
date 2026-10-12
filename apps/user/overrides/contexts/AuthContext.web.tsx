import React,{createContext,useContext,useEffect,useState,useRef} from 'react';
import {localBiometricSupported,readLocalCredential,enrollLocalCredential,forgetLocalCredential,verifyLocalCredential,type LocalCredential} from '../web/local-biometric';
import {api,authenticate,clearSession,hasSession,getVerifiedCachedUser,saveVerifiedUser,onSessionEnded,errorMessage,ApiError,restoreLegacySession,activeSessionTokens,lockSession} from '../web/api';
import {verifyQuickUnlock} from '../web/quick-unlock-session';
import {hasSessionVault,hasBiometricVault,hasOpenVault,clearSessionVault,protectSessionWithPin,protectSessionWithBiometric,unlockSessionWithPin,unlockSessionWithBiometric,removeVaultMethod} from '../web/session-vault';
import {hasQuickPin,setQuickPin,removeQuickPin,checkQuickPin,storedQuickPinAccountId,type PinResult} from '../web/quick-pin';
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
  pinReconnectRequired: boolean;
  reconnectQuickPin:(currentPin:string)=>Promise<void>;
  enableQuickPin:(pin:string,currentPin?:string)=>Promise<void>;
  disableQuickPin:(currentPin:string)=>Promise<void>;
  unlockWithPin:(pin:string)=>Promise<PinResult>;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
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
  updateProfile: (changes:{fullName:string;city:string})=>Promise<{fullName:string|null;city:string|null;phone:string|null;email:string}>;
  updateName: (newName: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}



const AuthContext=createContext<AuthContextType|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[isLoading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const version=useRef(0),request=useRef<AbortController|null>(null);
 const [biometricAvailable,setBiometricAvailable]=useState(false);
 const [biometricEnrolled,setBiometricEnrolled]=useState(false);
 const [biometricEnabled,setBiometricEnabled]=useState(false);
 const [lockedAccount,setLockedAccount]=useState<User|null>(null);
 const [quickPinEnabled,setQuickPinEnabled]=useState(false);
 const [pinReconnectRequired,setPinReconnectRequired]=useState(false);
 const latestUser=useRef<User|null>(null),quickLockState=useRef(false),biometricLockState=useRef(false);
 latestUser.current=user;quickLockState.current=quickPinEnabled&&!pinReconnectRequired;biometricLockState.current=biometricEnabled&&!pinReconnectRequired;
 const enrollment=useRef<LocalCredential|null>(null);
 const begin=()=>{request.current?.abort();request.current=new AbortController();return ++version.current;};
 const current=(attempt:number)=>{if(attempt!==version.current)throw new Error('تغيرت الجلسة. أعد المحاولة.');};
 const loadMe=async(attempt=version.current,fallback?:User|null)=>{
  const me=await api('/auth/me');current(attempt);
  if(!me?.userId||!me?.email)throw new ApiError('Invalid user');
  if(me.role!=='user'){await clearSession();throw new ApiError('User app role mismatch',403);}
  const known=fallback||await getVerifiedCachedUser();current(attempt);
  let fullName:string|null=known&&String(known.id)===String(me.userId)?known.name||null:null;
  try{
    const profile=await api<{id:string|number;fullName:string|null}>('/auth/profile');
    current(attempt);
    if(String(profile.id)===String(me.userId))fullName=profile.fullName;
  }catch(e){current(attempt); /* Name lookup failure must not break a valid login. */}
  const verified={id:me.userId,email:me.email,role:'user',name:fullName?.trim()||undefined} as User;
  await saveVerifiedUser({id:verified.id!,email:verified.email,role:'user',name:verified.name});current(attempt);
  return verified;
 };
 const refreshBiometricState=async(me:User|null,attempt=version.current)=>{
  const c=await readLocalCredential(),supported=await localBiometricSupported();
  const matched=!!(c&&me&&c.accountId===String(me.id));
  const recoverable=matched&&me&&(hasOpenVault(String(me.id))||await hasBiometricVault(String(me.id)));
  if(attempt!==version.current)return;
  enrollment.current=matched?c:null;setBiometricAvailable(supported);
  setBiometricEnrolled(matched);setBiometricEnabled(!!recoverable&&supported);
 };
 useEffect(()=>{let active=true;const boot=version.current;
  const unsubscribe=onSessionEnded(()=>{
   begin();enrollment.current=null;setLockedAccount(null);setQuickPinEnabled(false);
   setBiometricEnabled(false);setBiometricEnrolled(false);setPinReconnectRequired(false);setUser(null);setLoading(false);
  });
  const onStorage=(event:StorageEvent)=>{
   if(event.key==='dhahabi_user_session_ended'&&event.newValue)void clearSession(false);
  };
  window.addEventListener('storage',onStorage);
  (async()=>{try{
   await restoreLegacySession();
   const session=await hasSession();
   if(!session){if(active&&version.current===boot)await refreshBiometricState(null);return;}
   const cached=await getVerifiedCachedUser(),c=await readLocalCredential();
   const pinReady=cached?.id?await hasQuickPin(String(cached.id)):false;
   if(cached&&(pinReady||(c&&String(cached.id)===c.accountId))){
    const supported=await localBiometricSupported();
    const encryptedBio=await hasBiometricVault(String(cached.id));
    // Cached identity can label the lock, but cannot authorize the workspace.
    if(active&&version.current===boot){
     const credential=!!c&&String(cached.id)===c.accountId;
     enrollment.current=credential?c:null;setBiometricAvailable(supported);setBiometricEnrolled(credential);
     setBiometricEnabled(credential&&supported&&encryptedBio);setQuickPinEnabled(pinReady);
     lockSession();setLockedAccount(cached);setUser(null);setLoading(false);
    }return;
   }
   const me=await loadMe(boot);if(!active||version.current!==boot)return;
   setUser(me);await refreshBiometricState(me);setQuickPinEnabled(false);
  }catch(e){if(active&&version.current===boot)setError(errorMessage(e));}
  finally{if(active&&version.current===boot)setLoading(false);}})();
  return()=>{active=false;unsubscribe();request.current?.abort();window.removeEventListener('storage',onStorage);};
 },[]);
 const passwordSession=async(path:'/auth/login'|'/auth/register',data:object)=>{
  const attempt=begin();setLoading(true);setError(null);
  try{
   const cachedBefore=await getVerifiedCachedUser();
   const savedPinAccount=await storedQuickPinAccountId();current(attempt);
   await authenticate(path,data);current(attempt);const me=await loadMe(attempt,cachedBefore);
   const sameSavedAccount=!!me.id&&(savedPinAccount
    ?String(me.id)===savedPinAccount
    :!!cachedBefore&&String(me.id)===String(cachedBefore.id));
   if(!sameSavedAccount){
    // A different account must not inherit this device's encrypted PIN vault.
    await clearSessionVault();
    if(savedPinAccount)await removeQuickPin(savedPinAccount);
    await forgetLocalCredential();current(attempt);
    enrollment.current=null;setQuickPinEnabled(false);setPinReconnectRequired(false);
    setBiometricEnrolled(false);setBiometricEnabled(false);
   }else{
    // Preserve the verifier. Reconfirm the old PIN once to re-wrap the freshly
    // issued JWTs; never write an unencrypted password, PIN or refresh token.
    const pinReady=await hasQuickPin(String(me.id));current(attempt);
    setQuickPinEnabled(pinReady);setPinReconnectRequired(pinReady);
    await refreshBiometricState(me,attempt);
   }
   setLockedAccount(null);setUser(me);setBiometricAvailable(await localBiometricSupported());
  }catch(e){if(attempt===version.current)setError(errorMessage(e));throw e;}
  finally{if(attempt===version.current)setLoading(false);}
 };
 const login=(identifier:string,password:string)=>passwordSession('/auth/login',{identifier:identifier.trim(),password});
 const startRegistration=async(name:string,email:string,password:string)=>{
  try{await passwordSession('/auth/register',{email:email.trim(),password,fullName:name.trim()||undefined});return true;}catch{return false;}
 };
 const enableBiometric=async()=>{
  if(!user?.id||user.role!=='user')throw new Error('سجّل الدخول أولًا قبل تفعيل بصمة الجهاز.');
  const attempt=begin(),accountId=String(user.id),tokens=activeSessionTokens();
  // Keep platform credential creation first, within the user's explicit tap.
  const c=await enrollLocalCredential(accountId,user.email,request.current!.signal);current(attempt);
  if(c.unlockSecret)await protectSessionWithBiometric(accountId,c.unlockSecret,tokens);
  current(attempt);
  // Without PRF, WebAuthn can unlock only this open tab. A restart needs PIN/password.
  enrollment.current=c;setBiometricAvailable(true);setBiometricEnrolled(true);setBiometricEnabled(true);
 };
 const disableBiometric=async()=>{
  if(!user?.id)throw new Error('سجّل الدخول أولًا.');
  const attempt=begin();await forgetLocalCredential();await removeVaultMethod(String(user.id),'biometric');current(attempt);
  enrollment.current=null;setBiometricEnrolled(false);setBiometricEnabled(false);
 };
 const lockWithBiometric=async():Promise<boolean>=>{
  const attempt=version.current;
  if(!user||pinReconnectRequired||!(quickPinEnabled||biometricEnabled&&enrollment.current)||!await hasSession()||attempt!==version.current)return false;
  begin();lockSession();setLockedAccount(user);setUser(null);return true;
 };
 const authorizePinChange=async(accountId:string,pin:string,attempt:number)=>{
  const result=await checkQuickPin(accountId,pin);current(attempt);
  if(!result.ok)throw new Error(result.waitSeconds?'محاولات كثيرة؛ استخدم كلمة المرور لاستعادة الوصول.':'رمز الدخول الحالي غير صحيح.');
  const me=await loadMe(attempt);if(String(me.id)!==accountId)throw new ApiError('User app role mismatch',403);
 };
 const enableQuickPin=async(pin:string,currentPin?:string)=>{
  if(!user?.id||user.role!=='user')throw new Error('سجّل الدخول إلى حسابك أولًا.');
  const attempt=begin(),accountId=String(user.id);
  if(quickPinEnabled)await authorizePinChange(accountId,currentPin||'',attempt);
  await protectSessionWithPin(accountId,pin,activeSessionTokens());current(attempt);
  await setQuickPin(accountId,pin);current(attempt);setQuickPinEnabled(true);setPinReconnectRequired(false);
 };
 const reconnectQuickPin=async(currentPin:string)=>{
  if(!user?.id||!pinReconnectRequired)throw new Error('لا يلزم إعادة ربط رمز الدخول.');
  const attempt=begin(),accountId=String(user.id);
  const result=await checkQuickPin(accountId,currentPin);current(attempt);
  if(!result.ok)throw new Error(result.waitSeconds?'محاولات كثيرة؛ حاول لاحقًا.':'رمز الدخول المحفوظ غير صحيح.');
  const tokens=activeSessionTokens();
  // Recover the old encrypted data key if present, without ever reusing its
  // potentially expired JWTs. This also retains an enrolled biometric envelope.
  if(await hasSessionVault(accountId))await unlockSessionWithPin(accountId,currentPin);
  current(attempt);
  await protectSessionWithPin(accountId,currentPin,tokens);current(attempt);
  setQuickPinEnabled(true);setPinReconnectRequired(false);
  await refreshBiometricState(user,attempt);
 };
 const disableQuickPin=async(currentPin:string)=>{
  if(!user?.id)throw new Error('سجّل الدخول أولًا.');
  const attempt=begin(),accountId=String(user.id);
  await authorizePinChange(accountId,currentPin,attempt);
  await removeQuickPin(accountId);await removeVaultMethod(accountId,'pin');current(attempt);setQuickPinEnabled(false);setPinReconnectRequired(false);
 };
 const unlockWithPin=async(pin:string):Promise<PinResult>=>{
  const account=lockedAccount;if(!account?.id||!quickPinEnabled)return {ok:false,waitSeconds:0,remaining:0};
  const attempt=begin();setError(null);setLoading(true);
  try{
   const result=await checkQuickPin(String(account.id),pin);current(attempt);if(!result.ok)return result;
   const tokens=await hasSessionVault(String(account.id))?await unlockSessionWithPin(String(account.id),pin):activeSessionTokens();
   const me=await verifyQuickUnlock(String(account.id),tokens,()=>attempt===version.current);
   await protectSessionWithPin(String(me.id),pin,activeSessionTokens());current(attempt);
   setLockedAccount(null);setUser(me);await refreshBiometricState(me,attempt);
   return {ok:true,waitSeconds:0,remaining:5};
  }catch(e){
   if(attempt===version.current){lockSession();setError(e instanceof Error?e.message:'تعذر فتح الجلسة.');}
   return {ok:false,waitSeconds:0,remaining:0};
  }finally{if(attempt===version.current)setLoading(false);}
 };
 const loginWithBiometric=async():Promise<boolean>=>{
  const c=enrollment.current,account=lockedAccount;
  if(!c||!account||c.accountId!==String(account.id)||!biometricEnabled)return false;
  const attempt=begin();setError(null);setLoading(true);
  try{
   const secret=await verifyLocalCredential(c,request.current!.signal);current(attempt);
   const tokens=await hasSessionVault(c.accountId)?await unlockSessionWithBiometric(c.accountId,secret):activeSessionTokens();
   const me=await verifyQuickUnlock(c.accountId,tokens,()=>attempt===version.current);
   current(attempt);setLockedAccount(null);setUser(me);return true;
  }catch(e){
   if(attempt===version.current){lockSession();setError(e instanceof Error?e.message:'تعذر تأكيد هوية الجهاز.');}return false;
  }finally{if(attempt===version.current)setLoading(false);}
 };
 const checkBiometricAvailability=async()=>setBiometricAvailable(await localBiometricSupported());
 useEffect(()=>{
  let hiddenAt:number|null=null;
  const onVisibility=()=>{
   if(document.visibilityState==='hidden'){hiddenAt=Date.now();return;}
   if(hiddenAt!==null&&Date.now()-hiddenAt>=60000&&latestUser.current&&(quickLockState.current||biometricLockState.current)){
    begin();lockSession();setLockedAccount(latestUser.current);setUser(null);setLoading(false);
   }hiddenAt=null;
  };
  document.addEventListener('visibilitychange',onVisibility);
  return()=>document.removeEventListener('visibilitychange',onVisibility);
 },[]);
 const logout=()=>{begin();setLockedAccount(null);setUser(null);enrollment.current=null;setQuickPinEnabled(false);setPinReconnectRequired(false);setBiometricEnrolled(false);setBiometricEnabled(false);setLoading(false);void clearSession();};
 const updateProfile=async(changes:{fullName:string;city:string})=>{
  const updated=await api<{id:string|number;fullName:string|null;city:string|null;phone:string|null;email:string}>('/auth/profile',{
    method:'PATCH',body:JSON.stringify(changes)
  });
  setUser(previous=>previous&&String(previous.id)===String(updated.id)
    ?{...previous,name:updated.fullName?.trim()||undefined}:previous);
  if(user?.id&&String(user.id)===String(updated.id))
   await saveVerifiedUser({id:user.id,email:user.email,role:'user',name:updated.fullName?.trim()||undefined});
  return updated;
 };
 const updateName=async(newName:string)=>{
  try{
   const updated=await api<{id:string|number;fullName:string|null}>('/auth/profile',{
    method:'PATCH',body:JSON.stringify({fullName:newName.trim()})
   });
   setUser(previous=>previous&&String(previous.id)===String(updated.id)
    ?{...previous,name:updated.fullName?.trim()||undefined}:previous);
   if(user?.id&&String(user.id)===String(updated.id))
    await saveVerifiedUser({id:user.id,email:user.email,role:'user',name:updated.fullName?.trim()||undefined});
   return true;
  }catch(e){setError(errorMessage(e));return false;}
 };
 const unsupported=async()=>{setError('هذه الميزة غير متاحة من الخادم حاليًا.');return false;};
 const value:AuthContextType={user,lockedAccount,quickPinEnabled,pinReconnectRequired,reconnectQuickPin,enableQuickPin,disableQuickPin,unlockWithPin,isLoggedIn:!!user,isLoading,error,login,logout,clearError:()=>setError(null),
 biometricType:'fingerprint',biometricAvailable,biometricEnrolled,biometricEnabled,enableBiometric,disableBiometric,loginWithBiometric,checkBiometricAvailability,lockWithBiometric,
 resetStep:'email',resetEmail:'',resetCode:'',sendResetCode:unsupported,verifyResetCode:unsupported,resetPassword:unsupported,resendResetCode:unsupported,cancelReset:()=>{},
 registerStep:'form',registerEmail:'',registerCode:'',startRegistration,verifyRegistration:unsupported,resendRegisterCode:unsupported,cancelRegistration:()=>{},updateProfile,updateName,changePassword:unsupported};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('AuthProvider required');return ctx;}
