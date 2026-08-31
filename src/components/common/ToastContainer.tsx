import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-md pointer-events-none" dir="rtl">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = CheckCircle2;
          let colorClasses = 'bg-slate-900 border-emerald-500/50 text-emerald-300';
          let iconColor = 'text-emerald-400';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClasses = 'bg-slate-900 border-rose-500/50 text-rose-300';
            iconColor = 'text-rose-400';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorClasses = 'bg-slate-900 border-amber-500/50 text-amber-300';
            iconColor = 'text-amber-400';
          } else if (toast.type === 'info') {
            Icon = Info;
            colorClasses = 'bg-slate-900 border-sky-500/50 text-sky-300';
            iconColor = 'text-sky-400';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${colorClasses}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                <span className="text-sm font-medium text-slate-100">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
