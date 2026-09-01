import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActiveView, UserSettings, PomodoroMode } from '../types';
import { db } from '../services/db';
import { soundEffects } from '../utils/audio';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  quickAddDefaultTab: string;
  openQuickAdd: (tab?: string) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  openGlobalSearch: () => void;
  notificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  confirmDialog: ConfirmDialogOptions | null;
  showConfirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  refreshDb: () => void;
  refreshTrigger: number;
  // Pomodoro state
  pomodoroMode: PomodoroMode;
  setPomodoroMode: (mode: PomodoroMode) => void;
  pomodoroSecondsLeft: number;
  setPomodoroSecondsLeft: (seconds: number | ((prev: number) => number)) => void;
  pomodoroIsRunning: boolean;
  setPomodoroIsRunning: (running: boolean) => void;
  pomodoroActiveTaskId?: string;
  setPomodoroActiveTaskId: (id?: string) => void;
  pomodoroActiveTaskTitle?: string;
  setPomodoroActiveTaskTitle: (title?: string) => void;
  startPomodoro: (taskId?: string) => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  skipPomodoro: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState('task');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => db.getSettings());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pomodoro Global State
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('focus');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(settings.pomodoroFocusMinutes * 60);
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroActiveTaskId, setPomodoroActiveTaskId] = useState<string | undefined>(undefined);
  const [pomodoroActiveTaskTitle, setPomodoroActiveTaskTitle] = useState<string | undefined>(undefined);

  const refreshDb = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Synchronize document theme class
  useEffect(() => {
    const currentTheme = settings.theme || 'dark';
    const root = document.documentElement;
    if (currentTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  }, [settings.theme]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const openQuickAdd = useCallback((tab: string = 'task') => {
    setQuickAddDefaultTab(tab);
    setQuickAddOpen(true);
  }, []);

  const openGlobalSearch = useCallback(() => {
    setGlobalSearchOpen(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    const updated = db.updateSettings(partial);
    setSettings(updated);
    if (partial.pomodoroFocusMinutes && pomodoroMode === 'focus' && !pomodoroIsRunning) {
      setPomodoroSecondsLeft(partial.pomodoroFocusMinutes * 60);
    }
  }, [pomodoroMode, pomodoroIsRunning]);

  // Pomodoro Timer Controls
  const startPomodoro = useCallback((taskId?: string) => {
    if (taskId) {
      const task = db.getTask(taskId);
      if (task) {
        setPomodoroActiveTaskId(task.id);
        setPomodoroActiveTaskTitle(task.title);
      }
    }
    if (settings.soundEnabled || settings.soundEffectsEnabled) {
      soundEffects.playTimerStart(settings.soundVolume);
    }
    setPomodoroIsRunning(true);
  }, [settings.soundEnabled, settings.soundEffectsEnabled, settings.soundVolume]);

  const pausePomodoro = useCallback(() => {
    setPomodoroIsRunning(false);
  }, []);

  const resetPomodoro = useCallback(() => {
    setPomodoroIsRunning(false);
    let dur = settings.pomodoroFocusMinutes || 25;
    if (pomodoroMode === 'short_break') dur = settings.pomodoroShortBreakMinutes || 5;
    if (pomodoroMode === 'long_break') dur = settings.pomodoroLongBreakMinutes || 15;
    setPomodoroSecondsLeft(dur * 60);
  }, [pomodoroMode, settings.pomodoroFocusMinutes, settings.pomodoroShortBreakMinutes, settings.pomodoroLongBreakMinutes]);

  const skipPomodoro = useCallback(() => {
    setPomodoroIsRunning(false);
    if (pomodoroMode === 'focus') {
      setPomodoroMode('short_break');
      setPomodoroSecondsLeft((settings.pomodoroShortBreakMinutes || 5) * 60);
    } else {
      setPomodoroMode('focus');
      setPomodoroSecondsLeft((settings.pomodoroFocusMinutes || 25) * 60);
    }
  }, [pomodoroMode, settings.pomodoroFocusMinutes, settings.pomodoroShortBreakMinutes]);

  // Global Pomodoro countdown ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoroIsRunning) {
      interval = setInterval(() => {
        setPomodoroSecondsLeft((prev) => {
          if (prev <= 1) {
            // Completed!
            setPomodoroIsRunning(false);
            if (settings.soundEnabled || settings.soundEffectsEnabled) {
              soundEffects.playCompletionChime(settings.soundVolume);
            }

            // Log session in DB
            const duration =
              pomodoroMode === 'focus'
                ? settings.pomodoroFocusMinutes || 25
                : pomodoroMode === 'short_break'
                ? settings.pomodoroShortBreakMinutes || 5
                : settings.pomodoroLongBreakMinutes || 15;

            db.savePomodoroSession({
              id: `pomo_${Date.now()}`,
              mode: pomodoroMode,
              durationMinutes: duration,
              completedAt: new Date().toISOString(),
              taskId: pomodoroActiveTaskId,
              taskTitle: pomodoroActiveTaskTitle,
            });

            // Also record time entry for productivity analytics
            if (pomodoroMode === 'focus') {
              const now = new Date();
              const start = new Date(now.getTime() - duration * 60 * 1000);
              const startHH = String(start.getHours()).padStart(2, '0');
              const startMM = String(start.getMinutes()).padStart(2, '0');
              const endHH = String(now.getHours()).padStart(2, '0');
              const endMM = String(now.getMinutes()).padStart(2, '0');

              db.saveTimeEntry({
                id: `time_${Date.now()}`,
                title: pomodoroActiveTaskTitle || 'جلسه تمرکز پومودورو',
                category: 'work',
                date: now.toISOString().split('T')[0],
                startTime: `${startHH}:${startMM}`,
                endTime: `${endHH}:${endMM}`,
                durationMinutes: duration,
                linkedTaskId: pomodoroActiveTaskId,
                createdAt: now.toISOString(),
              });
            }

            db.saveNotification({
              id: `notif_${Date.now()}`,
              title: pomodoroMode === 'focus' ? 'جلسه تمرکز پایان یافت' : 'زمان استراحت پایان یافت',
              message:
                pomodoroMode === 'focus'
                  ? 'آفرین! یک جلسه تمرکز پومودورو با موفقیت تکمیل شد.'
                  : 'استراحت تمام شد. آماده جلسه تمرکز بعدی هستید؟',
              type: 'system',
              read: false,
              targetView: 'pomodoro',
              timestamp: new Date().toISOString(),
            });

            showToast(
              pomodoroMode === 'focus' ? 'تبریک! جلسه تمرکز با موفقیت تمام شد.' : 'زمان استراحت پایان یافت.',
              'success'
            );

            // Next mode
            if (pomodoroMode === 'focus') {
              setPomodoroMode('short_break');
              return (settings.pomodoroShortBreakMinutes || 5) * 60;
            } else {
              setPomodoroMode('focus');
              return (settings.pomodoroFocusMinutes || 25) * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroIsRunning, pomodoroMode, pomodoroActiveTaskId, pomodoroActiveTaskTitle, settings, showToast]);

  // Listen to DB update events across browser tabs/components
  useEffect(() => {
    const handleDbUpdate = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('planner_db_updated', handleDbUpdate);
    return () => window.removeEventListener('planner_db_updated', handleDbUpdate);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openQuickAdd('project');
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openQuickAdd('note');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !isInput) {
        e.preventDefault();
        openQuickAdd('task');
      } else if (e.key === 'Escape') {
        setQuickAddOpen(false);
        setGlobalSearchOpen(false);
        setNotificationCenterOpen(false);
        setConfirmDialog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openQuickAdd]);

  // Sync theme class to document body
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.className =
        'bg-slate-50 text-slate-900 font-sans antialiased selection:bg-purple-600 selection:text-white overflow-x-hidden';
    } else {
      document.documentElement.classList.add('dark');
      document.body.className =
        'bg-slate-950 text-slate-100 font-sans antialiased selection:bg-purple-600 selection:text-white overflow-x-hidden';
    }
  }, [settings.theme]);

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        quickAddOpen,
        setQuickAddOpen,
        quickAddDefaultTab,
        openQuickAdd,
        globalSearchOpen,
        setGlobalSearchOpen,
        openGlobalSearch,
        notificationCenterOpen,
        setNotificationCenterOpen,
        toasts,
        showToast,
        removeToast,
        confirmDialog,
        showConfirm,
        closeConfirm,
        settings,
        updateSettings,
        refreshDb,
        refreshTrigger,
        pomodoroMode,
        setPomodoroMode,
        pomodoroSecondsLeft,
        setPomodoroSecondsLeft,
        pomodoroIsRunning,
        setPomodoroIsRunning,
        pomodoroActiveTaskId,
        setPomodoroActiveTaskId,
        pomodoroActiveTaskTitle,
        setPomodoroActiveTaskTitle,
        startPomodoro,
        pausePomodoro,
        resetPomodoro,
        skipPomodoro,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
