const CACHE_NAME = 'betbox-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.json',
  'images/favicon.ico',
  'images/logo192.png',
  'images/logo512.png'
];

const API_HOSTS = [
  'https://legally-modest-joey.ngrok-free.app',
  'http://localhost:3000'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Controlla se la richiesta è per l'API
  if (API_HOSTS.includes(url.origin)) {
    // Per le richieste API, vai direttamente alla rete senza controllare la cache
    event.respondWith(fetch(event.request));
  } else {
    // Per le altre richieste, usa la strategia cache-first
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            (response) => {
              // Opzionale: memorizza nella cache la nuova risorsa se è una GET
              if (event.request.method === 'GET') {
                let responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            }
          );
        })
    );
  }
});