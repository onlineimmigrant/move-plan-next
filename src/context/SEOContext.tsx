// src/context/SEOContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  canonicalUrl: string;
  structuredData?: object | object[];
  noindex?: boolean;
  hreflang?: { href: string; hreflang: string }[];
  faqs?: { question: string; answer: string }[];
}

const SEOContext = createContext<{
  seoData: SEOData | null;
  setSEOData: (data: SEOData | null) => void;
}>({
  seoData: null,
  setSEOData: () => {},
});

export function SEOProvider({ children }: { children: ReactNode }) {
  const [seoData, setSEOData] = useState<SEOData | null>(null);

  return (
    <SEOContext.Provider value={{ seoData, setSEOData }}>
      {children}
    </SEOContext.Provider>
  );
}

export function useSEO() {
  return useContext(SEOContext);
}