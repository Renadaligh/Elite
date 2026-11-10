// Minimal service worker: it only makes the site installable and shows a small offline notice.
// Pages are always fetched from the network first, and /api is never cached, so a new deploy shows up immediately.
const OFFLINE = new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#050507;color:#fff;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center"><div><h2>لا يوجد اتصال بالإنترنت</h2><p style="color:#9aa0b4">No internet connection</p></div>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return; // only page loads: everything else goes straight to the network
  e.respondWith(fetch(r).catch(() => OFFLINE.clone()));
});
