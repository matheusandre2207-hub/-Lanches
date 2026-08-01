// +Lanches — Service Worker v2
const CACHE = 'pluslanches-v2';
const PRECACHE = [
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(PRECACHE.map(url => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Navegação: sempre tenta rede, cai para index.html em offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('./index.html').then(r => r || fetch('./index.html'))
      )
    );
    return;
  }

  // Recursos Firebase/CDN: network-only
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('gstatic.com') || url.includes('fonts.googleapis') || url.includes('unsplash')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first para assets locais
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || new Response('', { status: 503 }));
    })
  );
});
