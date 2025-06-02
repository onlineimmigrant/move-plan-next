// /app/layout.tsx
import { getSettings, getOrganizationId } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Skip Supabase queries during Vercel build
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  if (isBuild) {
    console.log('Skipping Supabase queries during Vercel build');
    const defaultSettings: Settings = {
      id: 0,
      site: 'My Next.js App',
      image: '/images/logo.svg',
      organization_id: '',
      menu_width: '7xl',
      menu_items_are_text: true,
      footer_color: 'gray-800',
    };
    return (
      <html lang="en">
        <body>
          <ClientProviders
            defaultSEOData={{
              title: 'My Next.js App',
              description: 'Sample admin app with Next.js 15',
              keywords: 'education, resources, app',
              canonicalUrl: 'http://localhost:3000',
              hreflang: [],
              faqs: [],
              structuredData: [],
            }}
            settings={defaultSettings}
            headerData={{
              image_for_privacy_settings: defaultSettings.image,
              site: defaultSettings.site,
              image: defaultSettings.image,
              disclaimer: `© ${new Date().getFullYear()} My Next.js App. All rights reserved.`,
            }}
            activeLanguages={['en', 'es', 'fr']}
            heroData={{ h1_text_color: 'gray-900', p_description_color: '#000000' }}
            baseUrl="http://localhost:3000"
          >
            {children}
          </ClientProviders>
        </body>
      </html>
    );
  }

  // Determine base URL dynamically
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  console.log('Base URL in RootLayout:', baseUrl);

  // Fetch settings for the organization
  let settings: Settings = {
    id: 0,
    site: 'My Next.js App',
    image: '/images/logo.svg',
    organization_id: '',
    menu_width: '7xl',
    menu_items_are_text: true,
    footer_color: 'gray-800',
  };
  try {
    settings = await getSettings(baseUrl);
    console.log('Fetched settings in layout:', settings);
  } catch (error) {
    console.error('Failed to fetch settings in layout:', error);
  }

  // Fetch organization ID
  let organizationId: string | null = null;
  try {
    organizationId = await getOrganizationId(baseUrl);
    console.log('Fetched organizationId in layout:', organizationId);
  } catch (error) {
    console.error('Failed to fetch organizationId in layout:', error);
  }

  // Fetch site-wide FAQs
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

  // Fetch hero data
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
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'My Next.js App'}. All rights reserved.`,
  };

  const activeLanguages = ['en', 'es', 'fr'];

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
          settings={{ ...settings, baseUrl }} // Pass baseUrl in settings
          headerData={headerData}
          activeLanguages={activeLanguages}
          heroData={heroData}
          baseUrl={baseUrl}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const revalidate = 3600; // Revalidate every hour