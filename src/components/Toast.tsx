import { useEffect, useRef } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number; // Duration in milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Toast({ message, type, onClose, duration = 5000, action }: ToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);
  const { primary } = useThemeColors();

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]); // Removed onClose from dependencies to prevent timer reset on re-renders

  // Focus management for accessibility
  useEffect(() => {
    if (toastRef.current) {
      toastRef.current.focus();
    }
  }, []);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: primary.bg,
          icon: <FaCheckCircle className="h-8 w-8" />,
        };
      case 'error':
        return {
          bgColor: 'red-600',
          icon: <FaExclamationCircle className="h-8 w-8" />,
        };
      case 'warning':
        return {
          bgColor: 'amber-500',
          icon: <FaExclamationTriangle className="h-8 w-8" />,
        };
      case 'info':
        return {
          bgColor: 'blue-500',
          icon: <FaInfoCircle className="h-8 w-8" />,
        };
      default:
        return {
          bgColor: 'gray-600',
          icon: <FaInfoCircle className="h-8 w-8" />,
        };
    }
  };

  const { bgColor, icon } = getToastStyles();

  return (
    <div
      ref={toastRef}
      className={`fixed top-4 right-4 z-[10100] flex items-center justify-between p-4 rounded-md shadow-lg border-2 bg-white text-gray-700 border-${bgColor} max-w-sm animate-slide-in`}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <div className={`flex items-center space-x-4 text-${bgColor}`}>
        <span>{icon}</span>
        <p className="text-sm font-semibold">{message}</p>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`px-3 py-1 text-xs font-semibold text-white bg-${primary.bg} hover:bg-${primary.bgHover} rounded transition-colors focus:outline-none focus:ring-2 focus:ring-${primary.ring}`}
            aria-label={action.label}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
          aria-label="Close notification"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}