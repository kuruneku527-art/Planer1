import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Habit } from '../../types';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/CustomSelect';
import { TimeOfDaySelector } from '../common/TimeOfDaySelector';
import {
  Flame,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Award,
  Trash2,
  Clock,
  Sparkles,
  ArrowUpDown,
  Filter,
  Edit2,
  Calendar,
  Hash,
  Coffee,
  Check,
} from 'lucide-react';

export const HabitsView: React.FC = () => {
  const { refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const allHabits = useMemo(() => db.getHabits(), [refreshTrigger]);
  const allLogs = useMemo(() => db.getHabitLogs(), [refreshTrigger]);

  // Modal states for creating / editing habit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTime, setFormTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('morning');
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formTargetDays, setFormTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formColor, setFormColor] = useState('#8b5cf6');
  const [formError, setFormError] = useState('');

  // Filtering and sorting
  const [sortBy, setSortBy] = useState<'order' | 'streak' | 'time' | 'title'>('order');
  const [filterTime, setFilterTime] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'anytime'>('all');

  const todayIso = toGregorianIsoDate();

  // Fixed Persian Week calculation (Saturday to Friday)
  // Day 0: Saturday (شنبه)
  // Day 1: Sunday (یکشنبه)
  // Day 2: Monday (دوشنبه)
  // Day 3: Tuesday (سه‌شنبه)
  // Day 4: Wednesday (چهارشنبه)
  // Day 5: Thursday (پنج‌شنبه)
  // Day 6: Friday (جمعه)
  const fixedWeekDays = useMemo(() => {
    const today = new Date();
    const todayJsDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const offsetFromSaturday = (todayJsDay + 1) % 7; // 0 for Saturday, 1 for Sunday, ..., 6 for Friday

    const saturday = new Date(today);
    saturday.setDate(today.getDate() - offsetFromSaturday);

    const dayLabels = [
      { short: 'ش', full: 'شنبه' },
      { short: 'ی', full: 'یکشنبه' },
      { short: 'د', full: 'دوشنبه' },
      { short: 'س', full: 'سه‌شنبه' },
      { short: 'چ', full: 'چهارشنبه' },
      { short: 'پ', full: 'پنج‌شنبه' },
      { short: 'ج', full: 'جمعه' },
    ];

    const days = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + dayIndex);
      const iso = d.toISOString().split('T')[0];
      days.push({
        dayIndex,
        iso,
        shortLabel: dayLabels[dayIndex].short,
        fullLabel: dayLabels[dayIndex].full,
        isToday: iso === todayIso,
      });
    }
    return days;
  }, [todayIso]);

  // Open modal to create a new habit
  const handleOpenAdd = () => {
    setEditingHabitId(null);
    setFormTitle('');
    setFormDesc('');
    setFormTime('morning');
    // Default to 1 (or next integer), but user can type any custom priority
    const nextOrder = allHabits.length > 0 ? Math.max(...allHabits.map((h) => h.order || 1)) + 1 : 1;
    setFormPriority(nextOrder);
    setFormTargetDays([0, 1, 2, 3, 4, 5, 6]);
    setFormColor('#8b5cf6');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal to edit an existing habit
  const handleOpenEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setFormTitle(habit.title);
    setFormDesc(habit.description || '');
    setFormTime(habit.timeOfDay);
    setFormPriority(habit.order || 1);
    setFormTargetDays(habit.targetDays && habit.targetDays.length > 0 ? habit.targetDays : [0, 1, 2, 3, 4, 5, 6]);
    setFormColor(habit.color || '#8b5cf6');
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit create or edit form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('لطفاً عنوان عادت را وارد کنید.');
      return;
    }
    if (formTargetDays.length === 0) {
      setFormError('حداقل یک روز از روزهای هفته را انتخاب کنید.');
      return;
    }

    const priorityNum = Math.max(1, parseInt(String(formPriority), 10) || 1);

    if (editingHabitId) {
      const existing = allHabits.find((h) => h.id === editingHabitId);
      if (existing) {
        db.saveHabit({
          ...existing,
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          timeOfDay: formTime,
          order: priorityNum,
          targetDays: formTargetDays,
          targetDaysPerWeek: formTargetDays.length,
          color: formColor,
        });
        showToast('عادت با موفقیت ویرایش شد.', 'success');
      }
    } else {
      db.saveHabit({
        id: `habit_${Date.now()}`,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        color: formColor,
        icon: 'Flame',
        timeOfDay: formTime,
        order: priorityNum,
        targetDays: formTargetDays,
        targetDaysPerWeek: formTargetDays.length,
        createdAt: new Date().toISOString(),
      });
      showToast('عادت جدید با موفقیت ایجاد شد.', 'success');
    }

    setIsModalOpen(false);
    refreshDb();
  };

  // Toggle log for date
  const handleToggleHabitForDate = (habit: Habit, dateIso: string, isScheduled: boolean) => {
    const isDone = allLogs.some(
      (l) => l.habitId === habit.id && l.date === dateIso && l.completed
    );

    if (isDone) {
      showConfirm({
        title: 'لغو تیک انجام شده',
        message: `آیا از لغو وضعیت انجام شده برای «${habit.title}» در این تاریخ اطمینان دارید؟`,
        confirmText: 'بله، لغو شود',
        cancelText: 'انصراف',
        isDanger: false,
        onConfirm: () => {
          db.toggleHabitLog(habit.id, dateIso);
          refreshDb();
        },
      });
    } else {
      db.toggleHabitLog(habit.id, dateIso);
      refreshDb();
      if (!isScheduled) {
        showToast('آفرین! انجام عادت در روز استراحت ثبت شد.', 'success');
      }
    }
  };

  // Delete habit
  const handleDeleteHabit = (habit: Habit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف عادت',
      message: `آیا از حذف عادت «${habit.title}» مطمئن هستید؟ تمام سوابق استمرار آن پاک خواهد شد.`,
      onConfirm: () => {
        db.deleteHabit(habit.id);
        showToast('عادت با موفقیت حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  // In-place priority change
  const handleQuickChangePriority = (habit: Habit, newOrder: number) => {
    const val = Math.max(1, newOrder);
    db.updateHabitPriority(habit.id, val);
    refreshDb();
    showToast(`اولویت به ${settings.persianDigits ? toPersianDigits(val) : val} تغییر یافت.`, 'info');
  };

  const displayedHabits = useMemo(() => {
    let list = [...allHabits];
    if (filterTime !== 'all') {
      list = list.filter((h) => h.timeOfDay === filterTime);
    }
    if (sortBy === 'order') {
      list.sort((a, b) => (a.order || 9999) - (b.order || 9999) || (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id));
    } else if (sortBy === 'streak') {
      list.sort((a, b) => db.getHabitStreak(b.id) - db.getHabitStreak(a.id));
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'fa'));
    } else if (sortBy === 'time') {
      const order = { morning: 1, afternoon: 2, evening: 3, anytime: 4 };
      list.sort((a, b) => (order[a.timeOfDay] || 9) - (order[b.timeOfDay] || 9));
    }
    return list;
  }, [allHabits, sortBy, filterTime]);

  const timeLabels: Record<string, string> = {
    morning: 'صبحگاه',
    afternoon: 'ظهر / بعدازظهر',
    evening: 'عصر / شب',
    anytime: 'شناور در روز',
  };

  const dayNameList = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  return (
    <div id="habits-view" className="space-y-5 max-w-6xl mx-auto px-1 sm:px-0 w-full overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <span>عادت‌ها و استمرار روزانه (Habit Tracker)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            پیگیری عادات سازنده با روزهای تکرار واقعی، اولویت‌بندی عددی و ترتیب ثابت هفته (شنبه تا جمعه)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>عادت جدید</span>
        </button>
      </div>

      {/* Filter & Sorting Toolbar */}
      {allHabits.length > 0 && (
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Time of day filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs text-slate-400 font-medium pl-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>زمان:</span>
            </span>
            {[
              { id: 'all', label: 'همه' },
              { id: 'morning', label: '🌅 صبح' },
              { id: 'afternoon', label: '☀️ ظهر' },
              { id: 'evening', label: '🌙 شب' },
              { id: 'anytime', label: '⚡ شناور' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterTime(t.id as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  filterTime === t.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sorting selector */}
          <div className="flex items-center gap-2 shrink-0 min-w-[200px]">
            <CustomSelect
              className="w-full sm:w-56"
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'order', label: 'اولویت تعیین‌شده (۱، ۲، ۳...)' },
                { value: 'streak', label: 'بیشترین استمرار (Streak)' },
                { value: 'time', label: 'زمان روز (صبح به شب)' },
                { value: 'title', label: 'حروف الفبا (عنوان)' },
              ]}
            />
          </div>
        </div>
      )}

      {/* Habit List */}
      {displayedHabits.length === 0 ? (
        <EmptyState
          icon={Flame}
          title={allHabits.length === 0 ? 'هنوز عادتی اضافه نکرده‌اید' : 'عادتی در این بازه زمانی یافت نشد'}
          description={
            allHabits.length === 0
              ? 'عادت‌های روزانه مانند مطالعه، ورزش، نوشیدن آب یا پیاده‌روی را با روزهای تکرار مشخص ثبت کنید.'
              : 'فیلتر زمان را تغییر دهید یا عادت جدیدی برای این بازه ثبت کنید.'
          }
          actionText={allHabits.length === 0 ? 'ایجاد اولین عادت' : undefined}
          onAction={allHabits.length === 0 ? handleOpenAdd : undefined}
        />
      ) : (
        <div className="space-y-3.5 w-full">
          {displayedHabits.map((habit) => {
            const streak = db.getHabitStreak(habit.id);
            const targetDays = Array.isArray(habit.targetDays) && habit.targetDays.length > 0
              ? habit.targetDays
              : [0, 1, 2, 3, 4, 5, 6];

            const todayDayIdx = db.getPersianWeekdayIndex(todayIso);
            const isDueToday = targetDays.includes(todayDayIdx);
            const isDoneToday = allLogs.some(
              (l) => l.habitId === habit.id && l.date === todayIso && l.completed
            );

            return (
              <div
                key={habit.id}
                className="w-full p-3.5 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-800/40 transition shadow-sm space-y-3.5"
              >
                {/* Top Section: Action Button + Title & Badges + Actions Toolbar */}
                <div className="flex items-start justify-between gap-3 w-full">
                  {/* Right side: Today Check Button + Title */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleHabitForDate(habit, todayIso, isDueToday)}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 mt-0.5 ${
                        isDoneToday
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/50'
                          : isDueToday
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-purple-500 hover:text-purple-300'
                          : 'bg-slate-800/40 text-slate-600 border border-slate-800 hover:text-slate-400'
                      }`}
                      title={
                        isDoneToday
                          ? 'تکمیل شده برای امروز (برای لغو کلیک کنید)'
                          : isDueToday
                          ? 'ثبت انجام امروز'
                          : 'امروز در برنامه تکرار نیست (اختیاری)'
                      }
                    >
                      {isDoneToday ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-100 text-sm sm:text-base break-words">
                          {habit.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 font-bold shrink-0 flex items-center gap-1"
                          title="اولویت نمایش"
                        >
                          <Hash className="w-2.5 h-2.5" />
                          <span>اولویت {settings.persianDigits ? toPersianDigits(habit.order || 1) : (habit.order || 1)}</span>
                        </span>

                        {/* Time of Day Badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          {timeLabels[habit.timeOfDay]}
                        </span>

                        {/* Today Due Status */}
                        {!isDueToday && !isDoneToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/50 text-slate-400 border border-slate-800 shrink-0 flex items-center gap-1">
                            <Coffee className="w-2.5 h-2.5 text-slate-400" />
                            <span>استراحت (امروز موعد نیست)</span>
                          </span>
                        )}
                      </div>

                      {habit.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{habit.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Left side: Streak + Edit + Delete (Always visible and never pushed off screen) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Streak Badge */}
                    <div
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 shrink-0"
                      title={`استمرار پیوسته: ${streak} روز`}
                    >
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="text-xs font-bold font-mono">
                        {settings.persianDigits ? toPersianDigits(streak) : streak}
                      </span>
                      <span className="text-[10px] hidden xs:inline">روز</span>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(habit)}
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="ویرایش عادت و اولویت"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    {/* Delete Button (Always inside viewport) */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHabit(habit, e)}
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="حذف عادت"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Fixed Week Heatmap: Exactly Saturday to Friday (Right-to-Left) */}
                {/* 7 columns grid fitting full card width without ANY horizontal scroll */}
                <div className="pt-2 border-t border-slate-800/70 w-full">
                  <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <span>استمرار هفته جاری (شنبه تا جمعه):</span>
                    </span>
                    <span className="text-[10px] text-purple-400">
                      {targetDays.length === 7 ? 'هر روز' : `${targetDays.length} روز در هفته`}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
                    {fixedWeekDays.map((d) => {
                      const isScheduled = targetDays.includes(d.dayIndex);
                      const isDone = allLogs.some(
                        (l) => l.habitId === habit.id && l.date === d.iso && l.completed
                      );

                      return (
                        <div
                          key={d.iso}
                          onClick={() => handleToggleHabitForDate(habit, d.iso, isScheduled)}
                          className={`flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl transition cursor-pointer border select-none ${
                            d.isToday ? 'border-purple-500 bg-purple-950/20 shadow-sm' : 'border-slate-800/80 bg-slate-800/40 hover:bg-slate-800'
                          }`}
                          title={`${d.fullLabel} (${d.iso}): ${
                            isDone
                              ? 'انجام شده ✓'
                              : isScheduled
                              ? 'موعد انجام (انجام نشده)'
                              : 'روز استراحت / خارج از برنامه'
                          }`}
                        >
                          {/* Day Label */}
                          <span className={`text-[10px] sm:text-xs font-semibold mb-1 ${d.isToday ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                            {d.shortLabel}
                          </span>

                          {/* Completion Box */}
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition ${
                              isDone
                                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-950/40'
                                : isScheduled
                                ? d.isToday
                                  ? 'bg-slate-800 text-slate-400 border border-purple-400/60'
                                  : 'bg-slate-800/60 text-slate-500'
                                : 'bg-transparent text-slate-600'
                            }`}
                          >
                            {isDone ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : isScheduled ? (
                              ''
                            ) : (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHabitId ? 'ویرایش عادت و اولویت' : 'ثبت عادت جدید'}
        subtitle="برنامه‌ریزی، هدف‌گذاری و ثبت زنجیره استمرار عادت‌های روزمره"
        icon={<Flame className="text-amber-400" />}
        maxWidth="lg"
        position="center"
      >
        <form onSubmit={handleSaveForm} className="space-y-4" dir="rtl">
          {/* Habit Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              عنوان عادت <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={formTitle}
              onChange={(e) => {
                setFormTitle(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="مثلاً: ۳۰ دقیقه ورزش و نرمش / خواندن کتاب / نوشیدن آب..."
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm text-slate-100 bg-slate-800 focus:outline-none transition ${
                formError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-700 focus:border-purple-500'
              }`}
            />
            {formError && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">توضیحات و انگیزه (اختیاری)</label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="انگیزه یا یادداشت درباره نحوه انجام این عادت..."
              className="w-full h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Time of Day - Beautiful App-styled Selector */}
          <TimeOfDaySelector
            value={formTime}
            onChange={setFormTime}
            label="بازه زمانی ترجیحی برای انجام"
          />

          {/* Numeric Priority Stepper */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-400" />
                <span>اولویت نمایش در لیست</span>
              </label>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-300 font-bold">
                اولویت {settings.persianDigits ? toPersianDigits(formPriority || 1) : (formPriority || 1)}
                {formPriority === 1 ? ' (بالاترین)' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormPriority((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                title="کاهش عدد اولویت (اولویت بالاتر)"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  step="1"
                  value={formPriority}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFormPriority(isNaN(val) ? ('' as any) : Math.max(1, val));
                  }}
                  placeholder="1"
                  className="w-full h-10 px-3 text-center rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setFormPriority((prev) => (Number(prev) || 1) + 1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                title="افزایش عدد اولویت"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              عادت‌ها بر اساس عدد اولویت کمتر در بالای صفحه قرار می‌گیرند. عدد ۱ بالاترین اولویت است.
            </p>
          </div>

          {/* Target Days with Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                روزهای تکرار در هفته <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFormTargetDays([0, 1, 2, 3, 4, 5, 6])}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 cursor-pointer text-[10px]"
                >
                  همه روزها
                </button>
                <button
                  type="button"
                  onClick={() => setFormTargetDays([0, 1, 2, 3, 4])}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer text-[10px]"
                >
                  روزهای کاری
                </button>
                <button
                  type="button"
                  onClick={() => setFormTargetDays([5, 6])}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer text-[10px]"
                >
                  آخر هفته
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {[
                { day: 0, label: 'ش', name: 'شنبه' },
                { day: 1, label: 'ی', name: 'یکشنبه' },
                { day: 2, label: 'د', name: 'دوشنبه' },
                { day: 3, label: 'س', name: 'سه‌شنبه' },
                { day: 4, label: 'چ', name: 'چهارشنبه' },
                { day: 5, label: 'پ', name: 'پنج‌شنبه' },
                { day: 6, label: 'ج', name: 'جمعه' },
              ].map((item) => {
                const isSelected = formTargetDays.includes(item.day);
                return (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (formTargetDays.length > 1) {
                          setFormTargetDays(formTargetDays.filter((d) => d !== item.day));
                        } else {
                          showToast('حداقل یک روز باید انتخاب شده باشد.', 'warning');
                        }
                      } else {
                        setFormTargetDays([...formTargetDays, item.day].sort());
                      }
                    }}
                    className={`h-10 rounded-xl text-xs font-bold transition cursor-pointer border flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-950/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title={item.name}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              عادت فقط در روزهای انتخاب شده موعد انجام خواهد داشت و عدم انجام در سایر روزها زنجیره استمرار را قطع نمی‌کند.
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رنگ نشانه</label>
            <div className="flex items-center gap-3">
              {['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={`w-7 h-7 rounded-full transition cursor-pointer flex items-center justify-center ${
                    formColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {formColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-medium cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-950/50 cursor-pointer active:scale-98"
            >
              {editingHabitId ? 'ذخیره تغییرات' : 'ایجاد عادت'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
