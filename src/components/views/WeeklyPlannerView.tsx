import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import {
  formatToJalali,
  toPersianDigits,
  toGregorianIsoDate,
  gregorianToJalali,
  jalaliToGregorian,
} from '../../utils/jalali';
import {
  Columns3,
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle2,
  Circle,
  Target,
  Calendar,
} from 'lucide-react';

export const WeeklyPlannerView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast } = useApp();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Compute 7 days of the current week (Saturday to Friday)
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);

    // Find Saturday of this week
    const jsDay = today.getDay(); // 0=Sun..6=Sat
    const daysSinceSaturday = (jsDay + 1) % 7;

    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysSinceSaturday);

    const days = [];
    const dayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const jalaliStr = formatToJalali(iso, 'date_only', settings.persianDigits);
      days.push({
        name: dayLabels[i],
        dateIso: iso,
        jalaliStr,
        isToday: iso === toGregorianIsoDate(),
        isFriday: i === 6,
      });
    }
    return days;
  }, [currentWeekOffset, settings.persianDigits]);

  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);

  const handleToggleTask = (id: string) => {
    db.toggleTaskStatus(id);
    refreshDb();
  };

  return (
    <div id="weekly-planner-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Columns3 className="w-6 h-6 text-purple-400" />
            <span>برنامه هفتگی (Weekly Planner)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            نگاه جامع به برنامه‌ها و وظایف ۷ روز هفته از شنبه تا جمعه
          </p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="هفته قبل"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-slate-200 px-3 min-w-[140px] text-center">
            {weekDays[0].jalaliStr} تا {weekDays[6].jalaliStr}
          </span>

          <button
            type="button"
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="هفته بعد"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {currentWeekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setCurrentWeekOffset(0)}
              className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-medium hover:bg-purple-900 transition cursor-pointer"
            >
              هفته جاری
            </button>
          )}
        </div>
      </div>

      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayTasks = allTasks.filter((t) => t.dueDate === day.dateIso);

          return (
            <div
              key={day.dateIso}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[350px] transition ${
                day.isToday
                  ? 'bg-purple-950/20 border-purple-600/60 ring-1 ring-purple-600/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        day.isFriday ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {day.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{day.jalaliStr}</span>
                  </div>

                  {day.isToday && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">
                      امروز
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-slate-600">
                      وظیفه‌ای نیست
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-2 rounded-xl text-xs border transition cursor-pointer flex items-start gap-2 ${
                          task.status === 'completed'
                            ? 'bg-slate-800/20 border-slate-800/40 text-slate-500 line-through'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-200 hover:border-purple-800/50'
                        }`}
                      >
                        <button type="button" className="mt-0.5 flex-shrink-0">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                        <span className="truncate leading-tight">{task.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Day Footer / Quick Add */}
              <button
                type="button"
                onClick={() => openQuickAdd('task')}
                className="w-full mt-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-purple-300 text-[11px] border border-slate-800/80 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
