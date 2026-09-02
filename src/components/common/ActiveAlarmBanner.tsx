import React, { useState, useEffect } from 'react';
import { reminderScheduler, TriggeredAlarm } from '../../services/reminderScheduler';
import { useApp } from '../../context/AppContext';
import { Bell, BellRing, Check, ExternalLink, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPersianDigits } from '../../utils/jalali';

export const ActiveAlarmBanner: React.FC = () => {
  const { setActiveView, refreshDb } = useApp();
  const [activeAlarms, setActiveAlarms] = useState<TriggeredAlarm[]>([]);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and prompt if not determined
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Show gentle permission banner
        const dismissed = sessionStorage.getItem('planner_perm_prompt_dismissed');
        if (!dismissed) {
          setShowPermissionPrompt(true);
        }
      }
    }

    // Subscribe to triggered alarms
    const unsubscribe = reminderScheduler.subscribe((alarm) => {
      setActiveAlarms((prev) => [alarm, ...prev.slice(0, 2)]);
      refreshDb();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshDb]);

  const handleRequestPermission = async () => {
    const res = await reminderScheduler.requestNotificationPermission();
    setShowPermissionPrompt(false);
    sessionStorage.setItem('planner_perm_prompt_dismissed', 'true');
  };

  const dismissAlarm = (id: string) => {
    setActiveAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleNavigate = (alarm: TriggeredAlarm) => {
    setActiveView(alarm.targetView);
    dismissAlarm(alarm.id);
  };

  return (
    <>
      {/* 1. Notification Permission Prompt Bar (if not yet granted) */}
      <AnimatePresence>
        {showPermissionPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 sm:top-4 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-sm sm:max-w-md bg-slate-900/95 border border-purple-500/40 rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-sm flex items-center justify-between gap-2 text-slate-100"
            dir="rtl"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-200 leading-tight truncate">
                فعال‌سازی اعلان برای دریافت زنگ و هشدار سرِ موعد
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition shadow cursor-pointer active:scale-95"
              >
                فعال‌سازی
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPermissionPrompt(false);
                  sessionStorage.setItem('planner_perm_prompt_dismissed', 'true');
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Live High-Priority Alarm Alert Modal / Top Banner */}
      <div className="fixed top-2 sm:top-4 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm sm:max-w-md w-full pointer-events-none" dir="rtl">
        <AnimatePresence>
          {activeAlarms.map((alarm) => (
            <motion.div
              key={`${alarm.id}_${alarm.time}`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto bg-slate-900/98 border border-amber-500/70 rounded-xl p-3 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400 flex items-center justify-center shrink-0 animate-bounce mt-0.5">
                  <BellRing className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">{alarm.title}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 shrink-0 font-bold">
                      {toPersianDigits(alarm.time)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                    {alarm.subtitle}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleNavigate(alarm)}
                      className="flex-1 py-1 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>مشاهده</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissAlarm(alarm.id)}
                      className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
                    >
                      متوجه شدم
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
