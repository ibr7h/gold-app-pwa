/** iOS may complete Face ID yet leave navigator.credentials.get() unsettled.
 * Never authorize a session because a deadline fired: reject, abort the
 * platform request and let AuthContext invalidate any late continuation.
 */
export class BiometricUnlockTimeoutError extends Error {
 constructor(){super('انتهت مهلة فتح الجلسة بالبصمة. جرّب مجددًا أو ادخل بكلمة المرور.');this.name='BiometricUnlockTimeoutError';}
}

export async function withBiometricUnlockDeadline<T>(
 attempt:Promise<T>,controller:AbortController,timeoutMs=65000
):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  return await Promise.race([
   attempt,
   new Promise<T>((_,reject)=>{
    timer=setTimeout(()=>{
     controller.abort();
     reject(new BiometricUnlockTimeoutError());
    },timeoutMs);
   })
  ]);
 }finally{
  if(timer!==undefined)clearTimeout(timer);
 }
}
