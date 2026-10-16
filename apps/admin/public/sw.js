'use strict';
const BASE='/gold-app-pwa/admin/';
const PREFIX='dhahabk-admin-';
const CACHE=PREFIX+'__ADMIN_BUILD_SHA__';
const CORE=[
  BASE,BASE+'index.html',BASE+'manifest.webmanifest',BASE+'assets/icon.svg',
  BASE+'styles.css?admin-__ADMIN_BUILD_SHA__',
  BASE+'app.js?admin-__ADMIN_BUILD_SHA__',
  BASE+'admin-update-client.js?admin-__ADMIN_BUILD_SHA__',
  BASE+'admin-quick-lock.js?admin-__ADMIN_BUILD_SHA__'
];
self.addEventListener('install',event=>{
  // Wait for the user to choose "Update now", like the approved User app.
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>(key.startsWith(PREFIX)||key.startsWith('dhahabi-admin-'))&&key!==CACHE)
      .map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
  if(url.pathname===BASE+'version.json'){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'})
      .catch(()=>caches.match(BASE+'index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||
    fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
      }
      return response;
    })
  ));
});

/* Web Push runs inside Admin's Service Worker even when the app window is closed. */
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let payload={};
  try{payload=event.data?.json()||{};}catch{}
  const title='ذهبك | إشعار إداري';
  // Privacy: do not expose account names, case details, email or gold data on a locked screen.
  const body=payload?.tag==='dhahabk-admin-test'
    ?'إشعار تجريبي من تطبيق الإدارة. افتح التطبيق للاطلاع على التفاصيل.'
    :'يوجد إشعار إداري. افتح التطبيق بعد التحقق من هويتك.';
  await self.registration.showNotification(title,{
   body,tag:typeof payload?.tag==='string'?payload.tag.slice(0,80):'dhahabk-admin',
   icon:BASE+'assets/icon.svg',lang:'ar',dir:'rtl',
   data:{url:BASE}
  });
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const url=new URL(BASE,self.location.origin).href;
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const windowClient of windows){
   if(new URL(windowClient.url).origin===self.location.origin&&
      new URL(windowClient.url).pathname.startsWith(BASE)){
    await windowClient.focus();return;
   }
  }
  if(self.clients.openWindow)await self.clients.openWindow(url);
 })());
});
