const CACHE_PREFIX='gold-app-pwa-root-';
const CACHE=CACHE_PREFIX+'v0.3.3';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-maskable.svg'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(key=>key.startsWith(CACHE_PREFIX) && key!==CACHE)
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING'){
    self.skipWaiting();
  }
  if(event.data?.type==='CLEAR_OLD_CACHES'){
    event.waitUntil(
      caches.keys().then(keys=>Promise.all(
        keys
          .filter(key=>key.startsWith(CACHE_PREFIX) && key!==CACHE)
          .map(key=>caches.delete(key))
      ))
    );
  }
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  // The full application has its own service worker and cache namespace.
  // Never intercept or cache its requests from the root PWA.
  if(url.pathname.startsWith('/gold-app-pwa/full/')) return;

  if(url.pathname.endsWith('/version.json') || url.pathname.endsWith('/prices-live.json')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(!response.ok) return response;
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
