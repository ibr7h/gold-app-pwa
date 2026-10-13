import {ApiError,registrationRequest} from './api';

export function normalizeRegistrationPhone(value:unknown):string|null{
 if(typeof value!=='string'||value.length>40)return null;
 let phone=value.trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660))
  .replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6f0)).replace(/[\s()\-]/g,'');
 if(/^05\d{8}$/.test(phone))phone='+966'+phone.slice(1);
 if(/^009665\d{8}$/.test(phone))phone='+'+phone.slice(2);
 if(!/^\+[1-9]\d{7,14}$/.test(phone))return null;
 if(phone.startsWith('+966')&&!/^\+9665\d{8}$/.test(phone))return null;
 return phone;
}

export function registrationDigits(value:string){
 return value.replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660))
  .replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6f0)).replace(/[^0-9]/g,'').slice(0,6);
}

export interface RegistrationChallenge{registrationId:string;email:string;expiresAt:number;resendAt:number}
export function registrationChallenge(data:any,now=Date.now()):RegistrationChallenge{
 if(typeof data?.registrationId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.registrationId)
  ||typeof data.email!=='string'||!data.email.includes('@')||data.channel!=='email'
  ||!Number.isFinite(data.expiresIn)||data.expiresIn<0||data.expiresIn>600
  ||!Number.isFinite(data.resendAfterSeconds)||data.resendAfterSeconds<0||data.resendAfterSeconds>60
  ||'code' in data||'accessToken' in data||'refreshToken' in data)
  throw new ApiError('استجابة التحقق غير مكتملة. حاول لاحقًا.');
 return {registrationId:data.registrationId,email:data.email,expiresAt:now+data.expiresIn*1000,resendAt:now+data.resendAfterSeconds*1000};
}

export async function beginRegistration(name:string,email:string,password:string,phone:unknown){
 const normalized=normalizeRegistrationPhone(phone);
 if(!normalized)throw new ApiError('أدخل رقم جوال صحيحًا، مثل 05xxxxxxxx أو رقمًا دوليًا يبدأ بعلامة +.');
 return registrationChallenge(await registrationRequest('/auth/register',{
  email:email.trim(),password,phone:normalized,fullName:name.trim()||undefined,
 }));
}
export async function resendRegistration(registrationId:string){
 return registrationChallenge(await registrationRequest('/auth/register/resend',{registrationId}));
}
export async function registrationAvailable(){
 const config=await registrationRequest('/auth/registration/config');
 return config?.enabled===true&&config.channel==='email'&&config.codeLength===6;
}
