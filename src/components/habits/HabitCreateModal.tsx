import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { toPersianDigits } from '../../utils/jalali';
import { Modal } from '../common/Modal';
import { TimeOfDaySelector } from '../common/TimeOfDaySelector';
import { Flame, Minus, Plus, Hash, Check } from 'lucide-react';

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const HabitCreateModal: React.FC<HabitCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { refreshDb, settings, showToast } = useApp();

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTime, setFormTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('morning');
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formTargetDays, setFormTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formColor, setFormColor] = useState('#8b5cf6');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const allHabits = db.getHabits();
      const nextOrder = allHabits.length > 0 ? Math.max(...allHabits.map((h) => h.order || 1)) + 1 : 1;
      setFormTitle('');
      setFormDesc('');
      setFormTime('morning');
      setFormPriority(nextOrder);
      setFormTargetDays([0, 1, 2, 3, 4, 5, 6]);
      setFormColor('#8b5cf6');
      setFormError('');
    }
  }, [isOpen]);

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
    refreshDb();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت عادت جدید"
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

        {/* Time of Day */}
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
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-medium cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-950/50 cursor-pointer active:scale-98"
          >
            ایجاد عادت
          </button>
        </div>
      </form>
    </Modal>
  );
};
