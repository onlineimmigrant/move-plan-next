// src/components/SEOClient.tsx
'use client';

import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  canonicalUrl: string;
  structuredData?: object | object[];
  noindex?: boolean;
  hreflang?: { href: string; hreflang: string }[];
  faqs?: { question: string; answer: string }[];
}

export default function SEOClient({
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
  const siteName = 'Your Site Name';
  const defaultImage = '/default-og-image.jpg';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const structuredDataArray = Array.isArray(structuredData)
    ? structuredData
    : structuredData
    ? [structuredData]
    : [];

  // Add FAQPage schema if FAQs exist
  if (faqs.length > 0) {
    structuredDataArray.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
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

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />

      <link rel="canonical" href={canonicalUrl} />

      {hreflang?.map(({ href, hreflang: lang }) => (
        <link key={lang} rel="alternate" href={href} hrefLang={lang} />
      ))}

      {structuredDataArray.map((data, index) => (
        <script
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

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