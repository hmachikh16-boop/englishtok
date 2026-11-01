'use strict';

const CACHE_NAME = 'lin-go-control-v2';
const CONTROL_SHELL = [
  '/control',
  '/control.html',
  '/control.css',
  '/control.js',
  '/control-manifest.webmanifest',
  '/favicon.png',
  '/control-icon-180.png',
  '/control-icon-192.png',
  '/control-icon-512.png',
  '/control-icon-maskable-512.png',
  '/fonts/cairo-arabic.woff2',
];

const isControlAsset = (url) =>
  url.pathname === '/control' ||
  url.pathname === '/control.html' ||
  url.pathname === '/control.css' ||
  url.pathname === '/control.js' ||
  url.pathname === '/control-manifest.webmanifest' ||
  url.pathname === '/favicon.png' ||
  url.pathname === '/control-icon-180.png' ||
  url.pathname === '/control-icon-192.png' ||
  url.pathname === '/control-icon-512.png' ||
  url.pathname === '/control-icon-maskable-512.png' ||
  url.pathname.startsWith('/fonts/');

const networkFirst = async (request, fallbackUrl) => {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = (await cache.match(request)) || (fallbackUrl ? await cache.match(fallbackUrl) : null);
    if (cached) return cached;
    throw error;
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CONTROL_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/control'));
    return;
  }

  if (isControlAsset(url)) {
    event.respondWith(networkFirst(request));
  }
});
