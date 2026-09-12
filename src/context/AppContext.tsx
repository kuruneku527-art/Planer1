import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ActiveView, UserSettings, PomodoroMode } from '../types';
import { db } from '../services/db';
import { soundEffects } from '../utils/audio';
import { systemPermissions } from '../services/systemPermissions';
import { nativeBridge } from '../services/nativeBridge';

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
  quickAddInitialData?: { dueDate?: string; projectId?: string; category?: string };
  openQuickAdd: (tab?: string, initialData?: { dueDate?: string; projectId?: string; category?: string }) => void;
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
  pomodoroStrictLock: boolean;
  setPomodoroStrictLock: (lock: boolean) => void;
  startPomodoro: (taskId?: string, lockMode?: boolean) => void;
  pausePomodoro: () => void;
  resetPomodoro: (overrideMinutes?: number) => void;
  setPomodoroDuration: (minutes: number) => void;
  skipPomodoro: () => void;
  unlockPomodoroFocus: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState('task');
  const [quickAddInitialData, setQuickAddInitialData] = useState<{ dueDate?: string; projectId?: string; category?: string } | undefined>(undefined);
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
  const [pomodoroStrictLock, setPomodoroStrictLock] = useState<boolean>(false);
  const targetEndTimeRef = useRef<number | null>(null);

  const refreshDb = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Synchronize document theme class
  useEffect(() => {
    const currentTheme = settings.theme || 'dark';
    const root = document.documentElement;
    const isLight = currentTheme === 'light';
    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    nativeBridge.setSystemBarsTheme(isLight);
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

  const openQuickAdd = useCallback((tab: string = 'task', initialData?: { dueDate?: string; projectId?: string; category?: string }) => {
    setQuickAddDefaultTab(tab);
    setQuickAddInitialData(initialData);
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
  const startPomodoro = useCallback((taskId?: string, lockMode: boolean = false) => {
    let activeTitle = pomodoroActiveTaskTitle;
    if (taskId) {
      const task = db.getTask(taskId);
      if (task) {
        setPomodoroActiveTaskId(task.id);
        setPomodoroActiveTaskTitle(task.title);
        activeTitle = task.title;
      }
    }
    setPomodoroStrictLock(lockMode);

    const seconds = pomodoroSecondsLeft > 0 ? pomodoroSecondsLeft : (settings.pomodoroFocusMinutes || 25) * 60;
    const targetEnd = Date.now() + seconds * 1000;
    targetEndTimeRef.current = targetEnd;

    // 1. Keep mobile screen awake if supported
    systemPermissions.acquireWakeLock();

    // 2. Schedule Service Worker background alarm for mobile lock screen delivery
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_ALARM',
          alarm: {
            id: 'pomodoro_active_session',
            title: 'اتمام جلسه تمرکز پومودورو 🍅',
            body: activeTitle
              ? `جلسه تمرکز روی «${activeTitle}» به پایان رسید.`
              : 'زمان جلسه تمرکز شما با موفقیت به پایان رسید.',
            triggerAt: targetEnd,
            targetView: 'pomodoro',
          },
        });
      } catch {}
    }

    if (settings.soundEnabled || settings.soundEffectsEnabled) {
      soundEffects.playTimerStart(settings.soundVolume);
    }
    setPomodoroIsRunning(true);
  }, [
    pomodoroSecondsLeft,
    pomodoroActiveTaskTitle,
    settings.pomodoroFocusMinutes,
    settings.soundEnabled,
    settings.soundEffectsEnabled,
    settings.soundVolume,
  ]);

  const pausePomodoro = useCallback(() => {
    targetEndTimeRef.current = null;
    systemPermissions.releaseWakeLock();

    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CANCEL_ALARM',
          id: 'pomodoro_active_session',
        });
      } catch {}
    }

    setPomodoroIsRunning(false);
  }, []);

  const setPomodoroDuration = useCallback((minutes: number) => {
    targetEndTimeRef.current = null;
    systemPermissions.releaseWakeLock();

    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CANCEL_ALARM',
          id: 'pomodoro_active_session',
        });
      } catch {}
    }

    const updated = db.updateSettings({ pomodoroFocusMinutes: minutes });
    setSettings(updated);
    setPomodoroIsRunning(false);
    setPomodoroStrictLock(false);
    setPomodoroMode('focus');
    setPomodoroSecondsLeft(minutes * 60);
  }, []);

  const resetPomodoro = useCallback((overrideMinutes?: number) => {
    targetEndTimeRef.current = null;
    systemPermissions.releaseWakeLock();

    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CANCEL_ALARM',
          id: 'pomodoro_active_session',
        });
      } catch {}
    }

    setPomodoroIsRunning(false);
    setPomodoroStrictLock(false);
    const dur = overrideMinutes ?? settings.pomodoroFocusMinutes ?? 25;
    setPomodoroMode('focus');
    setPomodoroSecondsLeft(dur * 60);
  }, [settings.pomodoroFocusMinutes]);

  const skipPomodoro = useCallback(() => {
    targetEndTimeRef.current = null;
    systemPermissions.releaseWakeLock();

    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CANCEL_ALARM',
          id: 'pomodoro_active_session',
        });
      } catch {}
    }

    setPomodoroIsRunning(false);
    setPomodoroStrictLock(false);
    setPomodoroMode('focus');
    setPomodoroSecondsLeft((settings.pomodoroFocusMinutes || 25) * 60);
  }, [settings.pomodoroFocusMinutes]);

  const unlockPomodoroFocus = useCallback(() => {
    setPomodoroStrictLock(false);
  }, []);

  // Global Pomodoro countdown ticker with mobile background time synchronization
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoroIsRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + pomodoroSecondsLeft * 1000;
      }

      interval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const remaining = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));
        setPomodoroSecondsLeft(remaining);

        if (remaining <= 0) {
          // Completed!
          targetEndTimeRef.current = null;
          setPomodoroIsRunning(false);
          setPomodoroStrictLock(false);
          systemPermissions.releaseWakeLock();

          if (settings.soundEnabled || settings.soundEffectsEnabled) {
            soundEffects.playCompletionChime(settings.soundVolume);
          }

          // Hardware vibration on mobile
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([300, 150, 300, 150, 450]);
            } catch {}
          }

          // Real System Notification
          systemPermissions.showSystemNotification({
            title: 'اتمام جلسه تمرکز 🍅',
            body: pomodoroActiveTaskTitle
              ? `جلسه تمرکز روی «${pomodoroActiveTaskTitle}» با موفقیت پایان یافت.`
              : 'جلسه تمرکز عمیق با موفقیت تکمیل شد.',
            tag: 'pomodoro-complete',
            targetView: 'pomodoro',
          });

          // Log session in DB
          const duration = settings.pomodoroFocusMinutes || 25;

          db.savePomodoroSession({
            id: `pomo_${Date.now()}`,
            mode: 'focus',
            durationMinutes: duration,
            completedAt: new Date().toISOString(),
            taskId: pomodoroActiveTaskId,
            taskTitle: pomodoroActiveTaskTitle,
          });

          // Also record time entry for productivity analytics
          const nowDate = new Date();
          const start = new Date(nowDate.getTime() - duration * 60 * 1000);
          const startHH = String(start.getHours()).padStart(2, '0');
          const startMM = String(start.getMinutes()).padStart(2, '0');
          const endHH = String(nowDate.getHours()).padStart(2, '0');
          const endMM = String(nowDate.getMinutes()).padStart(2, '0');

          db.saveTimeEntry({
            id: `time_${Date.now()}`,
            title: pomodoroActiveTaskTitle || 'جلسه تمرکز عمیق',
            category: 'work',
            date: nowDate.toISOString().split('T')[0],
            startTime: `${startHH}:${startMM}`,
            endTime: `${endHH}:${endMM}`,
            durationMinutes: duration,
            linkedTaskId: pomodoroActiveTaskId,
            createdAt: nowDate.toISOString(),
          });

          db.saveNotification({
            id: `notif_${Date.now()}`,
            title: 'جلسه تمرکز پایان یافت',
            message: 'آفرین! یک جلسه تمرکز با موفقیت تکمیل شد.',
            type: 'system',
            read: false,
            targetView: 'pomodoro',
            timestamp: new Date().toISOString(),
          });

          showToast('تبریک! جلسه تمرکز با موفقیت به پایان رسید.', 'success');

          setPomodoroMode('focus');
          setPomodoroSecondsLeft((settings.pomodoroFocusMinutes || 25) * 60);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    pomodoroIsRunning,
    pomodoroSecondsLeft,
    pomodoroActiveTaskId,
    pomodoroActiveTaskTitle,
    settings,
    showToast,
  ]);

  // Synchronize Pomodoro timer when mobile screen turns on / tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pomodoroIsRunning && targetEndTimeRef.current) {
        const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
        setPomodoroSecondsLeft(remaining);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pomodoroIsRunning]);

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
        quickAddInitialData,
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
        pomodoroStrictLock,
        setPomodoroStrictLock,
        startPomodoro,
        pausePomodoro,
        resetPomodoro,
        setPomodoroDuration,
        skipPomodoro,
        unlockPomodoroFocus,
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
