import React from 'react';

interface FormattedMetaTagsProps {
  seoData: {
    title?: string;
    description?: string;
    keywords?: string | string[];
    canonicalUrl?: string;
    seo_og_image?: string | null;
  };
  siteName: string;
  currentDomain: string;
}

export default function FormattedMetaTags({ 
  seoData, 
  siteName, 
  currentDomain 
}: FormattedMetaTagsProps) {
  const title = seoData.title || siteName;
  const description = seoData.description || 'Welcome to our platform';
  const keywordsString = Array.isArray(seoData.keywords) 
    ? seoData.keywords.join(', ') 
    : seoData.keywords || 'page, information, company';
  const canonicalUrl = seoData.canonicalUrl || currentDomain;
  const ogImage = seoData.seo_og_image || '/images/codedharmony.png';
  
  return (
    <>
      {/* =============================================== */}
      {/* META TAGS - USER-FRIENDLY FORMATTING */}
      {/* =============================================== */}
      
      {/* Basic Meta Tags */}
      <title>
        {title}
      </title>
      
      <meta 
        name="description" 
        content={description} 
      />
      
      <meta 
        name="keywords" 
        content={keywordsString} 
      />
      
      {/* SEO Meta Tags */}
      <meta 
        name="robots" 
        content="index, follow" 
      />
      
      <meta 
        name="googlebot" 
        content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" 
      />
      
      {/* Canonical URL */}
      <link 
        rel="canonical" 
        href={canonicalUrl} 
      />
      
      {/* =============================================== */}
      {/* OPEN GRAPH (FACEBOOK, LINKEDIN, ETC.) */}
      {/* =============================================== */}
      
      <meta 
        property="og:title" 
        content={title} 
      />
      
      <meta 
        property="og:description" 
        content={description} 
      />
      
      <meta 
        property="og:url" 
        content={canonicalUrl} 
      />
      
      <meta 
        property="og:site_name" 
        content={siteName} 
      />
      
      <meta 
        property="og:locale" 
        content="en_US" 
      />
      
      <meta 
        property="og:image" 
        content={`${currentDomain}${ogImage}`} 
      />
      
      <meta 
        property="og:image:width" 
        content="1200" 
      />
      
      <meta 
        property="og:image:height" 
        content="630" 
      />
      
      <meta 
        property="og:image:alt" 
        content={title} 
      />
      
      <meta 
        property="og:type" 
        content="website" 
      />
      
      {/* =============================================== */}
      {/* TWITTER CARD META TAGS */}
      {/* =============================================== */}
      
      <meta 
        name="twitter:card" 
        content="summary_large_image" 
      />
      
      <meta 
        name="twitter:title" 
        content={title} 
      />
      
      <meta 
        name="twitter:description" 
        content={description} 
      />
      
      <meta 
        name="twitter:image" 
        content={`${currentDomain}${ogImage}`} 
      />
      
      {/* =============================================== */}
      {/* END META TAGS */}
      {/* =============================================== */}
    </>
  );
}
