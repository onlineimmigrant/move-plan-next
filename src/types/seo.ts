export interface HrefLang {
  href: string;
  hreflang: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  hreflang: HrefLang[];
  faqs: FAQ[];
  structuredData: any[]; // Can be typed stricter if needed
  seo_og_image?: string; // Optional, matches settings.seo_og_image
}