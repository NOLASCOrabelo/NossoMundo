// public/sw.js
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Apenas repassa a requisição, necessário para PWA funcionar
  e.respondWith(fetch(e.request));
});