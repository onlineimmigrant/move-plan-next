// src/components/study-plan/ToastWrapper.tsx
import Toast from '@/components/Toast';
import { Dispatch, SetStateAction } from 'react';

interface ToastWrapperProps {
  toast: { message: string; type: 'success' | 'error' } | null;
  setToast: Dispatch<SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
}

const ToastWrapper = ({ toast, setToast }: ToastWrapperProps) => {
  return toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
      aria-live="polite"
    />
  ) : null;
};

export default ToastWrapper;