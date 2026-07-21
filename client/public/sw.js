const CACHE_NAME = 'comexcrm-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;
  
  // Para scripts y estilos dentro de /assets/, ir siempre a la red primero
  if (e.request.url.includes('/assets/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Network-First para la navegación principal
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});



self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'ComEx CRM Alerta', body: 'Tenés nuevas alertas de comercio exterior.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/src/assets/logo-don-yeyo-png-sin-fondo.png',
      badge: '/src/assets/logo-don-yeyo-png-sin-fondo.png',
      data: { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
