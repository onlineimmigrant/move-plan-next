import { useEffect } from 'react';

interface LocalStorageFiltersConfig<T> {
  isOpen: boolean;
  organizationId: string | undefined;
  filters: T;
  storageKey: string;
}

/**
 * Custom hook to persist filters to localStorage
 * @param config - Configuration object with filters and storage key
 */
export function useSaveFiltersToLocalStorage<T extends Record<string, any>>(
  config: LocalStorageFiltersConfig<T>
): void {
  const { isOpen, organizationId, filters, storageKey } = config;

  useEffect(() => {
    if (organizationId) {
      try {
        const key = `${storageKey}-${organizationId}`;
        localStorage.setItem(key, JSON.stringify(filters));
      } catch (error) {
        console.error('Failed to save filters:', error);
      }
    }
  }, [organizationId, filters, storageKey]);
}

/**
 * Custom hook to restore filters from localStorage
 * @param isOpen - Whether the modal is open
 * @param organizationId - The organization ID
 * @param storageKey - The base key for localStorage
 * @param onRestore - Callback to restore filters
 */
export function useRestoreFiltersFromLocalStorage<T>(
  isOpen: boolean,
  organizationId: string | undefined,
  storageKey: string,
  onRestore: (filters: T) => void
): void {
  useEffect(() => {
    if (isOpen && organizationId) {
      try {
        const key = `${storageKey}-${organizationId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const filters = JSON.parse(saved) as T;
          onRestore(filters);
          console.log('✅ Restored filters from localStorage');
        }
      } catch (error) {
        console.error('Failed to restore filters:', error);
      }
    }
  }, [isOpen, organizationId, storageKey]);
}
