// Service Worker for Push Notifications

// Lắng nghe sự kiện push từ server
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let data = {
    title: 'Thông báo',
    body: 'Bạn có thông báo mới!',
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png'
  };

  // Parse data từ server
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon-192.png',
    badge: data.badge || '/images/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Lắng nghe click vào notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Tìm window đang mở và focus
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Nếu không có window nào, mở mới
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Lắng nghe đóng notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
