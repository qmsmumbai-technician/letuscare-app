// Let Us Care service worker – network first, cache as fallback (so updates show immediately)
const CACHE = 'luc-v16';
const CORE = ['./', 'index.html', 'family.html', 'toddler.html', 'elder.html', 'patient.html', 'mother.html', 'special.html', 'partner.html', 'manifest.json', 'i18n.js',
  'logo.webp', 'toddler.webp', 'elder.webp', 'patient.webp', 'mother.webp', 'special.webp', 'adt-logo.webp', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache Firebase / Google API traffic
  if (url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts.')) return;
  if (url.hostname.includes('firebase') || url.hostname.includes('gstatic.com') && url.pathname.includes('firebasejs')) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok && (url.origin === location.origin || url.hostname.startsWith('fonts.'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
