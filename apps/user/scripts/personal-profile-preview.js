/* User preview: authenticated personal profile and display name.
 * Does not cache personal data on disk. */
(function(){
 'use strict';
 let workspace=null,profile=null,loading=false,editing=false,card=null,frame=0;
 const request=(path,data)=>{
  if(typeof window.__dhahabiLocationRequest!=='function')return Promise.reject(new Error('الخدمة غير جاهزة.'));
  return window.__dhahabiLocationRequest(path,data);
 };
 function editText(value){return value==null||String(value).trim()===''?'غير مضاف':String(value);}
 function reflect(){
  if(!workspace||!profile)return;
  const display=profile.fullName?.trim()||'أضف اسمك';
  const title=workspace.querySelector('.home-name-link span[dir="auto"]');
  if(title&&title.textContent!==display)title.textContent=display;
  const header=workspace.querySelector('.profile-approved h2');
  if(header){
   if(header.textContent!==display)header.textContent=display;
   header.dir='auto';
  }
  const avatar=workspace.querySelector('.profile-approved .avatar');
  if(avatar&&avatar.textContent!==display[0])avatar.textContent=display[0];
 }
 function el(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
 }
 function detailRows(body){
  const dl=el('dl','dh-personal-rows');
  for(const [label,value,latin] of [
   ['الاسم الكامل',profile.fullName||'غير مضاف',false],
   ['البريد الإلكتروني',profile.email||'',true],
   ['رقم الجوال',profile.phone||'غير مضاف',true],
   ['المدينة',profile.city||'غير مضافة',false]]){
    const row=el('div','dh-personal-row'),dt=el('dt','',label),dd=el('dd','',value);
    if(latin)dd.dir='ltr';
    row.append(dt,dd);dl.appendChild(row);
  }
  body.appendChild(dl);
 }
 function editForm(body){
  const form=el('form','dh-personal-form');form.noValidate=true;
  const makeInput=(labelText,value,type,max)=>{
   const label=el('label','dh-personal-field',labelText);
   const inp=el('input','dh-personal-input');inp.type=type;
   inp.value=value;inp.maxLength=max;
   if(type==='text'&&max===80)inp.autocomplete=labelText==='الاسم الكامل'?'name':'address-level2';
   label.appendChild(inp);form.appendChild(label);return inp;
  };
  const name=makeInput('الاسم الكامل',profile.fullName||'','text',80);
  const city=makeInput('المدينة',profile.city||'','text',80);
  const help=el('p','dh-personal-hint','البريد الإلكتروني ورقم الجوال لا يُعدّلان من هذه الشاشة.');
  const actions=el('div','dh-personal-actions');
  const save=el('button','dh-personal-save','حفظ');save.type='submit';
  const cancel=el('button','dh-personal-cancel','إلغاء');cancel.type='button';
  actions.append(save,cancel);
  const error=el('p','dh-personal-error');error.hidden=true;error.setAttribute('role','alert');
  form.append(help,actions,error);body.appendChild(form);
  cancel.addEventListener('click',()=>{editing=false;paint();});
  form.addEventListener('submit',async ev=>{
   ev.preventDefault();
   const fullName=name.value.trim(),cityName=city.value.trim();
   if(fullName.length<2||fullName.length>80||cityName.length>80){
    error.textContent='الاسم يجب أن يكون من حرفين إلى 80 حرفًا، والمدينة 80 حرفًا بحد أقصى.';
    error.hidden=false;return;
   }
   save.disabled=true;cancel.disabled=true;save.textContent='جارٍ الحفظ…';
   const active=workspace;
   try{
    const updated=await request('/auth/profile',{fullName,city:cityName});
    if(workspace!==active)return;
    if(!updated||String(updated.id)!==String(profile.id))throw Error('تعذر التحقق من بيانات الحساب.');
    profile=updated;editing=false;reflect();paint();
   }catch(e){
    if(workspace===active){error.textContent=e?.message||'تعذر حفظ البيانات الشخصية.';error.hidden=false;
     save.disabled=false;cancel.disabled=false;save.textContent='حفظ';}
   }
  });
  name.focus({preventScroll:true});
 }
 function paint(){
  if(!card||!card.isConnected||!profile)return;
  const edit=card.querySelector('.dh-personal-edit');
  edit.hidden=editing;
  const body=card.querySelector('.dh-personal-body');
  body.replaceChildren();
  if(editing)editForm(body);else detailRows(body);
 }
 function mountProfileCard(){
  const native=workspace?.querySelector('.dh-personal-details-native');
  if(native)return;
  const lead=workspace?.querySelector('.workspace-content > section.profile-approved');
  if(!lead||!profile)return;
  if(card&&card.isConnected&&card.previousElementSibling===lead)return;
  card=el('section','approved-card dh-personal-card');
  card.setAttribute('aria-label','البيانات الشخصية');
  const head=el('div','dh-personal-head');
  const heading=el('h3','', 'البيانات الشخصية');
  const button=el('button','dh-personal-edit');
  button.type='button';button.setAttribute('aria-label','تعديل البيانات الشخصية');
  button.innerHTML='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="m16 4 4 4L9 19l-5 1 1-5L16 4Z"/></svg><span>تعديل</span>';
  button.addEventListener('click',()=>{editing=true;paint();});
  head.append(heading,button);
  card.append(head,el('div','dh-personal-body'));
  lead.after(card);paint();
 }
 function sync(){
  const next=document.querySelector('#root .gold-web.workspace');
  if(next!==workspace){
   workspace=next;profile=null;loading=false;editing=false;card=null;
  }
  if(!workspace)return;
  reflect();mountProfileCard();
  if(!profile&&!loading&&typeof window.__dhahabiLocationRequest==='function'){
   loading=true;const active=workspace;
   request('/auth/profile').then(data=>{
    if(workspace!==active||!data||!data.id)return;
    profile=data;reflect();mountProfileCard();
   }).catch(()=>{/* Retry on next visit to the account page only. */}).finally(()=>{if(workspace===active)loading=false;});
  }
 }
 function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;sync();});}
 function start(){
  const root=document.getElementById('root');if(!root)return;
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  window.addEventListener('hashchange',schedule);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
