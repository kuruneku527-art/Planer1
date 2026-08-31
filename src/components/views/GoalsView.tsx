import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Goal, GoalType, GoalStatus } from '../../types';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  Check,
  Award,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'short_term' | 'long_term'>('all');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const allGoals = useMemo(() => db.getGoals(), [refreshTrigger]);

  const filteredGoals = useMemo(() => {
    if (activeTab === 'all') return allGoals;
    return allGoals.filter((g) => g.type === activeTab);
  }, [allGoals, activeTab]);

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    const goal = db.getGoal(goalId);
    if (!goal) return;
    const milestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const allDone = milestones.length > 0 && milestones.every((m) => m.completed);
    const newStatus: GoalStatus = allDone ? 'achieved' : 'in_progress';
    db.saveGoal({ ...goal, milestones, status: newStatus });
    refreshDb();
  };

  const handleDeleteGoal = (goal: Goal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف هدف',
      message: `آیا از حذف هدف «${goal.title}» مطمئن هستید؟`,
      onConfirm: () => {
        db.deleteGoal(goal.id);
        showToast('هدف حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  return (
    <div id="goals-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            <span>اهداف و چشم‌انداز (Goals & Vision)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف اهداف کوتاه‌مدت و بلندمدت و شکستن آن‌ها به گام‌های عملی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Filters */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              همه اهداف
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('short_term')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'short_term' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              کوتاه‌مدت
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('long_term')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'long_term' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              بلندمدت
            </button>
          </div>

          <button
            type="button"
            onClick={() => openQuickAdd('goal')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>هدف جدید</span>
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      {allGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="هنوز هدفی تعریف نشده است"
          description="اهداف شغلی، مالی، سلامتی، تحصیلی یا شخصی خود را ثبت کرده و مراحل تحقق آن را بسازید."
          actionText="تعریف اولین هدف"
          onAction={() => openQuickAdd('goal')}
        />
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-sm font-medium">هدفی در این دسته‌بندی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.completed).length;
            const totalMilestones = goal.milestones.length;
            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition group shadow-sm ${
                  goal.status === 'achieved'
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-purple-800/50'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                        goal.type === 'short_term'
                          ? 'bg-blue-950 text-blue-300 border-blue-800/40'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-800/40'
                      }`}
                    >
                      {goal.type === 'short_term' ? 'کوتاه‌مدت' : 'بلندمدت'}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGoal(goal, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1 flex items-center gap-2">
                    {goal.status === 'achieved' && <Award className="w-4 h-4 text-emerald-400" />}
                    <span>{goal.title}</span>
                  </h3>

                  {goal.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {goal.description}
                    </p>
                  )}

                  {/* Milestones Checklist */}
                  {totalMilestones > 0 && (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">گام‌های پیشرفت:</span>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {goal.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(goal.id, m.id)}
                            className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-purple-300 transition"
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                m.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'
                              }`}
                            >
                              {m.completed && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className={m.completed ? 'line-through text-slate-500' : ''}>
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress & Target Date */}
                <div className="pt-4 mt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>پیشرفت کلی:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {settings.persianDigits ? toPersianDigits(progress) : progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>تاریخ تحقق هدف:</span>
                      <span className="font-mono text-purple-300">
                        {formatToJalali(goal.targetDate, 'date_only', settings.persianDigits)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
