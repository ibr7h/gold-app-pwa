import React,{useEffect,useRef,useState} from 'react';
import {api,ApiError,errorMessage,jsonRequest} from './api';
import {validateProfileFields,profileInitials,profileSince,type ProfileFields} from './profile-utils';

export interface AccountProfile {
 id:string;
 email:string;
 fullName:string|null;
 phone:string|null;
 city:string|null;
 countryCode:string|null;
 role:string;
 createdAt:string|null;
 updatedAt:string|null;
 lastLoginAt:string|null;
}
interface Props {
 email:string;
 role:string;
 initialName?:string;
 onDisplayName:(name:string)=>void;
}
function readable(value:string|null|undefined){return typeof value==='string'&&value.trim()?value.trim():'غير مسجل';}

export default function ProfilePanel({email,role,initialName,onDisplayName}:Props){
 const [profile,setProfile]=useState<AccountProfile|null>(null);
 const [fetching,setFetching]=useState(true),[busy,setBusy]=useState(false);
 const [loadError,setLoadError]=useState(''),[formError,setFormError]=useState('');
 const [notice,setNotice]=useState('');
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState<ProfileFields>({fullName:initialName||'',city:''});
 const [revision,setRevision]=useState(0);
 const current=useRef(true);
 useEffect(()=>{current.current=true;return()=>{current.current=false;};},[]);
 useEffect(()=>{
  let alive=true;
  setFetching(true);setLoadError('');
  (async()=>{
   try{
    const response=await api<AccountProfile>('/auth/profile');
    if(!alive)return;
    // Never show a previous user's personal data from a stale response.
    if(!response||response.email?.toLowerCase()!==email.toLowerCase()||response.role!=='user')throw new Error('Profile identity mismatch');
    setProfile(response);
    setDraft({fullName:response.fullName||'',city:response.city||''});
    if(response.fullName)onDisplayName(response.fullName);
   }catch(error){
    if(!alive)return;
    setProfile(null);
    setLoadError(error instanceof ApiError&&error.status===404
     ?'تعديل البيانات الشخصية بانتظار تفعيل خدمة الملف الشخصي على الخادم.'
     :'تعذر تحميل البيانات الشخصية. حاول إعادة المحاولة.');
   }finally{if(alive)setFetching(false);}
  })();
  return()=>{alive=false;};
 },[email,revision]);
 const cancel=()=>{
  if(!profile)return;
  setDraft({fullName:profile.fullName||'',city:profile.city||''});
  setEditing(false);setFormError('');setNotice('');
 };
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!profile||busy)return;
  const valid=validateProfileFields(draft);
  if(!valid.ok){setFormError(valid.message);return;}
  if(valid.fullName===(profile.fullName||'')&&valid.city===(profile.city||'')){
   setEditing(false);setFormError('');return;
  }
  setBusy(true);setFormError('');setNotice('');
  try{
   const response=await api<AccountProfile>('/auth/profile',jsonRequest('PATCH',{
    fullName:valid.fullName,city:valid.city,
   }));
   if(!current.current)return;
   if(!response||response.id!==profile.id||response.email!==profile.email)throw new Error('Profile mismatch');
   setProfile(response);setDraft({fullName:response.fullName||'',city:response.city||''});
   onDisplayName(response.fullName||'');setEditing(false);
   setNotice('حُفظت البيانات الشخصية بنجاح.');
  }catch(error){
   if(current.current)setFormError(errorMessage(error));
  }finally{if(current.current)setBusy(false);}
 };
 const name=profile?.fullName||initialName||'حساب ذهبي';
 const since=profileSince(profile?.createdAt);
 return <section className="dh-profile" aria-labelledby="dh-profile-heading">
  <div className="approved-card dh-profile-hero">
   <div className="dh-profile-hero-main">
    <div className="dh-profile-avatar" aria-hidden="true">{profileInitials(profile?.fullName||initialName||email)}</div>
    <div className="dh-profile-identity">
     <span className="dh-profile-eyebrow">الملف الشخصي</span>
     <h2 id="dh-profile-heading">{name}</h2>
     <span className="dh-profile-email" dir="ltr">{email}</span>
    </div>
   </div>
   <div className="dh-profile-hero-footer">
    <span className="dh-profile-account-type">حساب مستخدم</span>
    {since&&<span>عضو منذ {since}</span>}
   </div>
  </div>
  <section className="approved-card dh-profile-details" aria-labelledby="dh-profile-details-heading">
   <div className="dh-profile-section-head">
    <div><h3 id="dh-profile-details-heading">البيانات الشخصية</h3><p>راجع بياناتك وحدّث الاسم والمدينة عند الحاجة.</p></div>
    {profile&&!editing&&<button type="button" className="dh-profile-edit" onClick={()=>{setEditing(true);setNotice('');setFormError('');}}>تعديل البيانات</button>}
   </div>
   {fetching?<div className="dh-profile-loading" role="status" aria-live="polite">جارٍ تحميل بيانات الحساب…</div>:null}
   {loadError&&<div className="dh-profile-feedback warning" role="alert"><p>{loadError}</p><button type="button" onClick={()=>setRevision(x=>x+1)}>إعادة المحاولة</button></div>}
   {!fetching&&profile&&(editing?<form className="dh-profile-edit-form" onSubmit={submit}>
    <label htmlFor="dh-profile-name">الاسم الكامل
     <input id="dh-profile-name" autoComplete="name" maxLength={80} minLength={2}
      value={draft.fullName} required disabled={busy} placeholder="أدخل اسمك الكامل"
      onChange={e=>setDraft(d=>({...d,fullName:e.target.value}))}/>
    </label>
    <label htmlFor="dh-profile-city">المدينة <span className="dh-profile-optional">(اختياري)</span>
     <input id="dh-profile-city" autoComplete="address-level2" maxLength={80}
      value={draft.city} disabled={busy} placeholder="مثال: جازان"
      onChange={e=>setDraft(d=>({...d,city:e.target.value}))}/>
    </label>
    <p className="dh-profile-help">لا يمكن تعديل البريد أو الجوال من هنا؛ تغييرهما يحتاج تحققًا مستقلًا لحماية الحساب.</p>
    {formError&&<p className="dh-profile-feedback error" role="alert">{formError}</p>}
    <div className="dh-profile-edit-actions">
     <button className="primary" type="submit" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ التغييرات'}</button>
     <button className="secondary" type="button" disabled={busy} onClick={cancel}>إلغاء</button>
    </div>
   </form>:<div className="dh-profile-info-grid">
     <div className="dh-profile-info"><span>الاسم الكامل</span><strong>{readable(profile.fullName)}</strong></div>
     <div className="dh-profile-info"><span>المدينة</span><strong>{readable(profile.city)}</strong></div>
     <div className="dh-profile-info"><span>البريد الإلكتروني</span><strong dir="ltr">{profile.email}</strong><small>تغيير البريد يتطلب تحققًا آمنًا</small></div>
     <div className="dh-profile-info"><span>رقم الجوال</span><strong dir="ltr">{readable(profile.phone)}</strong><small>تغيير الرقم يتطلب تحققًا آمنًا</small></div>
    </div>)}
   {notice&&<p className="dh-profile-feedback success" role="status">{notice}</p>}
  </section>
 </section>;
}
