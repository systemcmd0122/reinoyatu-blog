// public/sw-custom.js
// カスタムService Worker設定

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // 即座にアクティベート
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  // 即座に制御を取得
  event.waitUntil(self.clients.claim());
});

// プッシュ通知のサポート（将来的な拡張用）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          action: 'explore',
          title: '開く',
        },
        {
          action: 'close',
          title: '閉じる',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知クリックハンドラ
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// バックグラウンド同期（将来的な拡張用）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  // バックグラウンドでデータを同期
  console.log('Syncing posts in background...');
}

// Share Target API（将来的な拡張用）
self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('/share-target') && event.request.method === 'POST') {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const title = formData.get('title');
      const text = formData.get('text');
      const url = formData.get('url');

      // 共有されたデータを処理
      return Response.redirect('/blog/new', 303);
    })());
  }
});