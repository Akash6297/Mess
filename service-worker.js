self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open('mess-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/Mess/',
          '/Mess/index.html',
          '/Mess/style.css',
          '/Mess/app.js',
          '/Mess/icon-192.png',
          '/Mess/icon-512.png',
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (e) => {
    e.respondWith(
      caches.match(e.request).then((response) => response || fetch(e.request))
    );
  });
  