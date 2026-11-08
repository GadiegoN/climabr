// ClimaBR Service Worker - Notificações PWA & Cache
const SW_VERSION = "climabr-sw-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Manipula cliques na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Se houver uma aba aberta com o ClimaBR, foca nela e navega
      for (const client of windowClients) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl) || client.url.includes("/")) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Se não houver aba aberta, abre uma nova janela
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Manipula mensagens enviadas pela aplicação (ex: agendamento e disparo imediato)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_NOTIFICATION") {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: "/icon",
      badge: "/icon",
      vibrate: [200, 100, 200],
      ...options,
    });
  }
});

