import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  CheckSquare,
} from 'lucide-react';

export const PomodoroView: React.FC = () => {
  const {
    pomodoroMode,
    setPomodoroMode,
    pomodoroSecondsLeft,
    pomodoroIsRunning,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    settings,
    updateSettings,
    refreshTrigger,
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

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

  // Calculate circular progress
  const totalSecondsForMode =
    pomodoroMode === 'focus'
      ? settings.pomodoroFocusMinutes * 60
      : pomodoroMode === 'short_break'
      ? settings.pomodoroShortBreakMinutes * 60
      : settings.pomodoroLongBreakMinutes * 60;

  const progressPercent = ((totalSecondsForMode - pomodoroSecondsLeft) / totalSecondsForMode) * 100;
  const strokeDashoffset = 565.48 - (565.48 * progressPercent) / 100;

  return (
    <div id="pomodoro-view" className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
          <Timer className="w-7 h-7 text-purple-400" />
          <span>تایمر تمرکز عمیق (پومودورو)</span>
        </h2>
        <p className="text-xs text-slate-400">
          ۲۵ دقیقه تمرکز پیوسته، ۵ دقیقه استراحت برای بیشینه‌سازی بهره‌وری ذهنی
        </p>
      </div>

      {/* Main Pomodoro Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center shadow-xl relative overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-800 border border-slate-700 mb-6 sm:mb-8 z-10 w-full sm:w-auto overflow-x-auto justify-center">
          <button
            type="button"
            onClick={() => setPomodoroMode('focus')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              pomodoroMode === 'focus'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تمرکز ({settings.persianDigits ? toPersianDigits(settings.pomodoroFocusMinutes) : settings.pomodoroFocusMinutes}د)
          </button>
          <button
            type="button"
            onClick={() => setPomodoroMode('short_break')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              pomodoroMode === 'short_break'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            استراحت کوتاه ({settings.persianDigits ? toPersianDigits(settings.pomodoroShortBreakMinutes) : settings.pomodoroShortBreakMinutes}د)
          </button>
          <button
            type="button"
            onClick={() => setPomodoroMode('long_break')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              pomodoroMode === 'long_break'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            استراحت بلند ({settings.persianDigits ? toPersianDigits(settings.pomodoroLongBreakMinutes) : settings.pomodoroLongBreakMinutes}د)
          </button>
        </div>

        {/* Circular SVG Timer */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center z-10">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="transparent"
              stroke={
                pomodoroMode === 'focus'
                  ? '#8b5cf6'
                  : pomodoroMode === 'short_break'
                  ? '#10b981'
                  : '#6366f1'
              }
              strokeWidth="10"
              strokeDasharray="565.48"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time digits inside circle */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl sm:text-5xl font-black text-slate-100 font-mono tracking-tight">
              {settings.persianDigits ? toPersianDigits(timeFormatted) : timeFormatted}
            </span>
            <span className="text-xs font-semibold text-purple-400 mt-2">
              {pomodoroMode === 'focus'
                ? 'بازه تمرکز فعال'
                : pomodoroMode === 'short_break'
                ? 'زمان استراحت کوتاه'
                : 'زمان استراحت بلند'}
            </span>
          </div>
        </div>

        {/* Task linking */}
        <div className="w-full max-w-sm mt-6 z-10">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 text-center">
            تسک مرتبط با این سشن تمرکز:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="">تمرکز عمومی (بدون اتصال به وظیفه خاص)</option>
            {allTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8 z-10">
          <button
            type="button"
            onClick={resetPomodoro}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer border border-slate-700"
            title="شروع مجدد این بازه"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={pomodoroIsRunning ? pausePomodoro : () => startPomodoro(selectedTaskId)}
            className={`px-8 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2 shadow-xl transition cursor-pointer active:scale-95 ${
              pomodoroIsRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
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

          <button
            type="button"
            onClick={() =>
              updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })
            }
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              settings.soundEffectsEnabled
                ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={settings.soundEffectsEnabled ? 'صدا روشن' : 'صدا خاموش'}
          >
            {settings.soundEffectsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* History & Statistics */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">تاریخچه و سوابق تمرکز</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
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
              <div
                key={s.id}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-slate-200">
                    {s.mode === 'focus' ? 'سشن تمرکز' : 'استراحت'} ({s.durationMinutes} دقیقه)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatToJalali(s.completedAt, 'short', settings.persianDigits)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
