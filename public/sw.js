function parseBadgeCount(value) {
  const count = Number(value || 0)

  if (!Number.isFinite(count) || count < 0) {
    return 0
  }

  return Math.floor(count)
}

function normalizeNotificationUrl(value) {
  try {
    const fallbackUrl = new URL('/properties', self.location.origin)

    if (!value || typeof value !== 'string') {
      return fallbackUrl.href
    }

    const url = new URL(value, self.location.origin)

    if (url.origin !== self.location.origin) {
      return fallbackUrl.href
    }

    return url.href
  } catch {
    return new URL('/properties', self.location.origin).href
  }
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

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

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
  const url = normalizeNotificationUrl(data.url)

  const options = {
    body: data.body || 'عندك إشعار جديد من Navienty',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'navienty-notification',
    renotify: data.renotify === true,
    data: {
      url,
      badgeCount,
      propertyId: data.propertyId || null,
      alertRequestId: data.alertRequestId || null,
      notificationId: data.notificationId || null,
      conversationId: data.conversationId || null,
      notificationType: data.notificationType || null,
    },
    vibrate: [120, 60, 120],
    requireInteraction: data.requireInteraction !== false,
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

  const urlToOpen = normalizeNotificationUrl(
    event.notification && event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/properties'
  )

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        const targetUrl = new URL(urlToOpen)

        for (const client of clientList) {
          const clientUrl = new URL(client.url)

          if (
            clientUrl.origin === targetUrl.origin &&
            clientUrl.pathname === targetUrl.pathname
          ) {
            if ('focus' in client) {
              return client.focus()
            }
          }
        }

        for (const client of clientList) {
          const clientUrl = new URL(client.url)

          if (clientUrl.origin === targetUrl.origin) {
            if ('navigate' in client && 'focus' in client) {
              return client.navigate(urlToOpen).then(function () {
                return client.focus()
              })
            }
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }

        return undefined
      })
  )
})

self.addEventListener('notificationclose', function (event) {
  const badgeCount =
    event.notification && event.notification.data && event.notification.data.badgeCount
      ? parseBadgeCount(event.notification.data.badgeCount)
      : 0

  if (badgeCount <= 0) {
    event.waitUntil(updateAppBadge(0))
  }
})

self.addEventListener('message', function (event) {
  const data = event.data || {}

  if (data.type === 'SET_APP_BADGE') {
    event.waitUntil(updateAppBadge(parseBadgeCount(data.count)))
  }

  if (data.type === 'CLEAR_APP_BADGE') {
    event.waitUntil(updateAppBadge(0))
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (data.type === 'NAVIENTY_TEST_NOTIFICATION') {
    const badgeCount = parseBadgeCount(data.badgeCount)

    event.waitUntil(
      Promise.all([
        updateAppBadge(badgeCount),
        self.registration.showNotification(data.title || 'Navienty', {
          body: data.body || 'تم تفعيل إشعارات Navienty بنجاح ✅',
          icon: data.icon || '/icon-192.png',
          badge: data.badge || '/icon-192.png',
          tag: 'navienty-test-notification',
          data: {
            url: normalizeNotificationUrl(data.url || '/properties'),
            badgeCount,
          },
          vibrate: [120, 60, 120],
        }),
      ])
    )
  }
})