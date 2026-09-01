import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import {
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthDays,
  toPersianDigits,
  formatToJalali,
  toGregorianIsoDate,
} from '../../utils/jalali';
import { Modal } from '../common/Modal';
import { CalendarEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  MapPin,
  Trash2,
  CheckSquare,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const today = new Date();
  const { jy: jYear, jm: jMonth, jd: jDay } = gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  const [currentYear, setCurrentYear] = useState(jYear);
  const [currentMonth, setCurrentMonth] = useState(jMonth);
  const [selectedDay, setSelectedDay] = useState<number>(jDay);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(toGregorianIsoDate());

  // Database events and tasks
  const allEvents = useMemo(() => db.getEvents(), [refreshTrigger]);
  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);

  const monthNames = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];

  const weekDayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(jYear);
    setCurrentMonth(jMonth);
    setSelectedDay(jDay);
    setSelectedDateIso(toGregorianIsoDate());
  };

  // Build grid for current Jalali month
  const daysInMonth = getJalaliMonthDays(currentYear, currentMonth);

  // First day of month's day of week (0 = Saturday, 6 = Friday)
  const { gy: fGy, gm: fGm, gd: fGd } = jalaliToGregorian(currentYear, currentMonth, 1);
  const firstDayDateObj = new Date(fGy, fGm - 1, fGd);
  const jsDay = firstDayDateObj.getDay();
  const firstDayOffset = (jsDay + 1) % 7;

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const { gy, gm, gd } = jalaliToGregorian(currentYear, currentMonth, day);
    const iso = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
    setSelectedDateIso(iso);
  };

  // Events on selected day
  const selectedDayEvents = useMemo(() => {
    return allEvents.filter((e) => e.startDate === selectedDateIso);
  }, [allEvents, selectedDateIso]);

  // Tasks due on selected day
  const selectedDayTasks = useMemo(() => {
    return allTasks.filter((t) => t.dueDate === selectedDateIso);
  }, [allTasks, selectedDateIso]);

  const handleDeleteEvent = (event: CalendarEvent) => {
    showConfirm({
      title: 'حذف رویداد',
      message: `آیا از حذف رویداد «${event.title}» اطمینان دارید؟`,
      onConfirm: () => {
        db.deleteEvent(event.id);
        showToast('رویداد با موفقیت حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  const handleToggleTask = (taskId: string) => {
    db.toggleTaskStatus(taskId);
    refreshDb();
  };

  return (
    <div id="calendar-view" className="space-y-4 sm:space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <span>تقویم جامع خورشیدی</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده رویدادها، سررسیدها و برنامه‌ریزی ماهانه و روزانه
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
          {/* Month & Year Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <span className="text-xs sm:text-sm font-bold text-slate-200 px-2 min-w-[110px] sm:min-w-[130px] text-center">
              {monthNames[currentMonth - 1]} {settings.persianDigits ? toPersianDigits(currentYear) : currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-300 text-xs font-semibold transition cursor-pointer"
          >
            امروز
          </button>

          <button
            type="button"
            onClick={() => openQuickAdd('event')}
            className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>رویداد</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Calendar Matrix + Day Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar Month Grid */}
        <div className="lg:col-span-2 p-3.5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 sm:space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] sm:text-xs text-slate-400 pb-2 border-b border-slate-800">
            {weekDayNames.map((d, i) => (
              <div
                key={d}
                className={`py-1.5 sm:py-2 rounded-lg ${i === 6 ? 'text-rose-400' : 'text-slate-400'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Empty slots for offset */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`offset_${idx}`} className="h-12 sm:h-20 rounded-lg sm:rounded-xl bg-slate-900/20" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday =
                currentYear === jYear && currentMonth === jMonth && dayNum === jDay;
              const isSelected = selectedDay === dayNum;

              // Convert to Gregorian ISO to check events
              const { gy, gm, gd } = jalaliToGregorian(currentYear, currentMonth, dayNum);
              const iso = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;

              const dayEvents = allEvents.filter((e) => e.startDate === iso);
              const dayTasks = allTasks.filter((t) => t.dueDate === iso);

              // Check if Friday
              const dayOfWeek = (firstDayOffset + idx) % 7;
              const isFriday = dayOfWeek === 6;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-12 sm:h-20 p-1 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col justify-between transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-purple-950/70 border-purple-500 ring-1 ring-purple-500'
                      : isToday
                      ? 'bg-slate-800/90 border-purple-600/60'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold font-mono ${
                        isToday
                          ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] sm:text-xs'
                          : isFriday
                          ? 'text-rose-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {settings.persianDigits ? toPersianDigits(dayNum) : dayNum}
                    </span>

                    {(dayEvents.length > 0 || dayTasks.length > 0) && (
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {dayEvents.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        )}
                        {dayTasks.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop Preview */}
                  <div className="hidden sm:block space-y-0.5 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 1).map((evt) => (
                      <div
                        key={evt.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate bg-purple-900/60 text-purple-200 border border-purple-700/30"
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 1).map((tsk) => (
                      <div
                        key={tsk.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate bg-slate-700/60 text-slate-300"
                      >
                        ✓ {tsk.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Sidebar */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 mb-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  برنامه‌های روز {settings.persianDigits ? toPersianDigits(selectedDay) : selectedDay} {monthNames[currentMonth - 1]}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatToJalali(selectedDateIso, 'full', settings.persianDigits)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => openQuickAdd('event')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 transition"
                title="افزودن رویداد به این روز"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Events List for Selected Day */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>رویدادها و جلسات:</span>
                </h4>

                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">هیچ رویدادی برای این روز ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-100 text-xs truncate">{ev.title}</h5>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev)}
                            className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <span>
                              {settings.persianDigits ? toPersianDigits(ev.startTime) : ev.startTime} تا{' '}
                              {settings.persianDigits ? toPersianDigits(ev.endTime) : ev.endTime}
                            </span>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1 font-sans">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks due on this day */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>وظایف با سررسید این روز:</span>
                </h4>

                {selectedDayTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">وظیفه‌ای برای این روز تنظیم نشده است.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTask(t.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                          t.status === 'completed'
                            ? 'bg-slate-800/30 border-slate-800/40 text-slate-500 line-through'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-200 hover:border-purple-800/50'
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${
                            t.status === 'completed' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {t.status === 'completed' ? 'انجام شد' : 'در انتظار'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openQuickAdd('task')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold border border-slate-700/60 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن وظیفه به این روز</span>
          </button>
        </div>
      </div>
    </div>
  );
};
