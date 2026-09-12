import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import {
  BarChart3,
  TrendingUp,
  CheckSquare,
  Timer,
  Flame,
  FolderKanban,
  Award,
  Calendar,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { refreshTrigger, settings, openQuickAdd } = useApp();

  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);
  const allPomodoros = useMemo(() => db.getPomodoroSessions(), [refreshTrigger]);
  const allHabits = useMemo(() => db.getHabits(), [refreshTrigger]);
  const allHabitLogs = useMemo(() => db.getHabitLogs(), [refreshTrigger]);
  const allProjects = useMemo(() => db.getProjects(), [refreshTrigger]);

  const completedTasks = useMemo(() => allTasks.filter((t) => t.status === 'completed'), [allTasks]);
  const totalFocusMinutes = useMemo(
    () => allPomodoros.filter((p) => p.mode === 'focus').reduce((acc, p) => acc + p.durationMinutes, 0),
    [allPomodoros]
  );

  const taskCompletionRate =
    allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  // Breakdown by priority
  const priorityStats = useMemo(() => {
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    allTasks.forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return counts;
  }, [allTasks]);

  // Breakdown of tasks completed over the last 7 days
  const last7DaysData = useMemo(() => {
    const days = [];
    const dayLabels = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const jsDay = d.getDay();
      const persianDayIdx = (jsDay + 1) % 7;

      const count = allTasks.filter(
        (t) => t.status === 'completed' && t.completedAt?.startsWith(iso)
      ).length;

      days.push({
        label: dayLabels[persianDayIdx],
        iso,
        count,
      });
    }
    return days;
  }, [allTasks]);

  const maxDailyTasks = Math.max(...last7DaysData.map((d) => d.count), 1);

  const hasData = allTasks.length > 0 || allPomodoros.length > 0 || allHabits.length > 0;

  return (
    <div id="reports-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <span>آمار و گزارش‌های تحلیلی بهره‌وری</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          محاسبه واقعی بازدهی، زمان تمرکز، نرخ انجام کارها و استمرار عادات
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="داده‌ای برای تحلیل وجود ندارد"
          description="با شروع ثبت وظایف، عادات و سشن‌های تمرکز، گزارش‌های تحلیلی و نمودارهای پیشرفت در این قسمت ساخته می‌شوند."
          actionText="ایجاد اولین وظیفه"
          onAction={() => openQuickAdd('task')}
        />
      ) : (
        <>
          {/* Top 4 Real Productivity Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>نرخ تکمیل وظایف</span>
                <CheckSquare className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
                {settings.persianDigits ? toPersianDigits(taskCompletionRate) : taskCompletionRate}%
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.persianDigits ? toPersianDigits(completedTasks.length) : completedTasks.length} از{' '}
                {settings.persianDigits ? toPersianDigits(allTasks.length) : allTasks.length} کار تکمیل شده
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>کل زمان تمرکز ثبت‌شده</span>
                <Timer className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
                {settings.persianDigits ? toPersianDigits(totalFocusMinutes) : totalFocusMinutes}
                <span className="text-sm font-sans font-normal text-slate-400 mr-1.5">دقیقه</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.persianDigits ? toPersianDigits(allPomodoros.length) : allPomodoros.length} سشن پومودورو
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>عادت‌های فعال</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
                {settings.persianDigits ? toPersianDigits(allHabits.length) : allHabits.length}
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.persianDigits ? toPersianDigits(allHabitLogs.filter((l) => l.completed).length) : allHabitLogs.filter((l) => l.completed).length} ثبت عملکرد
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>پروژه‌های در حال اجرا</span>
                <FolderKanban className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
                {settings.persianDigits ? toPersianDigits(allProjects.length) : allProjects.length}
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.persianDigits ? toPersianDigits(allProjects.filter((p) => p.status === 'completed').length) : allProjects.filter((p) => p.status === 'completed').length} پروژه نهایی شده
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Tasks Done in Last 7 Days (Bar Chart) */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>وظایف انجام‌شده در ۷ روز گذشته</span>
              </h3>

              <div className="h-48 flex items-end justify-between gap-2 pt-6">
                {last7DaysData.map((d, idx) => {
                  const heightPercent = maxDailyTasks > 0 ? (d.count / maxDailyTasks) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[11px] font-mono text-slate-400">
                        {settings.persianDigits ? toPersianDigits(d.count) : d.count}
                      </span>
                      <div className="w-full max-w-[36px] bg-slate-800 rounded-t-lg overflow-hidden h-32 flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(d.count > 0 ? 15 : 4, heightPercent)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Priority Distribution */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-100 text-sm">توزیع اولویت وظایف</h3>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'بحرانی (Urgent)', count: priorityStats.urgent, color: 'bg-rose-500', barColor: '#ef4444' },
                  { label: 'زیاد (High)', count: priorityStats.high, color: 'bg-amber-500', barColor: '#f59e0b' },
                  { label: 'متوسط (Medium)', count: priorityStats.medium, color: 'bg-blue-500', barColor: '#3b82f6' },
                  { label: 'کم (Low)', count: priorityStats.low, color: 'bg-emerald-500', barColor: '#10b981' },
                ].map((p, idx) => {
                  const pct = allTasks.length > 0 ? Math.round((p.count / allTasks.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                          <span>{p.label}</span>
                        </div>
                        <span className="font-mono text-slate-400">
                          {settings.persianDigits ? toPersianDigits(p.count) : p.count} ({settings.persianDigits ? toPersianDigits(pct) : pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ backgroundColor: p.barColor, width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
