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

  const [isCompactAddOpen, setIsCompactAddOpen] = React.useState(false);
  const [quickTitle, setQuickTitle] = React.useState('');
  const [quickTime, setQuickTime] = React.useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('morning');
  const [quickError, setQuickError] = React.useState('');

  const handleQuickAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      setQuickError('لطفاً عنوان عادت را وارد کنید.');
      return;
    }
    db.saveHabit({
      id: `habit_${Date.now()}`,
      title: quickTitle.trim(),
      color: '#8b5cf6',
      icon: 'Flame',
      timeOfDay: quickTime,
      targetDaysPerWeek: 7,
      targetDays: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
    });
    showToast('عادت جدید با موفقیت ذخیره شد.', 'success');
    setQuickTitle('');
    setQuickError('');
    setIsCompactAddOpen(false);
    refreshDb();
  };

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

  const handleToggleHabitForDate = (habit: Habit, dateIso: string) => {
    const isDone = allLogs.some(
      (l) => l.habitId === habit.id && l.date === dateIso && l.completed
    );
    if (isDone) {
      showConfirm({
        title: 'لغو تیک انجام شده',
        message: `آیا از لغو وضعیت انجام شده برای عادت «${habit.title}» مطمئن هستید؟`,
        confirmText: 'بله، لغو شود',
        cancelText: 'انصراف',
        isDanger: false,
        onConfirm: () => {
          db.toggleHabitLog(habit.id, dateIso);
          refreshDb();
        },
      });
    } else {
      db.toggleHabitLog(habit.id, dateIso);
      refreshDb();
    }
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
          onClick={() => setIsCompactAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>عادت جدید</span>
        </button>
      </div>

      {/* Compact Habit Creation Modal (Zero vertical scroll, screen-sized) */}
      {isCompactAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-100">ثبت سریع عادت روزانه</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCompactAddOpen(false);
                  setQuickError('');
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان عادت <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={quickTitle}
                  onChange={(e) => {
                    setQuickTitle(e.target.value);
                    if (quickError) setQuickError('');
                  }}
                  placeholder="مثلاً: ۲۰ دقیقه مطالعه / نوشیدن آب / ورزش..."
                  className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-100 bg-slate-800 focus:outline-none transition ${
                    quickError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-700 focus:border-purple-500'
                  }`}
                />
                {quickError && <p className="text-[11px] text-rose-400 mt-1 font-medium">{quickError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">زمان مناسب انجام در روز</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'morning', label: '🌅 صبحگاه' },
                    { id: 'afternoon', label: '☀️ ظهر / بعدازظهر' },
                    { id: 'evening', label: '🌙 عصر / شب' },
                    { id: 'anytime', label: '⚡ شناور در روز' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQuickTime(t.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                        quickTime === t.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCompactAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-950/50 cursor-pointer active:scale-98"
                >
                  ذخیره عادت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    onClick={() => handleToggleHabitForDate(habit, todayIso)}
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
                          onClick={() => handleToggleHabitForDate(habit, d.iso)}
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
