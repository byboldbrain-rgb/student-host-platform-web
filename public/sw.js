self.addEventListener('push', function (event) {
  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = {
        title: 'Navienty',
        body: event.data.text(),
      }
    }
  }

  const title = data.title || 'Navienty'
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'navienty-notification',
    data: {
      url: data.url || '/admin/finance/deposit-requests',
    },
    vibrate: [120, 60, 120],
    requireInteraction: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const urlToOpen =
    event.notification && event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/admin/finance/deposit-requests'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }

      return undefined
    })
  )
})