import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Timer,
  Flame,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  FolderKanban,
  Target,
  FileText,
  Bell,
  Sparkles,
  CheckCircle2,
  Circle,
  Zap,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { openQuickAdd, setActiveView, refreshTrigger, settings, refreshDb } = useApp();
  const [mobileTab, setMobileTab] = useState<'today' | 'habits_reminders' | 'actions'>('today');

  const todayIso = toGregorianIsoDate();
  const todayJalali = formatToJalali(new Date(), 'full', settings.persianDigits);

  // Real Database Queries for Today
  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);
  const allEvents = useMemo(() => db.getEvents(), [refreshTrigger]);
  const allHabits = useMemo(() => db.getHabits(), [refreshTrigger]);
  const allHabitLogs = useMemo(() => db.getHabitLogs(), [refreshTrigger]);
  const allPomodoro = useMemo(() => db.getPomodoroSessions(), [refreshTrigger]);
  const allReminders = useMemo(() => db.getReminders(), [refreshTrigger]);
  const allProjects = useMemo(() => db.getProjects(), [refreshTrigger]);
  const allGoals = useMemo(() => db.getGoals(), [refreshTrigger]);

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

  const upcomingReminders = useMemo(() => {
    return allReminders.filter((r) => !r.isCompleted).slice(0, 4);
  }, [allReminders]);

  const handleToggleTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    db.toggleTaskStatus(id);
    refreshDb();
  };

  const handleToggleHabit = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    db.toggleHabitLog(habitId, todayIso);
    refreshDb();
  };

  const focusHours = Math.floor(todayFocusMinutes / 60);
  const focusRemMinutes = todayFocusMinutes % 60;
  const focusTimeDisplay =
    focusHours > 0
      ? `${focusHours}:${String(focusRemMinutes).padStart(2, '0')}`
      : `${focusRemMinutes} دقیقه`;

  return (
    <div id="dashboard-view" className="space-y-4 sm:space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/40 border border-purple-800/30 p-4 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-900/60 text-purple-300 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2 border border-purple-700/40">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{todayJalali}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-100">
              {settings.userName ? `سلام ${settings.userName}، روزت بخیر!` : 'سلام، به پلنر خوش آمدید!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed line-clamp-1 sm:line-clamp-none">
              مرکز کنترل روزانه برای مدیریت دقیق وظایف، برنامه‌ها، جلسات و عادت‌های سازنده شما.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => openQuickAdd('task')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium transition shadow-lg shadow-purple-950/50 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>وظیفه جدید</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('pomodoro')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition cursor-pointer"
            >
              <Timer className="w-4 h-4 text-purple-400" />
              <span>شروع تمرکز</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top 4 Summary Metric Cards (Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Tasks */}
        <div
          onClick={() => setActiveView('tasks')}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-800/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">وظایف امروز</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(completedTodayTasks.length) : completedTodayTasks.length}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">
              از {settings.persianDigits ? toPersianDigits(todayTasks.length) : todayTasks.length}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 w-full bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
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
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-800/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">رویدادها</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(todayEvents.length) : todayEvents.length}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">برنامه امروز</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 sm:mt-3 truncate">
            {todayEvents.length > 0 ? `اولین: ${todayEvents[0].startTime}` : 'بدون جلسه'}
          </p>
        </div>

        {/* Metric 3: Focus / Pomodoro */}
        <div
          onClick={() => setActiveView('pomodoro')}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-800/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">تمرکز امروز</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(focusTimeDisplay) : focusTimeDisplay}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 sm:mt-3">
            {settings.persianDigits ? toPersianDigits(todayPomodoros.length) : todayPomodoros.length} سشن تمرکز
          </p>
        </div>

        {/* Metric 4: Habits */}
        <div
          onClick={() => setActiveView('habits')}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-800/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold">عادت‌ها</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-slate-100">
              {settings.persianDigits ? toPersianDigits(todayHabitsDoneCount) : todayHabitsDoneCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">
              از {settings.persianDigits ? toPersianDigits(allHabits.length) : allHabits.length}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 w-full bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${allHabits.length > 0 ? (todayHabitsDoneCount / allHabits.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Segmented Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileTab('today')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
            mobileTab === 'today'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          امروز و برنامه‌ها
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('habits_reminders')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
            mobileTab === 'habits_reminders'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          عادت‌ها و یادآورها
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('actions')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
            mobileTab === 'actions'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          دسترسی سریع
        </button>
      </div>

      {/* Main Grid: Today's Tasks & Schedule vs Quick Actions & Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Columns: Today's Tasks & Today's Schedule Timeline */}
        <div className={`lg:col-span-2 space-y-4 sm:space-y-6 ${mobileTab !== 'today' ? 'hidden lg:block' : ''}`}>
          {/* Today's Tasks Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">وظایف امروز</h3>
              </div>
              <button
                type="button"
                onClick={() => openQuickAdd('task')}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="هنوز وظیفه‌ای برای امروز ثبت نشده است"
                description="برای شروع روز پربازده خود، اولین وظیفه امروز را ایجاد کنید."
                actionText="ایجاد وظیفه جدید"
                onAction={() => openQuickAdd('task')}
              />
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setActiveView('tasks')}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTask(task.id, e)}
                        className="text-slate-400 hover:text-purple-400 transition cursor-pointer flex-shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
                        )}
                      </button>
                      <span
                        className={`text-xs sm:text-sm font-medium truncate ${
                          task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      {task.priority && <Badge priority={task.priority} size="sm" />}
                      {task.dueTime && (
                        <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                          {settings.persianDigits ? toPersianDigits(task.dueTime) : task.dueTime}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {todayTasks.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setActiveView('tasks')}
                    className="w-full text-center py-2 text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                  >
                    مشاهده همه {settings.persianDigits ? toPersianDigits(todayTasks.length) : todayTasks.length} وظیفه
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Today's Timeline / Events */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">جدول زمانی و رویدادهای امروز</h3>
              </div>
              <button
                type="button"
                onClick={() => openQuickAdd('event')}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="رویداد یا جلسه‌ای برای امروز ندارید"
                description="می‌توانید جلسات، قرارها و بازه‌های کاری امروز را ثبت و زمان‌بندی کنید."
                actionText="ثبت رویداد جدید"
                onAction={() => openQuickAdd('event')}
              />
            ) : (
              <div className="space-y-2.5">
                {todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setActiveView('calendar')}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div
                      className="w-1.5 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: evt.color || '#8b5cf6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200">{evt.title}</h4>
                        <span className="text-[11px] sm:text-xs font-mono text-purple-300">
                          {settings.persianDigits ? toPersianDigits(evt.startTime) : evt.startTime} —{' '}
                          {settings.persianDigits ? toPersianDigits(evt.endTime) : evt.endTime}
                        </span>
                      </div>
                      {evt.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{evt.description}</p>}
                      {evt.location && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">📍 {evt.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Quick Actions, Today's Habits & Reminders */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions Grid */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 ${mobileTab !== 'actions' ? 'hidden lg:block' : ''}`}>
            <h3 className="font-bold text-slate-100 text-sm mb-3">دسترسی سریع</h3>
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openQuickAdd('task')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-purple-800/50 flex flex-col items-center text-center transition cursor-pointer"
              >
                <CheckSquare className="w-5 h-5 text-purple-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">وظیفه</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('event')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-800/50 flex flex-col items-center text-center transition cursor-pointer"
              >
                <CalendarIcon className="w-5 h-5 text-indigo-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">رویداد</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('project')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-800/50 flex flex-col items-center text-center transition cursor-pointer"
              >
                <FolderKanban className="w-5 h-5 text-blue-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">پروژه</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('goal')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-800/50 flex flex-col items-center text-center transition cursor-pointer"
              >
                <Target className="w-5 h-5 text-emerald-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">هدف</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('note')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-800/50 flex flex-col items-center text-center transition cursor-pointer"
              >
                <FileText className="w-5 h-5 text-amber-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">یادداشت</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('habit')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-rose-800/50 flex flex-col items-center text-center transition cursor-pointer"
              >
                <Flame className="w-5 h-5 text-rose-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">عادت</span>
              </button>
            </div>
          </div>

          {/* Today's Habits Tracker */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 ${mobileTab !== 'habits_reminders' ? 'hidden lg:block' : ''}`}>
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">عادت‌های امروز</h3>
              </div>
              <button
                type="button"
                onClick={() => openQuickAdd('habit')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
              >
                + عادت
              </button>
            </div>

            {allHabits.length === 0 ? (
              <EmptyState
                icon={Flame}
                title="هنوز عادتی ثبت نشده است"
                description="عادت‌های روزانه خود را برای ایجاد نظم و پیگیری پیوسته بسازید."
                actionText="ایجاد عادت"
                onAction={() => openQuickAdd('habit')}
              />
            ) : (
              <div className="space-y-2">
                {allHabits.map((habit) => {
                  const isDone = allHabitLogs.some((l) => l.habitId === habit.id && l.date === todayIso && l.completed);
                  const streak = db.getHabitStreak(habit.id);
                  return (
                    <div
                      key={habit.id}
                      onClick={(e) => handleToggleHabit(habit.id, e)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                            isDone ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-medium truncate">{habit.title}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-amber-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{settings.persianDigits ? toPersianDigits(streak) : streak} روز</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Reminders Card */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 ${mobileTab !== 'habits_reminders' ? 'hidden lg:block' : ''}`}>
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">یادآورهای فعال</h3>
              </div>
              <button
                type="button"
                onClick={() => openQuickAdd('reminder')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
              >
                + یادآور
              </button>
            </div>

            {upcomingReminders.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="یادآوری وجود ندارد"
                description="کارهای مهم و زمان‌بندی‌شده را به عنوان یادآور ثبت کنید."
                actionText="تنظیم یادآور"
                onAction={() => openQuickAdd('reminder')}
              />
            ) : (
              <div className="space-y-2">
                {upcomingReminders.map((rem) => (
                  <div
                    key={rem.id}
                    onClick={() => setActiveView('reminders')}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="text-xs font-medium text-slate-200 truncate">{rem.title}</div>
                    <span className="text-[11px] text-purple-300 font-mono flex-shrink-0">
                      {settings.persianDigits ? toPersianDigits(rem.time) : rem.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
