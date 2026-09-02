import { NotificationItem, NotificationCategory, ActiveView } from '../types';
import { db } from './db';
import { systemPermissions } from './systemPermissions';
import { formatToJalali, toPersianDigits } from '../utils/jalali';

export interface ScheduleNotificationParams {
  id: string; // Unique stable ID (e.g. 'rem_task_123', 'rem_event_456', 'rem_789')
  title: string;
  message: string;
  type?: NotificationCategory;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  targetView?: ActiveView | string;
  sourceId?: string; // Optional reference to parent task/event/habit
}

class NotificationService {
  private subscribers: ((notifications: NotificationItem[]) => void)[] = [];
  private scheduledRegistryKey = 'planner_scheduled_registry_v2';

  constructor() {
    this.listenToServiceWorkerMessages();
    this.syncScheduledWithSW();
  }

  public subscribe(callback: (notifications: NotificationItem[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers() {
    const list = this.getNotifications();
    this.subscribers.forEach((cb) => {
      try {
        cb(list);
      } catch (err) {
        console.error('[NotificationService] Subscriber callback error:', err);
      }
    });
    // Cross-component broadcast event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('planner_notifications_updated'));
    }
  }

  private listenToServiceWorkerMessages() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'ALARM_TRIGGERED') {
          // Re-sync notifications from db
          this.notifySubscribers();
        } else if (msg.type === 'CHECK_SCHEDULED_ITEMS') {
          // Trigger reminder scheduler check
          import('./reminderScheduler').then(({ reminderScheduler }) => {
            (reminderScheduler as any).checkScheduledItems?.();
          });
        }
      });
    }
  }

  /**
   * Get all notifications from persistent DB
   */
  public getNotifications(): NotificationItem[] {
    return db.getNotifications();
  }

  /**
   * Get unread notification count
   */
  public getUnreadCount(): number {
    return db.getNotifications().filter((n) => !n.read).length;
  }

  /**
   * Create a new recorded notification and immediately save it
   */
  public createNotification(params: {
    title: string;
    message: string;
    type?: NotificationCategory;
    targetView?: ActiveView | string;
    timeStr?: string;
    dateStr?: string;
    sourceId?: string;
  }): NotificationItem {
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');

    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type || 'reminder',
      read: false,
      targetView: params.targetView || 'reminders',
      timestamp: now.toISOString(),
      timeStr: params.timeStr || `${currentHH}:${currentMM}`,
      dateStr: params.dateStr || formatToJalali(now, 'short', true),
      sourceId: params.sourceId,
    };

    db.saveNotification(item);
    this.notifySubscribers();
    return item;
  }

  /**
   * Deliver an active alarm notification:
   * 1. Shows OS System Notification with vibration and lockscreen action
   * 2. Adds persistent record to Notification Center
   */
  public async deliverAlarmNotification(params: {
    id: string;
    title: string;
    message: string;
    type?: NotificationCategory;
    timeStr?: string;
    dateStr?: string;
    targetView?: ActiveView | string;
    sourceId?: string;
  }): Promise<NotificationItem> {
    const item = this.createNotification({
      title: params.title,
      message: params.message,
      type: params.type || 'reminder',
      timeStr: params.timeStr,
      dateStr: params.dateStr,
      targetView: params.targetView,
      sourceId: params.sourceId,
    });

    // Fire real OS notification
    await systemPermissions.showSystemNotification({
      title: params.title,
      body: params.message,
      tag: params.id || item.id,
      targetView: params.targetView,
    });

    return item;
  }

  /**
   * Schedule a future alarm/notification:
   * Works both in foreground and via Service Worker when backgrounded or closed.
   */
  public async scheduleNotification(params: ScheduleNotificationParams): Promise<void> {
    try {
      // First, cancel any existing reminder with the same ID or sourceId to prevent duplicates!
      await this.cancelNotification(params.id);

      const targetDate = new Date(`${params.scheduledDate}T${params.scheduledTime}:00`);
      const now = new Date();
      const delayMs = targetDate.getTime() - now.getTime();

      // If already expired in the past by more than 1 minute, don't schedule in SW
      if (delayMs < -60000) {
        return;
      }

      // Save into scheduled registry
      this.saveScheduledItem(params);

      // Send SCHEDULE_ALARM to ServiceWorker
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await systemPermissions.getServiceWorker();
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'SCHEDULE_ALARM',
            tag: params.id,
            delayMs: Math.max(0, delayMs),
            title: params.title,
            body: params.message,
            targetView: params.targetView || 'reminders',
            sourceId: params.sourceId,
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] scheduleNotification error:', err);
    }
  }

  /**
   * Cancel a scheduled notification (prevents duplicate alarms when item is edited or deleted)
   */
  public async cancelNotification(idOrSourceId: string): Promise<void> {
    try {
      this.removeScheduledItem(idOrSourceId);

      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await systemPermissions.getServiceWorker();
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'CANCEL_ALARM',
            tag: idOrSourceId,
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] cancelNotification error:', err);
    }
  }

  /**
   * Update an existing scheduled notification
   */
  public async updateNotification(params: ScheduleNotificationParams): Promise<void> {
    await this.cancelNotification(params.id);
    await this.scheduleNotification(params);
  }

  /**
   * Mark a single notification as read
   */
  public markAsRead(id: string): void {
    db.markNotificationAsRead(id);
    this.notifySubscribers();
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    db.markAllNotificationsAsRead();
    this.notifySubscribers();
  }

  /**
   * Delete a single notification
   */
  public deleteNotification(id: string): void {
    const list = db.getNotifications().filter((n) => n.id !== id);
    try {
      localStorage.setItem('planner_notifications_v1', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('planner_db_updated', { detail: { key: 'planner_notifications_v1' } }));
    } catch {}
    this.notifySubscribers();
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    db.clearAllNotifications();
    this.notifySubscribers();
  }

  // --- Internal Scheduled Registry Management ---
  private getScheduledRegistry(): Record<string, ScheduleNotificationParams> {
    try {
      const data = localStorage.getItem(this.scheduledRegistryKey);
      if (data) return JSON.parse(data);
    } catch {}
    return {};
  }

  private saveScheduledItem(item: ScheduleNotificationParams) {
    try {
      const reg = this.getScheduledRegistry();
      reg[item.id] = item;
      localStorage.setItem(this.scheduledRegistryKey, JSON.stringify(reg));
    } catch {}
  }

  private removeScheduledItem(idOrSourceId: string) {
    try {
      const reg = this.getScheduledRegistry();
      delete reg[idOrSourceId];
      // Also check by sourceId
      for (const [key, val] of Object.entries(reg)) {
        if (val.sourceId === idOrSourceId || key === idOrSourceId) {
          delete reg[key];
        }
      }
      localStorage.setItem(this.scheduledRegistryKey, JSON.stringify(reg));
    } catch {}
  }

  private async syncScheduledWithSW() {
    if (typeof window === 'undefined') return;
    try {
      const reg = this.getScheduledRegistry();
      const now = Date.now();
      const sw = await systemPermissions.getServiceWorker();

      for (const [id, item] of Object.entries(reg)) {
        const targetDate = new Date(`${item.scheduledDate}T${item.scheduledTime}:00`);
        const delayMs = targetDate.getTime() - now;
        if (delayMs > 0 && sw && sw.active) {
          sw.active.postMessage({
            type: 'SCHEDULE_ALARM',
            tag: id,
            delayMs,
            title: item.title,
            body: item.message,
            targetView: item.targetView,
            sourceId: item.sourceId,
          });
        }
      }
    } catch {}
  }
}

export const notificationService = new NotificationService();
