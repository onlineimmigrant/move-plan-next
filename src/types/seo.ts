export interface HrefLang {
  href: string;
  hreflang: string;
}

export interface FAQ {
  question: string;
  answer: string;
}



// types/seo.ts
export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonicalUrl?: string;
  seo_og_image?: string;
  seo_og_url?: string;
  structuredData?: Array<{ key: string; any: any }>;
  faqs?: Array<{ question: string; answer: string }>;
}