import { useEffect } from 'react';

interface SearchAutoHideConfig {
  responseMessage: string;
  showSearch: boolean;
  onHideSearch: () => void;
}

/**
 * Custom hook to automatically hide search when user starts typing a response
 * @param config - Configuration object with response message and search state
 */
export function useSearchAutoHide(config: SearchAutoHideConfig): void {
  const { responseMessage, showSearch, onHideSearch } = config;

  useEffect(() => {
    if (responseMessage.trim() && showSearch) {
      onHideSearch();
    }
  }, [responseMessage, showSearch, onHideSearch]);
}
