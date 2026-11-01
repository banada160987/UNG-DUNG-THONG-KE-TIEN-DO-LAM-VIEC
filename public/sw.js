// Service Worker for THPT Cao Bá Quát PWA
const CACHE_NAME = 'cbq-app-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.jpg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// 1. Install Event: Cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Một số tài nguyên tĩnh chưa nạp kịp vào cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('PWA: Dọn dẹp cache phiên bản cũ:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First for dynamic pages & API, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Bỏ qua các request không phải GET hoặc chrome-extension
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Đối với Supabase API hoặc backend: luôn ưu tiên mạng trực tiếp
  if (request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Mất kết nối mạng. Vui lòng kiểm tra lại 4G/Wifi.' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Đối với trang HTML và điều hướng: Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match(request);
        })
    );
    return;
  }

  // Đối với hình ảnh, css, js, fonts: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Push Event: Xử lý thông báo đẩy (Web Push Notifications) trên điện thoại
self.addEventListener('push', (event) => {
  let data = {
    title: 'THPT Cao Bá Quát - Đắk Lắk',
    body: 'Bạn có thông báo mới từ hệ thống nhà trường!',
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg',
    url: '/'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Xem chi tiết' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click Event: Chạm vào thông báo trên điện thoại để mở ngay ứng dụng
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu ứng dụng đang mở sẵn ở một tab/cửa sổ thì focus và chuyển trang
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Nếu ứng dụng đang đóng thì mở cửa sổ mới
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
