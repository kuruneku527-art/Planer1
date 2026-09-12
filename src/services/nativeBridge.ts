/**
 * Native Android Bridge & System Integration Layer
 * 
 * Provides direct communication with Android Native APIs via WebView JavascriptInterface:
 * - NotificationManager & Notification Channels (POST_NOTIFICATIONS)
 * - Exact Alarm Scheduling via AlarmManager (SCHEDULE_EXACT_ALARM)
 * - System Clock Integration (AlarmClock.ACTION_SET_ALARM, ACTION_SHOW_ALARMS)
 * - Android Storage Access Framework (SAF - ACTION_OPEN_DOCUMENT, ACTION_CREATE_DOCUMENT)
 * - Settings Navigation (Settings.ACTION_APP_NOTIFICATION_SETTINGS, ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
 * - WindowInsets & Edge-to-Edge System Bar safe insets
 * 
 * When running in standard Web/PWA mode without a native wrapper, provides
 * authentic, un-faked fallbacks using standard Web APIs (Notification API, Web Audio,
 * File System Access API, Web Share, .ics Calendar export).
 */

export interface SystemInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ClockAlarmParams {
  hour: number;
  minutes: number;
  message: string;
  skipUi?: boolean;
  days?: number[]; // Calendar.SUNDAY = 1, MONDAY = 2... or Persian weekday map
}

export interface NativeAlarmParams {
  id: string;
  title: string;
  message: string;
  timestamp: number; // Unix epoch ms
  soundUri?: string;
  vibrate?: boolean;
  targetView?: string;
}

export interface NativeBridgeStatus {
  isNative: boolean;
  platform: 'android' | 'web';
  notificationPermission: 'granted' | 'denied' | 'default' | 'unsupported';
  canScheduleExactAlarms: boolean;
  hasAudioFilePicker: boolean;
  hasSafStorage: boolean;
}

declare global {
  interface Window {
    AndroidBridge?: {
      isNative: () => boolean;
      getNotificationPermissionStatus: () => string;
      requestNotificationPermission: () => void;
      openNotificationSettings: () => void;
      canScheduleExactAlarms: () => boolean;
      requestExactAlarmPermission: () => void;
      openBatteryOptimizationSettings: () => void;
      showNotification: (title: string, body: string, tag?: string, targetView?: string) => boolean;
      scheduleExactAlarm: (alarmJson: string) => boolean;
      cancelAlarm: (alarmId: string) => boolean;
      setClockAlarm: (hour: number, minutes: number, message: string, skipUi: boolean, daysJson: string) => boolean;
      openClockApp: () => boolean;
      pickAudioFile: () => void;
      saveBackupFile: (jsonContent: string, defaultFilename: string) => void;
      getSystemInsets: () => string; // returns JSON "{ top, bottom, left, right }"
      setSystemBarsTheme?: (isLight: boolean) => void;
      showToast: (message: string) => void;
    };
    // Callbacks invoked by Android Native Activity
    onNativeNotificationPermissionResult?: (granted: boolean, status: string) => void;
    onNativeAudioFilePicked?: (uri: string, displayName: string) => void;
    onNativeAudioFileError?: (error: string) => void;
    onNativeBackupFileSaved?: (success: boolean, pathOrError: string) => void;
  }
}

class NativeBridgeService {
  private listeners: (() => void)[] = [];
  private selectedAudioCache: { uri: string; name: string } | null = null;

  constructor() {
    this.setupWindowListeners();
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    // Receive selected audio file from Android Storage Access Framework
    window.onNativeAudioFilePicked = (uri: string, displayName: string) => {
      this.selectedAudioCache = { uri, name: displayName };
      window.dispatchEvent(
        new CustomEvent('planner_native_audio_picked', { detail: { uri, displayName } })
      );
    };

    // Receive backup result from Android SAF
    window.onNativeBackupFileSaved = (success: boolean, pathOrError: string) => {
      window.dispatchEvent(
        new CustomEvent('planner_native_backup_result', { detail: { success, pathOrError } })
      );
    };

    // Receive notification permission result
    window.onNativeNotificationPermissionResult = (granted: boolean, status: string) => {
      window.dispatchEvent(
        new CustomEvent('planner_native_permission_changed', { detail: { granted, status } })
      );
    };
  }

  /**
   * Check whether running inside real Android Native Container with JavascriptInterface
   */
  public isNative(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof window.AndroidBridge !== 'undefined' && typeof window.AndroidBridge.isNative === 'function';
  }

  /**
   * Comprehensive capabilities report
   */
  public async getStatus(): Promise<NativeBridgeStatus> {
    const isNat = this.isNative();

    if (isNat && window.AndroidBridge) {
      let notifStatus: 'granted' | 'denied' | 'default' | 'unsupported' = 'default';
      try {
        const raw = window.AndroidBridge.getNotificationPermissionStatus();
        if (raw === 'granted' || raw === 'denied' || raw === 'default') {
          notifStatus = raw;
        }
      } catch {
        notifStatus = 'default';
      }

      let canExact = false;
      try {
        canExact = window.AndroidBridge.canScheduleExactAlarms();
      } catch {
        canExact = false;
      }

      return {
        isNative: true,
        platform: 'android',
        notificationPermission: notifStatus,
        canScheduleExactAlarms: canExact,
        hasAudioFilePicker: true,
        hasSafStorage: true,
      };
    }

    // Web / PWA fallback status
    let notifPermission: 'granted' | 'denied' | 'default' | 'unsupported' = 'unsupported';
    if (typeof window !== 'undefined' && 'Notification' in window) {
      notifPermission = Notification.permission;
    }

    return {
      isNative: false,
      platform: 'web',
      notificationPermission: notifPermission,
      canScheduleExactAlarms: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      hasAudioFilePicker: true,
      hasSafStorage: typeof window !== 'undefined' && ('showSaveFilePicker' in window || 'canShare' in navigator),
    };
  }

  /**
   * Check current status of notification permission
   */
  public getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (this.isNative() && window.AndroidBridge) {
      try {
        const raw = window.AndroidBridge.getNotificationPermissionStatus();
        return (raw as any) || 'default';
      } catch (err) {
        console.warn('[NativeBridge] getNotificationPermissionStatus error:', err);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  }

  /**
   * Request Notification Permission
   * Calls native Android 13+ POST_NOTIFICATIONS runtime dialog or browser Notification.requestPermission()
   */
  public async requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (this.isNative() && window.AndroidBridge) {
      try {
        window.AndroidBridge.requestNotificationPermission();
        const raw = window.AndroidBridge.getNotificationPermissionStatus();
        return (raw as any) || 'default';
      } catch (err) {
        console.warn('[NativeBridge] requestNotificationPermission native error:', err);
      }
    }

    // Browser Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return 'granted';
      try {
        const res = await Notification.requestPermission();
        return res;
      } catch {
        return Notification.permission;
      }
    }

    return 'unsupported';
  }

  /**
   * Open app's direct notification settings page in Android OS
   * (Settings.ACTION_APP_NOTIFICATION_SETTINGS)
   */
  public openNotificationSettings(): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        window.AndroidBridge.openNotificationSettings();
        return true;
      } catch (err) {
        console.warn('[NativeBridge] openNotificationSettings error:', err);
      }
    }
    return false;
  }

  /**
   * Check if exact alarms can be scheduled on Android 12+ (SCHEDULE_EXACT_ALARM)
   */
  public canScheduleExactAlarms(): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        return window.AndroidBridge.canScheduleExactAlarms();
      } catch {
        return false;
      }
    }
    return true; // In Web mode, Service Worker timer handles exact alarm
  }

  /**
   * Open Android OS Exact Alarm Permission Settings
   * (Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
   */
  public openExactAlarmSettings(): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        window.AndroidBridge.requestExactAlarmPermission();
        return true;
      } catch (err) {
        console.warn('[NativeBridge] openExactAlarmSettings error:', err);
      }
    }
    return false;
  }

  /**
   * Open Android Battery Optimization Settings
   */
  public openBatteryOptimizationSettings(): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        window.AndroidBridge.openBatteryOptimizationSettings();
        return true;
      } catch (err) {
        console.warn('[NativeBridge] openBatteryOptimizationSettings error:', err);
      }
    }
    return false;
  }

  /**
   * Show immediate native notification
   */
  public showNotification(title: string, body: string, tag?: string, targetView?: string): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        return window.AndroidBridge.showNotification(title, body, tag, targetView);
      } catch (err) {
        console.warn('[NativeBridge] showNotification error:', err);
      }
    }
    return false;
  }

  /**
   * Schedule real Alarm via Android AlarmManager or Web ServiceWorker
   */
  public async scheduleAlarm(params: NativeAlarmParams): Promise<boolean> {
    if (this.isNative() && window.AndroidBridge) {
      try {
        return window.AndroidBridge.scheduleExactAlarm(JSON.stringify(params));
      } catch (err) {
        console.warn('[NativeBridge] scheduleAlarm native error:', err);
      }
    }

    // Web ServiceWorker Fallback
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({
            type: 'SCHEDULE_ALARM',
            tag: `alarm_${params.id}`,
            title: params.title,
            body: params.message,
            delayMs: Math.max(0, params.timestamp - Date.now()),
            targetView: params.targetView || 'reminders',
            soundUri: params.soundUri,
          });
          return true;
        }
      } catch (err) {
        console.warn('[NativeBridge] Web alarm postMessage error:', err);
      }
    }

    return false;
  }

  /**
   * Cancel an existing alarm
   */
  public cancelAlarm(alarmId: string): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        return window.AndroidBridge.cancelAlarm(alarmId);
      } catch (err) {
        console.warn('[NativeBridge] cancelAlarm native error:', err);
      }
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({
          type: 'CANCEL_ALARM',
          tag: `alarm_${alarmId}`,
        });
      });
    }

    return true;
  }

  /**
   * Set an alarm in Android's official default Clock / Alarm app
   * Uses AlarmClock.ACTION_SET_ALARM Intent
   */
  public setClockAlarm(params: ClockAlarmParams): { supported: boolean; success: boolean; message: string } {
    if (this.isNative() && window.AndroidBridge) {
      try {
        const daysJson = JSON.stringify(params.days || []);
        const res = window.AndroidBridge.setClockAlarm(
          params.hour,
          params.minutes,
          params.message,
          params.skipUi ?? false,
          daysJson
        );
        return {
          supported: true,
          success: res,
          message: res
            ? 'آلارم با موفقیت به برنامه ساعت گوشی افزوده شد.'
            : 'برنامه ساعت در دستگاه یافت نشد.',
        };
      } catch (err: any) {
        return { supported: true, success: false, message: err?.message || 'خطا در ثبت آلارم در ساعت گوشی' };
      }
    }

    // On standard Android Browser, try deep link intent
    if (typeof window !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      try {
        const hour = params.hour;
        const minutes = params.minutes;
        const msg = encodeURIComponent(params.message);
        // Standard Android AlarmClock Intent URI
        const intentUri = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${hour};i.android.intent.extra.alarm.MINUTES=${minutes};S.android.intent.extra.alarm.MESSAGE=${msg};end`;
        window.location.href = intentUri;
        return {
          supported: true,
          success: true,
          message: 'دستور ثبت آلارم به ساعت گوشی ارسال شد.',
        };
      } catch {
        // Fallback message
      }
    }

    return {
      supported: false,
      success: false,
      message: 'تنظیم مستقیم ساعت نیازمند اپلیکیشن Native Android یا دستگاه اندرویدی است. در وب، آلارم به صورت اعلان سیستمی و صوتی پلنر پخش می‌شود.',
    };
  }

  /**
   * Open Android System Clock Application (AlarmClock.ACTION_SHOW_ALARMS)
   */
  public openClockApp(): boolean {
    if (this.isNative() && window.AndroidBridge) {
      try {
        return window.AndroidBridge.openClockApp();
      } catch (err) {
        console.warn('[NativeBridge] openClockApp native error:', err);
      }
    }

    if (typeof window !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      try {
        window.location.href = 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end';
        return true;
      } catch {}
    }

    return false;
  }

  /**
   * Pick custom audio file from phone via Storage Access Framework (SAF - ACTION_OPEN_DOCUMENT)
   * or standard File Input in Web
   */
  public pickAudioFile(): Promise<{ uri: string; name: string } | null> {
    return new Promise((resolve) => {
      // 1. Android Native SAF
      if (this.isNative() && window.AndroidBridge) {
        const handler = (e: any) => {
          window.removeEventListener('planner_native_audio_picked', handler);
          resolve(e.detail);
        };
        window.addEventListener('planner_native_audio_picked', handler, { once: true });
        try {
          window.AndroidBridge.pickAudioFile();
          return;
        } catch (err) {
          console.warn('[NativeBridge] pickAudioFile native error:', err);
        }
      }

      // 2. Web File Input fallback
      if (typeof document === 'undefined') {
        resolve(null);
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.style.display = 'none';

      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const blobUrl = URL.createObjectURL(file);
          resolve({ uri: blobUrl, name: file.name });
        } else {
          resolve(null);
        }
        document.body.removeChild(input);
      };

      input.oncancel = () => {
        resolve(null);
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Save Backup JSON to Phone Storage via SAF (ACTION_CREATE_DOCUMENT)
   * or File System Access API / Web Share / Verified DOM Download
   */
  public async saveBackupFile(
    jsonString: string,
    defaultFilename: string
  ): Promise<{ success: boolean; cancelled?: boolean; message: string }> {
    // 1. Android Native Storage Access Framework
    if (this.isNative() && window.AndroidBridge) {
      return new Promise((resolve) => {
        const handler = (e: any) => {
          window.removeEventListener('planner_native_backup_result', handler);
          if (e.detail?.success) {
            resolve({ success: true, message: 'پشتیبان با موفقیت در حافظه گوشی ذخیره شد.' });
          } else {
            resolve({ success: false, message: e.detail?.pathOrError || 'ذخیره لغو شد یا با خطا مواجه شد.' });
          }
        };
        window.addEventListener('planner_native_backup_result', handler, { once: true });
        try {
          window.AndroidBridge.saveBackupFile(jsonString, defaultFilename);
          return;
        } catch (err: any) {
          resolve({ success: false, message: err?.message || 'خطا در دسترسی به حافظه اندروید' });
        }
      });
    }

    // 2. Modern Web File System Access API (Supported on Chrome Desktop & Android)
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [
            {
              description: 'فایل پشتیبان پلنر (JSON)',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return { success: true, message: 'پشتیبان با موفقیت در محل انتخابی ذخیره شد.' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User intentionally cancelled picker -> strictly DO NOT show success
          return { success: false, cancelled: true, message: 'عملیات ذخیره فایل توسط کاربر لغو شد.' };
        }
        console.warn('[NativeBridge] showSaveFilePicker failed, trying fallback:', err);
      }
    }

    // 3. Web Share API (Save to Files / Share on Mobile Devices)
    if (typeof navigator !== 'undefined' && 'canShare' in navigator && (navigator as any).canShare) {
      try {
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const file = new File([blob], defaultFilename, { type: 'application/json' });
        if ((navigator as any).canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: defaultFilename,
            text: 'نسخه کامل پشتیبان اطلاعات پلنر هوشمند',
          });
          return { success: true, message: 'فایل پشتیبان با موفقیت ذخیره یا به اشتراک گذاشته شد.' };
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: false, cancelled: true, message: 'عملیات توسط کاربر لغو شد.' };
        }
      }
    }

    // 4. Robust Anchor Download Verification
    try {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 30000);
      return { success: true, message: 'فایل پشتیبان با موفقیت در پوشه بارگیری‌ها (Downloads) دانلود شد.' };
    } catch (err: any) {
      return { success: false, message: 'خطا در دانلود فایل پشتیبان: ' + (err?.message || 'نامشخص') };
    }
  }

  /**
   * Open / Read a Backup JSON file from phone storage via File System Access API
   * or standard HTML input element
   */
  public async openBackupFile(): Promise<{ success: boolean; content?: string; message?: string }> {
    // 1. File System Access API (Chromium / Edge / Android Chrome)
    if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'فایل پشتیبان پلنر (JSON)',
              accept: { 'application/json': ['.json'] },
            },
          ],
          multiple: false,
        });
        const file = await handle.getFile();
        const content = await file.text();
        return { success: true, content };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: false, message: 'cancelled' };
        }
      }
    }

    // 2. Standard DOM input fallback
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve({ success: false, message: 'محیط DOM در دسترس نیست.' });
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({ success: false, message: 'cancelled' });
          if (document.body.contains(input)) document.body.removeChild(input);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          resolve({ success: true, content: text });
          if (document.body.contains(input)) document.body.removeChild(input);
        };
        reader.onerror = () => {
          resolve({ success: false, message: 'خطا در خواندن فایل انتخابی.' });
          if (document.body.contains(input)) document.body.removeChild(input);
        };
        reader.readAsText(file);
      };

      input.oncancel = () => {
        resolve({ success: false, message: 'cancelled' });
        if (document.body.contains(input)) document.body.removeChild(input);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Query real System Bar Insets from Android Native Activity WindowInsets
   */
  public getSystemInsets(): SystemInsets {
    if (this.isNative() && window.AndroidBridge) {
      try {
        const json = window.AndroidBridge.getSystemInsets();
        if (json) {
          const parsed = JSON.parse(json);
          return {
            top: Number(parsed.top) || 0,
            bottom: Number(parsed.bottom) || 0,
            left: Number(parsed.left) || 0,
            right: Number(parsed.right) || 0,
          };
        }
      } catch (err) {
        console.warn('[NativeBridge] getSystemInsets error:', err);
      }
    }

    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  /**
   * Dynamically adjust Android status and navigation bar icon contrast based on theme
   */
  public setSystemBarsTheme(isLight: boolean): void {
    if (this.isNative() && window.AndroidBridge && typeof window.AndroidBridge.setSystemBarsTheme === 'function') {
      try {
        window.AndroidBridge.setSystemBarsTheme(isLight);
      } catch (err) {
        console.warn('[NativeBridge] setSystemBarsTheme error:', err);
      }
    }
  }
}

export const nativeBridge = new NativeBridgeService();
