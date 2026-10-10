import React,{useEffect,useState} from 'react';
import {api,jsonRequest,errorMessage} from './api';

interface UserLocation {
  locationEnabled:boolean;
  latitude:number|null;
  longitude:number|null;
  locationAccuracyMeters:number|null;
  locationUpdatedAt:string|null;
}
interface Position {latitude:number;longitude:number;accuracyMeters:number}
const valid=(p:Position)=>Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180;
async function getLocation():Promise<Position>{
  if(!navigator.geolocation)throw Error('خدمة الموقع غير متاحة على هذا الجهاز.');
  if(navigator.permissions?.query){
    try{
      const permission=await navigator.permissions.query({name:'geolocation'});
      if(permission.state==='denied')throw Error('إذن الموقع معطّل؛ فعّله من إعدادات الجهاز.');
    }catch(e){if(e instanceof Error&&e.message.startsWith('إذن الموقع'))throw e;}
  }
  return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
    p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy}),
    e=>reject(Error(e.code===1?'تم رفض إذن الموقع؛ فعّله من إعدادات الجهاز.':
      e.code===2?'تعذر تحديد موقعك. حاول مرة أخرى.':
      e.code===3?'انتهت مهلة تحديد الموقع. حاول مرة أخرى.':'تعذر تحديد الموقع.')),
    {enableHighAccuracy:true,maximumAge:0,timeout:20000}));
}

export default function NearbyMarkets(){
 const [point,setPoint]=useState<Position|null>(null);
 const [notice,setNotice]=useState('جارٍ تحديد موقعك…');
 const [failure,setFailure]=useState('');
 useEffect(()=>{
  let canceled=false;
  (async()=>{
   try{
    const fresh=await getLocation();
    if(!valid(fresh))throw Error('إحداثيات الموقع غير صالحة.');
    if(canceled)return;
    const profile=await api<UserLocation>('/auth/profile');
    if(canceled)return;
    if(profile.locationEnabled!==true){
      await api('/auth/location/preference',jsonRequest('PATCH',{enabled:true}));
      if(canceled)return;
    }
    const saved=await api<UserLocation>('/auth/location/position',jsonRequest('PATCH',fresh));
    if(canceled)return;
    if(saved.locationEnabled!==true)throw Error('تعذر حفظ الموقع في حسابك.');
    setPoint(fresh);setNotice('تم تحديث موقعك.');
   }catch(e){if(!canceled){setFailure(e instanceof Error?e.message:errorMessage(e));setPoint(null);}}
  })();
  return()=>{canceled=true;};
 },[]);
 const pair=point?point.latitude.toFixed(5)+','+point.longitude.toFixed(5):'';
 const apple=/(iPhone|iPad|iPod|Macintosh|Mac OS X)/i.test(navigator.userAgent||'')||/^Mac/i.test(navigator.platform||'');
 return <section className="approved-card map-placeholder" aria-label="محلات الذهب القريبة">
  <div className="approved-card-title"><span>أسواق الذهب القريبة</span><b className="pill gold">حسب موقعك</b></div>
  <div className="dh-nearby-location">
   {failure?<p className="notice warning" role="alert">{failure}</p>:<p role="status">{notice}</p>}
   {point&&<div className="dh-location-links" style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
    <a target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('محلات ذهب بالقرب من '+pair)}>خرائط Google</a>
    {apple&&<a target="_blank" rel="noopener noreferrer" href={'https://maps.apple.com/?q='+encodeURIComponent('محلات ذهب')+'&ll='+encodeURIComponent(pair)}>خرائط Apple</a>}
   </div>}
  </div>
 </section>;
}
