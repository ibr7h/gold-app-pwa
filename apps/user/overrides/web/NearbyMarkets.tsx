import React,{useCallback,useEffect,useRef,useState} from 'react';
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
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(true);
  const [saved,setSaved]=useState<UserLocation|null>(null);
  const [notice,setNotice]=useState('جارٍ التحقق من إعدادات الموقع…');
  const [error,setError]=useState('');
  const mounted=useRef(true);
  const updateLocation=useCallback(async(location?:Position)=>{
    if(!mounted.current)return;
    setBusy(true);setError('');setNotice('جارٍ تحديث الموقع…');
    try{
      const pos=location||await getLocation();
      if(!valid(pos))throw Error('إحداثيات الموقع غير صالحة.');
      const result=await api<UserLocation>('/auth/location/position',jsonRequest('PATCH',pos));
      if(!mounted.current)return;
      setSaved(result);setEnabled(result.locationEnabled);
      setNotice('تم تحديث الموقع وحفظه في حسابك.');
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:errorMessage(e));}
    finally{if(mounted.current)setBusy(false);}
  },[]);
  useEffect(()=>{
    mounted.current=true;
    (async()=>{
      try{
        const data=await api<UserLocation>('/auth/profile');
        if(!mounted.current)return;
        setSaved(data);setEnabled(data.locationEnabled===true);
        if(data.locationEnabled)await updateLocation();
        else{setBusy(false);setNotice('الموقع غير مفعل.');}
      }catch(e){
        if(mounted.current){setBusy(false);setError(errorMessage(e));}
      }
    })();
    return()=>{mounted.current=false;};
  },[updateLocation]);
  const onChange=async(next:boolean)=>{
    if(busy)return;
    setBusy(true);setError('');setNotice(next?'جارٍ تفعيل الموقع…':'جارٍ إيقاف الموقع…');
    try{
      if(next){
        const pos=await getLocation();
        if(!valid(pos))throw Error('إحداثيات الموقع غير صالحة.');
        await api('/auth/location/preference',jsonRequest('PATCH',{enabled:true}));
        if(!mounted.current)return;
        setEnabled(true);setBusy(false);
        await updateLocation(pos);
      }else{
        const result=await api<UserLocation>('/auth/location/preference',jsonRequest('PATCH',{enabled:false}));
        if(!mounted.current)return;
        setEnabled(false);setSaved(result);setNotice('الموقع متوقف، وحُذفت الإحداثيات المحفوظة.');
      }
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:errorMessage(e));}
    finally{if(mounted.current)setBusy(false);}
  };
  const hasCoordinates=enabled&&saved?.latitude!=null&&saved?.longitude!=null;
  const pair=hasCoordinates?saved.latitude!.toFixed(5)+','+saved.longitude!.toFixed(5):'';
  return <section className="approved-card map-placeholder">
    <div className="approved-card-title"><span>أسواق الذهب القريبة</span><b className="pill gold">حسب موقعك</b></div>
    <div className="dh-nearby-location">
      <label className="dh-location-preference" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <strong>تفعيل الموقع</strong>
        <input type="checkbox" role="switch" checked={enabled} disabled={busy} onChange={e=>void onChange(e.target.checked)}/>
      </label>
      <p className="approved-muted">يُحدَّث موقعك عند فتح «التجار القريبون» إذا كانت الخدمة مفعّلة.</p>
      <p role="status">{notice}</p>
      {error&&<p className="notice warning" role="alert">{error}</p>}
      <button type="button" className="primary" onClick={()=>void updateLocation()} disabled={!enabled||busy}>{busy?'جارٍ المعالجة…':'تحديث الموقع'}</button>
      {hasCoordinates&&<div className="dh-location-links" style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
        <a target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('محلات ذهب بالقرب من '+pair)}>خرائط Google</a>
        <a target="_blank" rel="noopener noreferrer" href={'https://maps.apple.com/?q='+encodeURIComponent('محلات ذهب')+'&ll='+encodeURIComponent(pair)}>خرائط Apple</a>
      </div>}
    </div>
  </section>;
}
