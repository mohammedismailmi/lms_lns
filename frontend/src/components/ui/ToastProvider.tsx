import React, { useEffect, useState } from 'react';
import { subscribeToasts, Toast } from '../../lib/useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts((newToast) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => {
        const updated = [...prev, { ...newToast, id }];
        if (updated.length > 3) return updated.slice(updated.length - 3);
        return updated;
      });

      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border w-80 animate-in slide-in-from-right-8 fade-in duration-300",
              toast.type === 'success' && "bg-success text-white border-green-800",
              toast.type === 'error' && "bg-accent text-white border-red-900",
              toast.type === 'info' && "bg-primary text-white border-blue-900",
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            
            <p className="flex-1 font-medium text-sm leading-tight">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
