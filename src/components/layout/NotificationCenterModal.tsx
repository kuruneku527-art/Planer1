import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { notificationService } from '../../services/notificationService';
import { systemPermissions } from '../../services/systemPermissions';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { NotificationItem, NotificationCategory } from '../../types';
import {
  Bell,
  Check,
  CheckSquare,
  Repeat,
  Target,
  Calendar,
  Clock,
  Trash2,
  CheckCheck,
  Sparkles,
  ArrowLeft,
  X,
  Send,
  Flame,
} from 'lucide-react';

export const NotificationCenterModal: React.FC = () => {
  const {
    notificationCenterOpen,
    setNotificationCenterOpen,
    setActiveView,
    refreshTrigger,
    settings,
    showToast,
    showConfirm,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'reminder' | 'task' | 'habit' | 'calendar'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    notificationService.getNotifications()
  );
  const [isTesting, setIsTesting] = useState(false);

  // Keep state synchronized across database updates
  useEffect(() => {
    const update = () => {
      setNotifications(notificationService.getNotifications());
    };
    update();
    const unsub = notificationService.subscribe(update);
    window.addEventListener('planner_notifications_updated', update);
    window.addEventListener('planner_db_updated', update);
    return () => {
      unsub();
      window.removeEventListener('planner_notifications_updated', update);
      window.removeEventListener('planner_db_updated', update);
    };
  }, [refreshTrigger, notificationCenterOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'unread') return !item.read;
      if (activeTab === 'reminder') return item.type === 'reminder';
      if (activeTab === 'task') return item.type === 'task';
      if (activeTab === 'habit') return item.type === 'habit';
      if (activeTab === 'calendar') return item.type === 'calendar';
      return true;
    });
  }, [notifications, activeTab]);

  if (!notificationCenterOpen) return null;

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    showToast('تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند.', 'info');
  };

  const handleClearAll = () => {
    showConfirm({
      title: 'پاک‌سازی تاریخچه اعلان‌ها',
      message: 'آیا از پاک‌سازی تمام اعلان‌های ثبت شده مطمئن هستید؟ این عملیات قابل بازگشت نیست.',
      confirmText: 'بله، پاک‌سازی شود',
      cancelText: 'انصراف',
      isDanger: true,
      onConfirm: () => {
        notificationService.clearAll();
        setNotifications([]);
        showToast('تمام اعلان‌ها با موفقیت پاک شدند.', 'info');
      },
    });
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) {
      notificationService.markAsRead(n.id);
      setNotifications(notificationService.getNotifications());
    }
    if (n.targetView) {
      setActiveView(n.targetView as any);
      setNotificationCenterOpen(false);
    }
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.toggleRead(id);
    setNotifications(notificationService.getNotifications());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
    setNotifications(notificationService.getNotifications());
  };

  const handleSendTestNotification = async () => {
    setIsTesting(true);
    try {
      const live = await systemPermissions.getLivePermissionsStatus();
      if (live.notification !== 'granted') {
        const reqRes = await systemPermissions.requestNotificationPermission();
        if (reqRes !== 'granted') {
          showToast('دسترسی اعلان‌ها فعال نیست. لطفاً دسترسی را مجاز کنید.', 'warning');
          setIsTesting(false);
          return;
        }
      }

      await notificationService.deliverAlarmNotification({
        id: `test_${Date.now()}`,
        title: 'تست موفق اعلان سیستمی پلنر 🔔',
        message: 'سیستم اعلان‌ها و ثبت در مرکز یادآوری‌ها با موفقیت و به موقع کار می‌کند.',
        type: 'reminder',
        targetView: 'reminders',
      });

      showToast('اعلان تستی با موفقیت ارسال شد!', 'success');
    } catch (err) {
      console.warn('[NotificationCenter] Test notification error:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const getCategoryIcon = (type: NotificationCategory) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'habit':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'goal':
        return <Target className="w-4 h-4 text-rose-400" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case 'daily_planner':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  const getCategoryBg = (type: NotificationCategory) => {
    switch (type) {
      case 'task':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'habit':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'goal':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'calendar':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      case 'daily_planner':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      default:
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
    }
  };

  const getCategoryLabel = (type: NotificationCategory) => {
    switch (type) {
      case 'task':
        return 'وظیفه';
      case 'habit':
        return 'عادت';
      case 'goal':
        return 'هدف';
      case 'calendar':
        return 'رویداد تقویم';
      case 'daily_planner':
        return 'برنامه روزانه';
      default:
        return 'یادآور';
    }
  };

  return (
    <div
      id="notification-center-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md"
      dir="rtl"
    >
      <div
        id="notification-center-modal"
        className="w-full sm:max-w-xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[82vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
        style={{
          paddingBottom: 'var(--safe-bottom, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">مرکز اعلان‌ها و یادآورها</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    {settings.persianDigits ? toPersianDigits(unreadCount) : unreadCount} جدید
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">تاریخچه کامل هشدارهای وظایف، عادات و رویدادها</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Test Notification Trigger */}
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={isTesting}
              className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800/50 text-purple-300 text-xs font-medium transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
              title="ارسال اعلان آزمایشی برای بررسی دریافت"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">اعلان آزمایشی</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-medium transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="علامت‌گذاری همه به عنوان خوانده شده"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline text-[11px]">خواندن همه</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="پاک‌سازی تمام اعلان‌ها"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setNotificationCenterOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-slate-900/60">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              همه ({settings.persianDigits ? toPersianDigits(notifications.length) : notifications.length})
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'unread'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                خوانده‌نشده ({settings.persianDigits ? toPersianDigits(unreadCount) : unreadCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('reminder')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'reminder'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              یادآورها
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'task'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              وظایف
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('habit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'habit'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              عادت‌ها
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              تقویم
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                <Bell className="w-7 h-7 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-200">اعلانی در این بخش وجود ندارد</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                هنگامی که موعد یک وظیفه، یادآور یا رویداد برسد، هشدار آن در این بخش ثبت می‌شود.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const formattedDate =
                item.dateStr || formatToJalali(item.timestamp, 'short', settings.persianDigits);
              const formattedTime =
                item.timeStr || item.timestamp.split('T')[1]?.substring(0, 5) || '';

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800/50'
                      : 'bg-slate-800/85 border-purple-500/40 hover:border-purple-400 shadow-md shadow-purple-950/20 ring-1 ring-purple-500/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-inner ${getCategoryBg(
                        item.type
                      )}`}
                    >
                      {getCategoryIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              item.read ? 'text-slate-300' : 'text-slate-100'
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0 font-medium">
                            {getCategoryLabel(item.type)}
                          </span>
                        </div>

                        {/* Direct Card Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!item.read && (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-purple-500/20 animate-pulse ml-1"
                              title="خوانده‌نشده"
                            />
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(item.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-700/60 transition cursor-pointer"
                            title={item.read ? 'علامت‌گذاری خوانده نشده' : 'خوانده شد'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition cursor-pointer"
                            title="حذف اعلان"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Message Body */}
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      {/* Time & Date & Navigation Hint */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/30 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {formattedDate}{' '}
                            {formattedTime
                              ? `— ${settings.persianDigits ? toPersianDigits(formattedTime) : formattedTime}`
                              : ''}
                          </span>
                        </span>

                        {item.targetView && (
                          <span className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-0.5">
                            <span>مشاهده جزئیات</span>
                            <ArrowLeft className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
