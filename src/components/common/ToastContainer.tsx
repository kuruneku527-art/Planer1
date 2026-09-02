import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-2 sm:top-4 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 flex flex-col gap-1.5 max-w-sm sm:max-w-md w-full pointer-events-none" dir="rtl">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = CheckCircle2;
          let colorClasses = 'bg-slate-900/98 border-emerald-500/50 text-emerald-300';
          let iconColor = 'text-emerald-400';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClasses = 'bg-slate-900/98 border-rose-500/60 text-rose-300';
            iconColor = 'text-rose-400';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorClasses = 'bg-slate-900/98 border-amber-500/60 text-amber-300';
            iconColor = 'text-amber-400';
          } else if (toast.type === 'info') {
            Icon = Info;
            colorClasses = 'bg-slate-900/98 border-sky-500/60 text-sky-300';
            iconColor = 'text-sky-400';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-center justify-between gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border shadow-lg backdrop-blur-md ${colorClasses}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                <span className="text-xs font-medium text-slate-100 truncate">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-800 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
