import React from 'react';
import { Priority, TaskStatus, ProjectStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'priority' | 'status' | 'category' | 'tag' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  priority?: Priority;
  status?: TaskStatus | ProjectStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  priority,
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  let colorClasses = 'bg-slate-800 text-slate-300 border border-slate-700/60';

  if (variant === 'priority' || priority) {
    const p = priority || 'medium';
    switch (p) {
      case 'urgent':
        colorClasses = 'bg-rose-950/60 text-rose-300 border border-rose-800/50';
        break;
      case 'high':
        colorClasses = 'bg-amber-950/60 text-amber-300 border border-amber-800/50';
        break;
      case 'medium':
        colorClasses = 'bg-blue-950/60 text-blue-300 border border-blue-800/50';
        break;
      case 'low':
        colorClasses = 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50';
        break;
    }
  } else if (variant === 'status' || status) {
    const s = status || 'todo';
    switch (s) {
      case 'completed':
        colorClasses = 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50';
        break;
      case 'in_progress':
        colorClasses = 'bg-purple-950/60 text-purple-300 border border-purple-800/50';
        break;
      case 'planning':
      case 'todo':
        colorClasses = 'bg-blue-950/60 text-blue-300 border border-blue-800/50';
        break;
      case 'on_hold':
        colorClasses = 'bg-amber-950/60 text-amber-300 border border-amber-800/50';
        break;
      case 'cancelled':
      case 'archived':
        colorClasses = 'bg-slate-900 text-slate-400 border border-slate-800';
        break;
    }
  } else if (variant === 'success') {
    colorClasses = 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50';
  } else if (variant === 'warning') {
    colorClasses = 'bg-amber-950/60 text-amber-300 border border-amber-800/50';
  } else if (variant === 'danger') {
    colorClasses = 'bg-rose-950/60 text-rose-300 border border-rose-800/50';
  } else if (variant === 'info') {
    colorClasses = 'bg-sky-950/60 text-sky-300 border border-sky-800/50';
  } else if (variant === 'tag') {
    colorClasses = 'bg-purple-950/40 text-purple-300 border border-purple-800/40';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-medium whitespace-nowrap leading-none ${sizeClasses} ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
};
