import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { notificationService } from '../../services/notificationService';
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
  MoreVertical,
  CheckCheck,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const NotificationCenterModal: React.FC = () => {
  const {
    notificationCenterOpen,
    setNotificationCenterOpen,
    setActiveView,
    refreshTrigger,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'task' | 'habit' | 'calendar'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    notificationService.getNotifications()
  );

  // Keep state synchronized
  React.useEffect(() => {
    const update = () => {
      setNotifications(notificationService.getNotifications());
    };
    update();
    const unsub = notificationService.subscribe(update);
    window.addEventListener('planner_notifications_updated', update);
    return () => {
      unsub();
      window.removeEventListener('planner_notifications_updated', update);
    };
  }, [refreshTrigger, notificationCenterOpen]);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleDocClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'unread') return !item.read;
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
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
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
    const item = notifications.find((n) => n.id === id);
    if (!item) return;
    if (item.read) {
      // Mark unread
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: false } : n));
      try {
        localStorage.setItem('planner_notifications_v1', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('planner_notifications_updated'));
      } catch {}
      setNotifications(updated);
    } else {
      notificationService.markAsRead(id);
      setNotifications(notificationService.getNotifications());
    }
    setOpenMenuId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
    setNotifications(notificationService.getNotifications());
    setOpenMenuId(null);
  };

  const getCategoryIcon = (type: NotificationCategory) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'habit':
        return <Repeat className="w-4 h-4 text-violet-400" />;
      case 'goal':
        return <Target className="w-4 h-4 text-amber-400" />;
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
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'habit':
        return 'bg-violet-500/10 border-violet-500/30';
      case 'goal':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'calendar':
        return 'bg-sky-500/10 border-sky-500/30';
      case 'daily_planner':
        return 'bg-indigo-500/10 border-indigo-500/30';
      default:
        return 'bg-purple-500/10 border-purple-500/30';
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
        return 'تقویم';
      case 'daily_planner':
        return 'برنامه روزانه';
      default:
        return 'یادآور';
    }
  };

  return (
    <div
      id="notification-center-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"
      dir="rtl"
    >
      <div
        id="notification-center-modal"
        className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100">مرکز اعلان‌ها</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    {settings.persianDigits ? toPersianDigits(unreadCount) : unreadCount} جدید
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">یادآوری‌ها، وظایف و رویدادهای موعددار</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                title="علامت‌گذاری همه به عنوان خوانده شده"
              >
                <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline text-[11px]">خواندن همه</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="پاک‌سازی تمام اعلان‌ها"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setNotificationCenterOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition cursor-pointer"
              title="بستن"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-slate-900/50">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              همه ({settings.persianDigits ? toPersianDigits(notifications.length) : notifications.length})
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'unread'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                خوانده‌نشده ({settings.persianDigits ? toPersianDigits(unreadCount) : unreadCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'task'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              وظایف
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('habit')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'habit'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              عادت‌ها
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-sky-600 text-white font-bold'
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
            <div className="text-center py-14 px-4 text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-300">اعلانی در این بخش وجود ندارد</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                هنگامی که موعد یک وظیفه، یادآور یا رویداد برسد، اعلان آن در این بخش ثبت می‌شود.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const formattedDate =
                item.dateStr || formatToJalali(item.timestamp, 'short', settings.persianDigits);
              const formattedTime = item.timeStr || item.timestamp.split('T')[1]?.substring(0, 5) || '';

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-slate-800/30 border-slate-800/70 hover:bg-slate-800/50 opacity-80'
                      : 'bg-slate-800/80 border-purple-500/40 hover:border-purple-400 shadow-sm ring-1 ring-purple-500/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getCategoryBg(
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
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                            {getCategoryLabel(item.type)}
                          </span>
                        </div>

                        {/* Unread dot or Actions Trigger */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-500/30 animate-pulse" />
                          )}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === item.id ? null : item.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition cursor-pointer"
                              title="عملیات"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Action Menu dropdown */}
                            {openMenuId === item.id && (
                              <div
                                className="absolute left-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleRead(item.id, e)}
                                  className="w-full px-3 py-2 text-right text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-purple-400" />
                                  <span>{item.read ? 'علامت‌گذاری خوانده نشده' : 'خوانده شد'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(item.id, e)}
                                  className="w-full px-3 py-2 text-right text-xs font-medium text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف اعلان</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message Body */}
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      {/* Time & Date */}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {formattedDate} {formattedTime ? `— ${settings.persianDigits ? toPersianDigits(formattedTime) : formattedTime}` : ''}
                          </span>
                        </span>
                        {!item.read && (
                          <span className="text-purple-400 font-bold mr-auto">
                            خوانده نشده
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
