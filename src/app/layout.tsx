// app/layout.tsx
import { getSettings } from '@/lib/getSettings';
import { createClient } from '@supabase/supabase-js';
import './globals.css';
import ClientProviders from './ClientProviders';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch site-wide FAQs
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  let siteFaqs: { question: string; answer: string }[] = [];
  try {
    const { data, error } = await supabase.from('faq').select('question, answer');
    if (error) throw error;
    siteFaqs = data || [];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
  }

  const headerData = {
    text_color: settings.primary_color.name,
    text_color_hover: settings.secondary_color.name,
    font_family: settings.primary_font.name.toLowerCase(),
    image_for_privacy_settings: '/images/logo.svg',
    site: settings.site,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || ''}. All rights reserved.`,
  };

  const activeLanguages = ['en', 'es', 'fr'];

  // Default SEO data
  const defaultSEOData = {
    title: settings.site || 'My Next.js App',
    description: 'Sample admin app with Next.js 15',
    keywords: 'education, resources, app',
    canonicalUrl: baseUrl,
    hreflang: activeLanguages.map((lang) => ({
      href: `${baseUrl}/${lang}`,
      hreflang: lang,
    })),
    faqs: siteFaqs,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: settings?.site || `${baseUrl}`,
        url: baseUrl,
        description: 'Sample admin app with Next.js 15',
        publisher: {
          '@type': 'Organization',
          name: settings.site || 'Your Site Name',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/images/logo.svg`,
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
        ],
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <ClientProviders
          defaultSEOData={defaultSEOData}
          settings={settings}
          headerData={headerData}
          activeLanguages={activeLanguages}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const revalidate = 3600; // Revalidate FAQs every hour