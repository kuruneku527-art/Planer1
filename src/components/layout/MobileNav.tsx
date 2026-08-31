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

  const { activeView, setActiveView, openQuickAdd } = useApp();

  const mainTabs: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'وظایف', icon: CheckSquare },
    { id: 'calendar', label: 'تقویم', icon: CalendarIcon },
    { id: 'daily_planner', label: 'برنامه روزانه', icon: CalendarDays },
  ];

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
      {/* Bottom Navigation Bar for Mobile */}
      <div
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 flex items-center justify-around px-2"
        dir="rtl"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveView(tab.id);
                handleSetDrawerOpen(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition cursor-pointer ${
                isActive ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] truncate">{tab.label}</span>
            </button>
          );
        })}

        {/* Center Floating Quick Add Button */}
        <button
          type="button"
          onClick={() => openQuickAdd()}
          className="relative -top-5 w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/50 border-2 border-slate-900 transition active:scale-95 cursor-pointer"
          title="ایجاد سریع"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* More Drawer Button */}
        <button
          type="button"
          onClick={() => handleSetDrawerOpen(!isDrawerOpen)}
          className={`flex flex-col items-center justify-center gap-1 w-14 h-full transition cursor-pointer ${
            isDrawerOpen ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">بیشتر</span>
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
              <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-100">پلنر حرفه‌ای</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSetDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
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

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 text-center">
                <p className="text-[11px] text-slate-400">پلنر — برنامه‌ریزی هوشمند، زندگی بهتر</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
