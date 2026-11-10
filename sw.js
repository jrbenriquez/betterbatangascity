/* Clear previous offline content on upgrade; all template requests use the network.
 * This deliberately avoids retaining outdated personal or municipal data. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
