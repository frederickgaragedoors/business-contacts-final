
const CACHE_NAME = 'business-contacts-v16-js'; // Incremented version
const urlsToCache = [
  './',
  './index.html',
  './index.js',
  './manifest.json',
  './icons/icon.svg',
  './utils.js',
  './db.js',
  './types.js',
  './App.js',
  './components/Header.js',
  './components/Dashboard.js',
  './components/ContactList.js',
  './components/ContactListItem.js',
  './components/ContactDetail.js',
  './components/ContactForm.js',
  './components/Settings.js',
  './components/PhotoGalleryModal.js',
  './components/JobTicketModal.js',
  './components/JobTemplateModal.js',
  './components/InspectionModal.js',
  './components/InvoiceView.js',
  './components/JobDetailView.js',
  './components/EmptyState.js',
  './components/icons.js',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Fetch from network if not in cache
        return fetch(event.request).then(networkResponse => {
          // A response must be valid to be cached
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || event.request.url.startsWith('https://esm.sh'))) {
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
    }).then(() => self.clients.claim()) // Force the new service worker to take control immediately
  );
});