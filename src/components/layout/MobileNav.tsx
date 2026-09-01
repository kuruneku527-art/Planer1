import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveView } from '../../types';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  CalendarDays,
  Menu,
  Plus,
  X,
  FolderKanban,
  Target,
  Flame,
  FileText,
  Bell,
  Timer,
  Clock,
  BarChart3,
  Paperclip,
  BookmarkPlus,
  RefreshCw,
  Database,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileNavProps {
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean | ((prev: boolean) => boolean)) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ drawerOpen, setDrawerOpen }) => {
  const [internalDrawerOpen, setInternalDrawerOpen] = React.useState(false);
  const isDrawerOpen = drawerOpen !== undefined ? drawerOpen : internalDrawerOpen;

  const handleSetDrawerOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    if (setDrawerOpen) {
      setDrawerOpen(open);
    } else {
      setInternalDrawerOpen(open);
    }
  };

  const { activeView, setActiveView, openQuickAdd, settings, updateSettings } = useApp();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const allViews: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'وظایف', icon: CheckSquare },
    { id: 'projects', label: 'پروژه‌ها', icon: FolderKanban },
    { id: 'calendar', label: 'تقویم', icon: CalendarIcon },
    { id: 'daily_planner', label: 'برنامه روزانه', icon: CalendarDays },
    { id: 'weekly_planner', label: 'برنامه هفتگی', icon: CalendarDays },
    { id: 'goals', label: 'اهداف', icon: Target },
    { id: 'habits', label: 'عادت‌ها', icon: Flame },
    { id: 'pomodoro', label: 'تایمر پومودورو', icon: Timer },
    { id: 'time_management', label: 'مدیریت زمان', icon: Clock },
    { id: 'notes', label: 'یادداشت‌ها', icon: FileText },
    { id: 'reminders', label: 'یادآورها', icon: Bell },
    { id: 'reports', label: 'گزارش‌ها', icon: BarChart3 },
    { id: 'files', label: 'فایل‌ها', icon: Paperclip },
    { id: 'templates', label: 'قالب‌ها', icon: BookmarkPlus },
    { id: 'sync', label: 'همگام‌سازی', icon: RefreshCw },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: Database },
    { id: 'settings', label: 'تنظیمات', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Bottom Navigation Bar for Mobile: 5 symmetric items with + strictly centered */}
      <div
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 grid grid-cols-5 items-center px-1"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
          height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
        }}
        dir="rtl"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => {
            setActiveView('dashboard');
            handleSetDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 h-full transition cursor-pointer ${
            activeView === 'dashboard' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] truncate">داشبورد</span>
        </button>

        {/* 2. Tasks */}
        <button
          type="button"
          onClick={() => {
            setActiveView('tasks');
            handleSetDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 h-full transition cursor-pointer ${
            activeView === 'tasks' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] truncate">وظایف</span>
        </button>

        {/* 3. Center Quick Add (+) Button */}
        <div className="flex items-center justify-center">
          <button
            id="mobile-center-add-btn"
            type="button"
            onClick={() => openQuickAdd()}
            className="relative -top-3.5 w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 text-white flex items-center justify-center shadow-lg shadow-purple-900/50 border-2 border-slate-900 transition active:scale-90 cursor-pointer"
            title="ایجاد سریع (+)"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Calendar */}
        <button
          type="button"
          onClick={() => {
            setActiveView('calendar');
            handleSetDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 h-full transition cursor-pointer ${
            activeView === 'calendar' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] truncate">تقویم</span>
        </button>

        {/* 5. More Menu */}
        <button
          type="button"
          onClick={() => handleSetDrawerOpen(!isDrawerOpen)}
          className={`flex flex-col items-center justify-center gap-1 h-full transition cursor-pointer ${
            isDrawerOpen ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] truncate">بیشتر</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleSetDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 flex flex-col z-10 shadow-2xl"
            >
              {/* Drawer Header */}
              <div
                className="px-4 flex items-center justify-between border-b border-slate-800 shrink-0"
                style={{
                  paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)',
                  paddingBottom: '0.75rem',
                  minHeight: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-100">منوی بخش‌های پلنر</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Quick Theme Toggle inside Mobile Drawer */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    title={settings.theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
                  >
                    {settings.theme === 'dark' ? (
                      <Sun className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-purple-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Grid Navigation */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5">
                {allViews.map((v) => {
                  const Icon = v.icon;
                  const isActive = activeView === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setActiveView(v.id);
                        handleSetDrawerOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                          : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-medium">{v.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer with Theme & Status */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">پلنر شخصی — هوشمند و آفلاین</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium hover:bg-slate-700 transition cursor-pointer"
                >
                  {settings.theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{settings.theme === 'dark' ? 'تم روشن' : 'تم تاریک'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

