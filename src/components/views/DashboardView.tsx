import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Timer,
  Flame,
  Plus,
  FolderKanban,
  Target,
  FileText,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { openQuickAdd, setActiveView, refreshTrigger, settings } = useApp();

  const todayIso = toGregorianIsoDate();
  const todayJalali = formatToJalali(new Date(), 'full', settings.persianDigits);

  // Real Database Queries for Today
  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);
  const allEvents = useMemo(() => db.getEvents(), [refreshTrigger]);
  const allHabits = useMemo(() => db.getHabits(), [refreshTrigger]);
  const allHabitLogs = useMemo(() => db.getHabitLogs(), [refreshTrigger]);
  const allPomodoro = useMemo(() => db.getPomodoroSessions(), [refreshTrigger]);

  // Today's specific data
  const todayTasks = useMemo(() => {
    return allTasks.filter((t) => !t.dueDate || t.dueDate === todayIso);
  }, [allTasks, todayIso]);

  const completedTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status === 'completed');
  }, [todayTasks]);

  const todayEvents = useMemo(() => {
    return allEvents.filter((e) => e.startDate === todayIso);
  }, [allEvents, todayIso]);

  const todayPomodoros = useMemo(() => {
    return allPomodoro.filter((p) => p.completedAt.startsWith(todayIso) && p.mode === 'focus');
  }, [allPomodoro, todayIso]);

  const todayFocusMinutes = useMemo(() => {
    return todayPomodoros.reduce((acc, p) => acc + p.durationMinutes, 0);
  }, [todayPomodoros]);

  const todayHabitsDoneCount = useMemo(() => {
    return allHabitLogs.filter((l) => l.date === todayIso && l.completed).length;
  }, [allHabitLogs, todayIso]);

  const focusHours = Math.floor(todayFocusMinutes / 60);
  const focusRemMinutes = todayFocusMinutes % 60;
  const focusTimeDisplay =
    focusHours > 0
      ? `${focusHours}:${String(focusRemMinutes).padStart(2, '0')}`
      : `${focusRemMinutes} دقیقه`;

  return (
    <div id="dashboard-view" className="space-y-4 sm:space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Welcome Banner */}
      <div id="dashboard-welcome-banner" className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/40 border border-purple-800/30 p-3.5 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 sm:gap-4">
          <div>
            <div id="dashboard-welcome-date-badge" className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-900/60 text-purple-300 text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2 border border-purple-700/40">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{todayJalali}</span>
            </div>
            <h2 id="dashboard-welcome-title" className="text-base sm:text-2xl font-black text-slate-100">
              {settings.userName ? `سلام ${settings.userName}، روزت بخیر!` : 'سلام، به پلنر خوش آمدید!'}
            </h2>
            <p id="dashboard-welcome-desc" className="hidden sm:block text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              مرکز کنترل روزانه برای مدیریت دقیق وظایف، برنامه‌ها، جلسات و عادت‌های سازنده شما.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pt-0.5 sm:pt-0">
            <button
              id="dashboard-primary-add-btn"
              type="button"
              onClick={() => openQuickAdd('task')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium transition shadow-md shadow-purple-950/50 cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>وظیفه جدید</span>
            </button>
            <button
              id="dashboard-secondary-focus-btn"
              type="button"
              onClick={() => setActiveView('pomodoro')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span>شروع تمرکز</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div id="dashboard-welcome-glow" className="absolute top-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top 4 Summary Metric Cards (Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Metric 1: Tasks */}
        <div
          onClick={() => setActiveView('tasks')}
          className="p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-800/50 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold">وظایف امروز</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(completedTodayTasks.length) : completedTodayTasks.length}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">
              از {settings.persianDigits ? toPersianDigits(todayTasks.length) : todayTasks.length}
            </span>
          </div>
          <div className="mt-2 sm:mt-2.5 w-full bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${todayTasks.length > 0 ? (completedTodayTasks.length / todayTasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Events */}
        <div
          onClick={() => setActiveView('calendar')}
          className="p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-800/50 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold">رویدادها</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(todayEvents.length) : todayEvents.length}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">برنامه امروز</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 sm:mt-2.5 truncate">
            {todayEvents.length > 0 ? `اولین: ${todayEvents[0].startTime}` : 'بدون جلسه کاری'}
          </p>
        </div>

        {/* Metric 3: Focus / Pomodoro */}
        <div
          onClick={() => setActiveView('pomodoro')}
          className="p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-800/50 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold">تمرکز امروز</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(focusTimeDisplay) : focusTimeDisplay}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 sm:mt-2.5 truncate">
            {settings.persianDigits ? toPersianDigits(todayPomodoros.length) : todayPomodoros.length} سشن تمرکز
          </p>
        </div>

        {/* Metric 4: Habits */}
        <div
          onClick={() => setActiveView('habits')}
          className="p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-800/50 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold">عادت‌ها</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(todayHabitsDoneCount) : todayHabitsDoneCount}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">
              از {settings.persianDigits ? toPersianDigits(allHabits.length) : allHabits.length}
            </span>
          </div>
          <div className="mt-2 sm:mt-2.5 w-full bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${allHabits.length > 0 ? (todayHabitsDoneCount / allHabits.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Bar (Compact Grid) */}
      <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            دسترسی و ثبت سریع
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">ایجاد آسان هرگونه آیتم جدید</span>
        </div>

        {/* Compact Grid (No horizontal scrolling on mobile: 3-cols on mobile, 6-cols on desktop) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => openQuickAdd('task')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/70 hover:bg-purple-950/40 border border-slate-700/50 hover:border-purple-800/60 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-950/80 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 block">+ وظیفه</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openQuickAdd('event')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/70 hover:bg-indigo-950/40 border border-slate-700/50 hover:border-indigo-800/60 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-950/80 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 block">+ رویداد</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openQuickAdd('project')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/70 hover:bg-blue-950/40 border border-slate-700/50 hover:border-blue-800/60 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-950/80 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 block">+ پروژه</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openQuickAdd('goal')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/70 hover:bg-emerald-950/40 border border-slate-700/50 hover:border-emerald-800/60 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 block">+ هدف</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openQuickAdd('note')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/70 hover:bg-amber-950/40 border border-slate-700/50 hover:border-amber-800/60 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 block">+ یادداشت</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openQuickAdd('habit')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800/70 hover:bg-rose-950/40 border border-slate-700/50 hover:border-rose-800/60 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition cursor-pointer group active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 block">+ عادت</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
