function parseBadgeCount(value) {
  const count = Number(value || 0)

  if (!Number.isFinite(count) || count < 0) {
    return 0
  }

  return Math.floor(count)
}

async function updateAppBadge(count) {
  try {
    if (!self.registration) return

    if (count > 0 && 'setAppBadge' in self.registration) {
      await self.registration.setAppBadge(count)
      return
    }

    if (count <= 0 && 'clearAppBadge' in self.registration) {
      await self.registration.clearAppBadge()
    }
  } catch {
    // Badge API is not supported on all browsers/devices.
  }
}

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

  const badgeCount = parseBadgeCount(data.badgeCount)

  const title = data.title || 'Navienty'
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'navienty-notification',
    data: {
      url: data.url || '/admin',
      badgeCount,
    },
    vibrate: [120, 60, 120],
    requireInteraction: true,
  }

  event.waitUntil(
    Promise.all([
      updateAppBadge(badgeCount),
      self.registration.showNotification(title, options),
    ])
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const urlToOpen =
    event.notification && event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/admin'

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        for (const client of clientList) {
          const clientUrl = new URL(client.url)
          const targetUrl = new URL(urlToOpen, self.location.origin)

          if (
            clientUrl.origin === targetUrl.origin &&
            clientUrl.pathname === targetUrl.pathname &&
            'focus' in client
          ) {
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

self.addEventListener('message', function (event) {
  const data = event.data || {}

  if (data.type === 'SET_APP_BADGE') {
    event.waitUntil(updateAppBadge(parseBadgeCount(data.count)))
  }

  if (data.type === 'CLEAR_APP_BADGE') {
    event.waitUntil(updateAppBadge(0))
  }
})