import React,{useState} from 'react';

interface Coordinates {latitude:number;longitude:number;accuracy:number}
/** On-demand, ephemeral GPS only. Location is neither persisted nor sent to Dhahabi. */
export default function NearbyMarkets(){
 const [busy,setBusy]=useState(false);
 const [coords,setCoords]=useState<Coordinates|null>(null);
 const [error,setError]=useState('');
 const find=()=>{
  if(!navigator.geolocation){setError('هذا المتصفح لا يدعم تحديد الموقع.');return;}
  setBusy(true);setError('');setCoords(null);
  navigator.geolocation.getCurrentPosition(pos=>{
   setBusy(false);
   const {latitude,longitude,accuracy}=pos.coords;
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){
    setError('تعذر الحصول على إحداثيات صحيحة.');return;
   }
   setCoords({latitude,longitude,accuracy});
  },e=>{
   setBusy(false);
   setError(e.code===1?'إذن الموقع مرفوض. يمكنك تفعيله من إعدادات الجهاز أو المتصفح.':
     e.code===2?'تعذر العثور على موقعك. تحقق من خدمات الموقع.':
     e.code===3?'انتهت مهلة تحديد الموقع. حاول مرة أخرى.':'تعذر تحديد الموقع.');
  },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
 };
 const center=coords?coords.latitude.toFixed(5)+','+coords.longitude.toFixed(5):'';
 const google=coords?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('محلات ذهب بالقرب من '+center):'';
 const apple=coords?'https://maps.apple.com/?q='+encodeURIComponent('محلات ذهب')+'&ll='+encodeURIComponent(center):'';
 return <section className="approved-card map-placeholder">
  <div className="approved-card-title"><span>أسواق الذهب القريبة</span><b className="pill gold">حسب موقعك</b></div>
  <div className="dh-nearby-location" style={{padding:18,borderRadius:18,background:'#fbfaf5',border:'1px solid #e5d7a3'}}>
   <h3>ابحث عن أسواق الذهب بالقرب منك</h3>
   <p className="approved-muted">نطلب موقعك عند الضغط فقط، ولن نحفظ الإحداثيات في قاعدة البيانات. بيانات مواقع التجار المسجلين في ذهبي ليست متاحة بعد.</p>
   <button type="button" className="primary" disabled={busy} onClick={find} style={{minHeight:48}}>
    {busy?'جارٍ تحديد الموقع…':coords?'تحديث موقعي':'تحديد موقعي والبحث بالقرب مني'}
   </button>
   {error&&<p className="notice warning" role="alert">{error}</p>}
   {coords&&<div role="status" className="dh-nearby-result">
    <p>تم تحديد موقعك: <b dir="ltr">{center}</b> (دقة تقريبية {Math.round(coords.accuracy)} متر).</p>
    <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
     <a className="primary" target="_blank" rel="noopener noreferrer" href={google}>البحث في خرائط Google</a>
     <a className="primary" target="_blank" rel="noopener noreferrer" href={apple}>البحث في خرائط Apple</a>
    </div>
    <p className="fine">عند فتح الخرائط، سيُرسل الموقع إلى مزود الخرائط الخارجي. نتائجه ليست تجارًا معتمدين لدى ذهبي.</p>
   </div>}
  </div>
 </section>;
}
