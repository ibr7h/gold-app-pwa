/** Non-exportable browser key. This is not a hardware keystore or an XSS defense. */
let flight:Promise<CryptoKey>|null=null;
export async function getSessionKey(create:boolean):Promise<CryptoKey>{
 if(typeof indexedDB==='undefined'||typeof crypto==='undefined'||!crypto.subtle)
  throw new Error('التخزين الآمن غير متاح في هذا المتصفح.');
 if(flight)return flight;
 const open=new Promise<IDBDatabase>((resolve,reject)=>{
  const r=indexedDB.open('dhahabi-user-session-vault',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('keys');
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  r.onblocked=()=>reject(new Error('تعذر فتح التخزين الآمن.'));
 });
 flight=(async()=>{
  const db=await open;
  try{
   // Generate outside the transaction: awaiting crypto inside it would let IDB auto-commit.
   const candidate=create?await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']):null;
   return await new Promise<CryptoKey>((resolve,reject)=>{
    const tx=db.transaction('keys',create?'readwrite':'readonly'),store=tx.objectStore('keys');
    const r=store.get('session');let key:CryptoKey|null=null;
    r.onsuccess=()=>{key=r.result||candidate;if(!r.result&&candidate)store.put(candidate,'session');};
    tx.oncomplete=()=>key?resolve(key):reject(new Error('تعذر استعادة مفتاح الجلسة؛ استخدم كلمة المرور.'));
    tx.onerror=tx.onabort=()=>reject(tx.error||new Error('تعذر حفظ مفتاح الجلسة.'));
   });
  }finally{db.close();}
 })();
 try{return await flight;}finally{flight=null;}
}
