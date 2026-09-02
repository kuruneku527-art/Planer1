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
import { useApp } from '../../context/AppContext';

export const PermissionsCenter: React.FC = () => {
  const { showToast } = useApp();
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
      showToast('لطفاً ابتدا دسترسی اعلان را فعال کنید.', 'error');
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTestCalendarExport = () => {
    systemPermissions.exportToDeviceCalendar({
      title: 'جلسه برنامه‌ریزی هفتگی با پلنر',
      description: 'مرور اهداف، پروژه‌ها و عادت‌های هفتگی ثبت‌شده در اپلیکیشن هوشمند پلنر',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      location: 'دفتر / آنلاین',
    });
    showToast('فایل استاندارد تقویم (.ics) ایجاد شد و توسط برنامه تقویم گوشی شما باز می‌شود.', 'success');
  };

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
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                Live Status
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              اتصال زنده به بخش اعلان، ساعت و تقویم گوشی شما
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          className="self-start sm:self-auto text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
        >
          بررسی مجدد
        </button>
      </div>

      {/* Grid of 3 Main System Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Notification Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-slate-200 text-xs">🔔 اعلان‌ها</span>
              </div>
              {status.notification === 'granted' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>فعال</span>
                </span>
              ) : status.notification === 'denied' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/50">
                  <XCircle className="w-3 h-3" />
                  <span>مسدود</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                  <AlertTriangle className="w-3 h-3" />
                  <span>نیاز به تأیید</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              نمایش اعلان در Lock Screen و نوار نوتیفیکیشن سر موعد
            </p>
          </div>

          <div>
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
                onClick={handleRequestNotification}
                className="w-full py-1.5 px-2.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition cursor-pointer"
              >
                تلاش مجدد برای دسترسی
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotification}
                disabled={loadingAction === 'notification'}
                className="w-full py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
              >
                {loadingAction === 'notification' ? 'در حال بررسی...' : 'فعال‌سازی اعلان'}
              </button>
            )}
          </div>
        </div>

        {/* 2. Alarm & Exact Timing Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlarmClock className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200 text-xs">⏰ آلارم و زمان‌بندی دقیق</span>
              </div>
              {status.alarmExact === 'granted' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>فعال</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                  <AlertTriangle className="w-3 h-3" />
                  <span>آماده</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              صدای اختصاصی آلارم، لرزش سخت‌افزاری و Wake Lock گوشی
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleRequestAlarm}
              disabled={loadingAction === 'alarm'}
              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>تست آلارم و لرزش</span>
            </button>
          </div>
        </div>

        {/* 3. Calendar Sync Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 text-xs">📅 تقویم گوشی</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3" />
                <span>سازگار</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              هماهنگی رویدادها با تقویم پیش‌فرض اندروید و گوگل
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleTestCalendarExport}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>هماهنگی با تقویم دستگاه</span>
            </button>
          </div>
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
