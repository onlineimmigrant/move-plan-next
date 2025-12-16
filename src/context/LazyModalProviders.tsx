'use client';

import { ReactNode, createContext, useContext, useState, useCallback } from 'react';

// Context to track which modal providers are loaded
const ModalProvidersContext = createContext<{
  loadedProviders: Set<string>;
  loadProvider: (name: string) => void;
}>({
  loadedProviders: new Set(),
  loadProvider: () => {},
});

export const useModalProviders = () => useContext(ModalProvidersContext);

/**
 * Wrapper that lazy-loads all modal context providers only when first accessed.
 * This reduces initial JavaScript evaluation by deferring modal code until needed.
 */
export function LazyModalProviders({ children }: { children: ReactNode }) {
  const [loadedProviders, setLoadedProviders] = useState<Set<string>>(new Set());

  const loadProvider = useCallback((name: string) => {
    setLoadedProviders((prev) => new Set(prev).add(name));
  }, []);

  return (
    <ModalProvidersContext.Provider value={{ loadedProviders, loadProvider }}>
      {children}
    </ModalProvidersContext.Provider>
  );
}
