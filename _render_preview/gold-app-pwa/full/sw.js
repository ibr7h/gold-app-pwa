'use strict';
const VERSION = '1.9.102-20261031';
const PREFIX = 'dhahabi-full-';
const CACHE = PREFIX + VERSION;
const BASE = '/gold-app-pwa/full/';
// Generated from the verified current export; contains public static files only.
const OFFLINE_ASSETS = ["/gold-app-pwa/full/_expo/static/css/estimated-price-receipt-printer-ea53d9a0c6588988db020f73311d0a7a.css","/gold-app-pwa/full/_expo/static/css/gold-help-1fd32899116be762b2340bfc2c5d5b68.css","/gold-app-pwa/full/_expo/static/css/registration-8727cace2bf03ce1876bdc6758f67e77.css","/gold-app-pwa/full/_expo/static/css/user-84329812be58d14142755fddbcdfaa2d.css","/gold-app-pwa/full/_expo/static/css/web-899fd04ebc00e135e061f32034ea94c3.css","/gold-app-pwa/full/_expo/static/js/web/entry-a5bb80fdf86a4df46c8d419330fb9bb5.js","/gold-app-pwa/full/_expo/static/js/web/index-6c614662cf40963b5e52197045e7cc78.js","/gold-app-pwa/full/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","/gold-app-pwa/full/assets/node_modules/@react-navigation/elements/lib/module/assets/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","/gold-app-pwa/full/assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","/gold-app-pwa/full/iphone-apple-touch-67084b40.png","/gold-app-pwa/full/iphone-preview-lock.css","/gold-app-pwa/full/iphone-preview-lock.js","/gold-app-pwa/full/manifest.json","/gold-app-pwa/full/pwa-update.js","/gold-app-pwa/full/standalone-install-gate.js","/gold-app-pwa/full/user-update-locales.js"];
const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'login.html',
  BASE + 'register.html',
  BASE + 'manifest.webmanifest',
  BASE + 'pwa-icon.png',
  BASE + 'app_icon_user.jpg'
];

self.addEventListener('install', event => {
  // The current shell and its actual dependencies are essential. Obsolete
  // optional icon aliases below must not strand iOS on an old release.
  // A new worker still waits for the user's explicit update action.
  event.waitUntil(caches.open(CACHE).then(async cache => {
    // A successful install means every boot dependency is durable, not just HTML.
    // If an essential fetch fails, leave the old worker active for a safe retry.
    await cache.addAll([...new Set([BASE, BASE + 'index.html', BASE + 'login.html', BASE + 'register.html', ...OFFLINE_ASSETS])]);
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
      ? '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ذهبك — دون اتصال</title><body style="font:16px system-ui;text-align:center;padding:32px;color:#001F3F"><h1>لا يوجد اتصال بالإنترنت</h1><p>تحقق من الاتصال وحاول فتح ذهبك مجددًا.</p></body></html>'
      : 'Service temporarily unavailable',
    {status:503,headers:{'Content-Type':html?'text/html; charset=utf-8':'text/plain; charset=utf-8','Cache-Control':'no-store'}}
  );
  const network = () => fetch(event.request,{cache:'no-store'});

  // No stale update metadata. Never reject a fetch event when offline.
  const fresh = ['/version.json','/prices-live.json','/sw.js'];
  if(fresh.some(path => url.pathname.endsWith(path))){
    event.respondWith(network().catch(() => unavailable()));
    return;
  }

  // Bootstrap code is network-first online, with a *same-release* offline fallback.
  // Version metadata above is never served stale. Never read another release cache.
  const bootstrap = ['/pwa-update.js','/standalone-install-gate.js','/iphone-preview-lock.js','/user-update-locales.js'];
  const matchingAsset = async () => {
    try{
    const cache = await caches.open(CACHE);
    const requestedVersion = url.searchParams.get('v');
    const sameRelease = !requestedVersion || requestedVersion === VERSION;
    return await cache.match(event.request) ||
      (sameRelease ? await cache.match(url.pathname,{ignoreSearch:true}) : undefined);
    }catch{return undefined;}
  };
  if(bootstrap.some(path => url.pathname.endsWith(path))){
    event.respondWith((async()=>{
      try{
        const response=await network();
        if(response.ok)return response;
        return await matchingAsset() || response;
      }catch{return await matchingAsset() || unavailable();}
    })());
    return;
  }

  // Preserve the specific login/register document during offline navigation;
  // a generic index shell can contain an unrelated authenticated route.
  if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')){
    const route = url.pathname.endsWith('/') ? url.pathname.slice(0,-1) : url.pathname;
    const fallback = route.endsWith('/login') || route.endsWith('/login.html') ? BASE+'login.html'
      : route.endsWith('/register') || route.endsWith('/register.html') ? BASE+'register.html'
      : BASE+'index.html';
    event.respondWith(network().catch(async()=>{
      try{return await (await caches.open(CACHE)).match(fallback) || unavailable(true);}
      catch{return unavailable(true);}
    }));
    return;
  }

  // Content-hashed JS/CSS/assets can be served from cache when offline, but
  // an uncached resource must produce a controlled 503 instead of a rejection.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE).catch(()=>null);
    const cached=await cache?.match(event.request,{ignoreSearch:true}).catch(()=>undefined);
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response.ok){
        const copy=response.clone();
        if(cache)await cache.put(event.request,copy).catch(()=>{});
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
    const title=typeof payload.title==='string' ? payload.title.slice(0,90) : 'ذهبك';
    const body=typeof payload.body==='string' ? payload.body.slice(0,230) : 'لديك تنبيه جديد من ذهبك';
    const requested=typeof payload.url==='string' ? payload.url : BASE;
    // Relative hashes follow each installed PWA scope, whether GitHub /iphone/
    // or Render /full/; absolute destinations remain same-origin and in-scope.
    const url=new URL(requested.startsWith('#')?BASE+requested:requested,self.location.origin);
    const lang=['ar','en','fr'].includes(payload.lang)?payload.lang:'ar';
    const destination=url.origin===self.location.origin&&url.pathname.startsWith(BASE)
      ? url.href : new URL(BASE,self.location.origin).href;
    const tag=typeof payload.tag==='string' ? payload.tag.slice(0,90) : 'dhahabi-alert';
    await self.registration.showNotification(title,{
      body,tag,icon:BASE+'pwa-icon.png',badge:BASE+'pwa-icon.png',
      lang,dir:lang==='ar'?'rtl':'ltr',data:{url:destination}
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
