// src/app/ClientProviders.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { SEOProvider } from '@/context/SEOContext';
import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider } from '@/context/CookieSettingsContext';
import { BannerProvider } from '@/context/BannerContext';
import SEOWrapper from '@/components/seo/SEOWrapper';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/cookie/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import StructuredDataInjector from '@/components/seo/StructuredDataInjector';
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
  defaultSEOData: any;
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
  defaultSEOData,
  settings,
  headerData,
  activeLanguages,
  heroData,
  baseUrl,
  menuItems,
}: ClientProvidersProps) {
  const pathname = usePathname();
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
        console.log('Client baseUrl:', clientBaseUrl);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 5000)
        );

        const sectionsStart = Date.now();
        const sectionsResponse = await Promise.race([
          fetch(`${clientBaseUrl}/api/template-sections?url_page=${encodeURIComponent(urlPage)}`, {
            cache: 'no-store',
          }),
          timeoutPromise,
        ]) as Response;
        console.log('Sections fetch duration:', Date.now() - sectionsStart, 'ms');
        if (!sectionsResponse.ok) {
          const errorData = await sectionsResponse.json();
          console.error('Sections fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch template sections');
        }
        const sectionsData = await sectionsResponse.json();
        console.log('Sections data:', sectionsData);

        const headingsStart = Date.now();
        const headingsResponse = await Promise.race([
          fetch(`${clientBaseUrl}/api/template-heading-sections?url_page=${encodeURIComponent(urlPage)}`, {
            cache: 'no-store',
          }),
          timeoutPromise,
        ]) as Response;
        console.log('Headings fetch duration:', Date.now() - headingsStart, 'ms');
        if (!headingsResponse.ok) {
          const errorData = await headingsResponse.json();
          console.error('Headings fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch template headings');
        }
        const headingsData = await headingsResponse.json();
        console.log('Headings data:', headingsData);

        cache.set(cacheKey, { sections: sectionsData || [], headings: headingsData || [] });
        setSections(sectionsData || []);
        setHeadings(headingsData || []);
      } catch (error) {
        console.error('Error fetching template data:');
        setSections([]);
        setHeadings([]);
      } finally {
        setLoading(false);
        console.log('Loading state set to false at:', new Date().toISOString());
      }
    };

    fetchTemplateData();
  }, [pathname, cache]);

  const showNavbarFooter = useMemo(
    () => !hideNavbarFooterPrefixes.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  return (
    <SEOProvider>
      <AuthProvider>
        <BasketProvider>
          <SettingsProvider initialSettings={settings}>
            <CookieSettingsProvider>
              <BannerProvider>
                <SEOWrapper defaultSEOData={defaultSEOData} />
                <StructuredDataInjector />
                <BannerAwareContent
                  children={children}
                  showNavbarFooter={showNavbarFooter}
                  menuItems={menuItems}
                  loading={loading}
                />
                <CookieBanner headerData={headerData} activeLanguages={activeLanguages} />
              </BannerProvider>
            </CookieSettingsProvider>
          </SettingsProvider>
        </BasketProvider>
      </AuthProvider>
    </SEOProvider>
  );
}

function BannerAwareContent({
  children,
  showNavbarFooter,
  menuItems,
  loading,
}: {
  children: React.ReactNode;
  showNavbarFooter: boolean;
  menuItems: MenuItem[] | undefined;
  loading: boolean;
}) {
  const { banners, getFixedBannersHeight } = useBanner();
  const fixedBanners = useMemo(
    () => banners.filter((b) => b.isFixedAboveNavbar && !b.isDismissed && b.position === 'top'),
    [banners]
  );
  const nonFixedBanners = useMemo(
    () => banners.filter((b) => !b.isFixedAboveNavbar || b.isDismissed || b.position !== 'top'),
    [banners]
  );
  const fixedBannersHeight = useMemo(() => getFixedBannersHeight(), [getFixedBannersHeight]);

  useEffect(() => {
    console.log('BannerAwareContent re-rendered at:', new Date().toISOString());
    console.log('Banners reference changed:', banners);
  }, [banners]);

  console.log('Loading state:', loading);
  console.log('All banners:', JSON.stringify(banners, null, 2));
  console.log('Fixed banners:', JSON.stringify(fixedBanners, null, 2));
  console.log('Non-fixed banners:', JSON.stringify(nonFixedBanners, null, 2));
  console.log('Fixed banners height applied:', fixedBannersHeight);

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
              <BannerContainer banners={nonFixedBanners} />
            </main>
          )}
        </div>
      )}
    </>
  );
}