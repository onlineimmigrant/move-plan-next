import { useEffect } from 'react';

/**
 * Custom hook to persist modal size to localStorage
 * @param size - Current modal size
 */
export function useModalSizePersistence(size: string): void {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticketsModalSize', size);
    }
  }, [size]);
}
