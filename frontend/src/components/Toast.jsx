import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss, darkMode }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-slide-up transition-all ${
              isSuccess
                ? darkMode ? 'bg-gray-900 border-emerald-500/40 text-emerald-300' : 'bg-white border-emerald-300 text-emerald-800'
                : isError
                ? darkMode ? 'bg-gray-900 border-red-500/40 text-red-300' : 'bg-white border-red-300 text-red-800'
                : darkMode ? 'bg-gray-900 border-cyan-500/40 text-cyan-300' : 'bg-white border-cyan-300 text-cyan-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-200 p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
