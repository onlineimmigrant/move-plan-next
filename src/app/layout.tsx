// app/layout.tsx
import { getSettings } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get base URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch settings for the organization
  const settings: Settings = await getSettings(baseUrl);

  // Fetch site-wide FAQs (organization-specific)
  let siteFaqs: { question: string; answer: string }[] = [];
  try {
    const organizationId = await supabase
      .from('organizations')
      .select('id')
      .eq(process.env.NODE_ENV === 'development' ? 'base_url_local' : 'base_url', baseUrl)
      .single()
      .then(({ data }) => data?.id);

    if (organizationId) {
      const { data, error } = await supabase
        .from('faq')
        .select('question, answer')
        .eq('organization_id', organizationId);
      if (error) throw error;
      siteFaqs = data || [];
    }
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
  }

  const headerData = {
    text_color: settings.primary_color.name,
    text_color_hover: settings.secondary_color.name,
    font_family: settings.primary_font.name.toLowerCase(),
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
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
        name: settings?.site || baseUrl,
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

export const revalidate = 3600; // Revalidate every hour