export interface ProfileFields {fullName:string;city:string}
export type ProfileValidation={ok:true;fullName:string;city:string}|{ok:false;message:string};
export function validateProfileFields(fields:ProfileFields):ProfileValidation{
 const name=fields.fullName.trim().replace(/\s+/g,' ');
 const city=fields.city.trim().replace(/\s+/g,' ');
 if(name.length<2)return {ok:false,message:'أدخل اسمًا لا يقل عن حرفين.'};
 if(name.length>80)return {ok:false,message:'الاسم طويل جدًا (80 حرفًا كحد أقصى).'};
 if(city.length>80)return {ok:false,message:'اسم المدينة طويل جدًا (80 حرفًا كحد أقصى).'};
 if(/[\x00-\x1F\x7F]/.test(name+city))return {ok:false,message:'تحتوي البيانات على رموز غير مدعومة.'};
 return {ok:true,fullName:name,city};
}
export function profileInitials(name:string):string{
 const parts=name.trim().split(/\s+/).filter(Boolean);
 if(!parts.length)return 'ذ';
 // Avoid turning email local parts into misleading personal names.
 if(name.includes('@'))return parts[0].slice(0,1).toUpperCase();
 return parts.length>1?(parts[0].slice(0,1)+parts[parts.length-1].slice(0,1)).toUpperCase():parts[0].slice(0,2).toUpperCase();
}
export function profileSince(value:string|null|undefined):string{
 if(!value)return '';
 const time=new Date(value);
 if(!Number.isFinite(time.getTime()))return '';
 return new Intl.DateTimeFormat('ar-SA',{month:'long',year:'numeric',timeZone:'Asia/Riyadh'}).format(time);
}
