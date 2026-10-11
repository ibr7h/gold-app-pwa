/**
 * Always request a fresh fix on entry to nearby markets.
 * Browser/device geolocation permission can be requested, never forced on.
 */
export interface NearbyPosition {latitude:number;longitude:number;accuracyMeters:number}
export class NearbyLocationError extends Error {
 constructor(message:string,public readonly reason:'permission'|'unavailable'|'timeout'|'invalid'){
  super(message);this.name='NearbyLocationError';
 }
}
export function isValidNearbyPosition(pos:NearbyPosition):boolean{
 return Number.isFinite(pos.latitude)&&Math.abs(pos.latitude)<=90&&
 Number.isFinite(pos.longitude)&&Math.abs(pos.longitude)<=180&&
 Number.isFinite(pos.accuracyMeters)&&pos.accuracyMeters>=0;
}
export async function getFreshNearbyPosition():Promise<NearbyPosition>{
 if(typeof navigator==='undefined'||!navigator.geolocation){
  throw new NearbyLocationError('خدمة الموقع غير متاحة على هذا الجهاز.','unavailable');
 }
 // Safari may not implement the Permissions API for geolocation.
 // A denied permission cannot be re-enabled programmatically.
 if(navigator.permissions?.query){
  try{
   const permission=await navigator.permissions.query({name:'geolocation'});
   if(permission.state==='denied')
    throw new NearbyLocationError('إذن الموقع مرفوض. فعّل الوصول للموقع من إعدادات الآيفون ثم اضغط «إعادة المحاولة».','permission');
  }catch(error){
   if(error instanceof NearbyLocationError)throw error;
  }
 }
 const current=await new Promise<NearbyPosition>((resolve,reject)=>{
  navigator.geolocation.getCurrentPosition(
   pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracyMeters:pos.coords.accuracy}),
   error=>reject(new NearbyLocationError(
    error.code===1?'لم يُسمح بتحديد الموقع. اسمح بالوصول من إعدادات المتصفح أو الجهاز ثم أعد المحاولة.':
    error.code===2?'تعذر تحديد الموقع. تحقّق من تشغيل خدمات الموقع في الجهاز.':
    error.code===3?'انتهت مهلة تحديد الموقع. اضغط «إعادة المحاولة».':'تعذر تحديد الموقع.',
    error.code===1?'permission':error.code===3?'timeout':'unavailable'
   )),
   {enableHighAccuracy:true,maximumAge:0,timeout:20000}
  );
 });
 if(!isValidNearbyPosition(current))throw new NearbyLocationError('تعذر الحصول على إحداثيات موقع صحيحة.','invalid');
 return current;
}
