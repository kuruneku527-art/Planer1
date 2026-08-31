import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import {
  formatToJalali,
  toPersianDigits,
  toGregorianIsoDate,
  jalaliToGregorian,
  gregorianToJalali,
} from '../../utils/jalali';
import { TimeBlock, Priority } from '../../types';
import { Badge } from '../common/Badge';
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Star,
  Clock,
  Sparkles,
} from 'lucide-react';

export const DailyPlannerView: React.FC = () => {
  const { refreshTrigger, refreshDb, settings, showToast } = useApp();

  const [currentDateIso, setCurrentDateIso] = useState<string>(toGregorianIsoDate());
  const [newPriorityText, setNewPriorityText] = useState('');
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState('10:30');
  const [newBlockCategory, setNewBlockCategory] = useState<'work' | 'study' | 'personal' | 'health'>('work');
  const [dailyNoteText, setDailyNoteText] = useState('');

  // Daily plan from DB
  const dailyPlan = useMemo(() => {
    return db.getDailyPlan(currentDateIso);
  }, [currentDateIso, refreshTrigger]);

  const tasksForDay = useMemo(() => {
    return db.getTasks().filter((t) => !t.dueDate || t.dueDate === currentDateIso);
  }, [currentDateIso, refreshTrigger]);

  // Navigate next/prev day
  const handlePrevDay = () => {
    const d = new Date(currentDateIso);
    d.setDate(d.getDate() - 1);
    setCurrentDateIso(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateIso);
    d.setDate(d.getDate() + 1);
    setCurrentDateIso(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setCurrentDateIso(toGregorianIsoDate());
  };

  // Add top priority
  const handleAddTopPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityText.trim()) return;
    const existing = dailyPlan?.topPriorities || [];
    if (existing.length >= 5) {
      showToast('حداکثر ۵ اولویت اصلی می‌توانید تعیین کنید.', 'warning');
      return;
    }
    const updated = [
      ...existing,
      { id: `prio_${Date.now()}`, text: newPriorityText.trim(), completed: false },
    ];
    db.saveDailyPlan({
      id: dailyPlan?.id || `plan_${currentDateIso}`,
      date: currentDateIso,
      topPriorities: updated,
      timeBlocks: dailyPlan?.timeBlocks || [],
      notes: dailyPlan?.notes,
      productivityScore: dailyPlan?.productivityScore,
      createdAt: dailyPlan?.createdAt || new Date().toISOString(),
    });
    setNewPriorityText('');
    showToast('اولویت روزانه افزوده شد.', 'success');
    refreshDb();
  };

  const handleTogglePriority = (id: string) => {
    if (!dailyPlan) return;
    const updated = dailyPlan.topPriorities.map((p) =>
      p.id === id ? { ...p, completed: !p.completed } : p
    );
    db.saveDailyPlan({ ...dailyPlan, topPriorities: updated });
    refreshDb();
  };

  const handleDeletePriority = (id: string) => {
    if (!dailyPlan) return;
    const updated = dailyPlan.topPriorities.filter((p) => p.id !== id);
    db.saveDailyPlan({ ...dailyPlan, topPriorities: updated });
    refreshDb();
  };

  // Add TimeBlock
  const handleAddTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim()) return;
    const existing = dailyPlan?.timeBlocks || [];
    const newBlock: TimeBlock = {
      id: `tb_${Date.now()}`,
      title: newBlockTitle.trim(),
      startTime: newBlockStart,
      endTime: newBlockEnd,
      category: newBlockCategory,
      completed: false,
    };
    const updated = [...existing, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime));
    db.saveDailyPlan({
      id: dailyPlan?.id || `plan_${currentDateIso}`,
      date: currentDateIso,
      topPriorities: dailyPlan?.topPriorities || [],
      timeBlocks: updated,
      notes: dailyPlan?.notes,
      productivityScore: dailyPlan?.productivityScore,
      createdAt: dailyPlan?.createdAt || new Date().toISOString(),
    });
    setNewBlockTitle('');
    showToast('بازه زمانی (Time Block) با موفقیت ثبت شد.', 'success');
    refreshDb();
  };

  const handleToggleTimeBlock = (id: string) => {
    if (!dailyPlan) return;
    const updated = dailyPlan.timeBlocks.map((b) =>
      b.id === id ? { ...b, completed: !b.completed } : b
    );
    db.saveDailyPlan({ ...dailyPlan, timeBlocks: updated });
    refreshDb();
  };

  const handleDeleteTimeBlock = (id: string) => {
    if (!dailyPlan) return;
    const updated = dailyPlan.timeBlocks.filter((b) => b.id !== id);
    db.saveDailyPlan({ ...dailyPlan, timeBlocks: updated });
    refreshDb();
  };

  const handleSaveNotes = () => {
    db.saveDailyPlan({
      id: dailyPlan?.id || `plan_${currentDateIso}`,
      date: currentDateIso,
      topPriorities: dailyPlan?.topPriorities || [],
      timeBlocks: dailyPlan?.timeBlocks || [],
      notes: dailyNoteText,
      productivityScore: dailyPlan?.productivityScore,
      createdAt: dailyPlan?.createdAt || new Date().toISOString(),
    });
    showToast('یادداشت روزانه ذخیره شد.', 'success');
    refreshDb();
  };

  const formattedJalaliDate = formatToJalali(currentDateIso, 'full', settings.persianDigits);

  return (
    <div id="daily-planner-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-400" />
            <span>برنامه روزانه (Daily Planner)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تمرکز بر اولویت‌های کلیدی روز و مسدودسازی زمانی (Time-Blocking)
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="روز قبل"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-slate-200 px-3 min-w-[140px] text-center">
            {formattedJalaliDate}
          </span>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="روز بعد"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-medium hover:bg-purple-900 transition cursor-pointer"
          >
            امروز
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top 3 Priorities & Daily Notes */}
        <div className="space-y-6">
          {/* Top Priorities of the Day */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">اولویت‌های اصلی امروز (Top Priorities)</h3>
            </div>

            <form onSubmit={handleAddTopPriority} className="flex gap-2">
              <input
                type="text"
                value={newPriorityText}
                onChange={(e) => setNewPriorityText(e.target.value)}
                placeholder="مهم‌ترین کار امروز چیست؟"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2">
              {!dailyPlan?.topPriorities || dailyPlan.topPriorities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-800/20 rounded-xl border border-slate-800/50">
                  هنوز اولویت اصلی برای امروز مشخص نکرده‌اید.
                </p>
              ) : (
                dailyPlan.topPriorities.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs group"
                  >
                    <div
                      onClick={() => handleTogglePriority(p.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <button type="button" className="text-slate-400 hover:text-purple-400">
                        {p.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`truncate ${p.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {p.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePriority(p.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Notes & Reflections */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-100 text-sm">یادداشت و بازتاب پایانی روز</h3>
            <textarea
              rows={4}
              defaultValue={dailyPlan?.notes || ''}
              onChange={(e) => setDailyNoteText(e.target.value)}
              placeholder="دستاوردهای امروز، نکات یادگیری، قدردانی یا موانع..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              ذخیره یادداشت روز
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Time-Blocking Schedule */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-slate-100 text-base">جدول زمان‌بندی و بلوک‌های تمرکز</h3>
            </div>
          </div>

          {/* Add TimeBlock Form */}
          <form
            onSubmit={handleAddTimeBlock}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center"
          >
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newBlockTitle}
                onChange={(e) => setNewBlockTitle(e.target.value)}
                placeholder="عنوان فعالیت (مثلاً: برنامه‌نویسی ماژول...)"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1">
              <input
                type="time"
                value={newBlockStart}
                onChange={(e) => setNewBlockStart(e.target.value)}
                className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              />
              <span className="text-slate-500 text-xs">-</span>
              <input
                type="time"
                value={newBlockEnd}
                onChange={(e) => setNewBlockEnd(e.target.value)}
                className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن بلوک</span>
            </button>
          </form>

          {/* TimeBlocks Timeline */}
          <div className="space-y-3">
            {!dailyPlan?.timeBlocks || dailyPlan.timeBlocks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800/40">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p className="text-sm font-medium text-slate-400">بلوک زمانی برای این روز تعریف نشده است</p>
                <p className="text-xs text-slate-500 mt-1">
                  با تکنیک Time Blocking، ساعات روز خود را برای تمرکز عمیق رزرو کنید.
                </p>
              </div>
            ) : (
              dailyPlan.timeBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 group ${
                    block.completed
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-purple-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTimeBlock(block.id)}
                      className="text-slate-400 hover:text-purple-400 transition cursor-pointer"
                    >
                      {block.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          block.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {block.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-purple-300 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {settings.persianDigits ? toPersianDigits(block.startTime) : block.startTime} تا{' '}
                          {settings.persianDigits ? toPersianDigits(block.endTime) : block.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTimeBlock(block.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
