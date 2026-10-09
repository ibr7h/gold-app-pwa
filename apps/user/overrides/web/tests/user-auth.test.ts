import {describe,it,expect,vi} from 'vitest';
import {UserAuthController,type UserAuthDependencies,type AuthUser} from '../user-auth';
import {ApiError} from '../api';
const account:AuthUser={id:'user-one',email:'one@example.test',role:'user'};
const other:AuthUser={id:'user-two',email:'two@example.test',role:'user'};
const good={ok:true,waitSeconds:0,remaining:5};
function setup(overrides:Partial<UserAuthDependencies>={}){
 const d:UserAuthDependencies={
  authenticate:vi.fn(async()=>{}),clearSession:vi.fn(async()=>{}),hasSession:vi.fn(async()=>true),
  getVerifiedCachedUser:vi.fn(async()=>account),saveVerifiedUser:vi.fn(async()=>{}),validateSession:vi.fn(async()=>account),
  lockSession:vi.fn(),openSession:vi.fn(),confirmAccountPassword:vi.fn(async()=>{}),
  sessionIsPersistent:vi.fn(async()=>true),
  hasQuickPin:vi.fn(async()=>true),setQuickPin:vi.fn(async()=>{}),removeQuickPin:vi.fn(async()=>{}),
  checkQuickPin:vi.fn(async()=>good),localBiometricSupported:vi.fn(async()=>false),readLocalCredential:vi.fn(async()=>null),
  localCredentialConfigured:vi.fn(async()=>false),enrollLocalCredential:vi.fn(),forgetLocalCredential:vi.fn(async()=>{}),
  verifyLocalCredential:vi.fn(async()=>{}),now:()=>100000,...overrides
 };
 return {d,c:new UserAuthController(d)};
}
function deferred<T>(){let resolve!:(v:T)=>void,reject!:(e:unknown)=>void;
 const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const turn=()=>new Promise(r=>setTimeout(r,0));
describe('actual User authentication state machine',()=>{
 it('boots to the lock without triggering WebAuthn or fetching private data',async()=>{
  const {c,d}=setup();await c.boot();expect(c.state.user).toBeNull();expect(c.state.lockedAccount).toEqual(account);
  expect(d.verifyLocalCredential).not.toHaveBeenCalled();expect(d.enrollLocalCredential).not.toHaveBeenCalled();expect(d.validateSession).not.toHaveBeenCalled();
 });
 it('never grants access from the identity cache while server verification is pending or offline',async()=>{
  const server=deferred<AuthUser>(),{c}=setup({hasQuickPin:async()=>false,validateSession:()=>server.promise});
  const boot=c.boot();await turn();expect(c.state.user).toBeNull();server.reject(new ApiError('offline'));
  await boot;expect(c.state.user).toBeNull();expect(c.state.isLoading).toBe(false);
 });
 it('opens an unprotected saved session only after server identity is verified',async()=>{
  const {c,d}=setup({hasQuickPin:async()=>false});await c.boot();expect(c.state.user).toEqual(account);expect(d.openSession).toHaveBeenCalledOnce();
 });
 it('requires successful local PIN and same server account before opening',async()=>{
  const {c,d}=setup();await c.boot();expect(await c.unlockWithPin('406195')).toEqual(good);expect(c.state.user).toEqual(account);
  expect(d.validateSession).toHaveBeenCalledOnce();expect(d.openSession).toHaveBeenCalledOnce();
 });
 it('wrong PIN neither checks the server nor opens the session',async()=>{
  const {c,d}=setup({checkQuickPin:async()=>({ok:false,waitSeconds:900,remaining:0})});await c.boot();
  expect((await c.unlockWithPin('999999')).waitSeconds).toBe(900);expect(d.validateSession).not.toHaveBeenCalled();expect(c.state.user).toBeNull();
 });
 it('rejects different server identity and elevated roles from validation',async()=>{
  const {c,d}=setup({validateSession:async()=>other});await c.boot();expect((await c.unlockWithPin('406195')).ok).toBe(false);
  expect(c.state.user).toBeNull();expect(d.clearSession).toHaveBeenCalled();expect(d.openSession).not.toHaveBeenCalled();
 });
 it('expired session fails closed, with a password fallback',async()=>{
  const {c,d}=setup();await c.boot();vi.mocked(d.hasSession).mockResolvedValue(false);
  expect((await c.unlockWithPin('406195')).ok).toBe(false);expect(c.state.lockedAccount).toBeNull();expect(c.state.user).toBeNull();expect(c.state.error).toMatch(/الجلسة/);
 });
 it('keeps the lock on a transient server failure after a correct PIN',async()=>{
  const {c}=setup({validateSession:async()=>{throw new ApiError('offline');}});await c.boot();
  expect((await c.unlockWithPin('406195')).ok).toBe(false);expect(c.state.lockedAccount).toEqual(account);expect(c.state.user).toBeNull();
 });
 it('logout cancels an in-flight PIN verification before it can check the server',async()=>{
  const pin=deferred<typeof good>(),{c,d}=setup({checkQuickPin:()=>pin.promise});await c.boot();
  const unlock=c.unlockWithPin('406195');c.logout();pin.resolve(good);expect((await unlock).ok).toBe(false);
  expect(c.state.user).toBeNull();expect(d.validateSession).not.toHaveBeenCalled();
 });
 it('logout cancels a server response that arrived after local unlock',async()=>{
  const server=deferred<AuthUser>(),{c,d}=setup({validateSession:()=>server.promise});await c.boot();
  const unlock=c.unlockWithPin('406195');await turn();c.logout();server.resolve(account);await unlock;
  expect(c.state.user).toBeNull();expect(d.openSession).not.toHaveBeenCalled();
 });
 it('a new login wins over an old account unlock, without mixing accounts',async()=>{
  const pin=deferred<typeof good>(),{c,d}=setup({checkQuickPin:()=>pin.promise});await c.boot();
  const old=c.unlockWithPin('406195');vi.mocked(d.validateSession).mockResolvedValue(other);
  await c.login(other.email,'password-fixture');pin.resolve(good);await old;expect(c.state.user).toEqual(other);
 });
 it('only one unlock operation runs at a time',async()=>{
  const pin=deferred<typeof good>(),{c,d}=setup({checkQuickPin:vi.fn(()=>pin.promise)});await c.boot();
  const first=c.unlockWithPin('406195');expect((await c.unlockWithPin('406195')).ok).toBe(false);
  pin.resolve(good);await first;expect(d.checkQuickPin).toHaveBeenCalledOnce();
 });
 it('unsupported biometrics retain the opted-in setting and offer password rather than an unavailable prompt',async()=>{
  const credential={version:1 as const,accountId:String(account.id),email:account.email,rpId:'example.test',credentialId:'public-id',publicKeySpki:'public-key',counter:0};
  const {c,d}=setup({hasQuickPin:async()=>false,readLocalCredential:async()=>credential,localCredentialConfigured:async()=>true});
  await c.boot();expect(c.state.lockedAccount).toEqual(account);expect(await c.loginWithBiometric()).toBe(false);expect(d.verifyLocalCredential).not.toHaveBeenCalled();
 });
 it('device verification is first, then authoritative server validation',async()=>{
  const order:string[]=[],credential={version:1 as const,accountId:String(account.id),email:account.email,rpId:'example.test',credentialId:'public-id',publicKeySpki:'public-key',counter:0};
  const {c}=setup({hasQuickPin:async()=>false,readLocalCredential:async()=>credential,localCredentialConfigured:async()=>true,localBiometricSupported:async()=>true,
   verifyLocalCredential:async()=>{order.push('device');},validateSession:async()=>{order.push('server');return account;}});
  await c.boot();expect(await c.loginWithBiometric()).toBe(true);expect(order).toEqual(['device','server']);
 });
 it('canceled biometrics keep the account locked',async()=>{
  const credential={version:1 as const,accountId:String(account.id),email:account.email,rpId:'example.test',credentialId:'public-id',publicKeySpki:'public-key',counter:0};
  const {c,d}=setup({readLocalCredential:async()=>credential,localCredentialConfigured:async()=>true,localBiometricSupported:async()=>true,
   verifyLocalCredential:async()=>{throw new DOMException('Canceled','NotAllowedError');}});
  await c.boot();expect(await c.loginWithBiometric()).toBe(false);expect(c.state.lockedAccount).toEqual(account);expect(d.validateSession).not.toHaveBeenCalled();
 });
 it('hiding the PWA cancels a pending biometric unlock and signals cancellation to WebAuthn',async()=>{
  const pending=deferred<void>(),credential={version:1 as const,accountId:String(account.id),email:account.email,rpId:'example.test',credentialId:'public-id',publicKeySpki:'public-key',counter:0};let signal:AbortSignal|undefined;
  const {c,d}=setup({readLocalCredential:async()=>credential,localCredentialConfigured:async()=>true,localBiometricSupported:async()=>true,
   verifyLocalCredential:async(_,s)=>{signal=s;await pending.promise;}});
  await c.boot();const unlock=c.loginWithBiometric();c.visibility(true);expect(signal?.aborted).toBe(true);
  pending.resolve();await unlock;expect(c.state.user).toBeNull();expect(d.validateSession).not.toHaveBeenCalled();
 });
 it('relocks after a minute in the background and immediately invalidates API requests',async()=>{
  let now=0;const {c,d}=setup({now:()=>now});await c.login(account.email,'password-fixture');
  c.visibility(true);now=60000;c.visibility(false);expect(c.state.user).toBeNull();expect(c.state.lockedAccount).toEqual(account);expect(d.lockSession).toHaveBeenCalledTimes(2);
 });
 it('does not relock for a brief app switch',async()=>{
  let now=0;const {c}=setup({now:()=>now});await c.login(account.email,'password-fixture');
  c.visibility(true);now=59000;c.visibility(false);expect(c.state.user).toEqual(account);
 });
 it('PIN changes and disabling require a fresh account password, including after a PIN unlock',async()=>{
  const {c,d}=setup();await c.boot();await c.unlockWithPin('406195');
  await expect(c.enableQuickPin('123456')).rejects.toThrow(/كلمة مرور/);await expect(c.disableQuickPin()).rejects.toThrow(/كلمة مرور/);
  await c.authorizeSecurity('password-fixture');await c.enableQuickPin('123456');expect(d.setQuickPin).toHaveBeenCalledWith(String(account.id),'123456');
  await expect(c.disableQuickPin()).rejects.toThrow(/كلمة مرور/);
  await c.authorizeSecurity('password-fixture');await c.disableQuickPin();expect(c.state.quickPinEnabled).toBe(false);
 });
 it('password recovery can replace a forgotten PIN without knowing it or deleting user data',async()=>{
  const {c,d}=setup();await c.boot();c.logout();await c.login(account.email,'password-fixture');
  await c.authorizeSecurity('password-fixture');await c.enableQuickPin('654321');expect(d.setQuickPin).toHaveBeenCalledOnce();expect(d.removeQuickPin).not.toHaveBeenCalled();expect(d.forgetLocalCredential).not.toHaveBeenCalled();
 });
 it('an expired settings grant cannot change the PIN',async()=>{
  let now=0;const {c}=setup({now:()=>now});await c.login(account.email,'password-fixture');now=120001;
  await expect(c.enableQuickPin('654321')).rejects.toThrow();
 });
 it('reports the tab-only fallback accurately when durable storage is unavailable',async()=>{
  const {c}=setup({sessionIsPersistent:async()=>false});await c.login(account.email,'password-fixture');
  expect(c.state.user).toEqual(account);expect(c.state.sessionPersistent).toBe(false);
 });
 it('logout during password confirmation cannot resurrect a settings grant',async()=>{
  const password=deferred<void>(),{c}=setup({confirmAccountPassword:()=>password.promise});await c.login(account.email,'password-fixture');
  const pending=c.authorizeSecurity('password-fixture');c.logout();password.resolve();await expect(pending).rejects.toThrow();
  await expect(c.enableQuickPin('654321')).rejects.toThrow();
 });
});
