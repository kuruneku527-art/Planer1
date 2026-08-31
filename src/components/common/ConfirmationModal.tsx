import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmationModal: React.FC = () => {
  const { confirmDialog, closeConfirm } = useApp();

  if (!confirmDialog) return null;

  const {
    title,
    message,
    onConfirm,
    confirmText = 'حذف',
    cancelText = 'لغو',
    isDanger = true,
  } = confirmDialog;

  return (
    <Modal
      isOpen={true}
      onClose={closeConfirm}
      title={title}
      maxWidth="md"
      icon={<AlertTriangle className={isDanger ? 'text-rose-400' : 'text-amber-400'} />}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-sm font-medium cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              closeConfirm();
            }}
            className={`px-5 py-2 rounded-xl text-white text-sm font-medium transition cursor-pointer shadow-lg active:scale-98 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/40'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
