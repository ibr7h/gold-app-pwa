import {api,ApiError,clearSession,verifyQuickSessionWithRecovery,saveVerifiedUser,getVerifiedCachedUser,type VerifiedCachedUser} from './api';
import {readVaultDeviceGrant} from './session-vault';
import type {SessionTokens} from './session-vault';

/** Decryption proves a local factor; only the backend can authorize this account. */
export async function verifyQuickUnlock(accountId:string,tokens:SessionTokens,isCurrent:()=>boolean):Promise<VerifiedCachedUser>{
 const check=()=>{if(!isCurrent())throw new ApiError('تغيرت الجلسة.',401);};
 check();
 const grant=await readVaultDeviceGrant(accountId);check();
 const me=await verifyQuickSessionWithRecovery(tokens,grant,accountId);check();
 if(me?.role!=='user'||!me?.email||String(me?.userId)!==accountId){
  await clearSession();throw new ApiError('الحساب الحالي لا يطابق الدخول السريع.',403);
 }
 const cached=await getVerifiedCachedUser();check();
 // An account-matched name may label the workspace while profile lookup is
 // temporarily unavailable; a fresh successful profile lookup is authoritative.
 let name=cached&&String(cached.id)===accountId?cached.name:undefined;
 try{
  const profile=await api<{id:string|number;fullName:string|null}>('/auth/profile');check();
  if(String(profile?.id)===accountId)name=profile.fullName?.trim()||undefined;
 }catch{check(); /* Do not block a valid /auth/me when profile data is unavailable. */}
 const user:VerifiedCachedUser={id:me.userId,email:me.email,role:'user',...(name?{name}:{})};
 await saveVerifiedUser(user);check();return user;
}
