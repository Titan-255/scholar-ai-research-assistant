import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ToastMessage } from '../../types';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-55 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-indigo-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-100 dark:border-emerald-900/30',
    error: 'border-red-100 dark:border-red-900/30',
    warning: 'border-amber-100 dark:border-amber-900/30',
    info: 'border-indigo-100 dark:border-indigo-900/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-center justify-between p-4 bg-white dark:bg-slate-900 border ${borders[toast.type]} rounded-xl shadow-soft w-full`}
    >
      <div className="flex items-center space-x-3">
        {icons[toast.type]}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="ml-3 text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded-md transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};
