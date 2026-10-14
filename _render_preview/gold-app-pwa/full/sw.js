'use strict';
const VERSION = '1.9.72-20261014';
const PREFIX = 'dhahabi-full-';
const CACHE = PREFIX + VERSION;
const BASE = '/gold-app-pwa/full/';
const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'login.html',
  BASE + 'register.html',
  BASE + 'manifest.webmanifest',
  BASE + 'iphone-apple-touch-67084b40.png',
  BASE + 'pwa-icon.png',
  BASE + 'app_icon_user.jpg',
  BASE + 'apple-touch-icon.png',
  BASE + 'favicon.ico'
];

self.addEventListener('install', event => {
  // Only the application shell is essential. A temporarily missing icon must
  // not abort the entire SW install and strand iOS on an old release.
  // A new worker still waits for the user's explicit update action.
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await cache.addAll([BASE, BASE + 'index.html']);
    await Promise.allSettled(CORE.filter(url => url !== BASE && url !== BASE + 'index.html')
      .map(url => cache.add(url)));
  }));
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

  // A rejected fetch must never escape respondWith: Safari treats that as a
  // failed FetchEvent, even when the server is temporarily unreachable.
  const unavailable = (html=false) => new Response(
    html
      ? '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ذهبي — دون اتصال</title><body style="font:16px system-ui;text-align:center;padding:32px;color:#001F3F"><h1>لا يوجد اتصال بالإنترنت</h1><p>تحقق من الاتصال وحاول فتح ذهبي مجددًا.</p></body></html>'
      : 'Service temporarily unavailable',
    {status:503,headers:{'Content-Type':html?'text/html; charset=utf-8':'text/plain; charset=utf-8','Cache-Control':'no-store'}}
  );
  const network = () => fetch(event.request,{cache:'no-store'});

  // No stale update metadata. Never reject a fetch event when offline.
  const fresh = ['/version.json','/prices-live.json','/pwa-update.js','/sw.js',
    '/standalone-install-gate.js','/iphone-preview-lock.js','/user-update-locales.js'];
  if(fresh.some(path => url.pathname.endsWith(path))){
    event.respondWith(network().catch(() => unavailable()));
    return;
  }

  // Preserve the specific login/register document during offline navigation;
  // a generic index shell can contain an unrelated authenticated route.
  if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')){
    const route = url.pathname.replace(/\\/$/,'');
    const fallback = /\\/(?:login)(?:\\.html)?$/.test(route) ? BASE+'login.html'
      : /\\/(?:register)(?:\\.html)?$/.test(route) ? BASE+'register.html'
      : BASE+'index.html';
    event.respondWith(network().catch(async()=>{
      return await caches.match(fallback) || unavailable(true);
    }));
    return;
  }

  // Content-hashed JS/CSS/assets can be served from cache when offline, but
  // an uncached resource must produce a controlled 503 instead of a rejection.
  event.respondWith((async()=>{
    const cached=await caches.match(event.request).catch(()=>undefined);
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response.ok){
        const copy=response.clone();
        void caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }catch{return unavailable();}
  })());

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
