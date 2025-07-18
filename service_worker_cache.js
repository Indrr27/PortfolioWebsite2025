// sw.js - Service Worker for caching assets
const CACHE_NAME = 'pixel-portfolio-v1';
const STATIC_ASSETS = [
  // Critical files
  '/',
  '/index.html',
  '/lab.html',
  '/office.html', 
  '/comms.html',
  '/style.css',
  
  // Scripts
  '/scripts/rooms.js',
  '/scripts/classroom.js',
  '/scripts/lab.js',
  '/scripts/office.js',
  '/scripts/comms.js',
  
  // Critical character GIFs
  '/gif/characters/martywalk.gif',
  '/gif/characters/materwalk.gif',
  '/gif/characters/teinwalk.gif',
  '/gif/characters/lobbiewalk.gif',
  
  // Background images
  '/sprites/Webpages/classroom.webp',
  '/sprites/Webpages/lab.webp',
  '/sprites/Webpages/fileroom.webp',
  '/sprites/Webpages/comms.webp',
  
  // Frame assets
  '/sprites/frame/classframe/classframeback.webp',
  '/sprites/frame/classframe/classframefloor.webp',
  '/sprites/frame/labframe/labframeback.webp',
  '/sprites/frame/labframe/labframefloor.webp',
  '/sprites/frame/fileframe/fileframeback.webp',
  '/sprites/frame/fileframe/fileframefloor.webp',
  '/sprites/frame/commframe/commsframeback.webp',
  '/sprites/frame/commframe/commsframefloor.webp',
  
  // Titles
  '/sprites/titles/classroomtitle.webp',
  '/sprites/titles/labtitle.webp',
  '/sprites/titles/officetitle.webp',
  '/sprites/titles/commtitle.webp',
  
  // Font
  '/Pixelpurl-0vBPP.ttf',
  
  // Audio (cache BGM at least)
  '/sound/bgm.mp3'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('All assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response before caching
          const responseToCache = response.clone();
          
          // Cache images and assets for future use
          if (event.request.url.includes('.webp') || 
              event.request.url.includes('.gif') || 
              event.request.url.includes('.mp3') ||
              event.request.url.includes('.js') ||
              event.request.url.includes('.css')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        });
      })
      .catch(() => {
        // Network failed, try to serve a cached fallback
        if (event.request.destination === 'image') {
          return caches.match('/sprites/fallback.webp'); // Create a fallback image
        }
        return new Response('Offline', { status: 503 });
      })
  );
});