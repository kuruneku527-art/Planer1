import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  position?: 'center' | 'bottom';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'lg',
  position = 'center',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex justify-center overflow-y-auto ${
            position === 'bottom'
              ? 'items-end sm:items-center p-0 sm:p-6'
              : 'items-center p-3.5 sm:p-6'
          }`}
          style={{
            paddingBottom: 'calc(var(--keyboard-height, 0px) + 0.5rem)',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal / Dialog Content */}
          <motion.div
            initial={{ opacity: 0, y: position === 'bottom' ? 30 : 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'bottom' ? 30 : 15, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`relative w-full ${maxWidthClasses} bg-slate-900 shadow-2xl overflow-hidden z-10 flex flex-col my-auto ${
              position === 'bottom'
                ? 'border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl'
                : 'border border-slate-800/90 rounded-2xl sm:rounded-3xl'
            }`}
            style={{
              maxHeight: 'calc(100dvh - var(--safe-top, env(safe-area-inset-top, 0px)) - 1.5rem)',
              paddingBottom: position === 'bottom' ? 'var(--safe-bottom, env(safe-area-inset-bottom, 0px))' : undefined,
            }}
            dir="rtl"
          >
            {/* Mobile Sheet Drag Indicator (only for bottom mode) */}
            {position === 'bottom' && (
              <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-700/80" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {icon && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 flex-shrink-0">
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-slate-100">{title}</h3>
                  {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer flex-shrink-0 active:scale-95"
                title="بستن"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
