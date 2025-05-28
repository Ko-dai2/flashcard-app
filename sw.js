const CACHE_NAME = 'fc-app-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  'https://unpkg.com/papaparse@5.4.1/papaparse.min.js'
];

// インストール時にキャッシュを確保
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// リクエスト時はキャッシュ優先
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(res => res || fetch(evt.request))
  );
});
