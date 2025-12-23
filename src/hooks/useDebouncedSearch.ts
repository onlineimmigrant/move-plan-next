import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 180,
  onSearch?: (query: string, resultsCount?: number) => void
) {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const updateQuery = useCallback((value: string) => {
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      onSearch?.(value);
    }, delay);
  }, [delay, onSearch]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    debouncedQuery,
    updateQuery,
    clearQuery,
  };
}