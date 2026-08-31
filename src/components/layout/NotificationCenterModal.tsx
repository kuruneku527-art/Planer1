import React from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import { formatToJalali } from '../../utils/jalali';
import { Bell, Check, Trash2, Clock, AlertCircle } from 'lucide-react';

export const NotificationCenterModal: React.FC = () => {
  const {
    notificationCenterOpen,
    setNotificationCenterOpen,
    setActiveView,
    refreshTrigger,
    refreshDb,
    settings,
  } = useApp();

  const notifications = React.useMemo(() => {
    return db.getNotifications();
  }, [refreshTrigger, notificationCenterOpen]);

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead();
    refreshDb();
  };

  const handleClearAll = () => {
    db.clearAllNotifications();
    refreshDb();
  };

  const handleClickNotification = (n: any) => {
    db.markNotificationAsRead(n.id);
    refreshDb();
    if (n.targetView) {
      setActiveView(n.targetView);
      setNotificationCenterOpen(false);
    }
  };

  return (
    <Modal
      isOpen={notificationCenterOpen}
      onClose={() => setNotificationCenterOpen(false)}
      title="مرکز اعلان‌ها"
      subtitle="هشدارهای سیستم، یادآورها و اعلان‌های ثبت شده"
      maxWidth="md"
      icon={<Bell className="text-purple-400" />}
    >
      <div className="space-y-4" dir="rtl">
        {notifications.length > 0 && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>علامت‌گذاری همه به عنوان خوانده شده</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌سازی همه</span>
            </button>
          </div>
        )}

        <div className="max-h-[350px] overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-700 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-400">اعلانی وجود ندارد</p>
              <p className="text-xs text-slate-500 mt-1">تمام اعلان‌های شما در این بخش نمایش داده می‌شوند.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  n.read
                    ? 'bg-slate-800/30 border-slate-800/60 opacity-80'
                    : 'bg-slate-800/80 border-purple-800/50 shadow-sm'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === 'reminder'
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      : n.type === 'deadline'
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      : 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                  }`}
                >
                  {n.type === 'deadline' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {formatToJalali(n.timestamp, 'short', settings.persianDigits)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
