// Push notification event handlers — imported into the generated Workbox service worker

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'FitSelf', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'FitSelf', {
      body: payload.body ?? '',
      icon: payload.icon ?? '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag ?? 'fitself',
      data: payload.data ?? {},
      requireInteraction: false,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
