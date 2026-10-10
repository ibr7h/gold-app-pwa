import {beforeEach,describe,it,expect,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>memory.get(k)||null,setItem:async(k:string,v:string)=>{memory.set(k,v);},removeItem:async(k:string)=>{memory.delete(k);},multiRemove:async(keys:string[])=>keys.forEach(k=>memory.delete(k))}}));
import {activeSessionTokens,clearSession,errorMessage,ApiError,authenticate} from '../api';
import {beginRegistration,normalizeRegistrationPhone,registrationChallenge,registrationDigits,resendRegistration} from '../registration';
const challenge={registrationId:'8dea93b5-aa3e-4481-b81f-2fd688a70a8f',email:'new@example.test',channel:'email',expiresIn:599,resendAfterSeconds:59};
const response=(body:unknown,status=201)=>new Response(JSON.stringify(body),{status});
beforeEach(async()=>{vi.restoreAllMocks();await clearSession();});
describe('User phone and email registration',()=>{
 it('normalizes Saudi/international phones and Arabic/Persian digits without guessing missing countries',()=>{
  for(const phone of ['0501234567','٠٥٠١٢٣٤٥٦٧','۰۵۰۱۲۳۴۵۶۷','+966 50 123 4567','00966501234567'])expect(normalizeRegistrationPhone(phone)).toBe('+966501234567');
  expect(normalizeRegistrationPhone('+44 (7700) 900-123')).toBe('+447700900123');
  for(const phone of ['',undefined,'501234567','+966112345678','+0123456789','+9665012345678','x'.repeat(41)])expect(normalizeRegistrationPhone(phone)).toBeNull();
 });
 it('does not call the backend for a missing/invalid mobile number',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  await expect(beginRegistration('User','new@example.test','Password-fixture!',undefined)).rejects.toThrow('رقم جوال');
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('submits normalized phone, awaits email verification and never persists credentials or OTP',async()=>{
  const fetcher=vi.fn(async(_url:string,_options:RequestInit)=>response(challenge));vi.stubGlobal('fetch',fetcher);
  const result=await beginRegistration(' User ','new@example.test','Password-fixture!','٠٥٠١٢٣٤٥٦٧');
  const body=JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body).toEqual({email:'new@example.test',password:'Password-fixture!',fullName:'User',phone:'+966501234567'});
  expect(result.registrationId).toBe(challenge.registrationId);
  expect(()=>activeSessionTokens()).toThrow();expect(memory.size).toBe(0);
 });
 it('rejects a token or plaintext code in the pre-verification response',()=>{
  for(const key of ['code','accessToken','refreshToken'])expect(()=>registrationChallenge({...challenge,[key]:'invalid-exposure'})).toThrow();
  expect(()=>registrationChallenge({accessToken:'unverified-session',refreshToken:'unverified-refresh'})).toThrow();
 });
 it('validates registration nonce and countdowns rather than trusting malformed server state',()=>{
  expect(registrationChallenge(challenge,1000)).toMatchObject({expiresAt:600000,resendAt:60000});
  for(const data of [{...challenge,registrationId:'guessable'},{...challenge,expiresIn:Infinity},{...challenge,expiresIn:601},{...challenge,resendAfterSeconds:-1},{...challenge,channel:'sms'}])expect(()=>registrationChallenge(data)).toThrow();
 });
 it('takes the fresh nonce returned by a resend, without any stored session',async()=>{
  const next={...challenge,registrationId:'41a760f7-8b35-40fa-a981-7630247e2d04'};
  vi.stubGlobal('fetch',vi.fn(async()=>response(next)));
  expect((await resendRegistration(challenge.registrationId)).registrationId).toBe(next.registrationId);
  expect(memory.size).toBe(0);
 });
 it('translates the actual nested backend error envelope for duplicate phones and wrong codes',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response({success:false,error:{message:'Email or mobile number already exists'}},409)));
  try{await beginRegistration('User','new@example.test','Password-fixture!','0501234567');throw new Error('Expected rejection');}
  catch(error){expect(error).toBeInstanceOf(ApiError);expect(errorMessage(error)).toContain('رقم الجوال مسجل');}
  expect(errorMessage(new ApiError('Invalid or expired verification code',400))).toContain('انتهت صلاحيته');
 });
 it('cannot accept a verification token response after registration was cancelled',async()=>{
  let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>release=resolve)));
  const pending=authenticate('/auth/register/verify',{registrationId:challenge.registrationId,code:'123456'});
  await clearSession(false);release(response({accessToken:'cancelled-fixture',refreshToken:'cancelled-refresh-fixture'}));
  await expect(pending).rejects.toThrow();expect(()=>activeSessionTokens()).toThrow();expect(memory.size).toBe(0);
 });
 it('supports six-digit Arabic/Persian code input without adding a demo code',()=>{
  expect(registrationDigits('٠١٢٣٤٥')).toBe('012345');
  expect(registrationDigits('۰۱۲۳۴۵')).toBe('012345');
  expect(registrationDigits('123 456')).toBe('123456');
 });
});
