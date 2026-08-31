import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { TimeCategory, TimeEntry } from '../../types';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import { Modal } from '../common/Modal';
import {
  Clock,
  Play,
  Square,
  Plus,
  Trash2,
  PieChart,
  LayoutGrid,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';

export const TimeManagementView: React.FC = () => {
  const { refreshTrigger, refreshDb, settings, showToast, showConfirm, openQuickAdd } = useApp();

  const [activeTab, setActiveTab] = useState<'eisenhower' | 'tracker'>('eisenhower');
  const [timerTitle, setTimerTitle] = useState('');
  const [timerCategory, setTimerCategory] = useState<TimeCategory>('work');
  const [activeRunningTimer, setActiveRunningTimer] = useState<{
    id: string;
    title: string;
    category: TimeCategory;
    startTime: number;
  } | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);
  const allTimeEntries = useMemo(() => db.getTimeEntries(), [refreshTrigger]);

  // Timer interval
  React.useEffect(() => {
    let interval: any = null;
    if (activeRunningTimer) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - activeRunningTimer.startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeRunningTimer]);

  const handleStartTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timerTitle.trim()) {
      showToast('لطفاً عنوان فعالیت را وارد کنید.', 'error');
      return;
    }
    setActiveRunningTimer({
      id: `timer_${Date.now()}`,
      title: timerTitle.trim(),
      category: timerCategory,
      startTime: Date.now(),
    });
    setTimerTitle('');
    showToast('ثبت زمان شروع شد.', 'success');
  };

  const handleStopTracker = () => {
    if (!activeRunningTimer) return;
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const newEntry: TimeEntry = {
      id: `entry_${Date.now()}`,
      title: activeRunningTimer.title,
      category: activeRunningTimer.category,
      durationMinutes,
      date: toGregorianIsoDate(),
      createdAt: new Date().toISOString(),
    };
    db.saveTimeEntry(newEntry);
    setActiveRunningTimer(null);
    showToast(`مدت ${durationMinutes} دقیقه زمان با موفقیت ذخیره شد.`, 'success');
    refreshDb();
  };

  const handleDeleteTimeEntry = (id: string) => {
    db.deleteTimeEntry(id);
    refreshDb();
  };

  // Eisenhower Quadrants
  // Q1: Urgent & Important (urgent priority)
  // Q2: Important & Not Urgent (high priority)
  // Q3: Urgent & Not Important (medium priority)
  // Q4: Neither (low priority)
  const q1Tasks = allTasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
  const q2Tasks = allTasks.filter((t) => t.priority === 'high' && t.status !== 'completed');
  const q3Tasks = allTasks.filter((t) => t.priority === 'medium' && t.status !== 'completed');
  const q4Tasks = allTasks.filter((t) => t.priority === 'low' && t.status !== 'completed');

  const handleToggleTask = (id: string) => {
    db.toggleTaskStatus(id);
    refreshDb();
  };

  const timerMin = Math.floor(elapsedSeconds / 60);
  const timerSec = elapsedSeconds % 60;
  const runningTimeStr = `${String(timerMin).padStart(2, '0')}:${String(timerSec).padStart(2, '0')}`;

  const categoryLabels: Record<TimeCategory, string> = {
    work: 'کار و حرفه',
    study: 'مطالعه و آموزش',
    meeting: 'جلسات و گفتگو',
    exercise: 'ورزش و تندرستی',
    reading: 'کتاب‌خوانی',
    break: 'استراحت',
    personal: 'کارهای شخصی',
    health: 'سلامت و درمان',
    waste: 'اتلاف وقت',
    other: 'سایر موارد',
  };

  return (
    <div id="time-management-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" />
            <span>مدیریت زمان و ماتریکس اولویت‌ها</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ماتریکس آیزنهاور (Eisenhower Matrix) و ردیاب مستقیم زمان صرف‌شده
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('eisenhower')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'eisenhower' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ماتریکس آیزنهاور</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'tracker' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ردیاب زمان (Time Tracker)</span>
          </button>
        </div>
      </div>

      {activeTab === 'eisenhower' ? (
        /* Eisenhower Matrix 4 Quadrants */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Q1: Do First (فوری و مهم) */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-rose-800/30">
                <div>
                  <h3 className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>ربع اول: انجام فوری (مهم و فوری)</span>
                  </h3>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">بحران‌ها، ضرب‌الاجل‌ها و فوریت‌ها</p>
                </div>
                <span className="text-xs font-bold font-mono text-rose-300">
                  {settings.persianDigits ? toPersianDigits(q1Tasks.length) : q1Tasks.length}
                </span>
              </div>

              <div className="space-y-1.5 mt-3 max-h-52 overflow-y-auto">
                {q1Tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">وظیفه فوری و بحرانی وجود ندارد</p>
                ) : (
                  q1Tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-900/40 text-xs text-slate-200 flex items-center gap-2 cursor-pointer hover:border-rose-700"
                    >
                      <Circle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openQuickAdd('task')}
              className="w-full py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 text-xs font-medium border border-rose-800/50 transition cursor-pointer"
            >
              + افزودن وظیفه فوری
            </button>
          </div>

          {/* Q2: Schedule (مهم و غیرفوری) - حیاتی‌ترین ربع رشد */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-3 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-indigo-800/30">
                <div>
                  <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>ربع دوم: برنامه‌ریزی استراتژیک (مهم و غیرفوری)</span>
                  </h3>
                  <p className="text-[11px] text-indigo-400/80 mt-0.5">رشد، یادگیری، ورزش، اهداف بلندمدت</p>
                </div>
                <span className="text-xs font-bold font-mono text-indigo-300">
                  {settings.persianDigits ? toPersianDigits(q2Tasks.length) : q2Tasks.length}
                </span>
              </div>

              <div className="space-y-1.5 mt-3 max-h-52 overflow-y-auto">
                {q2Tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">وظیفه‌ای در این ربع ثبت نشده است</p>
                ) : (
                  q2Tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-indigo-900/40 text-xs text-slate-200 flex items-center gap-2 cursor-pointer hover:border-indigo-700"
                    >
                      <Circle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openQuickAdd('task')}
              className="w-full py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 text-xs font-medium border border-indigo-800/50 transition cursor-pointer"
            >
              + افزودن به ربع دوم
            </button>
          </div>

          {/* Q3: Delegate (فوری و غیرمهم) */}
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-amber-800/30">
                <div>
                  <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>ربع سوم: واگذاری یا اقدام سریع (فوری و غیرمهم)</span>
                  </h3>
                  <p className="text-[11px] text-amber-400/80 mt-0.5">وقفه‌ها، برخی تماس‌ها و درخواست‌های دیگران</p>
                </div>
                <span className="text-xs font-bold font-mono text-amber-300">
                  {settings.persianDigits ? toPersianDigits(q3Tasks.length) : q3Tasks.length}
                </span>
              </div>

              <div className="space-y-1.5 mt-3 max-h-52 overflow-y-auto">
                {q3Tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">موردی در این ربع وجود ندارد</p>
                ) : (
                  q3Tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-900/40 text-xs text-slate-200 flex items-center gap-2 cursor-pointer hover:border-amber-700"
                    >
                      <Circle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openQuickAdd('task')}
              className="w-full py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 text-xs font-medium border border-amber-800/50 transition cursor-pointer"
            >
              + افزودن وظیفه
            </button>
          </div>

          {/* Q4: Eliminate (غیرمهم و غیرفوری) */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-300 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>ربع چهارم: حذف یا به حداقل رساندن</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">اتلاف وقت، وبگردی بی‌هدف و فعالیت‌های کم‌ارزش</p>
                </div>
                <span className="text-xs font-bold font-mono text-slate-400">
                  {settings.persianDigits ? toPersianDigits(q4Tasks.length) : q4Tasks.length}
                </span>
              </div>

              <div className="space-y-1.5 mt-3 max-h-52 overflow-y-auto">
                {q4Tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">موردی در این ربع وجود ندارد</p>
                ) : (
                  q4Tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300 flex items-center gap-2 cursor-pointer hover:border-slate-600"
                    >
                      <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openQuickAdd('task')}
              className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              + افزودن
            </button>
          </div>
        </div>
      ) : (
        /* Live Time Tracker */
        <div className="space-y-6">
          {/* Active Tracker Control */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            {activeRunningTimer ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <h3 className="font-bold text-slate-100 text-base">{activeRunningTimer.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    دسته‌بندی: {categoryLabels[activeRunningTimer.category]}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black font-mono text-purple-400 tracking-wider">
                    {settings.persianDigits ? toPersianDigits(runningTimeStr) : runningTimeStr}
                  </span>
                  <button
                    type="button"
                    onClick={handleStopTracker}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-950/50 transition cursor-pointer active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>توقف و ثبت</span>
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleStartTracker}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
              >
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={timerTitle}
                    onChange={(e) => setTimerTitle(e.target.value)}
                    placeholder="در حال انجام چه کاری هستید؟"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <select
                    value={timerCategory}
                    onChange={(e) => setTimerCategory(e.target.value as TimeCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="work">کار و حرفه</option>
                    <option value="study">مطالعه و آموزش</option>
                    <option value="personal">کارهای شخصی</option>
                    <option value="health">سلامت و ورزش</option>
                    <option value="waste">اتلاف وقت</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>شروع تایمر زمان</span>
                </button>
              </form>
            )}
          </div>

          {/* Logged Time Entries List */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">سوابق زمان‌های ثبت‌شده</h3>

            {allTimeEntries.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                هنوز هیچ مدخل زمانی ثبت نشده است. با شروع تایمر، ساعات صرف‌شده ذخیره می‌شوند.
              </p>
            ) : (
              <div className="space-y-2">
                {allTimeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="font-medium text-slate-200 truncate">{entry.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0">
                        {categoryLabels[entry.category]}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-bold font-mono text-purple-300">
                        {settings.persianDigits ? toPersianDigits(entry.durationMinutes) : entry.durationMinutes} دقیقه
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTimeEntry(entry.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
