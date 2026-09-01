import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  CheckSquare,
  Lock,
  Unlock,
  ShieldAlert,
  Zap,
  Target,
  Brain,
  Sliders,
  Plus,
  Minus,
  Edit3,
  Check,
  X,
  Clock,
} from 'lucide-react';

const FOCUS_PRESETS = [15, 25, 45, 60, 90];

export const PomodoroView: React.FC = () => {
  const {
    pomodoroSecondsLeft,
    pomodoroIsRunning,
    pomodoroStrictLock,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroDuration,
    settings,
    updateSettings,
    refreshTrigger,
    showToast,
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showLockPrompt, setShowLockPrompt] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(settings.pomodoroFocusMinutes || 25);

  const handleInitiateStart = () => {
    if (pomodoroIsRunning) {
      pausePomodoro();
    } else {
      setShowLockPrompt(true);
    }
  };

  const handleConfirmStartWithChoice = (lockMode: boolean) => {
    setShowLockPrompt(false);
    startPomodoro(selectedTaskId, lockMode);
  };

  const handlePresetSelect = (minutes: number) => {
    if (!pomodoroIsRunning) {
      setPomodoroDuration(minutes);
    }
  };

  const handleApplyCustomDuration = () => {
    const val = Number(customMinutes);
    if (isNaN(val) || val < 1 || val > 360) {
      showToast('لطفاً عددی بین ۱ تا ۳۶۰ دقیقه وارد کنید', 'error');
      return;
    }
    setPomodoroDuration(val);
    setShowCustomModal(false);
    showToast(`زمان تمرکز روی ${settings.persianDigits ? toPersianDigits(val) : val} دقیقه تنظیم شد`, 'success');
  };

  const allTasks = useMemo(() => {
    return db.getTasks().filter((t) => t.status !== 'completed');
  }, [refreshTrigger]);

  const allSessions = useMemo(() => {
    return db.getPomodoroSessions();
  }, [refreshTrigger]);

  const totalFocusMinutes = useMemo(() => {
    return allSessions
      .filter((s) => s.mode === 'focus')
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [allSessions]);

  const minutes = Math.floor(pomodoroSecondsLeft / 60);
  const seconds = pomodoroSecondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = (settings.pomodoroFocusMinutes || 25) * 60;
  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - pomodoroSecondsLeft) / totalSeconds) * 100)) : 0;
  const strokeDashoffset = 565.48 - (565.48 * progressPercent) / 100;

  return (
    <div id="pomodoro-view" className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-purple-300 text-xs font-semibold">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>محیط اختصاصی تمرکز عمیق (Deep Focus)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center gap-2 tracking-tight">
          <span>تایمر تمرکز بدون وقفه</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          حذف عوامل حواس‌پرتی و دستیابی به بهره‌وری پیوسته در بازه‌های مشخص
        </p>
      </div>

      {/* Main Focus Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center shadow-xl relative overflow-hidden">
        {/* Preset & Custom duration selector pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 mb-8 z-10">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>مدت زمان:</span>
          </span>
          {FOCUS_PRESETS.map((p) => {
            const isSelected = settings.pomodoroFocusMinutes === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetSelect(p)}
                disabled={pomodoroIsRunning}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                } ${pomodoroIsRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {settings.persianDigits ? toPersianDigits(p) : p} دقیقه
              </button>
            );
          })}

          {/* Custom active pill if selected time is not in presets */}
          {!FOCUS_PRESETS.includes(settings.pomodoroFocusMinutes) && (
            <button
              type="button"
              onClick={() => {
                setCustomMinutes(settings.pomodoroFocusMinutes);
                setShowCustomModal(true);
              }}
              disabled={pomodoroIsRunning}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer bg-purple-600 text-white shadow-md shadow-purple-950/60 font-black ${
                pomodoroIsRunning ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {settings.persianDigits
                ? toPersianDigits(settings.pomodoroFocusMinutes)
                : settings.pomodoroFocusMinutes}{' '}
              دقیقه (سفارشی)
            </button>
          )}

          {/* Custom Time Button */}
          <button
            type="button"
            onClick={() => {
              setCustomMinutes(settings.pomodoroFocusMinutes || 25);
              setShowCustomModal(true);
            }}
            disabled={pomodoroIsRunning}
            className={`py-1.5 px-3 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 ${
              pomodoroIsRunning ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title="تنظیم زمان دلخواه"
          >
            <Edit3 className="w-3 h-3" />
            <span>زمان دلخواه...</span>
          </button>
        </div>

        {/* Circular SVG Timer Dial */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center z-10">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background track circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="transparent"
              stroke="#8b5cf6"
              strokeWidth="8"
              strokeDasharray="565.48"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Time digits & central status inside dial */}
          <div className="absolute flex flex-col items-center justify-center text-center select-none">
            <div className="text-4xl sm:text-6xl font-black text-slate-100 font-mono tracking-tight">
              {settings.persianDigits ? toPersianDigits(timeFormatted) : timeFormatted}
            </div>

            <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/70">
              <span className={`w-2 h-2 rounded-full ${pomodoroIsRunning ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-semibold text-slate-300">
                {pomodoroIsRunning ? 'در حال تمرکز فعال' : 'آماده برای شروع'}
              </span>
            </div>
          </div>
        </div>

        {/* Task linking */}
        <div className="w-full max-w-sm mt-8 z-10">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 text-center flex items-center justify-center gap-1">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>اتصال به وظیفه مشخص (اختیاری):</span>
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={pomodoroIsRunning}
            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500 transition ${
              pomodoroIsRunning ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <option value="">تمرکز عمومی (بدون اتصال به وظیفه خاص)</option>
            {allTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 mt-8 z-10">
          {/* Reset button */}
          <button
            type="button"
            onClick={() => resetPomodoro()}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer border border-slate-700 shadow-md active:scale-95"
            title="شروع مجدد تایمر"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Primary Action Button (Start/Pause) */}
          <button
            type="button"
            onClick={handleInitiateStart}
            className={`px-8 sm:px-10 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 shadow-lg transition cursor-pointer active:scale-95 ${
              pomodoroIsRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40'
            }`}
          >
            {pomodoroIsRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>توقف موقت</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>شروع تمرکز</span>
              </>
            )}
          </button>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() =>
              updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })
            }
            className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-md active:scale-95 ${
              settings.soundEffectsEnabled
                ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={settings.soundEffectsEnabled ? 'صدا روشن' : 'صدا خاموش'}
          >
            {settings.soundEffectsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Lock indicator status badge if strictly locked */}
        {pomodoroIsRunning && pomodoroStrictLock && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-semibold shadow-md z-10">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>حالت قفل تمرکز فعال است (خروج و تغییر بخش‌ها مسدود شده)</span>
          </div>
        )}
      </div>

      {/* Mandatory Lock Confirmation Modal with Motion Entry */}
      <AnimatePresence>
        {showLockPrompt && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">تنظیم وضعیت تمرکز و قفل صفحه</h3>
                  <p className="text-xs text-slate-400 mt-0.5">قبل از شروع تایمر لطفاً حالت دلخواه را مشخص کنید:</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-200">
                  آیا می‌خواهید پس از استارت تایمر، در این صفحه قفل شوید تا امکان خروج یا باز کردن بخش‌های دیگر وجود نداشته باشد؟
                </p>
                <p className="text-[11px] text-slate-400">
                  • <strong>قفل کامل تمرکز (پیشنهادی):</strong> نوار منو و سایر تب‌ها پنهان و قفل می‌شوند تا تمرکز ۱۰۰٪ حفظ شود.
                  <br />
                  • <strong>حالت عادی:</strong> امکان مشاهده سایر بخش‌ها در حین کار تایمر باز می‌ماند.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleConfirmStartWithChoice(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer transition"
                >
                  <Lock className="w-4 h-4" />
                  <span>بله، قفل شود و شروع کن</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleConfirmStartWithChoice(false)}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition"
                >
                  <Unlock className="w-4 h-4 text-slate-400" />
                  <span>خیر، حالت عادی شروع کن</span>
                </motion.button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowLockPrompt(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition py-1"
                >
                  انصراف و بازگشت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Duration Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">تنظیم زمان دلخواه تمرکز</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">مدت زمان جلسه تمرکز را بر حسب دقیقه وارد کنید</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stepper + Direct Input */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">مدت زمان تمرکز (دقیقه):</span>

                <div className="flex items-center justify-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setCustomMinutes((prev) => Math.max(1, prev - 5))}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
                    title="-۵ دقیقه"
                  >
                    -۵
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMinutes((prev) => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition cursor-pointer"
                    title="-۱ دقیقه"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex-1 max-w-[120px]">
                    <input
                      type="number"
                      min={1}
                      max={360}
                      value={customMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setCustomMinutes(isNaN(val) ? 0 : val);
                      }}
                      className="w-full text-center text-3xl font-black text-slate-100 bg-slate-900/90 border border-purple-500/60 focus:border-purple-400 rounded-xl py-2 px-1 focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomMinutes((prev) => Math.min(360, prev + 1))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition cursor-pointer"
                    title="+۱ دقیقه"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMinutes((prev) => Math.min(360, prev + 5))}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
                    title="+۵ دقیقه"
                  >
                    +۵
                  </button>
                </div>

                {/* Quick select chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  {[10, 20, 30, 40, 50, 75, 120].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setCustomMinutes(quick)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        customMinutes === quick
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {settings.persianDigits ? toPersianDigits(quick) : quick}د
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleApplyCustomDuration}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت و اعمال زمان</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer active:scale-95 transition"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History & Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">تاریخچه و سوابق تمرکز</h3>
          </div>
          <span className="text-xs font-mono text-purple-300 font-bold">
            مجموع زمان تمرکز: {settings.persianDigits ? toPersianDigits(totalFocusMinutes) : totalFocusMinutes} دقیقه
          </span>
        </div>

        {allSessions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            هنوز سشن تمرکزی تکمیل نشده است. پس از اتمام تایمر، گزارش آن در اینجا ثبت می‌شود.
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {allSessions.slice(0, 10).map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-slate-200">
                    سشن تمرکز ({settings.persianDigits ? toPersianDigits(s.durationMinutes) : s.durationMinutes} دقیقه)
                    {s.taskTitle ? ` - ${s.taskTitle}` : ''}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatToJalali(s.completedAt, 'short', settings.persianDigits)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
