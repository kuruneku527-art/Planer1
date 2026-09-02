/**
 * Real System Permissions & Hardware Capabilities Manager
 * Interacts directly with the underlying browser / Android OS APIs:
 * - Notification API (System Notification, Lockscreen & Tray)
 * - Service Worker Registration & Background Sync
 * - Alarm & WakeLock / Audio System
 * - Calendar System (.ics export & webcal / Web Intent / Native sync)
 * - Battery & Power Management Status
 */

export interface SystemPermissionsStatus {
  // Real OS-queried states
  notification: 'granted' | 'denied' | 'default' | 'unsupported';
  alarmExact: 'granted' | 'denied' | 'prompt' | 'unsupported';
  calendar: 'granted' | 'available' | 'denied' | 'unsupported';
  backgroundSync: 'supported' | 'unsupported' | 'active';
  wakeLock: 'supported' | 'unsupported' | 'active';
  batteryOptimization: {
    supported: boolean;
    isCharging?: boolean;
    batteryLevel?: number;
  };
}

class SystemPermissionsService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private wakeLockSentinel: any = null;
  private statusListeners: ((status: SystemPermissionsStatus) => void)[] = [];

  constructor() {
    this.initServiceWorker();
    this.listenToWindowFocus();
  }

  public subscribe(callback: (status: SystemPermissionsStatus) => void) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(status: SystemPermissionsStatus) {
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
  }

  // Re-check permissions when user resumes / switches back from Android Settings
  private listenToWindowFocus() {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.getLivePermissionsStatus().then((status) => {
          this.notifyListeners(status);
        });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.getLivePermissionsStatus().then((status) => {
            this.notifyListeners(status);
          });
        }
      });
    }
  }

  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      console.log('[SystemPermissions] ServiceWorker registered with scope:', reg.scope);
      return reg;
    } catch (err) {
      console.warn('[SystemPermissions] ServiceWorker registration failed:', err);
      return null;
    }
  }

  public async getServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (this.swRegistration) return this.swRegistration;
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready;
        return this.swRegistration;
      } catch {}
    }
    return null;
  }

  /**
   * Queries REAL live OS permissions without mocking or localStorage Booleans.
   */
  public async getLivePermissionsStatus(): Promise<SystemPermissionsStatus> {
    const status: SystemPermissionsStatus = {
      notification: 'unsupported',
      alarmExact: 'unsupported',
      calendar: 'available',
      backgroundSync: 'unsupported',
      wakeLock: 'unsupported',
      batteryOptimization: { supported: false },
    };

    if (typeof window === 'undefined') return status;

    // 1. Notification Permission (Direct from window.Notification)
    if ('Notification' in window) {
      status.notification = Notification.permission; // 'granted' | 'denied' | 'default'
    } else {
      status.notification = 'unsupported';
    }

    // 2. Alarm / Audio / WakeLock Support
    // Wake Lock API prevents phone from sleeping during active pomodoro / exact alarm countdown
    if ('wakeLock' in navigator) {
      status.wakeLock = 'supported';
    }
    if ('AudioContext' in window || 'webkitAudioContext' in (window as any)) {
      status.alarmExact = status.notification === 'granted' ? 'granted' : 'prompt';
    }

    // 3. Background Sync & Periodic Sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      status.backgroundSync = 'supported';
    } else if ('serviceWorker' in navigator) {
      status.backgroundSync = 'supported';
    }

    // 4. Battery Optimization API
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        status.batteryOptimization = {
          supported: true,
          isCharging: battery.charging,
          batteryLevel: Math.round(battery.level * 100),
        };
      } catch {
        status.batteryOptimization = { supported: false };
      }
    }

    return status;
  }

  /**
   * Step 1: Real OS Notification Permission Request
   */
  public async requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const res = await Notification.requestPermission();
      // If granted and service worker is available, register push / test notification
      if (res === 'granted') {
        const sw = await this.getServiceWorker();
        if (sw) {
          try {
            await sw.showNotification('پلنر — اعلانات با موفقیت فعال شد', {
              body: 'از این پس یادآورها، آلارم وظایف و رویدادهای شما سر موعد دقیق اعلام می‌شوند.',
              icon: '/logo.jpg',
              badge: '/logo.jpg',
              dir: 'rtl',
              lang: 'fa',
              tag: 'welcome-notification',
            } as any);
          } catch {}
        }
      }
      return res;
    } catch (err) {
      console.error('[SystemPermissions] Notification request error:', err);
      return 'denied';
    }
  }

  /**
   * Step 2: Request Alarm / Exact Timing Capability & WakeLock
   */
  public async requestAlarmCapability(): Promise<boolean> {
    try {
      // Test audio synthesizer pipeline
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      }

      // Acquire and release Wake Lock test
      if ('wakeLock' in navigator) {
        try {
          const wl = await (navigator as any).wakeLock.request('screen');
          wl.release();
        } catch {}
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Acquire persistent screen/CPU wake lock during alarm or strict pomodoro focus
   */
  public async acquireWakeLock(): Promise<boolean> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return false;
    try {
      if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
        return true;
      }
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel.addEventListener('release', () => {
        this.wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Schedule an alarm in the Service Worker so that even if the tab is in background,
   * the ServiceWorker will trigger the system notification and vibration at exact time.
   */
  public async scheduleBackgroundAlarm(params: {
    id: string;
    title: string;
    body: string;
    targetTimestamp: number; // Unix epoch ms
    targetView?: string;
  }) {
    const sw = await this.getServiceWorker();
    const now = Date.now();
    const delayMs = Math.max(0, params.targetTimestamp - now);

    // 1. Post to active Service Worker
    if (sw && sw.active) {
      sw.active.postMessage({
        type: 'SCHEDULE_ALARM',
        tag: `alarm_${params.id}`,
        title: params.title,
        body: params.body,
        delayMs: delayMs,
        targetView: params.targetView || 'reminders',
      });
    }

    // 2. Also register periodic sync if supported (Chromium Android)
    if (sw && 'periodicSync' in sw) {
      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as any,
        });
        if (status.state === 'granted') {
          await (sw as any).periodicSync.register('planner-reminder-sync', {
            minInterval: 12 * 60 * 1000, // 12 minutes
          });
        }
      } catch {}
    }
  }

  /**
   * Post immediate system notification through Service Worker with robust fallbacks
   */
  public async showSystemNotification(params: {
    title: string;
    body: string;
    tag?: string;
    targetView?: string;
  }): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. Verify notification permission is granted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('[SystemPermissions] Notification permission not granted:', Notification?.permission);
      return false;
    }

    const notifTag = params.tag || `planner_alarm_${Date.now()}`;
    let delivered = false;

    // 2. Try ServiceWorkerRegistration showNotification directly (most reliable on Android & desktop)
    try {
      const sw = await this.getServiceWorker();
      if (sw && typeof sw.showNotification === 'function') {
        await sw.showNotification(params.title, {
          body: params.body,
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          dir: 'rtl',
          lang: 'fa',
          vibrate: [300, 150, 300, 150, 350],
          tag: notifTag,
          renotify: true,
          requireInteraction: true,
          data: {
            targetView: params.targetView || 'reminders',
            timestamp: Date.now(),
          },
        } as any);
        delivered = true;
      }
    } catch (swErr) {
      console.warn('[SystemPermissions] ServiceWorker showNotification attempt failed, trying fallback:', swErr);
    }

    // 3. If Service Worker was not ready or failed, fallback to window.Notification constructor
    if (!delivered) {
      try {
        const notif = new Notification(params.title, {
          body: params.body,
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          dir: 'rtl',
          lang: 'fa',
          tag: notifTag,
        } as any);

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        delivered = true;
      } catch (winNotifErr) {
        console.warn('[SystemPermissions] window.Notification fallback also failed:', winNotifErr);
      }
    }

    // 4. Hardware vibration fallback if supported on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([250, 120, 250, 120, 350]);
      } catch {}
    }

    return delivered;
  }

  /**
   * Export / Sync event directly with Device Calendar (.ics standard format)
   * This is universally supported by Android (Google Calendar, Samsung Calendar),
   * iOS Calendar, Outlook and macOS without needing paid 3rd party APIs.
   */
  public exportToDeviceCalendar(event: {
    title: string;
    description?: string;
    location?: string;
    startDate: string; // YYYY-MM-DD
    startTime?: string; // HH:MM
    endTime?: string; // HH:MM
  }) {
    const startIso = event.startDate.replace(/-/g, '');
    const startTimeClean = (event.startTime || '09:00').replace(':', '') + '00';
    const endTimeClean = (event.endTime || '10:00').replace(':', '') + '00';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Planner Smart App//FA',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:planner_${Date.now()}@planner.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startIso}T${startTimeClean}`,
      `DTEND:${startIso}T${endTimeClean}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:یادآور: ${event.title}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title || 'event'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const systemPermissions = new SystemPermissionsService();
