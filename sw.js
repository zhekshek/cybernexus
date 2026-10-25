const VERSION='1.6';
const CACHE='nexus-pwa-v'+VERSION.replace(/\./g,'-');
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./crew-johnny.webp','./crew-lucy.webp','./crew-panam.webp','./crew-rebecca.webp','./crew-judy.webp','./crew-david.webp'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',e=>{
  if(e.data==='SKIP_WAITING')self.skipWaiting();
});

// Pages and the manifest: network first, so a new GitHub deploy shows up immediately.
// Images and icons: cache first, they rarely change.
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  const isPage=req.mode==='navigate'||/\.(html|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/');
  if(isPage){
    e.respondWith(
      fetch(req,{cache:'no-cache'}).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return res;
    }))
  );
});
