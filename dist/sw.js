const CACHE='fourth-dimension-v6';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./service.html','./service.css','./service.js','./tools/','./tools/index.html','./tools/tools.css','./tools/tools.js','./brief/','./legal/privacy.html','./legal/terms.html','./legal/cookies.html','./legal/refunds.html','./legal/ai-disclaimer.html','./legal/legal.css','./journal/','./shop/','./assets/logo.webp','./assets/hero-poster.jpg','./assets/app-icon-192-transparent.png','./assets/app-icon-512-transparent.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(CORE.map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(hit=>hit||caches.match('./index.html'))));return;
  }
  event.respondWith(caches.match(request).then(hit=>{
    const update=fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response});
    return hit||update;
  }));
});
