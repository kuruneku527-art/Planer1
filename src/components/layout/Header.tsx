import React from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Menu,
  Timer,
  LayoutDashboard,
  Calendar as CalendarIcon,
  CalendarDays,
  Columns3,
  CheckSquare,
  FolderKanban,
  Target,
  Flame,
  FileText,
  Clock,
  BarChart3,
  Paperclip,
  BookmarkPlus,
  RefreshCw,
  Database,
  Settings as SettingsIcon,
} from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const {
    activeView,
    openGlobalSearch,
    openQuickAdd,
    setNotificationCenterOpen,
    settings,
    updateSettings,
    refreshTrigger,
    pomodoroIsRunning,
    pomodoroSecondsLeft,
    pomodoroMode,
    setActiveView,
  } = useApp();

  const unreadNotificationsCount = React.useMemo(() => {
    return db.getNotifications().filter((n) => !n.read).length;
  }, [refreshTrigger]);

  const viewTitles: Record<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
    dashboard: { title: 'داشبورد اصلی', icon: LayoutDashboard },
    tasks: { title: 'مدیریت وظایف', icon: CheckSquare },
    projects: { title: 'پروژه‌ها', icon: FolderKanban },
    calendar: { title: 'تقویم خورشیدی', icon: CalendarIcon },
    daily_planner: { title: 'برنامه روزانه', icon: CalendarDays },
    weekly_planner: { title: 'برنامه هفتگی', icon: Columns3 },
    goals: { title: 'اهداف و چشم‌انداز', icon: Target },
    habits: { title: 'عادت‌ها و پیگیری روزانه', icon: Flame },
    notes: { title: 'دفترچه یادداشت‌ها', icon: FileText },
    reminders: { title: 'یادآورها و هشدارها', icon: Bell },
    pomodoro: { title: 'تایمر تمرکز پومودورو', icon: Timer },
    time_management: { title: 'مدیریت زمان', icon: Clock },
    reports: { title: 'آمار و گزارش‌های بهره‌وری', icon: BarChart3 },
    files: { title: 'مدیریت فایل‌ها و پیوست‌ها', icon: Paperclip },
    templates: { title: 'قالب‌های آماده برنامه‌ریزی', icon: BookmarkPlus },
    sync: { title: 'همگام‌سازی بین دستگاه‌ها', icon: RefreshCw },
    backup: { title: 'پشتیبان‌گیری و بازیابی', icon: Database },
    settings: { title: 'تنظیمات برنامه', icon: SettingsIcon },
  };

  const currentViewInfo = viewTitles[activeView] || { title: 'پلنر', icon: LayoutDashboard };
  const CurrentIcon = currentViewInfo.icon;

  const todayJalaliFormatted = formatToJalali(new Date(), 'full', settings.persianDigits);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const minutesLeft = Math.floor(pomodoroSecondsLeft / 60);
  const secondsLeft = pomodoroSecondsLeft % 60;
  const timeFormatted = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  return (
    <header
      id="main-header"
      className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 transition-all px-3 sm:px-6 shrink-0"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)',
        paddingBottom: '0.5rem',
        minHeight: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
      }}
      dir="rtl"
    >
      {/* Right side: Mobile Menu + View Title & Date */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-0.5">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
          title="منوی اصلی"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center shrink-0">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold text-slate-100 leading-tight truncate">
              {currentViewInfo.title}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate">{todayJalaliFormatted}</p>
          </div>
        </div>
      </div>

      {/* Left side: Actions, Search, Pomodoro Pill, Notifications, Quick Add */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Active Pomodoro Pill */}
        {pomodoroIsRunning && (
          <button
            type="button"
            onClick={() => setActiveView('pomodoro')}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[11px] sm:text-xs font-mono font-bold animate-pulse hover:bg-purple-900 transition cursor-pointer shadow-sm shrink-0"
            title="تایمر تمرکز فعال"
          >
            <Timer className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">
              {settings.persianDigits ? toPersianDigits(timeFormatted) : timeFormatted}
            </span>
          </button>
        )}

        {/* Global Search Button (Desktop) */}
        <button
          id="global-search-trigger"
          type="button"
          onClick={openGlobalSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs cursor-pointer group shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400" />
          <span>جستجو در همه بخش‌ها...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
            Ctrl K
          </kbd>
        </button>

        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={openGlobalSearch}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
          title="جستجو"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Quick Add Button */}
        <button
          id="quick-add-btn"
          type="button"
          onClick={() => openQuickAdd('task')}
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-purple-900/40 transition cursor-pointer active:scale-95 shrink-0"
          title="ایجاد جدید"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">ایجاد جدید</span>
        </button>

        {/* Notifications Center */}
        <button
          id="notifications-trigger"
          type="button"
          onClick={() => setNotificationCenterOpen(true)}
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
          title="اعلان‌ها"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
              {settings.persianDigits ? toPersianDigits(unreadNotificationsCount) : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
          title={settings.theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          )}
        </button>
      </div>
    </header>
  );
};
