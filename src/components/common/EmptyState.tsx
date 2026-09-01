import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        id="empty-state-container-compact"
        className={`flex flex-col items-center justify-center p-5 sm:p-6 text-center rounded-xl border border-dashed border-slate-800/80 bg-slate-900/30 text-slate-400 my-1 flex-1 ${className}`}
      >
        <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-800/30 flex items-center justify-center text-purple-400 mb-2.5 shadow-inner">
          <Icon className="w-5 h-5 stroke-[1.75]" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-200 mb-1">{title}</h4>
        <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs mb-3 leading-relaxed">{description}</p>
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition shadow-md shadow-purple-950/40 cursor-pointer active:scale-98"
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="empty-state-container"
      className={`flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-400 my-2 ${className}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
        <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          id="empty-state-action-btn"
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-purple-900/30 cursor-pointer active:scale-98"
        >
          <ActionIcon className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
