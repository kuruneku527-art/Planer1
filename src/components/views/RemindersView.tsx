import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Reminder } from '../../types';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import {
  Bell,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  Repeat,
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const allReminders = useMemo(() => db.getReminders(), [refreshTrigger]);

  const handleToggleReminder = (id: string) => {
    db.toggleReminder(id);
    refreshDb();
  };

  const handleDeleteReminder = (rem: Reminder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف یادآور',
      message: `آیا از حذف یادآور «${rem.title}» مطمئن هستید؟`,
      onConfirm: () => {
        db.deleteReminder(rem.id);
        showToast('یادآور حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  const recurrenceLabels: Record<string, string> = {
    none: 'یک‌باره',
    daily: 'روزانه',
    weekly: 'هفتگی',
    monthly: 'ماهانه',
  };

  return (
    <div id="reminders-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>یادآورها و هشدارها (Reminders)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تنظیم هشدارهای موعد مقرر، پرداخت‌ها، تماس‌ها و رویدادهای مهم
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickAdd('reminder')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>یادآور جدید</span>
        </button>
      </div>

      {allReminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="هنوز یادآوری تنظیم نشده است"
          description="برای قرارهای کاری، سررسید فاکتورها، تماس‌ها و امور مهم خود یادآور ثبت کنید."
          actionText="تنظیم اولین یادآور"
          onAction={() => openQuickAdd('reminder')}
        />
      ) : (
        <div className="space-y-3">
          {allReminders.map((rem) => (
            <div
              key={rem.id}
              onClick={() => handleToggleReminder(rem.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 group ${
                rem.isCompleted
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-purple-800/40'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  className="text-slate-400 hover:text-purple-400 transition flex-shrink-0 cursor-pointer"
                >
                  {rem.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="truncate">
                  <h3
                    className={`font-bold text-sm truncate ${
                      rem.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}
                  >
                    {rem.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>{formatToJalali(rem.date, 'date_only', settings.persianDigits)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-purple-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{settings.persianDigits ? toPersianDigits(rem.time) : rem.time}</span>
                    </div>
                    {rem.type !== 'none' && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-400">
                        <Repeat className="w-3 h-3" />
                        <span>{recurrenceLabels[rem.type]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge priority={rem.priority} size="sm" />
                <button
                  type="button"
                  onClick={(e) => handleDeleteReminder(rem, e)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 opacity-80 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
