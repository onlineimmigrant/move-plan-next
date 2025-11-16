/**
 * useModalDataFetching Hook
 * 
 * Manages initial data loading when modal opens
 * and cleanup when it closes
 */

import { useEffect } from 'react';

interface UseModalDataFetchingProps {
  isOpen: boolean;
  onFetchData: () => void;
  onCleanup?: () => void;
}

/**
 * Handles data fetching when modal opens
 * 
 * @param isOpen - Whether the modal is open
 * @param onFetchData - Callback to fetch initial data
 * @param onCleanup - Optional cleanup callback when modal closes
 * 
 * @example
 * ```tsx
 * useModalDataFetching({
 *   isOpen,
 *   onFetchData: () => {
 *     fetchProducts();
 *     fetchTaxCodes();
 *   },
 *   onCleanup: () => {
 *     // Optional cleanup
 *   }
 * });
 * ```
 */
export function useModalDataFetching({
  isOpen,
  onFetchData,
  onCleanup,
}: UseModalDataFetchingProps) {
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
