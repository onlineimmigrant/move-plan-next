import { useEffect } from 'react';

interface DataFetchConfig {
  isOpen: boolean;
  onFetchData: () => void;
  onCleanup?: () => void;
}

/**
 * Custom hook to fetch data when modal opens and cleanup on close
 * @param config - Configuration object with isOpen state and callbacks
 */
export function useModalDataFetching(config: DataFetchConfig): void {
  const { isOpen, onFetchData, onCleanup } = config;

  useEffect(() => {
    if (isOpen) {
      onFetchData();
    }

    return () => {
      if (onCleanup) {
        onCleanup();
      }
    };
  }, [isOpen]);
}
