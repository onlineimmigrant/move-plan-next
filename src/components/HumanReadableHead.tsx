import { pageMetadataDefinitions } from '@/lib/page-metadata-definitions';

interface HumanReadableHeadProps {
  pathname: string;
  siteName: string;
  currentDomain: string;
  ogImage?: string;
}

export default function HumanReadableHead({ 
  pathname, 
  siteName, 
  currentDomain, 
  ogImage = '/default-og-image.jpg' 
}: HumanReadableHeadProps) {
  const pageMetadata = pageMetadataDefinitions[pathname];
  
  if (!pageMetadata) {
    return null;
  }

  const title = pathname === '/' ? siteName : `${pageMetadata.title} | ${siteName}`;
  const canonicalUrl = `${currentDomain}${pathname}`;
  const keywords = pageMetadata.keywords.join(', ');

  return (
    <>
      {/* =============================================== */}
      {/* PAGE METADATA - HUMAN READABLE FORMAT */}
      {/* =============================================== */}
      {/* Page: {pathname} */}
      {/* Title: {title} */}
      {/* Description: {pageMetadata.description} */}
      {/* Keywords: {keywords} */}
      {/* =============================================== */}

      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={pageMetadata.description} />
      <meta name="keywords" content={keywords} />
      
      {/* SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta 
        name="googlebot" 
        content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" 
      />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* =============================================== */}
      {/* OPEN GRAPH (FACEBOOK, LINKEDIN, ETC.) */}
      {/* =============================================== */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={pageMetadata.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en-US" />
      <meta property="og:image" content={`${currentDomain}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageMetadata.title} />
      <meta property="og:type" content="website" />
      
      {/* =============================================== */}
      {/* TWITTER CARD META TAGS */}
      {/* =============================================== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={pageMetadata.description} />
      <meta name="twitter:image" content={`${currentDomain}${ogImage}`} />
      
      {/* =============================================== */}
      {/* ADDITIONAL INFORMATION */}
      {/* =============================================== */}
      {/* This page uses structured metadata for: */}
      {/* - Search Engine Optimization (SEO) */}
      {/* - Social Media Sharing (Facebook, Twitter, LinkedIn) */}
      {/* - Web Crawlers and Bots */}
      {/* - Browser Tab Display */}
      {/* Generated from: /src/lib/page-metadata-definitions.ts */}
      {/* =============================================== */}
    </>
  );
}
