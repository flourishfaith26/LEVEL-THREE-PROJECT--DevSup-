self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through fetch to satisfy PWA installability requirements
  // In a production app, we would cache assets here for offline support
  e.respondWith(
    fetch(e.request).catch(() => {
      return new Response('You are offline. Please check your connection.');
    })
  );
});
