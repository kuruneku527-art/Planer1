import { db } from './db';
import { soundEffects } from '../utils/audio';
import { toGregorianIsoDate } from '../utils/jalali';
import { ActiveView } from '../types';

export interface TriggeredAlarm {
  id: string;
  title: string;
  subtitle: string;
  type: 'task' | 'event' | 'habit' | 'reminder' | 'timeblock';
  time: string;
  targetView: ActiveView;
}

class ReminderScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private notifiedIdsKey = 'planner_notified_alarms';
  private listeners: ((alarm: TriggeredAlarm) => void)[] = [];

  constructor() {
    this.start();
  }

  public subscribe(callback: (alarm: TriggeredAlarm) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch {
        return 'denied';
      }
    }
    return 'denied';
  }

  public hasNotificationPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  private getNotifiedIds(): Set<string> {
    try {
      const data = localStorage.getItem(this.notifiedIdsKey);
      if (data) {
        return new Set(JSON.parse(data));
      }
    } catch {}
    return new Set();
  }

  private markNotified(id: string) {
    try {
      const set = this.getNotifiedIds();
      set.add(id);
      // Keep set reasonably small (last 200 items)
      const arr = Array.from(set).slice(-200);
      localStorage.setItem(this.notifiedIdsKey, JSON.stringify(arr));
    } catch {}
  }

  public start() {
    if (this.intervalId) return;
    // Check every 10 seconds
    this.intervalId = setInterval(() => {
      this.checkScheduledItems();
    }, 10000);
    // Also run an immediate check on startup
    setTimeout(() => this.checkScheduledItems(), 1500);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkScheduledItems() {
    if (typeof window === 'undefined') return;

    const todayIso = toGregorianIsoDate();
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;
    const notified = this.getNotifiedIds();

    // 1. Check Reminders
    const reminders = db.getReminders();
    for (const rem of reminders) {
      if (rem.isCompleted) continue;
      // If reminder date matches today and time <= currentTime
      if (rem.date === todayIso && rem.time <= currentTimeStr) {
        const alarmKey = `rem_${rem.id}_${todayIso}_${rem.time}`;
        if (!notified.has(alarmKey)) {
          this.markNotified(alarmKey);
          this.triggerAlarm({
            id: rem.id,
            title: `یادآور: ${rem.title}`,
            subtitle: rem.description || `زمان تنظیم شده: ${rem.time}`,
            type: 'reminder',
            time: rem.time,
            targetView: 'reminders',
          });
        }
      }
    }

    // 2. Check Tasks with dueDate & dueTime
    const tasks = db.getTasks();
    for (const task of tasks) {
      if (task.status === 'completed' || task.status === 'cancelled') continue;
      if (task.dueDate === todayIso && task.dueTime && task.dueTime <= currentTimeStr) {
        const alarmKey = `task_${task.id}_${todayIso}_${task.dueTime}`;
        if (!notified.has(alarmKey)) {
          this.markNotified(alarmKey);
          this.triggerAlarm({
            id: task.id,
            title: `موعد انجام وظیفه: ${task.title}`,
            subtitle: task.description || `ساعت سررسید: ${task.dueTime}`,
            type: 'task',
            time: task.dueTime,
            targetView: 'tasks',
          });
        }
      }
    }

    // 3. Check Calendar Events
    const events = db.getEvents();
    for (const ev of events) {
      if (ev.startDate === todayIso && ev.startTime && ev.startTime <= currentTimeStr) {
        const alarmKey = `event_${ev.id}_${todayIso}_${ev.startTime}`;
        if (!notified.has(alarmKey)) {
          this.markNotified(alarmKey);
          this.triggerAlarm({
            id: ev.id,
            title: `رویداد تقویم: ${ev.title}`,
            subtitle: ev.location ? `مکان: ${ev.location} - ساعت: ${ev.startTime}` : `ساعت برگزاری: ${ev.startTime}`,
            type: 'event',
            time: ev.startTime,
            targetView: 'calendar',
          });
        }
      }
    }

    // 4. Check Daily Plan TimeBlocks
    const dailyPlans = db.getDailyPlans();
    const todayPlan = dailyPlans.find((p) => p.date === todayIso);
    if (todayPlan && todayPlan.timeBlocks) {
      for (const block of todayPlan.timeBlocks) {
        if (block.completed) continue;
        if (block.startTime <= currentTimeStr) {
          const alarmKey = `block_${block.id}_${todayIso}_${block.startTime}`;
          if (!notified.has(alarmKey)) {
            this.markNotified(alarmKey);
            this.triggerAlarm({
              id: block.id,
              title: `بازه زمانی روزانه: ${block.title}`,
              subtitle: `ساعت شروع: ${block.startTime} تا ${block.endTime}`,
              type: 'timeblock',
              time: block.startTime,
              targetView: 'daily_planner',
            });
          }
        }
      }
    }
  }

  public triggerAlarm(alarm: TriggeredAlarm) {
    // 1. Play synthesized audio alarm chime & vibrate device
    soundEffects.playAlarmChime();

    // 2. Hardware vibration if supported on mobile device
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 400]);
      } catch {}
    }

    // 3. Deliver Real System Notification + Persistent DB Record via NotificationService
    if (typeof window !== 'undefined') {
      import('./notificationService').then(({ notificationService }) => {
        const notifType =
          alarm.type === 'task'
            ? 'task'
            : alarm.type === 'event'
            ? 'calendar'
            : alarm.type === 'habit'
            ? 'habit'
            : alarm.type === 'timeblock'
            ? 'daily_planner'
            : 'reminder';

        notificationService.deliverAlarmNotification({
          id: `alarm_${alarm.id}_${Date.now()}`,
          title: alarm.title,
          message: alarm.subtitle,
          type: notifType,
          timeStr: alarm.time,
          targetView: alarm.targetView,
          sourceId: alarm.id,
        });
      });
    }

    // 4. Notify active subscribers (In-App Alarm Banner)
    this.listeners.forEach((listener) => {
      try {
        listener(alarm);
      } catch {}
    });
  }
}

export const reminderScheduler = new ReminderScheduler();
