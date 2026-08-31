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
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = '',
}) => {
  return (
    <div
      id="empty-state-container"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-400 my-4 ${className}`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center text-purple-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          id="empty-state-action-btn"
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition shadow-lg shadow-purple-900/30 cursor-pointer active:scale-98"
        >
          <ActionIcon className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
