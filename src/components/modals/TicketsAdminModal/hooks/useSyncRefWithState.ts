import { useEffect, MutableRefObject } from 'react';

/**
 * Custom hook to keep a ref in sync with state
 * Useful for accessing current state value in callbacks without stale closures
 * @param ref - Mutable ref object to sync
 * @param value - Current value to sync to ref
 */
export function useSyncRefWithState<T>(
  ref: MutableRefObject<T>,
  value: T
): void {
  useEffect(() => {
    ref.current = value;
  }, [ref, value]);
}
