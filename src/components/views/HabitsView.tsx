import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Habit } from '../../types';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Award,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const HabitsView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const allHabits = useMemo(() => db.getHabits(), [refreshTrigger]);
  const allLogs = useMemo(() => db.getHabitLogs(), [refreshTrigger]);

  const todayIso = toGregorianIsoDate();

  // Generate last 7 days ISO list
  const last7Days = useMemo(() => {
    const days = [];
    const dayLabels = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const jsDay = d.getDay();
      const persianDayIdx = (jsDay + 1) % 7;
      days.push({
        iso,
        label: dayLabels[persianDayIdx],
        isToday: iso === todayIso,
      });
    }
    return days;
  }, [todayIso]);

  const handleToggleHabitForDate = (habitId: string, dateIso: string) => {
    db.toggleHabitLog(habitId, dateIso);
    refreshDb();
  };

  const handleDeleteHabit = (habit: Habit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف عادت',
      message: `آیا از حذف عادت «${habit.title}» مطمئن هستید؟ تمام سوابق ثبت شده برای این عادت پاک خواهند شد.`,
      onConfirm: () => {
        db.deleteHabit(habit.id);
        showToast('عادت با موفقیت حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  return (
    <div id="habits-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400" />
            <span>عادت‌ها و استمرار روزانه (Habit Tracker)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            پیگیری منظم عادات سازنده، ثبت زنجیره استمرار و توسعه فردی
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickAdd('habit')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>عادت جدید</span>
        </button>
      </div>

      {allHabits.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="هنوز عادتی اضافه نکرده‌اید"
          description="عادت‌های روزانه مانند مطالعه، ورزش، نوشیدن آب یا یادگیری مهارت جدید را ثبت کنید."
          actionText="ایجاد اولین عادت"
          onAction={() => openQuickAdd('habit')}
        />
      ) : (
        <div className="space-y-3">
          {allHabits.map((habit) => {
            const streak = db.getHabitStreak(habit.id);
            const isDoneToday = allLogs.some(
              (l) => l.habitId === habit.id && l.date === todayIso && l.completed
            );

            const timeLabels: Record<string, string> = {
              morning: 'صبحگاه',
              afternoon: 'ظهر / بعدازظهر',
              evening: 'عصر / شب',
              anytime: 'شناور در روز',
            };

            return (
              <div
                key={habit.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm"
              >
                {/* Habit Info & Today Check */}
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleHabitForDate(habit.id, todayIso)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                      isDoneToday
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-purple-500 hover:text-purple-400'
                    }`}
                  >
                    {isDoneToday ? (
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-base truncate">{habit.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {timeLabels[habit.timeOfDay]}
                      </span>
                    </div>
                    {habit.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{habit.description}</p>
                    )}
                  </div>
                </div>

                {/* Last 7 Days Heatmap & Streak Counter */}
                <div className="flex items-center justify-between md:justify-end gap-6 flex-shrink-0">
                  {/* 7 Days Dots */}
                  <div className="flex items-center gap-1.5">
                    {last7Days.map((d) => {
                      const done = allLogs.some(
                        (l) => l.habitId === habit.id && l.date === d.iso && l.completed
                      );
                      return (
                        <div
                          key={d.iso}
                          onClick={() => handleToggleHabitForDate(habit.id, d.iso)}
                          className={`flex flex-col items-center gap-1 cursor-pointer group/dot`}
                          title={`${d.iso} - ${done ? 'انجام شده' : 'انجام نشده'}`}
                        >
                          <span className="text-[10px] text-slate-500">{d.label}</span>
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold transition ${
                              done
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : d.isToday
                                ? 'bg-slate-800 border border-purple-500/50 text-slate-400'
                                : 'bg-slate-800/40 border border-slate-800 text-slate-600'
                            }`}
                          >
                            {done ? '✓' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    <span className="text-xs font-bold font-mono">
                      {settings.persianDigits ? toPersianDigits(streak) : streak}
                    </span>
                    <span className="text-[10px] font-sans">روز استمرار</span>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHabit(habit, e)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 opacity-80 group-hover:opacity-100 transition cursor-pointer"
                    title="حذف عادت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
