
// 1. Listen for incoming push notifications from the server
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Society Tracker Alert';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/icon.png', // Path to your logo in public folder
    badge: '/badge.png',
    data: {
      url: data.url || '/notifications', // Link to open on click
    },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});