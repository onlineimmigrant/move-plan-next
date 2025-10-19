import { useEffect } from 'react';

/**
 * Custom hook to persist a value to localStorage
 * @param key - The localStorage key
 * @param value - The value to save
 */
export function useLocalStorage(key: string, value: string | undefined): void {
  useEffect(() => {
    if (value) {
      localStorage.setItem(key, value);
    }
  }, [key, value]);
}
