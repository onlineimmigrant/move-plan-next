// /components/Shared/Toast.tsx
'use client';

import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-600" />,
    error: <ExclamationCircleIcon className="h-6 w-6 text-red-600" />,
    warning: <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-600" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border-2 shadow-lg',
        'animate-in slide-in-from-top-5 fade-in duration-300',
        colors[type]
      )}
      role="alert"
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      
      <div className="flex-1 text-sm font-medium text-gray-900">
        {message}
      </div>
      
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
