import { useToastStore } from '@/hooks/useToast';
import { useCallback } from 'react';

/**
 * Hook for showing toasts in the Email module
 * Wraps the global toast store with email-specific defaults
 */
export function useEmailToast() {
  const showToast = useToastStore((state) => state.showToast);

  const success = useCallback(
    (message: string, duration = 3000) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration = 5000) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration = 3000) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration = 4000) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const progress = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, 'info', 0, action); // 0 duration = stays until dismissed
    },
    [showToast]
  );

  return {
    success,
    error,
    info,
    warning,
    progress,
    showToast, // Access to raw toast for advanced usage
  };
}
