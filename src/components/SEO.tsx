// components/SEO.tsx
import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string; // Open Graph and Twitter Card image
  canonicalUrl: string; // Full URL for canonical tag
  structuredData?: object | object[]; // Single or multiple JSON-LD schemas
  noindex?: boolean; // Mark page as noindex
  hreflang?: { href: string; hreflang: string }[]; // For multilingual sites
  faqs?: { question: string; answer: string }[]; // Page-specific FAQs
}

export default async function SEO({
  title,
  description,
  keywords,
  image,
  canonicalUrl,
  structuredData,
  noindex = false,
  hreflang,
  faqs = [],
}: SEOProps) {
  const siteName = 'Your Site Name'; // Replace with your site name
  const defaultImage = '/default-og-image.jpg'; // Fallback image in public/
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch site-wide FAQs from Supabase
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: siteFaqs } = await supabase.from('faqs').select('question, answer');

  // Combine site-wide and page-specific FAQs
  const allFaqs = [...(siteFaqs || []), ...faqs];

  // Normalize structured data to array
  const structuredDataArray = Array.isArray(structuredData)
    ? structuredData
    : structuredData
    ? [structuredData]
    : [];

  // Add FAQPage schema if FAQs exist
  if (allFaqs.length > 0) {
    structuredDataArray.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <Head>
      <title>{`${title} | ${siteName}`}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang for multilingual sites */}
      {hreflang?.map(({ href, hreflang: lang }) => (
        <link key={lang} rel="alternate" href={href} hrefLang={lang} />
      ))}

      {/* JSON-LD Structured Data */}
      {structuredDataArray.map((data, index) => (
        <script
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* WebSite Schema (site-wide) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteName,
            url: baseUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${baseUrl}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </Head>
  );
}