import { getSettings, getOrganizationId, getDefaultSettings, getSiteName } from '@/lib/getSettings';
import { headers } from 'next/headers';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import { pageMetadataDefinitions } from '@/lib/page-metadata-definitions';
import { fetchMenuItems, getDomain, getSettingsWithFallback, getFaviconUrl, getLanguageFromSettings, getLocaleFromSettings } from '@/lib/layout-utils';
import { getSupportedLocales } from '@/lib/language-utils';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/GTMComponents';
import { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const currentDomain = await getDomain();
  const settings = await getSettingsWithFallback(currentDomain);
  const pageMetadata = pageMetadataDefinitions['/'];
  const siteName = getSiteName(settings);
  const description = pageMetadata.description;
  const ogImage = settings.seo_og_image || '/images/codedharmony.png';
  const locale = getLocaleFromSettings(settings);

  return {
    title: siteName,
    description,
    keywords: pageMetadata.keywords.join(', '),
    openGraph: {
      title: siteName,
      description,
      url: currentDomain,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: [ogImage],
    },
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
    alternates: { canonical: currentDomain },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentDomain = await getDomain();
  const settings = await getSettingsWithFallback(currentDomain);
  const organizationId = await getOrganizationId(currentDomain).catch(() => null);
  const menuItems = await fetchMenuItems(organizationId);
  const language = getLanguageFromSettings(settings);

  const headerData = {
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'Company'}. All rights reserved.`,
  };

  const faviconUrl = getFaviconUrl(settings.favicon || undefined);

  return (
    <html lang={language}>
      <head>
        <link rel="icon" href={faviconUrl} />
        {settings.google_tag && <GoogleTagManager gtmId={settings.google_tag} />}
      </head>
      <body>
        {settings.google_tag && <GoogleTagManagerNoscript gtmId={settings.google_tag} />}
        <ClientProviders
          settings={settings}
          headerData={headerData}
          activeLanguages={getSupportedLocales(settings as any)}
          baseUrl={currentDomain}
          menuItems={menuItems}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}