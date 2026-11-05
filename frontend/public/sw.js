self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const conversationId = event.notification.data?.conversationId;
  const messageId = event.notification.tag?.replace('message-', '');
  
  if (!conversationId) return;

  if (event.action === 'reply' && event.reply) {
    event.waitUntil((async () => {
      const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Find an active window client to handle the reply emit
      for (const client of windowClients) {
        client.postMessage({ 
          type: 'NOTIFICATION_REPLY', 
          conversationId, 
          text: event.reply, 
          messageId 
        });
        return; 
      }
    })());
    return;
  }

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if ('focus' in client) {
        await client.focus();
        client.postMessage({ type: 'OPEN_CONVERSATION', conversationId });
        return;
      }
    }

    const url = new URL('/dashboard', self.location.origin);
    url.searchParams.set('conversationId', conversationId);
    await self.clients.openWindow(url.toString());
  })());
});

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevSup - Offline</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #070B13;
      color: #F8FAFC;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
    }
    .offline-card {
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 24px;
      padding: 44px 36px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.08);
      position: relative;
    }
    .logo-badge {
      width: 76px;
      height: 76px;
      border-radius: 20px;
      background: rgba(6, 182, 212, 0.08);
      border: 1px solid rgba(6, 182, 212, 0.25);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 0 24px rgba(6, 182, 212, 0.18);
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #F8FAFC;
      margin-bottom: 12px;
      letter-spacing: -0.4px;
    }
    p {
      color: #94A3B8;
      font-size: 0.98rem;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #EF4444;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #EF4444;
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .retry-btn {
      width: 100%;
      padding: 14px 24px;
      border-radius: 12px;
      background: #06B6D4;
      color: #070B13;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 4px 16px rgba(6, 182, 212, 0.35);
    }
    .retry-btn:hover {
      background: #0891B2;
      color: #FFFFFF;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(6, 182, 212, 0.45);
    }
    .retry-btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="offline-card">
    <div class="logo-badge">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="46" height="38" stroke="#06B6D4" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M 35 25 L 10 50 L 35 75" />
        <path d="M 70 15 L 50 85" />
        <path d="M 85 25 L 110 50 L 85 75" />
      </svg>
    </div>
    <div class="status-pill">
      <span class="status-dot"></span>
      <span>No Connection</span>
    </div>
    <h1>You are offline</h1>
    <p>Please check your internet connection. DevSup will automatically reconnect as soon as your network is restored.</p>
    <button class="retry-btn" onclick="window.location.reload()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
        <path d="M16 21h5v-5"/>
      </svg>
      Retry Connection
    </button>
  </div>
  <script>
    window.addEventListener('online', () => {
      window.location.reload();
    });
  </script>
</body>
</html>`;

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
        return new Response(OFFLINE_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      return new Response('You are offline. Please check your connection.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
