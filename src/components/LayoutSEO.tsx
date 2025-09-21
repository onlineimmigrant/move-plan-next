import { headers } from 'next/headers';
import { fetchPageSEOData, fetchDefaultSEOData } from '@/lib/supabase/seo';
import { getDomain } from '@/lib/layout-utils';

function getPathnameFromHeaders(headersList: Headers): string {
  // Try multiple ways to extract pathname
  const xPathname = headersList.get('x-pathname');
  const xUrl = headersList.get('x-url');
  const referer = headersList.get('referer');
  
  console.log('🔍 [LayoutSEO] Headers debug:', {
    xPathname,
    xUrl,
    referer,
    allHeaders: Array.from(headersList.entries())
  });
  
  if (xPathname) return xPathname;
  if (xUrl) return xUrl;
  
  // Extract from referer as fallback
  if (referer) {
    try {
      const url = new URL(referer);
      return url.pathname;
    } catch (e) {
      console.warn('⚠️ [LayoutSEO] Could not parse referer URL:', referer);
    }
  }
  
  // Ultimate fallback
  return '/';
}

export default async function LayoutSEO() {
  const currentDomain = await getDomain();
  const headersList = await headers();
  
  // Get current pathname from headers with fallbacks
  const pathname = getPathnameFromHeaders(headersList);
  console.log('🔍 [LayoutSEO] Processing pathname:', pathname);
  console.log('🔍 [LayoutSEO] Current domain:', currentDomain);
  
  // Use comprehensive SEO system
  let seoData;
  try {
    seoData = await fetchPageSEOData(pathname, currentDomain);
    console.log('✅ [LayoutSEO] SEO data fetched successfully');
    console.log('📊 [LayoutSEO] Structured data items:', seoData.structuredData.length);
    console.log('📊 [LayoutSEO] FAQ items:', seoData.faqs.length);
    
    // Debug the structured data content
    seoData.structuredData.forEach((item, index) => {
      console.log(`📋 [LayoutSEO] Structured data ${index}:`, JSON.stringify(item, null, 2));
    });
    
  } catch (error) {
    console.error('❌ [LayoutSEO] Error fetching SEO data:', error);
    seoData = await fetchDefaultSEOData(currentDomain, pathname);
    console.log('🔄 [LayoutSEO] Using fallback SEO data');
  }

  if (!seoData || !seoData.structuredData || seoData.structuredData.length === 0) {
    console.warn('⚠️ [LayoutSEO] No structured data available');
    return null;
  }

  // Render structured data scripts
  return (
    <>
      {seoData.structuredData.map((structuredDataItem, index) => {
        // Validate structured data before rendering
        if (!structuredDataItem || typeof structuredDataItem !== 'object') {
          console.warn(`⚠️ [LayoutSEO] Invalid structured data item ${index}:`, structuredDataItem);
          return null;
        }
        
        try {
          const jsonString = JSON.stringify(structuredDataItem, null, 2);
          console.log(`✅ [LayoutSEO] Rendering structured data ${index}:`, structuredDataItem['@type']);
          
          return (
            <script
              key={`structured-data-${index}`}
              id={`structured-data-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: jsonString
              }}
            />
          );
        } catch (error) {
          console.error(`❌ [LayoutSEO] Error serializing structured data ${index}:`, error);
          return null;
        }
      })}
      
      {/* FAQ structured data if available */}
      {seoData.faqs && seoData.faqs.length > 0 && (
        <script
          id="faq-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: seoData.faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer.replace(/\n/g, ' ').trim(),
                },
              })),
            }, null, 2)
          }}
        />
      )}
    </>
  );
}
