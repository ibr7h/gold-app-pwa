import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {generateKeyPairSync,createHash,sign,webcrypto} from 'node:crypto';

const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('@react-native-async-storage/async-storage',()=>({default:{
 getItem:async(k:string)=>memory.get(k)||null,
 setItem:async(k:string,v:string)=>{memory.set(k,v);},
 removeItem:async(k:string)=>{memory.delete(k);}
}}));
import {verifyLocalCredential,enrollLocalCredential,readLocalCredential,forgetLocalCredential,type LocalCredential} from '../local-biometric';

const url='https://ibr7h.github.io';
const hostname='ibr7h.github.io';
const encode=(bytes:Uint8Array)=>Buffer.from(bytes).toString('base64url');
const buffer=(bytes:Uint8Array):ArrayBuffer=>Uint8Array.from(bytes).buffer as ArrayBuffer;

beforeEach(()=>{
 memory.clear();
 vi.stubGlobal('location',{hostname,origin:url});
 vi.stubGlobal('crypto',webcrypto);
 vi.stubGlobal('window',{isSecureContext:true,PublicKeyCredential:true});
});
afterEach(()=>vi.unstubAllGlobals());

function buildAssertion({verified=true,goodChallenge=true,goodRp=true,goodSignature=true}:{
 verified?:boolean;goodChallenge?:boolean;goodRp?:boolean;goodSignature?:boolean;
}={}){
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const pub=new Uint8Array(publicKey.export({format:'der',type:'spki'}));
 const id=webcrypto.getRandomValues(new Uint8Array(32));
 const c:LocalCredential={version:1,accountId:'account-123',email:'person@example.test',rpId:hostname,
  credentialId:encode(id),publicKeySpki:encode(pub),counter:0};
 memory.set('dhahabi_user_local_biometric_v1',JSON.stringify(c));
 const get=vi.fn(async (options:CredentialRequestOptions)=>{
  const req=options.publicKey!;
  const challenge=new Uint8Array(req.challenge as ArrayBuffer);
  const responseData=new TextEncoder().encode(JSON.stringify({
   type:'webauthn.get',challenge:goodChallenge?encode(challenge):encode(new Uint8Array(32)),origin:url
  }));
  const authData=new Uint8Array(37);
  authData.set(createHash('sha256').update(goodRp?hostname:'attacker.github.io').digest(),0);
  authData[32]=verified?0x05:0x01;
  authData[36]=1;
  const signed=Buffer.concat([authData,createHash('sha256').update(responseData).digest()]);
  const signature=sign('sha256',signed,privateKey);
  if(!goodSignature)signature[signature.length-1]^=0x01;
  return {type:'public-key',rawId:buffer(id),response:{
   clientDataJSON:buffer(responseData),authenticatorData:buffer(authData),signature:buffer(signature)
  }} as unknown as Credential;
 });
 vi.stubGlobal('navigator',{credentials:{get}});
 return {c,get};
}

describe('device-only WebAuthn assertion verification',()=>{
 it('accepts a genuine locally signed challenge with verified user presence and matching RP',async()=>{
  const {c,get}=buildAssertion();
  await expect(verifyLocalCredential(c)).resolves.toBeUndefined();
  expect(get).toHaveBeenCalledOnce();
  const request=get.mock.calls[0][0].publicKey!;
  expect(request.userVerification).toBe('required');
  expect(request.allowCredentials).toHaveLength(1);
 });
 it('rejects an assertion without biometric or device PIN verification',async()=>{
  const {c}=buildAssertion({verified:false});
  await expect(verifyLocalCredential(c)).rejects.toThrow();
 });
 it('rejects a challenge mismatch (replay attempt)',async()=>{
  const {c}=buildAssertion({goodChallenge:false});
  await expect(verifyLocalCredential(c)).rejects.toThrow();
 });
 it('rejects an RP ID hash from a different website',async()=>{
  const {c}=buildAssertion({goodRp:false});
  await expect(verifyLocalCredential(c)).rejects.toThrow();
 });
 it('rejects tampered ECDSA signatures',async()=>{
  const {c}=buildAssertion({goodSignature:false});
  await expect(verifyLocalCredential(c)).rejects.toThrow();
 });
 it('registers only the public credential after the operating system user verification',async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  void privateKey;
  const spki=new Uint8Array(publicKey.export({format:'der',type:'spki'}));
  const id=webcrypto.getRandomValues(new Uint8Array(32));
  const create=vi.fn(async(options:CredentialCreationOptions)=>{
   const request=options.publicKey!;
   const clientDataJSON=new TextEncoder().encode(JSON.stringify({
    type:'webauthn.create',challenge:encode(new Uint8Array(request.challenge as ArrayBuffer)),origin:url
   }));
   const authData=new Uint8Array(37);authData.set(createHash('sha256').update(hostname).digest());authData[32]=0x05;
   return {type:'public-key',rawId:buffer(id),response:{
    clientDataJSON:buffer(clientDataJSON),getPublicKey:()=>buffer(spki),
    getPublicKeyAlgorithm:()=>-7,getAuthenticatorData:()=>buffer(authData)
   }} as unknown as Credential;
  });
  vi.stubGlobal('navigator',{credentials:{create}});
  const credential=await enrollLocalCredential('account-123','person@example.test');
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0].publicKey?.authenticatorSelection?.userVerification).toBe('required');
  expect(credential.publicKeySpki).toBe(encode(spki));
  expect(await readLocalCredential()).toEqual(credential);
  expect([...memory.values()].join('')).not.toContain('PRIVATE KEY');
  await forgetLocalCredential();
  expect(await readLocalCredential()).toBeNull();
 });
 it('advances the live credential counter and rejects a repeated nonzero counter',async()=>{
  const {c}=buildAssertion();await verifyLocalCredential(c);expect(c.counter).toBe(1);
  await expect(verifyLocalCredential(c)).rejects.toThrow(/تسلسل/);
 });
 it('does not revive forgotten enrollment when a late assertion completes',async()=>{
  const {c}=buildAssertion();await forgetLocalCredential();
  await expect(verifyLocalCredential(c)).rejects.toThrow(/إيقاف/);expect(await readLocalCredential()).toBeNull();
 });
 it('rejects a repeated counter even when another tab has the older credential snapshot',async()=>{
  const {c}=buildAssertion();memory.set('dhahabi_user_local_biometric_v1',JSON.stringify({...c,counter:1}));
  await expect(verifyLocalCredential(c)).rejects.toThrow(/تسلسل/);
 });
 it('a canceled verification cannot update local state',async()=>{
  const {c}=buildAssertion();const controller=new AbortController();controller.abort();
  await expect(verifyLocalCredential(c,controller.signal)).rejects.toThrow();expect(c.counter).toBe(0);
 });
});
