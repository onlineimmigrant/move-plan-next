import { headers } from 'next/headers';
import { fetchPageSEOData, fetchDefaultSEOData } from '@/lib/supabase/seo';
import { getDomain } from '@/lib/layout-utils';
import { getPathnameFromHeaders, stripLocaleFromPathname } from '@/lib/seo/pathname-utils';

export default async function LayoutSEO() {
  const currentDomain = await getDomain();
  const headersList = await headers();
  
  // Get current pathname and strip locale for SEO data lookup
  const fullPathname = getPathnameFromHeaders(headersList);
  const pathname = stripLocaleFromPathname(fullPathname);
  
  // Use comprehensive SEO system
  let seoData;
  try {
    seoData = await fetchPageSEOData(pathname, currentDomain);
    
  } catch (error) {
    console.error('❌ [LayoutSEO] Error fetching SEO data:', error);
    seoData = await fetchDefaultSEOData(currentDomain, pathname);
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
