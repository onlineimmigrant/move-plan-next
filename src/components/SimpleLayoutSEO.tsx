import { getDomain } from '@/lib/layout-utils';
import { fetchPageSEOData, fetchDefaultSEOData } from '@/lib/supabase/seo';
import { headers } from 'next/headers';

function getPathnameFromHeaders(headersList: Headers): string {
  // Try multiple ways to extract pathname
  const xPathname = headersList.get('x-pathname');
  const xUrl = headersList.get('x-url');
  const referer = headersList.get('referer');
  
  if (xPathname) return xPathname;
  if (xUrl) return xUrl;
  
  // Extract from referer as fallback
  if (referer) {
    try {
      const url = new URL(referer);
      return url.pathname;
    } catch (e) {
      console.warn('⚠️ [SimpleLayoutSEO] Could not parse referer URL:', referer);
    }
  }
  
  // Ultimate fallback
  return '/';
}

export default async function SimpleLayoutSEO() {
  const currentDomain = await getDomain();
  const headersList = await headers();
  const pathname = getPathnameFromHeaders(headersList);
  
  console.log('🔍 [SimpleLayoutSEO] Using domain:', currentDomain);
  console.log('� [SimpleLayoutSEO] Using pathname:', pathname);
  
  // Use proper SEO data fetching based on actual path
  let seoData;
  try {
    seoData = await fetchPageSEOData(pathname, currentDomain);
    console.log('✅ [SimpleLayoutSEO] Page-specific SEO data fetched for:', pathname);
  } catch (error) {
    console.log('🔄 [SimpleLayoutSEO] Falling back to default SEO data for:', pathname, error);
    seoData = await fetchDefaultSEOData(currentDomain, pathname);
  }
  
  console.log('📊 [SimpleLayoutSEO] SEO data summary:', {
    title: seoData.title,
    structuredDataItems: seoData.structuredData?.length || 0,
    faqItems: seoData.faqs?.length || 0
  });

  // Only render if we have structured data
  if (!seoData.structuredData || seoData.structuredData.length === 0) {
    console.log('⚠️ [SimpleLayoutSEO] No structured data to render');
    return null;
  }

  return (
    <>
      {/* Render SEO structured data from the database */}
      {seoData.structuredData.map((structuredDataItem, index) => {
        try {
          // Use compact JSON without indentation for valid structured data
          const jsonString = JSON.stringify(structuredDataItem);
          console.log(`✅ [SimpleLayoutSEO] Rendering structured data ${index}:`, structuredDataItem['@type']);
          
          return (
            <script
              key={`seo-structured-data-${index}`}
              id={`seo-structured-data-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: jsonString
              }}
            />
          );
        } catch (error) {
          console.error(`❌ [SimpleLayoutSEO] Error serializing structured data ${index}:`, error);
          return null;
        }
      })}
      
      {/* Only render FAQ structured data if it's the homepage and we have FAQs */}
      {seoData.faqs && seoData.faqs.length > 0 && (pathname === '/' || pathname.match(/^\/[a-z]{2}$/) || pathname.match(/^\/[a-z]{2}\/$/)) && (
        <script
          id="layout-faq-structured-data"
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
                  text: faq.answer.replace(/\n/g, ' ').replace(/<[^>]*>/g, '').trim(),
                },
              })),
            })
          }}
        />
      )}
    </>
  );
}
