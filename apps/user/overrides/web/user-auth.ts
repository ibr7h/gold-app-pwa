import {authenticate,clearSession,hasSession,getVerifiedCachedUser,saveVerifiedUser,validateSession,
 lockSession,openSession,confirmAccountPassword,sessionIsPersistent,ApiError,errorMessage} from './api';
import {hasQuickPin,setQuickPin,removeQuickPin,checkQuickPin,type PinResult} from './quick-pin';
import {localBiometricSupported,readLocalCredential,localCredentialConfigured,enrollLocalCredential,
 forgetLocalCredential,verifyLocalCredential,type LocalCredential} from './local-biometric';
export interface AuthUser{id:string|number;email:string;role:'user';name?:string}
export interface UserAuthState{
 user:AuthUser|null;lockedAccount:AuthUser|null;isLoading:boolean;error:string|null;
 quickPinEnabled:boolean;biometricAvailable:boolean;biometricEnrolled:boolean;biometricEnabled:boolean;
 sessionPersistent:boolean;
}
const dependencies={authenticate,clearSession,hasSession,getVerifiedCachedUser,saveVerifiedUser,validateSession,
 lockSession,openSession,confirmAccountPassword,sessionIsPersistent,hasQuickPin,setQuickPin,removeQuickPin,checkQuickPin,
 localBiometricSupported,readLocalCredential,localCredentialConfigured,enrollLocalCredential,
 forgetLocalCredential,verifyLocalCredential,now:()=>Date.now()};
export type UserAuthDependencies=typeof dependencies;
const initial=():UserAuthState=>({user:null,lockedAccount:null,isLoading:true,error:null,
 quickPinEnabled:false,biometricAvailable:false,biometricEnrolled:false,biometricEnabled:false,sessionPersistent:false});
const denied=():PinResult=>({ok:false,waitSeconds:0,remaining:0});

/** All asynchronous transitions are account-bound and invalidated by lock/logout/new login.
 * Local verification opens only an existing session, after authoritative /auth/me verification.
 */
export class UserAuthController{
 state=initial();
 private d:UserAuthDependencies;
 private generation=0;
 private abort=new AbortController();
 private credential:LocalCredential|null=null;
 private securityGrant:{accountId:string;until:number}|null=null;
 private hiddenAt:number|null=null;
 private listeners=new Set<(s:UserAuthState)=>void>();
 constructor(deps:Partial<UserAuthDependencies>={}){this.d={...dependencies,...deps};}
 subscribe(fn:(s:UserAuthState)=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private publish(p:Partial<UserAuthState>){this.state={...this.state,...p};this.listeners.forEach(fn=>fn(this.state));}
 private invalidate(){this.generation++;this.abort.abort();this.abort=new AbortController();this.securityGrant=null;return this.generation;}
 private current(n:number){return n===this.generation&&!this.abort.signal.aborted;}
 private finish(n:number){if(this.current(n))this.publish({isLoading:false});}
 private fail(e:unknown,n:number){
  if(!this.current(n))return;
  const message=e instanceof ApiError?errorMessage(e):e instanceof Error?e.message:'تعذر فتح الجلسة.';
  this.publish({error:message});
  if(e instanceof ApiError&&(e.status===401||e.status===403)){
   this.endSession();void this.d.clearSession();
  }
 }
 endSession(){
  this.invalidate();this.credential=null;
  this.publish({...initial(),isLoading:false,error:this.state.error||
   (this.state.user||this.state.lockedAccount||this.state.isLoading?'انتهت الجلسة. سجّل الدخول بكلمة المرور.':null)});
 }
 dispose(){this.invalidate();}
 clearError(){this.publish({error:null});}
 private async settings(me:AuthUser,n:number){
  const [pin,c,supported,configured,persistent]=await Promise.all([this.d.hasQuickPin(String(me.id)),
   this.d.readLocalCredential(),this.d.localBiometricSupported(),this.d.localCredentialConfigured(String(me.id)),this.d.sessionIsPersistent()]);
  if(!this.current(n))return null;
  const matched=!!c&&c.accountId===String(me.id);this.credential=matched?c:null;
  return {quickPinEnabled:pin,biometricAvailable:supported,biometricEnrolled:matched,
   biometricEnabled:matched,configured:pin||configured,sessionPersistent:persistent};
 }
 private async serverAccount(accountId?:string):Promise<AuthUser>{
  if(!await this.d.hasSession())throw new ApiError('انتهت الجلسة.',401);
  const me=await this.d.validateSession();
  if(accountId!==undefined&&String(me.id)!==accountId)throw new ApiError('الحساب الحالي لا يطابق قفل هذا الجهاز.',403);
  return me;
 }
 async boot(){
  const n=this.invalidate();this.d.lockSession();this.publish({...initial()});
  try{
   if(!await this.d.hasSession()){
    const available=await this.d.localBiometricSupported();
    if(this.current(n))this.publish({biometricAvailable:available,isLoading:false});return;
   }
   const cached=await this.d.getVerifiedCachedUser();
   if(!this.current(n))return;
   if(cached){
    const security=await this.settings(cached,n);if(!security)return;
    if(security.configured){this.publish({...security,lockedAccount:cached,user:null,isLoading:false});return;}
   }
   // Cached identity is only a lock-screen hint. It never grants access, even offline.
   const me=await this.serverAccount();if(!this.current(n))return;
   const security=await this.settings(me,n);if(!security)return;
   if(security.configured)this.publish({...security,lockedAccount:me,user:null});
   else{await this.d.saveVerifiedUser(me);if(!this.current(n))return;this.d.openSession();this.publish({...security,user:me,lockedAccount:null});}
  }catch(e){this.fail(e,n);}finally{this.finish(n);}
 }
 async login(email:string,password:string,registrationName?:string){
  const n=this.invalidate();this.d.lockSession();this.publish({...initial(),error:null});
  try{
   await this.d.authenticate(registrationName===undefined?'/auth/login':'/auth/register',
    {email:email.trim(),password,...(registrationName===undefined?{}:{fullName:registrationName.trim()||undefined})});
   if(!this.current(n))return;
   const me=await this.serverAccount();if(!this.current(n))return;
   if(me.email.toLowerCase()!==email.trim().toLowerCase())throw new ApiError('تعذر تأكيد الحساب الحالي.',403);
   const security=await this.settings(me,n);if(!security)return;
   await this.d.saveVerifiedUser(me);if(!this.current(n))return;
   this.d.openSession();this.publish({...security,user:me,lockedAccount:null});
   this.securityGrant={accountId:String(me.id),until:this.d.now()+120000};
  }catch(e){this.fail(e,n);throw e;}finally{this.finish(n);}
 }
 logout(){this.invalidate();this.credential=null;this.d.lockSession();
  this.publish({...initial(),isLoading:false});void this.d.clearSession();}
 async lock():Promise<boolean>{
  const me=this.state.user;if(!me||!(this.state.quickPinEnabled||this.state.biometricEnabled))return false;
  this.invalidate();this.d.lockSession();this.publish({lockedAccount:me,user:null,isLoading:false,error:null});return true;
 }
 async unlockWithPin(pin:string):Promise<PinResult>{
  const account=this.state.lockedAccount;
  if(!account||!this.state.quickPinEnabled||this.state.isLoading)return denied();
  const n=this.invalidate();this.publish({isLoading:true,error:null});
  try{
   const result=await this.d.checkQuickPin(String(account.id),pin);
   if(!result.ok||!this.current(n))return this.current(n)?result:denied();
   const me=await this.serverAccount(String(account.id));if(!this.current(n))return denied();
   await this.d.saveVerifiedUser(me);if(!this.current(n))return denied();
   this.d.openSession();this.publish({user:me,lockedAccount:null});return {ok:true,waitSeconds:0,remaining:5};
  }catch(e){this.fail(e,n);return denied();}finally{this.finish(n);}
 }
 async loginWithBiometric():Promise<boolean>{
  const account=this.state.lockedAccount,c=this.credential;
  if(!account||!c||c.accountId!==String(account.id)||!this.state.biometricEnabled||
    !this.state.biometricAvailable||this.state.isLoading)return false;
  const n=this.invalidate();this.publish({isLoading:true,error:null});
  try{
   // First async operation is the WebAuthn request, preserving Safari's real user activation.
   await this.d.verifyLocalCredential(c,this.abort.signal);if(!this.current(n))return false;
   const me=await this.serverAccount(c.accountId);if(!this.current(n))return false;
   await this.d.saveVerifiedUser(me);if(!this.current(n))return false;
   this.d.openSession();this.publish({user:me,lockedAccount:null});return true;
  }catch(e){this.fail(e,n);return false;}finally{this.finish(n);}
 }
 async authorizeSecurity(password:string){
  const me=this.state.user;if(!me||this.state.isLoading)throw new Error('سجّل الدخول أولًا.');
  const n=this.invalidate();this.publish({isLoading:true,error:null});
  try{
   await this.d.confirmAccountPassword(String(me.id),me.email,password);
   if(!this.current(n))throw new Error('تغيرت الجلسة؛ أعد المحاولة.');
   this.securityGrant={accountId:String(me.id),until:this.d.now()+120000};
  }catch(e){throw new Error(errorMessage(e));}finally{this.finish(n);}
 }
 private requireGrant():AuthUser{
  const me=this.state.user,g=this.securityGrant;
  if(!me||!g||g.accountId!==String(me.id)||g.until<this.d.now())throw new Error('أكد كلمة مرور حسابك أولًا.');
  return me;
 }
 async enableQuickPin(pin:string){
  const me=this.requireGrant(),n=this.generation;
  await this.serverAccount(String(me.id));if(!this.current(n))throw new Error('تغيرت الجلسة.');
  await this.d.setQuickPin(String(me.id),pin);if(!this.current(n))throw new Error('تغيرت الجلسة.');
  this.securityGrant=null;this.publish({quickPinEnabled:true});
 }
 async disableQuickPin(){
  const me=this.requireGrant(),n=this.generation;
  await this.serverAccount(String(me.id));if(!this.current(n))throw new Error('تغيرت الجلسة.');
  await this.d.removeQuickPin(String(me.id));if(!this.current(n))throw new Error('تغيرت الجلسة.');
  this.securityGrant=null;this.publish({quickPinEnabled:false});
 }
 async enableBiometric(){
  const me=this.state.user;if(!me||this.state.isLoading)throw new Error('سجّل الدخول أولًا.');
  const n=this.invalidate();this.publish({isLoading:true});
  try{
   const c=await this.d.enrollLocalCredential(String(me.id),me.email,this.abort.signal);
   if(!this.current(n))return;
   await this.serverAccount(String(me.id));if(!this.current(n))return;
   this.credential=c;this.publish({biometricAvailable:true,biometricEnrolled:true,biometricEnabled:true});
  }catch(e){if(this.current(n))throw e;}finally{this.finish(n);}
 }
 async disableBiometric(){
  const me=this.state.user;if(!me)throw new Error('سجّل الدخول أولًا.');const n=this.generation;
  await this.serverAccount(String(me.id));if(!this.current(n))return;
  await this.d.forgetLocalCredential();if(!this.current(n))return;
  this.credential=null;this.publish({biometricEnrolled:false,biometricEnabled:false});
 }
 async checkBiometricAvailability(){const n=this.generation,available=await this.d.localBiometricSupported();
  if(this.current(n))this.publish({biometricAvailable:available});}
 visibility(hidden:boolean){
  if(hidden){this.hiddenAt=this.d.now();
   if(this.state.lockedAccount&&this.state.isLoading){this.invalidate();this.publish({isLoading:false});}return;
  }
  if(this.hiddenAt!==null&&(this.d.now()-this.hiddenAt>=60000))void this.lock();this.hiddenAt=null;
 }
}
