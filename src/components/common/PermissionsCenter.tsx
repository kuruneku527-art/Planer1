import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlarmClock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  Battery,
  ExternalLink,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { systemPermissions, SystemPermissionsStatus } from '../../services/systemPermissions';
import { nativeBridge } from '../../services/nativeBridge';
import { useApp } from '../../context/AppContext';

export const PermissionsCenter: React.FC = () => {
  const { showToast } = useApp();
  const isNative = nativeBridge.isNative();
  const [status, setStatus] = useState<SystemPermissionsStatus>({
    notification: 'unsupported',
    alarmExact: 'unsupported',
    calendar: 'available',
    backgroundSync: 'unsupported',
    wakeLock: 'unsupported',
    batteryOptimization: { supported: false },
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  const fetchStatus = useCallback(async () => {
    const live = await systemPermissions.getLivePermissionsStatus();
    setStatus(live);
  }, []);

  useEffect(() => {
    fetchStatus();
    const unsub = systemPermissions.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, [fetchStatus]);

  const handleRequestNotification = async () => {
    setLoadingAction('notification');
    try {
      const res = await systemPermissions.requestNotificationPermission();
      await fetchStatus();
      if (res === 'granted') {
        showToast('دسترسی اعلان‌های سیستمی با موفقیت فعال شد.', 'success');
      } else if (res === 'denied') {
        showToast('دسترسی اعلان‌ها توسط کاربر یا تنظیمات مرورگر مسدود شده است.', 'warning');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestAlarm = async () => {
    setLoadingAction('alarm');
    try {
      await systemPermissions.requestAlarmCapability();
      await fetchStatus();
      showToast('قابلیت آلارم دقیق و خروجی صوتی سیستم تست و فعال شد.', 'success');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTestSystemNotification = async () => {
    setTestSent(true);
    const sent = await systemPermissions.showSystemNotification({
      title: 'تست موفقیت‌آمیز اعلان سیستمی پلنر 🔔',
      body: 'این اعلان واقعی از طرف سیستم‌عامل و Service Worker ارسال شده و در Lock Screen و Notification Tray نمایش داده می‌شود.',
      tag: 'test_system_notification',
      targetView: 'reminders',
    });
    if (sent) {
      showToast('اعلان سیستمی ارسال شد! بالای صفحه گوشی یا Notification Center را بررسی کنید.', 'success');
    } else {
      showToast('لطفاً ابتدا دسترسی اعلان را فعال کنید یا تنظیمات اعلان را بررسی نمایید.', 'error');
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTestRealAlarm = async () => {
    setLoadingAction('real_alarm');
    try {
      const now = Date.now();
      const testTime = now + 5000; // 5 seconds in future
      const success = await nativeBridge.scheduleAlarm({
        id: `test_alarm_${now}`,
        title: '⏰ تست آلارم واقعی پلنر',
        message: 'این یک تست واقعی آلارم پس‌زمینه با صدای هشدار و لرزش است.',
        timestamp: testTime,
      });

      if (success) {
        showToast('آلارم واقعی برای ۵ ثانیه دیگر تنظیم شد! صفحه را قفل کنید تا تست شود 🔔', 'success');
      } else {
        // Fallback test sound
        await systemPermissions.requestAlarmCapability();
        showToast('تست صدای آلارم اجرا شد.', 'info');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const isAlarmExactGranted = isNative ? nativeBridge.canScheduleExactAlarms() : (status.alarmExact === 'granted');

  return (
    <div id="permissions-center" className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-2">
              <span>دسترسی‌های سخت‌افزاری و سیستم‌عامل</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isNative
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
              }`}>
                {isNative ? 'Android Native Live' : 'Web / PWA Live'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              بررسی و مدیریت واقعی مجوزهای اعلان، آلارم دقیق و پس‌زمینه در سیستم‌عامل
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          className="self-start sm:self-auto text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
        >
          <span>بررسی مجدد وضعیت</span>
        </button>
      </div>

      {/* Grid of Real System Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Notification Card (POST_NOTIFICATIONS) */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-slate-200 text-xs">اعلان‌ها (Notification)</span>
              </div>
              {status.notification === 'granted' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مجاز</span>
                </span>
              ) : status.notification === 'denied' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/50">
                  <XCircle className="w-3 h-3" />
                  <span>مسدود در تنظیمات</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                  <AlertTriangle className="w-3 h-3" />
                  <span>نیاز به تأیید</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ارسال پیام یادآورها به نوار اعلان و قفل صفحه (POST_NOTIFICATIONS)
            </p>
          </div>

          <div className="space-y-1.5">
            {status.notification === 'granted' ? (
              <button
                type="button"
                onClick={handleTestSystemNotification}
                disabled={testSent}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{testSent ? 'در حال ارسال...' : 'تست ارسال اعلان به گوشی'}</span>
              </button>
            ) : status.notification === 'denied' ? (
              <button
                type="button"
                onClick={() => {
                  if (isNative) {
                    nativeBridge.openNotificationSettings();
                  } else {
                    handleRequestNotification();
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>باز کردن تنظیمات اعلان در اندروید</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotification}
                disabled={loadingAction === 'notification'}
                className="w-full py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
              >
                {loadingAction === 'notification' ? 'در حال درخواست...' : 'درخواست دسترسی اعلان'}
              </button>
            )}
          </div>
        </div>

        {/* 2. Exact Alarm & Reminders Card (SCHEDULE_EXACT_ALARM) */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlarmClock className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200 text-xs">آلارم دقیق (Exact Alarm)</span>
              </div>
              {isAlarmExactGranted ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مجاز</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                  <AlertTriangle className="w-3 h-3" />
                  <span>نیاز به تنظیمات</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اجرای آلارم رأس دقیقه تعیین‌شده از طریق Android AlarmManager
            </p>
          </div>

          <div className="space-y-1.5">
            {isAlarmExactGranted ? (
              <button
                type="button"
                onClick={handleTestRealAlarm}
                disabled={loadingAction === 'real_alarm'}
                className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{loadingAction === 'real_alarm' ? 'تنظیم شد...' : 'تست آلارم ۵ ثانیه‌ای'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isNative) {
                    nativeBridge.openExactAlarmSettings();
                  } else {
                    handleRequestAlarm();
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-bold transition cursor-pointer"
              >
                <span>تنظیمات Alarms & Reminders</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Battery Optimization (Unrestricted Execution) */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 text-xs">بهینه‌سازی باتری</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/50">
                <span>پس‌زمینه</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              برای جلوگیری از خاموش شدن آلارم‌ها هنگام قفل طولانی، حالت باتری را روی Unrestricted بگذارید
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                if (isNative) {
                  nativeBridge.openBatteryOptimizationSettings();
                } else {
                  showToast('در تنظیمات گوشی بهینه سازی باتری پلنر را غیرفعال کنید.', 'info');
                }
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>تنظیمات باتری برنامه</span>
            </button>
          </div>
        </div>
      </div>

      {/* Android Native Integration Section */}
      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-xs text-indigo-200">پل ارتباطی اختصاصی سیستم‌عامل (Android Native Bridge)</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            isNative
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {isNative ? 'Android Native Ready' : 'Web / PWA Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={async () => {
              const now = new Date();
              const hour = (now.getHours() + 1) % 24;
              const res = nativeBridge.setClockAlarm({
                hour,
                minutes: 0,
                message: 'یادآور هوشمند پلنر',
              });
              if (res.success) {
                showToast(res.message || 'هشدار در برنامه ساعت اندروید تنظیم شد.', 'success');
              } else {
                showToast(res.message || 'امکان دسترسی به برنامه ساعت فراهم نشد.', 'info');
              }
            }}
            className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <AlarmClock className="w-3.5 h-3.5 text-indigo-400" />
            <span>تنظیم آلارم در برنامه ساعت گوشی (Clock App)</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const res = await nativeBridge.pickAudioFile();
              if (res && res.uri) {
                showToast(`فایل صوتی «${res.name || 'انتخاب‌شده'}» با موفقیت ثبت شد.`, 'success');
              } else {
                showToast('انتخاب فایل صوتی لغو شد یا انجام نشد.', 'info');
              }
            }}
            className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            <span>انتخاب صدای زنگ از حافظه گوشی (SAF)</span>
          </button>
        </div>
      </div>

      {/* Battery Optimization & Background Execution Notice */}
      <div className="p-3 rounded-xl bg-purple-950/25 border border-purple-800/30 flex items-start gap-2.5 text-[11px] text-slate-300">
        <Battery className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-purple-200">بهینه‌سازی باتری در اندروید: </span>
          برای اجرای دقیق آلارم‌ها هنگام خاموش بودن نمایشگر، در تنظیمات گوشی حالت باتری پلنر را روی بدون محدودیت (Unrestricted) قرار دهید.
          {status.batteryOptimization.supported && (
            <span className="block text-[10px] text-purple-400 mt-0.5">
              باتری فعلی: {status.batteryOptimization.batteryLevel}% {status.batteryOptimization.isCharging ? '(در حال شارژ)' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
