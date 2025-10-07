// /components/Shared/ToastContainer.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from './Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => {
    showToast('success', message);
  }, [showToast]);

  const error = useCallback((message: string) => {
    showToast('error', message);
  }, [showToast]);

  const info = useCallback((message: string) => {
    showToast('info', message);
  }, [showToast]);

  const warning = useCallback((message: string) => {
    showToast('warning', message);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
