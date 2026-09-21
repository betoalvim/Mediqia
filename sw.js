/* Service worker do MediQia. Cache-first: o app abre sem rede.
   CACHE muda sozinho a cada build (hash do conteudo), entao um deploy novo
   descarta o cache antigo sem precisar de bump manual. */
const CACHE = 'mediqia-a081c61249';
const ATIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./database.js",
  "./logo.png",
  "./prescription_symbol.png",
  "./manifest.json",
  "./vendor/fonts.css",
  "./vendor/material-symbols.css",
  "./vendor/phosphor-regular.css",
  "./vendor/tailwind.css",
  "./vendor/fonts/Phosphor.woff2",
  "./vendor/fonts/PlusJakartaSans-VariableFont_wght.ttf",
  "./vendor/fonts/material-symbols-outlined.woff2",
  "./vendor/img/apple-touch-icon.png",
  "./vendor/img/avatar-252528f4.jpg",
  "./vendor/img/avatar-955977c7.jpg",
  "./vendor/img/icon-192.png",
  "./vendor/img/icon-512-maskable.png",
  "./vendor/img/icon-512.png",
  "./vendor/img/ph-4b3142bf-300.jpg",
  "./vendor/img/ph-51b55104-400.jpg",
  "./vendor/img/ph-7bb81c04-300.jpg",
  "./vendor/img/ph-7bbbfe19-300.jpg",
  "./vendor/img/ph-7ccdbaba-300.jpg",
  "./vendor/img/ph-dba999ef-400.jpg",
  "./vendor/img/ph-e5d09982-100.jpg",
  "./vendor/img/ph-e5d09982-400.jpg",
  "./vendor/img/ph-fc9aa908-300.jpg",
  "./vendor/img/placeholder-produto.svg"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ATIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      // guarda o que veio da rede para a proxima abertura ficar offline tambem
      if (res.ok && res.type === 'basic') {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
