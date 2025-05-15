const CACHE_NAME = 'fc-app-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  'https://unpkg.com/papaparse@5.4.1/papaparse.min.js'
];

// インストール：キャッシュに必要ファイルを保存
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// フェッチ：キャッシュ優先で返す
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
