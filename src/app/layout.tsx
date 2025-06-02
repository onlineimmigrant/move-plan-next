import { getSettings, getOrganizationId } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get base URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch settings for the organization
  const settings: Settings = await getSettings(baseUrl);
  console.log('Fetched settings in layout:', settings);

  // Fetch organization ID using the same logic as getSettings
  const organizationId = await getOrganizationId(baseUrl);
  console.log('Fetched organizationId in layout:', organizationId);

  // Fetch site-wide FAQs (organization-specific or null)
  let siteFaqs: { question: string; answer: string }[] = [];
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('faq')
        .select('question, answer')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`);
      if (error) throw error;
      siteFaqs = data || [];
      console.log('Fetched siteFaqs in layout:', siteFaqs);
    } catch (error) {
      console.error('Failed to fetch FAQs in layout:', error);
    }
  } else {
    console.error('No organization ID found for FAQ fetch, URL:', baseUrl);
  }

  // Fetch hero data for ClientProviders
  let heroData = {
    h1_text_color: 'gray-900',
    p_description_color: '#000000',
  };
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('website_hero')
        .select('h1_text_color, p_description_color')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .single();
      if (error) throw error;
      heroData = {
        h1_text_color: data?.h1_text_color || 'gray-900',
        p_description_color: data?.p_description_color || '#000000',
      };
      console.log('Fetched heroData in layout:', heroData);
    } catch (error) {
      console.error('Failed to fetch hero data in layout:', error);
    }
  }

  const headerData = {
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
          heroData={heroData}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const revalidate = 3600; // Revalidate every hour