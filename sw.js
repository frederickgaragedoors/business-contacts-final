const CACHE_NAME = 'business-contacts-v5-js';
const urlsToCache = [
  './',
  './index.html',
  './index.js',
  './manifest.json',
  './icons/icon.svg',
  './utils.js',
  './App.js',
  './components/ContactList.js',
  './components/ContactListItem.js',
  './components/ContactDetail.js',
  './components/ContactForm.js',
  './components/Settings.js',
  './components/PhotoGalleryModal.js',
  './components/JobTicketModal.js',
  './components/icons.js',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll with a catch to prevent a single failed asset from breaking the whole cache
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache initial assets:', error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return the cached response if it's found
        if (response) {
          return response;
        }

        // If not in cache, fetch from the network
        return fetch(event.request).then(networkResponse => {
          // Check for a valid response to cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             // Clone the response because it's a stream and can only be consumed once
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
