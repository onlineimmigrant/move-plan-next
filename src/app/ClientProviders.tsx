'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider } from '@/context/CookieSettingsContext';
import { BannerProvider } from '@/context/BannerContext';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/cookie/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import TemplateSections from '@/components/TemplateSections';
import TemplateHeadingSections from '@/components/TemplateHeadingSections';
import { BannerContainer } from '@/components/banners/BannerContainer';
import SkeletonLoader from '@/components/SkeletonLoader';
import { hideNavbarFooterPrefixes } from '@/lib/hiddenRoutes';
import { getBaseUrl } from '@/lib/utils';
import { TemplateSection } from '@/types/template_section';
import { TemplateHeadingSection } from '@/types/template_heading_section';
import { useBanner } from '@/context/BannerContext';
import { Banner } from '@/components/banners/types';
import { MenuItem } from '@/types/menu';

interface ClientProvidersProps {
  children: React.ReactNode;
  settings: any;
  headerData: any;
  activeLanguages: string[];
  heroData: {
    h1_text_color: string;
    p_description_color: string;
  };
  baseUrl: string;
  menuItems: MenuItem[] | undefined;
}

export default function ClientProviders({
  children,
  settings,
  headerData,
  activeLanguages,
  heroData,
  baseUrl,
  menuItems,
}: ClientProvidersProps) {
  const pathname = usePathname() || '/'; // Fallback to '/' if usePathname returns null
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [headings, setHeadings] = useState<TemplateHeadingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useMemo(() => new Map<string, { sections: TemplateSection[]; headings: TemplateHeadingSection[] }>(), []);

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        setLoading(true);
        const urlPage = pathname === '/' ? '/home' : pathname;
        const cacheKey = urlPage;

        if (cache.has(cacheKey)) {
          const cachedData = cache.get(cacheKey)!;
          setSections(cachedData.sections);
          setHeadings(cachedData.headings);
          console.log('Using cached template data for:', cacheKey);
          setLoading(false);
          return;
        }

        const clientBaseUrl = getBaseUrl(false);
        const timeoutPromise: Promise<never> = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 5000)
        );

        const [sectionsResult, headingsResult] = await Promise.all([
          Promise.race([
            fetch(`${clientBaseUrl}/api/template-sections?url_page=${encodeURIComponent(urlPage)}`, {
              cache: 'no-store',
            }),
            timeoutPromise,
          ]),
          Promise.race([
            fetch(`${clientBaseUrl}/api/template-heading-sections?url_page=${encodeURIComponent(urlPage)}`, {
              cache: 'no-store',
            }),
            timeoutPromise,
          ]),
        ]);

        const sectionsResponse = sectionsResult as Response;
        const headingsResponse = headingsResult as Response;

        if (!sectionsResponse.ok) {
          const errorData = await sectionsResponse.json();
          console.error('Sections fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch template sections');
        }
        const sectionsData = await sectionsResponse.json();

        if (!headingsResponse.ok) {
          const errorData = await headingsResponse.json();
          console.error('Headings fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch template headings');
        }
        const headingsData = await headingsResponse.json();

        cache.set(cacheKey, { sections: sectionsData || [], headings: headingsData || [] });
        setSections(sectionsData || []);
        setHeadings(headingsData || []);
      } catch (error: any) {
        console.error('Error fetching template data:', error.message);
        setSections([]);
        setHeadings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [pathname, cache]);

  const showNavbarFooter = useMemo(
    () => !hideNavbarFooterPrefixes.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  return (
    <AuthProvider>
      <BasketProvider>
        <SettingsProvider initialSettings={settings}>
          <CookieSettingsProvider>
            <BannerProvider>
              <BannerAwareContent
                children={children}
                showNavbarFooter={showNavbarFooter}
                menuItems={menuItems}
                loading={loading}
                headerData={headerData}
                activeLanguages={activeLanguages}
              />
              <CookieBanner headerData={headerData} activeLanguages={activeLanguages} />
            </BannerProvider>
          </CookieSettingsProvider>
        </SettingsProvider>
      </BasketProvider>
    </AuthProvider>
  );
}

function BannerAwareContent({
  children,
  showNavbarFooter,
  menuItems,
  loading,
  headerData,
  activeLanguages,
}: {
  children: React.ReactNode;
  showNavbarFooter: boolean;
  menuItems: MenuItem[] | undefined;
  loading: boolean;
  headerData: any;
  activeLanguages: string[];
}) {
  const { banners, getFixedBannersHeight } = useBanner() || { banners: [], getFixedBannersHeight: () => 0 }; // Fallback for null context
  const fixedBanners = useMemo(
    () => (banners || []).filter((b: Banner) => b.isFixedAboveNavbar && !b.isDismissed && b.position === 'top'),
    [banners]
  );
  const nonFixedBanners = useMemo(
    () => (banners || []).filter((b: Banner) => !b.isFixedAboveNavbar || b.isDismissed || b.position !== 'top'),
    [banners]
  );
  const fixedBannersHeight = useMemo(() => getFixedBannersHeight?.() || 0, [getFixedBannersHeight]);

  return (
    <>
      <BannerContainer banners={fixedBanners} />
      {loading ? (
        <SkeletonLoader />
      ) : (
        <div style={{ marginTop: `${fixedBannersHeight}px` }} className="w-full">
          {showNavbarFooter ? (
            <NavbarFooterWrapper menuItems={menuItems} fixedBannersHeight={fixedBannersHeight}>
              <main className="w-full">
                {children}
                <TemplateHeadingSections />
                <TemplateSections />
                <Breadcrumbs />
                <BannerContainer banners={nonFixedBanners} />
              </main>
            </NavbarFooterWrapper>
          ) : (
            <main className="w-full">
              {children}
              <TemplateHeadingSections />
              <TemplateSections />
              <Breadcrumbs />
              <BannerContainer banners={nonFixedBanners} />
            </main>
          )}
        </div>
      )}
    </>
  );
}