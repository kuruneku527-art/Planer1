import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlarmClock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { systemPermissions, SystemPermissionsStatus } from '../../services/systemPermissions';
import { useApp } from '../../context/AppContext';

export const PermissionSetupModal: React.FC = () => {
  const { showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SystemPermissionsStatus>({
    notification: 'unsupported',
    alarmExact: 'unsupported',
    calendar: 'available',
    backgroundSync: 'unsupported',
    wakeLock: 'unsupported',
    batteryOptimization: { supported: false },
  });
  const [loading, setLoading] = useState(false);
  const [showSettingsHelp, setShowSettingsHelp] = useState(false);

  const checkLiveStatus = useCallback(async () => {
    const live = await systemPermissions.getLivePermissionsStatus();
    setStatus(live);
    return live;
  }, []);

  useEffect(() => {
    // Check initial OS state
    checkLiveStatus().then((live) => {
      // If notification permission has not been granted, display setup modal
      const hasDismissed = sessionStorage.getItem('planner_perm_modal_dismissed');
      if (live.notification !== 'granted' && !hasDismissed) {
        setIsOpen(true);
      }
    });

    // Re-check automatically on resume or window focus
    const unsub = systemPermissions.subscribe((newStatus) => {
      setStatus(newStatus);
      if (newStatus.notification === 'granted') {
        setShowSettingsHelp(false);
      }
    });

    return () => unsub();
  }, [checkLiveStatus]);

  if (!isOpen) return null;

  const handleRequestAllPermissions = async () => {
    setLoading(true);
    try {
      // 1. Request real browser/OS notification permission
      const notifRes = await systemPermissions.requestNotificationPermission();

      // 2. Request alarm / audio capability
      await systemPermissions.requestAlarmCapability();

      // 3. Re-read real live state
      const updated = await checkLiveStatus();

      if (notifRes === 'granted') {
        showToast('دسترسی اعلان‌ها با موفقیت فعال شد.', 'success');
      } else if (notifRes === 'denied') {
        setShowSettingsHelp(true);
        showToast('دسترسی اعلان‌ها در مرورگر مسدود است. لطفاً از راهنمای تنظیمات استفاده کنید.', 'warning');
      }
    } catch (err) {
      console.error('[PermissionSetupModal] Error requesting permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualNotification = async () => {
    setLoading(true);
    try {
      const res = await systemPermissions.requestNotificationPermission();
      await checkLiveStatus();
      if (res === 'granted') {
        showToast('دسترسی اعلان‌ها با موفقیت فعال شد.', 'success');
      } else if (res === 'denied') {
        setShowSettingsHelp(true);
        showToast('دسترسی اعلان‌ها مسدود شده است. راهنمای تنظیمات مرورگر را مطالعه کنید.', 'warning');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualAlarm = async () => {
    setLoading(true);
    try {
      await systemPermissions.requestAlarmCapability();
      await checkLiveStatus();
      showToast('قابلیت زمان‌بندی دقیق و آلارم صوتی فعال شد.', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualCalendar = async () => {
    showToast('امکان همگام‌سازی و خروجی تقویم در دسترس است.', 'success');
  };

  const handleDismiss = () => {
    sessionStorage.setItem('planner_perm_modal_dismissed', 'true');
    setIsOpen(false);
  };

  const isNotifGranted = status.notification === 'granted';
  const isNotifDenied = status.notification === 'denied';

  return (
    <div
      id="permission-setup-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"
      dir="rtl"
    >
      <div
        id="permission-setup-modal"
        className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                  فعال‌سازی دسترسی‌های پلنر
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  برای ارسال دقیق یادآورها سر زمان تعیین‌شده
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition text-sm cursor-pointer"
              title="بستن"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Permission Cards List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[65vh] overflow-y-auto">
          {/* Card 1: Notification */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isNotifGranted
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : isNotifDenied
                ? 'bg-rose-950/20 border-rose-800/40'
                : 'bg-slate-800/50 border-slate-700/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isNotifGranted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isNotifDenied
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">اعلان‌ها (Notification)</h3>
                    {isNotifGranted ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5" />
                        فعال
                      </span>
                    ) : isNotifDenied ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        غیرفعال در تنظیمات
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    برای نمایش یادآورها و آلارم وظایف در بالای صفحه گوشی
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {isNotifGranted ? (
                <div className="text-emerald-400 shrink-0 p-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : isNotifDenied ? (
                <button
                  type="button"
                  onClick={() => setShowSettingsHelp(!showSettingsHelp)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 border border-rose-700/60"
                >
                  <Settings className="w-3 h-3" />
                  <span>تنظیمات گوشی</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleIndividualNotification}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  فعال‌سازی
                </button>
              )}
            </div>

            {/* In-place Settings Guidance if Denied */}
            {showSettingsHelp && isNotifDenied && (
              <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>راهنمای فعال‌سازی از تنظیمات:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-300">
                  روی علامت <strong>قفل</strong> یا تنظیمات در کنار آدرس سایت بزنید &gt; <strong>Permissions</strong> &gt; <strong>Notifications</strong> را روی <strong>Allow</strong> قرار دهید، سپس به برنامه برگردید.
                </p>
                <button
                  type="button"
                  onClick={checkLiveStatus}
                  className="mt-1 text-[11px] text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                >
                  بررسی مجدد وضعیت دسترسی
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Alarm */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              status.alarmExact === 'granted'
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-slate-800/50 border-slate-700/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    status.alarmExact === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-purple-400'
                  }`}
                >
                  <AlarmClock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">آلارم و یادآوری (Alarm)</h3>
                    {status.alarmExact === 'granted' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5" />
                        فعال
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    برای اجرای یادآوری در زمان دقیق و اعلام صوتی به موقع
                  </p>
                </div>
              </div>

              {status.alarmExact === 'granted' ? (
                <div className="text-emerald-400 shrink-0 p-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleIndividualAlarm}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  فعال‌سازی
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Calendar */}
          <div className="p-3.5 rounded-xl border bg-emerald-950/30 border-emerald-500/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">تقویم (Calendar)</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                      <Check className="w-2.5 h-2.5" />
                      فعال
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    برای مدیریت رویدادها و هماهنگی با تقویم دستگاه
                  </p>
                </div>
              </div>

              <div className="text-emerald-400 shrink-0 p-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 pt-3 border-t border-slate-800/80 space-y-2.5">
          {isNotifGranted ? (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>ورود به برنامه</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRequestAllPermissions}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'در حال بررسی...' : 'درخواست و فعال‌سازی دسترسی‌ها'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer text-center"
              >
                بعداً یادآوری کن
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
