// Planner Progressive Web App Service Worker
// Handles Background Notifications, Exact Scheduling Sync, Periodic Background Reminders, and Offline Caching

// IMPORTANT: bump this version string on every deploy (or better: inject build hash via CI)
const CACHE_VERSION = 'v2'; // <-- change this every time you push a new build
const CACHE_NAME = `planner-app-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/favicon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // delete any cache that isn't the current version — this is what was missing
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      clients.claim(),
    ]).then(() => {
      console.log('[SW] Planner Service Worker activated, old caches cleared, clients claimed.');
    })
  );
});

// Strategy:
// - Navigation requests & index.html -> NETWORK-FIRST (so a new build's HTML is picked up immediately)
// - Everything else (hashed JS/CSS/images) -> CACHE-FIRST (safe: filenames change per build)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  const isNavigation =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/index.html');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for hashed static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {});
    })
  );
});

// Handle Background Push & Scheduled Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'یادآور پلنر',
    body: 'زمان انجام یکی از برنامه‌های شما فرا رسیده است.',
    tag: 'planner-reminder',
    targetView: 'dashboard'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    dir: 'rtl',
    lang: 'fa',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.tag || `planner_alarm_${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'مشاهده در برنامه' },
      { action: 'close', title: 'بستن' }
    ],
    data: {
      targetView: data.targetView || 'dashboard',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetView = event.notification.data?.targetView || 'dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_VIEW',
            targetView: targetView
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(`/#${targetView}`);
      }
    })
  );
});

const activeTimers = new Map();

function openAlarmDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('planner_sw_alarms_db', 1);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('alarms')) {
        db.createObjectStore('alarms', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function persistAlarm(alarm) {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction('alarms', 'readwrite');
    tx.objectStore('alarms').put(alarm);
  } catch (err) {
    console.warn('[SW] Could not persist alarm:', err);
  }
}

async function removePersistedAlarm(id) {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction('alarms', 'readwrite');
    tx.objectStore('alarms').delete(id);
  } catch (err) {}
}

async function checkPendingAlarms() {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction('alarms', 'readonly');
    const store = tx.objectStore('alarms');
    const req = store.getAll();
    req.onsuccess = () => {
      const alarms = req.result || [];
      const now = Date.now();
      alarms.forEach((alarm) => {
        if (alarm.triggerAt <= now) {
          triggerAlarmNotification(alarm);
          removePersistedAlarm(alarm.id);
        } else if (!activeTimers.has(alarm.id)) {
          const delay = Math.max(100, alarm.triggerAt - now);
          scheduleTimer(alarm, delay);
        }
      });
    };
  } catch {}
}

function triggerAlarmNotification(alarm) {
  const options = {
    body: alarm.body || 'زمان موعد انجام فرا رسیده است.',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    dir: 'rtl',
    lang: 'fa',
    vibrate: [350, 150, 350, 150, 450],
    tag: alarm.id || `alarm_${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'مشاهده در پلنر' },
      { action: 'close', title: 'متوجه شدم' }
    ],
    data: {
      targetView: alarm.targetView || 'reminders',
      sourceId: alarm.sourceId,
      timestamp: Date.now()
    }
  };

  self.registration.showNotification(alarm.title || 'یادآور پلنر', options);

  clients.matchAll().then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'ALARM_TRIGGERED',
        alarmId: alarm.id,
        targetView: alarm.targetView
      });
    });
  });
}

function scheduleTimer(alarm, delayMs) {
  if (activeTimers.has(alarm.id)) {
    clearTimeout(activeTimers.get(alarm.id));
    activeTimers.delete(alarm.id);
  }

  const timer = setTimeout(() => {
    triggerAlarmNotification(alarm);
    activeTimers.delete(alarm.id);
    removePersistedAlarm(alarm.id);
  }, delayMs);

  activeTimers.set(alarm.id, timer);
}

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, tag, targetView, sourceId } = msg;
    triggerAlarmNotification({
      id: tag || `direct_${Date.now()}`,
      title,
      body,
      targetView,
      sourceId
    });
  } else if (msg.type === 'SCHEDULE_ALARM') {
    const alarmData = msg.alarm || msg;
    const triggerAt = alarmData.triggerAt || (Date.now() + Math.max(0, alarmData.delayMs || 0));
    const delayMs = Math.max(0, triggerAt - Date.now());
    const alarm = {
      id: alarmData.id || alarmData.tag || `alarm_${Date.now()}`,
      title: alarmData.title || 'یادآور پلنر',
      body: alarmData.body || 'زمان موعد فرا رسیده است.',
      targetView: alarmData.targetView || 'reminders',
      sourceId: alarmData.sourceId,
      triggerAt: triggerAt,
      createdAt: Date.now()
    };

    persistAlarm(alarm);
    scheduleTimer(alarm, delayMs);
  } else if (msg.type === 'CANCEL_ALARM') {
    const id = msg.id || msg.tag || (msg.alarm && msg.alarm.id);
    if (id) {
      if (activeTimers.has(id)) {
        clearTimeout(activeTimers.get(id));
        activeTimers.delete(id);
      }
      removePersistedAlarm(id);
    }
  } else if (msg.type === 'CHECK_PENDING') {
    checkPendingAlarms();
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'planner-reminder-sync') {
    event.waitUntil(checkPendingAlarms());
  }
});

setInterval(() => {
  checkPendingAlarms();
}, 30000);
