// Utility function to generate page-specific metadata
// This can be used by individual pages that need custom metadata

import { Metadata } from 'next';
import { pageMetadataDefinitions, generateDynamicPageMetadata } from '@/lib/page-metadata-definitions';
import { getSettings } from '@/lib/getSettings';
import { headers } from 'next/headers';

export async function createPageMetadata(pathname: string): Promise<Metadata> {
  const headersList = await headers();
  const currentDomain = headersList.get('host')
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${headersList.get('host')}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Get settings for site name and default values
  let siteName = 'App';
  let ogImage = '/default-og-image.jpg';

  try {
    const settings = await getSettings(currentDomain);
    if (settings) {
      siteName = settings.site || 'App';
      ogImage = settings.seo_og_image || ogImage;
    }
  } catch (error) {
    console.error(`[${pathname} generateMetadata] Failed to fetch settings:`, error);
  }

  // Get page-specific metadata or generate dynamic metadata
  const pageMetadata = pageMetadataDefinitions[pathname] || 
    generateDynamicPageMetadata(pathname, siteName);

  const title = pathname === '/' 
    ? siteName 
    : `${pageMetadata.title} | ${siteName}`;

  const canonicalUrl = `${currentDomain}${pathname}`;
  const keywords = pageMetadata.keywords.join(', ');

  return {
    title,
    description: pageMetadata.description,
    keywords,
    
    // Open Graph
    openGraph: {
      title,
      description: pageMetadata.description,
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: `${currentDomain}${ogImage}`,
          width: 1200,
          height: 630,
          alt: pageMetadata.title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description: pageMetadata.description,
      images: [`${currentDomain}${ogImage}`],
    },

    // Additional meta tags
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
