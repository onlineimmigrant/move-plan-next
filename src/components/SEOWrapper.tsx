// src/components/SEOWrapper.tsx
'use client';

import { useSEO } from '@/context/SEOContext';
import SEOClient from '@/lib/SEOClient';

interface SEOWrapperProps {
  defaultSEOData: {
    title: string;
    description: string;
    keywords?: string;
    canonicalUrl: string;
    hreflang?: { href: string; hreflang: string }[];
    structuredData?: object[];
    faqs?: { question: string; answer: string }[];
  };
}

export default function SEOWrapper({ defaultSEOData }: SEOWrapperProps) {
  const { seoData } = useSEO();
  return <SEOClient {...(seoData || defaultSEOData)} />;
}