'use strict';
const VERSION = '72022f49';
const PREFIX = 'dhahabi-full-';
const CACHE = PREFIX + VERSION;
const BASE = '/gold-app-pwa/full/';
const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'pwa-icon.png',
  BASE + 'app_icon_user.jpg'
];

self.addEventListener('install', event => {
  // A new build waits until the user chooses "Update now".
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  // Version metadata and live price snapshots must never come from an old cache.
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/prices-live.json')) {
    event.respondWith(fetch(event.request, {cache:'no-store'}));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(BASE + 'index.html')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (!response.ok) return response;
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }))
  );
});

/* Real remote Web Push; a push event is distinct from local in-page notices. */
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload={};
    try { payload=event.data ? event.data.json() : {}; } catch { payload={}; }
    const title=typeof payload.title==='string' ? payload.title.slice(0,90) : 'ذهبي';
    const body=typeof payload.body==='string' ? payload.body.slice(0,230) : 'لديك تنبيه جديد من ذهبي';
    const url=new URL(typeof payload.url==='string' ? payload.url : BASE, self.location.origin);
    const destination=url.origin===self.location.origin&&url.pathname.startsWith(BASE)
      ? url.href : new URL(BASE,self.location.origin).href;
    const tag=typeof payload.tag==='string' ? payload.tag.slice(0,90) : 'dhahabi-alert';
    await self.registration.showNotification(title,{
      body,tag,icon:BASE+'pwa-icon.png',badge:BASE+'pwa-icon.png',
      lang:'ar',dir:'rtl',data:{url:destination}
    });
  })());
});
self.addEventListener('notificationclick',event => {
  event.notification.close();
  event.waitUntil((async()=>{
    const destination=event.notification.data?.url||new URL(BASE,self.location.origin).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const windowClient of windows){
      if(new URL(windowClient.url).origin===self.location.origin&&new URL(windowClient.url).pathname.startsWith(BASE)){
        try { await windowClient.navigate(destination); } catch {}
        return windowClient.focus();
      }
    }
    if(self.clients.openWindow)return self.clients.openWindow(destination);
  })());
});
