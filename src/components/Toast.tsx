import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-cobalt flex-shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-200 bg-white text-slate-900',
    error: 'border-rose-200 bg-white text-slate-900',
    info: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl transition-all animate-in slide-in-from-bottom-2 ${borderColors[toast.type]}`}>
      {icons[toast.type]}
      <div className="flex-1 text-left">
        <h4 className="text-xs font-bold font-mono tracking-tight text-slate-900">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-600 mt-0.5 leading-snug">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
