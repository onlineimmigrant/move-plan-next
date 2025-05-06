import { useEffect, useRef } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number; // Duration in milliseconds
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Focus management for accessibility
  useEffect(() => {
    if (toastRef.current) {
      toastRef.current.focus();
    }
  }, []);

  const bgColor = type === 'success' ? 'teal-600' : 'red-600';
  const icon = type === 'success' ? <FaCheckCircle className="h-8 w-8" /> : <FaExclamationCircle className="h-8 w-8" />;

  return (
    <div
      ref={toastRef}
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-md shadow-lg border-2 bg-white text-gray-700 border-${bgColor} max-w-sm animate-slide-in`}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <div className={`flex items-center space-x-4 text-${bgColor}`}>
        <span className={`text-${bgColor}`}>{icon}</span>
        <p className="text-sm font-semibold">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700"
        aria-label="Close notification"
      >
        <FaTimes className="h-4 w-4" />
      </button>
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