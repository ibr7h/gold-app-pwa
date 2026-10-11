import React,{useEffect,useState} from 'react';
import {api,jsonRequest,errorMessage} from './api';
import {getFreshNearbyPosition,isValidNearbyPosition,NearbyPosition} from './nearby-geolocation';

interface UserLocation {
 locationEnabled:boolean;
 latitude:number|null;
 longitude:number|null;
 locationAccuracyMeters:number|null;
 locationUpdatedAt:string|null;
}

export default function NearbyMarkets(){
 const [point,setPoint]=useState<NearbyPosition|null>(null);
 const [loading,setLoading]=useState(true);
 const [failure,setFailure]=useState('');
 const [attempt,setAttempt]=useState(0);
 const [radius,setRadius]=useState<5|10|25|50>(25);

 // React mounts this screen afresh every time the user enters "Nearby traders".
 // A manual retry is available if iOS blocks the automatic permission prompt.
 useEffect(()=>{
  let cancelled=false;
  setLoading(true);setFailure('');setPoint(null);
  (async()=>{
   try{
    const fresh=await getFreshNearbyPosition();
    if(cancelled)return;
    if(!isValidNearbyPosition(fresh))throw Error('إحداثيات الموقع غير صالحة.');
    const profile=await api<UserLocation>('/auth/profile');
    if(cancelled)return;
    if(profile.locationEnabled!==true){
     await api<UserLocation>('/auth/location/preference',jsonRequest('PATCH',{enabled:true}));
     if(cancelled)return;
    }
    // Save the *new* coordinates every time, even if the location preference was already on.
    const saved=await api<UserLocation>('/auth/location/position',jsonRequest('PATCH',fresh));
    if(cancelled)return;
    if(saved.locationEnabled!==true)throw Error('تعذر حفظ موقعك في حسابك.');
    setPoint(fresh);
   }catch(error){
    if(!cancelled)setFailure(error instanceof Error?error.message:errorMessage(error));
   }finally{
    if(!cancelled)setLoading(false);
   }
  })();
  return()=>{cancelled=true;};
 },[attempt]);

 const pair=point?point.latitude.toFixed(5)+','+point.longitude.toFixed(5):'';
 const zoom=({5:12,10:11,25:10,50:9} as Record<number,number>)[radius];
 const googleUrl=point?'https://www.google.com/maps/search/'+encodeURIComponent('محلات ذهب')+
  '/@'+pair+','+zoom+'z':'';
 const latSpan=(2*radius/111.32).toFixed(5);
 const lonSpan=point?(2*radius/(111.32*Math.max(0.01,Math.cos(point.latitude*Math.PI/180)))).toFixed(5):'';
 const appleUrl=point?'https://maps.apple.com/search?query='+encodeURIComponent('محلات ذهب')+
  '&center='+encodeURIComponent(pair)+'&span='+encodeURIComponent(latSpan+','+lonSpan):'';
 const apple=/(iPhone|iPad|iPod|Macintosh|Mac OS X)/i.test(navigator.userAgent||'')||/^Mac/i.test(navigator.platform||'');

 return <section className="approved-card map-placeholder" aria-label="محلات الذهب القريبة">
  <div className="approved-card-title"><span>أسواق الذهب القريبة</span><b className="pill gold">حسب موقعك</b></div>
  <div className="dh-nearby-location">
   <div className="dh-location-radius"><label htmlFor="dh-search-radius">نطاق البحث التقريبي</label>
    <select className="dh-search-radius" id="dh-search-radius" value={radius} onChange={e=>setRadius(Number(e.target.value) as 5|10|25|50)}>
     <option value={5}>5 كم</option><option value={10}>10 كم</option><option value={25}>25 كم</option><option value={50}>50 كم</option>
    </select>
   </div>
   <p className="dh-location-radius-hint">النطاق استرشادي؛ يتغير تقريب الخريطة وقد تظهر محلات أبعد.</p>
   {loading&&<p className="dh-nearby-progress" role="status" aria-live="polite">جارٍ تحديد موقعك والبحث عن محلات الذهب القريبة…</p>}
   {!loading&&failure&&<div className="dh-nearby-permission-error" role="alert">
    <p className="notice warning">{failure}</p>
    <button type="button" className="dh-nearby-retry" onClick={()=>setAttempt(value=>value+1)}>إعادة المحاولة</button>
    <p className="dh-nearby-help">على الآيفون: فعّل «خدمات الموقع» واسمح لـ Safari أو لتطبيق ذهبي بالوصول إلى موقعك من إعدادات الجهاز.</p>
   </div>}
   {!loading&&point&&<div className="dh-location-links">
    <a target="_blank" rel="noopener noreferrer" href={googleUrl}>خرائط Google</a>
    {apple&&<a target="_blank" rel="noopener noreferrer" href={appleUrl}>خرائط Apple</a>}
   </div>}
  </div>
 </section>;
}
