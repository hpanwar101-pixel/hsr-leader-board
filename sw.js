const CACHE_NAME = 'hsr-leaderboard-v3';
const urlsToCache = [
  '/',
  '/index.html'
];

// Install event - cache basic files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function() {
        console.log('Cache failed - will use network only');
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Clone response for cache
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          if (event.request.method === 'GET') {
            cache.put(event.request, responseToCache);
          }
        });
        return response;
      })
      .catch(function() {
        // Network failed - try cache
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Not in cache - return offline page
          return new Response('Offline - Check internet connection', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
