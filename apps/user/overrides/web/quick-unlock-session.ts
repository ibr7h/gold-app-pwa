import {api,ApiError,clearSession,resumeSession,saveVerifiedUser,type VerifiedCachedUser} from './api';
import type {SessionTokens} from './session-vault';

/** Decryption proves a local factor; only the backend can authorize this account. */
export async function verifyQuickUnlock(accountId:string,tokens:SessionTokens,isCurrent:()=>boolean):Promise<VerifiedCachedUser>{
 const check=()=>{if(!isCurrent())throw new ApiError('تغيرت الجلسة.',401);};
 check();resumeSession(tokens);
 const me=await api('/auth/me');check();
 if(me?.role!=='user'||!me?.email||String(me?.userId)!==accountId){
  await clearSession();throw new ApiError('الحساب الحالي لا يطابق الدخول السريع.',403);
 }
 const user:VerifiedCachedUser={id:me.userId,email:me.email,role:'user'};
 await saveVerifiedUser(user);check();return user;
}
