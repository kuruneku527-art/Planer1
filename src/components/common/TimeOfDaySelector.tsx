import React from 'react';
import { Sunrise, Sun, Moon, Zap, Check } from 'lucide-react';

export type TimeOfDayOption = 'morning' | 'afternoon' | 'evening' | 'anytime';

interface TimeOfDaySelectorProps {
  value: TimeOfDayOption;
  onChange: (val: TimeOfDayOption) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const TIME_OF_DAY_ITEMS: {
  id: TimeOfDayOption;
  label: string;
  shortLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badgeBg: string;
}[] = [
  {
    id: 'morning',
    label: 'صبحگاه',
    shortLabel: 'صبح',
    desc: 'شروع روز و انرژی اولیه',
    icon: Sunrise,
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/40 border-amber-800/40 text-amber-300',
  },
  {
    id: 'afternoon',
    label: 'ظهر و بعدازظهر',
    shortLabel: 'ظهر',
    desc: 'میانه روز و ساعت تمرکز',
    icon: Sun,
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-950/40 border-orange-800/40 text-orange-300',
  },
  {
    id: 'evening',
    label: 'عصر و شب',
    shortLabel: 'عصر و شب',
    desc: 'پایان روز و آرامش شبانه',
    icon: Moon,
    iconColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300',
  },
  {
    id: 'anytime',
    label: 'شناور در طول روز',
    shortLabel: 'شناور',
    desc: 'انجام در هر ساعت از ۲۴ ساعت',
    icon: Zap,
    iconColor: 'text-purple-400',
    badgeBg: 'bg-purple-950/40 border-purple-800/40 text-purple-300',
  },
];

export const TimeOfDaySelector: React.FC<TimeOfDaySelectorProps> = ({
  value,
  onChange,
  label = 'بازه زمانی ترجیحی',
  error,
  required = false,
}) => {
  return (
    <div className="space-y-1.5" dir="rtl">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          <span className="text-[10px] text-purple-400 font-medium">
            {TIME_OF_DAY_ITEMS.find((i) => i.id === value)?.label}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TIME_OF_DAY_ITEMS.map((item) => {
          const isSelected = value === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1.5 active:scale-[0.98] ${
                isSelected
                  ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border transition ${
                    isSelected
                      ? 'bg-purple-900/60 border-purple-400/50 text-purple-200'
                      : 'bg-slate-800 border-slate-700 ' + item.iconColor
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition ${
                    isSelected
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'border-slate-700 bg-slate-900/60'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>

              <div>
                <span
                  className={`text-xs font-bold block transition ${
                    isSelected ? 'text-purple-100' : 'text-slate-200'
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
