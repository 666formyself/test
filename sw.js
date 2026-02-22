// Service Worker for 佳倩管家 - 支持后台通知推送

const CACHE_NAME = 'jiaqian-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx'
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 处理推送消息
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || '小主，别忘了记录今天的精彩瞬间哦！✨',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
    tag: data.tag || 'checkin-reminder',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: data.payload || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '打卡提醒', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 如果已有窗口打开，聚焦到该窗口
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 处理来自主线程的消息（定时提醒）
self.addEventListener('message', (event) => {
  if (event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, icon, tag } = event.data.payload;
    self.registration.showNotification(title, {
      body,
      icon: icon || 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
      tag: tag || 'checkin-reminder',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
  }
});

// 处理 fetch 请求（离线支持）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果缓存中有，返回缓存
      if (response) {
        return response;
      }
      // 否则请求网络
      return fetch(event.request).then((response) => {
        // 不缓存非成功响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // 缓存新资源
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
