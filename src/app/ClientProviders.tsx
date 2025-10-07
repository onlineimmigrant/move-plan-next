'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext'; // Verify this export exists
import { BasketProvider } from '@/context/BasketContext'; // Verify this export exists
import { SettingsProvider } from '@/context/SettingsContext'; // Verify this export exists
import { CookieSettingsProvider } from '@/context/CookieSettingsContext'; // Verify this export exists
import { BannerProvider } from '@/context/BannerContext'; // Verify this export exists
import { PostEditModalProvider } from '@/context/PostEditModalContext';
import { TemplateSectionEditProvider } from '@/context/TemplateSectionEditContext';
import { TemplateHeadingSectionEditProvider } from '@/context/TemplateHeadingSectionEditContext';
import { ToastProvider } from '@/components/Shared/ToastContainer';
import PostEditModal from '@/components/PostEditModal/PostEditModal';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/cookie/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import TemplateSections from '@/components/TemplateSections';
import TemplateHeadingSections from '@/components/TemplateHeadingSections';
import { BannerContainer } from '@/components/banners/BannerContainer';
import DefaultLocaleCookieManager from '@/components/DefaultLocaleCookieManager';
import SkeletonLoader from '@/components/SkeletonLoader';
import DynamicLanguageUpdater from '@/components/DynamicLanguageUpdater';
import ChatHelpWidget from '@/components/ChatHelpWidget';
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
  heroData?: {
    h1_text_color: string;
    p_description_color: string;
  };
  baseUrl: string;
  menuItems?: MenuItem[];
}

export default function ClientProviders({
  children,
  settings,
  headerData,
  activeLanguages,
  heroData = {
    h1_text_color: 'gray-900',
    p_description_color: '#000000',
  },
  baseUrl,
  menuItems = [],
}: ClientProvidersProps) {
  const pathname = usePathname() || '/'; // Fallback to '/' if usePathname returns null
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [headings, setHeadings] = useState<TemplateHeadingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useMemo(() => new Map<string, { sections: TemplateSection[]; headings: TemplateHeadingSection[] }>(), []);

  // Create QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    const fetchTemplateData = async () => {
      const maxRetries = 3;
      const timeout = 10000; // 10 seconds
      let attempt = 0;

      while (attempt < maxRetries) {
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
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
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
          setLoading(false);
          return; // Success, exit retry loop
        } catch (error: any) {
          attempt++;
          console.error(`Attempt ${attempt} failed: Error fetching template data:`, error.message);
          if (attempt === maxRetries) {
            console.error('Max retries reached. Setting empty data.');
            setSections([]);
            setHeadings([]);
            setLoading(false);
          } else {
            console.log(`Retrying... (${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }
    };

    fetchTemplateData();
  }, [pathname, cache]);

  const showNavbarFooter = useMemo(() => {
    // Extract the path without locale prefix for hidden route checking
    // Pathname format: /[locale]/path or /path
    const pathSegments = pathname.split('/').filter(Boolean);
    const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/; // Matches 'en', 'es', 'en-US', etc.
    
    // If first segment looks like a locale, remove it to get the actual route
    const routePath = pathSegments.length > 0 && localePattern.test(pathSegments[0])
      ? '/' + pathSegments.slice(1).join('/')
      : pathname;
    
    return !hideNavbarFooterPrefixes.some((prefix) => routePath.startsWith(prefix));
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BannerProvider>
          <BasketProvider>
            <SettingsProvider initialSettings={settings}>
              <ToastProvider>
                <PostEditModalProvider>
                  <TemplateSectionEditProvider>
                    <TemplateHeadingSectionEditProvider>
                      <DynamicLanguageUpdater />
                      <DefaultLocaleCookieManager />
                      <CookieSettingsProvider>
                        <BannerAwareContent
                          children={children}
                          showNavbarFooter={showNavbarFooter}
                          menuItems={menuItems}
                          loading={loading}
                          headerData={headerData}
                          activeLanguages={activeLanguages}
                        />
                        <CookieBanner headerData={headerData} activeLanguages={activeLanguages} />
                      </CookieSettingsProvider>
                      <PostEditModal />
                    </TemplateHeadingSectionEditProvider>
                  </TemplateSectionEditProvider>
                </PostEditModalProvider>
              </ToastProvider>
            </SettingsProvider>
          </BasketProvider>
        </BannerProvider>
      </AuthProvider>
    </QueryClientProvider>
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

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <BannerContainer banners={fixedBanners} />
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
        <ChatHelpWidget />
      </div>
    </>
  );
}