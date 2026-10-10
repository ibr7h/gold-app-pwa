import React,{useEffect,useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {api,errorMessage} from './api';

interface PersonalProfile {
 id:string|number;fullName:string|null;email:string;phone:string|null;
 city:string|null;countryCode:string|null;
}
export default function UserPersonalDetails(){
 const {updateProfile}=useAuth();
 const [profile,setProfile]=useState<PersonalProfile|null>(null);
 const [loading,setLoading]=useState(true),[editing,setEditing]=useState(false);
 const [name,setName]=useState(''),[city,setCity]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  api<PersonalProfile>('/auth/profile').then(data=>{
   if(!active)return;setProfile(data);setName(data.fullName||'');setCity(data.city||'');
  }).catch(e=>{if(active)setError(errorMessage(e));})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();if(busy)return;
  const trimmed=name.trim();
  if(trimmed.length<2||trimmed.length>80||city.trim().length>80){
   setError('اكتب اسمًا من حرفين إلى ٨٠ حرفًا، ومدينة لا تزيد على ٨٠ حرفًا.');return;
  }
  setBusy(true);setError('');
  try{
   const updated=await updateProfile({fullName:trimmed,city:city.trim()});
   setProfile(old=>old?{...old,fullName:updated.fullName,city:updated.city}:old);
   setEditing(false);
  }catch(err){setError(errorMessage(err));}
  finally{setBusy(false);}
 };
 return <section className="approved-card dh-personal-details-native" aria-labelledby="personal-details-title">
  <div className="dh-personal-head">
   <h3 id="personal-details-title">البيانات الشخصية</h3>
   {!editing&&<button type="button" className="dh-personal-edit" aria-label="تعديل البيانات الشخصية" onClick={()=>{setEditing(true);setError('');}}><svg viewBox="0 0 24 24" aria-hidden="true" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="m16 4 4 4L9 19l-5 1 1-5L16 4Z"/></svg><span>تعديل</span></button>}
  </div>
  {loading?<p role="status">جارٍ تحميل البيانات الشخصية…</p>:profile&&(!editing?
   <dl className="dh-personal-rows">
    <div><dt>الاسم الكامل</dt><dd>{profile.fullName||'غير مضاف'}</dd></div>
    <div><dt>البريد الإلكتروني</dt><dd dir="ltr">{profile.email}</dd></div>
    <div><dt>رقم الجوال</dt><dd dir="ltr">{profile.phone||'غير مضاف'}</dd></div>
    <div><dt>المدينة</dt><dd>{profile.city||'غير مضافة'}</dd></div>
   </dl>:
   <form className="dh-personal-form" onSubmit={save}>
    <label>الاسم الكامل<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label>
    <label>المدينة<input maxLength={80} autoComplete="address-level2" value={city} onChange={e=>setCity(e.target.value)} disabled={busy}/></label>
    <p className="dh-personal-readonly">لتغيير البريد الإلكتروني أو رقم الجوال يلزم مسار تحقق منفصل.</p>
    <div className="dh-personal-actions"><button type="submit" className="primary" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ'}</button><button type="button" className="secondary" disabled={busy} onClick={()=>{setEditing(false);setName(profile.fullName||'');setCity(profile.city||'');setError('');}}>إلغاء</button></div>
   </form>)}
  {error&&<p className="notice warning" role="alert">{error}</p>}
 </section>;
}
