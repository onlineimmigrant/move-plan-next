import { useState, useCallback } from 'react';

/**
 * Custom hook to manage screen sharing and error state
 * Extracts screen sharing logic from VideoCallModal
 * 
 * @returns Screen sharing state and error management
 */
export function useScreenShareState() {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScreenSharing = useCallback(() => {
    setIsScreenSharing(true);
    setError(null);
  }, []);

  const stopScreenSharing = useCallback(() => {
    setIsScreenSharing(false);
  }, []);

  const setErrorMessage = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isScreenSharing,
    error,
    startScreenSharing,
    stopScreenSharing,
    setErrorMessage,
    clearError,
  };
}

export type UseScreenShareStateReturn = ReturnType<typeof useScreenShareState>;
