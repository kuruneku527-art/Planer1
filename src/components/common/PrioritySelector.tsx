import React from 'react';
import { Priority } from '../../types';
import { ShieldCheck, Minus, AlertCircle, Flame, Check } from 'lucide-react';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (val: Priority) => void;
  label?: string;
  className?: string;
}

interface PriorityOption {
  value: Priority;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  activeClass: string;
  indicatorColor: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'low',
    label: 'کم',
    icon: ShieldCheck,
    colorClass: 'text-emerald-400',
    activeClass: 'bg-emerald-500/15 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-950/30',
    indicatorColor: 'bg-emerald-500',
  },
  {
    value: 'medium',
    label: 'متوسط',
    icon: Minus,
    colorClass: 'text-sky-400',
    activeClass: 'bg-sky-500/15 border-sky-500/70 text-sky-300 shadow-sm shadow-sky-950/30',
    indicatorColor: 'bg-sky-500',
  },
  {
    value: 'high',
    label: 'زیاد',
    icon: AlertCircle,
    colorClass: 'text-amber-400',
    activeClass: 'bg-amber-500/15 border-amber-500/70 text-amber-300 shadow-sm shadow-amber-950/30',
    indicatorColor: 'bg-amber-500',
  },
  {
    value: 'urgent',
    label: 'بحرانی',
    icon: Flame,
    colorClass: 'text-rose-400',
    activeClass: 'bg-rose-500/15 border-rose-500/70 text-rose-300 shadow-sm shadow-rose-950/30',
    indicatorColor: 'bg-rose-500',
  },
];

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  label = 'اولویت',
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRIORITY_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-medium transition cursor-pointer select-none ${
                isSelected
                  ? opt.activeClass
                  : 'bg-slate-800/80 border-slate-700/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? opt.colorClass : 'text-slate-500'
                  }`}
                />
                <span className={isSelected ? 'font-bold' : ''}>{opt.label}</span>
              </div>
              {isSelected && (
                <Check className={`w-3.5 h-3.5 shrink-0 ${opt.colorClass}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
