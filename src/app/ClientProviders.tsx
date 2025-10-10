'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext'; // Verify this export exists
import { BasketProvider } from '@/context/BasketContext'; // Verify this export exists
import { SettingsProvider } from '@/context/SettingsContext'; // Verify this export exists
import { CookieSettingsProvider } from '@/context/CookieSettingsContext'; // Verify this export exists
import { BannerProvider } from '@/context/BannerContext'; // Verify this export exists
import { PostEditModalProvider } from '@/components/modals/PostEditModal/context';
import { TemplateSectionEditProvider } from '@/components/modals/TemplateSectionModal/context';
import { TemplateHeadingSectionEditProvider } from '@/components/modals/TemplateHeadingSectionModal/context';
import { PageCreationProvider } from '@/components/modals/PageCreationModal/context';
import { SiteMapModalProvider } from '@/components/modals/SiteMapModal/context';
import { GlobalSettingsModalProvider } from '@/components/modals/GlobalSettingsModal/context';
import { ToastProvider } from '@/components/Shared/ToastContainer';
import PostEditModal from '@/components/modals/PostEditModal/PostEditModal';
import TemplateSectionEditModal from '@/components/modals/TemplateSectionModal/TemplateSectionEditModal';
import TemplateHeadingSectionEditModal from '@/components/modals/TemplateHeadingSectionModal/TemplateHeadingSectionEditModal';
import PageCreationModal from '@/components/modals/PageCreationModal/PageCreationModal';
import SiteMapModal from '@/components/modals/SiteMapModal/SiteMapModal';
import GlobalSettingsModal from '@/components/modals/GlobalSettingsModal/GlobalSettingsModal';
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
import UniversalNewButton from '@/components/AdminQuickActions/UniversalNewButton';
import CommandPalette from '@/components/AdminQuickActions/CommandPalette';
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
  const [loading, setLoading] = useState(false); // Start with false to avoid blocking initial render
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
      const maxRetries = 1; // Only try once - fail fast
      const timeout = 10000; // 10 seconds - reasonable timeout
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          const urlPage = pathname === '/' ? '/home' : pathname;
          const cacheKey = urlPage;

          if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey)!;
            setSections(cachedData.sections);
            setHeadings(cachedData.headings);
            console.log('[ClientProviders] Using cached template data for:', cacheKey);
            setLoading(false);
            return;
          }

          // Only set loading if we're actually fetching (not using cache)
          setLoading(true);

          const clientBaseUrl = getBaseUrl(false);
          const timeoutPromise: Promise<never> = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
          );

          console.log(`[ClientProviders] Fetching template data for: ${urlPage}`);
          const startTime = Date.now();

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

          const fetchTime = Date.now() - startTime;
          console.log(`[ClientProviders] Template data fetched in ${fetchTime}ms`);

          const sectionsResponse = sectionsResult as Response;
          const headingsResponse = headingsResult as Response;

          if (!sectionsResponse.ok) {
            const errorData = await sectionsResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[ClientProviders] Sections fetch error:', errorData);
            throw new Error(errorData.error || 'Failed to fetch template sections');
          }
          const sectionsData = await sectionsResponse.json();

          if (!headingsResponse.ok) {
            const errorData = await headingsResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[ClientProviders] Headings fetch error:', errorData);
            throw new Error(errorData.error || 'Failed to fetch template headings');
          }
          const headingsData = await headingsResponse.json();

          cache.set(cacheKey, { sections: sectionsData || [], headings: headingsData || [] });
          setSections(sectionsData || []);
          setHeadings(headingsData || []);
          setLoading(false);
          console.log(`[ClientProviders] ✅ Template data loaded successfully`);
          return; // Success, exit retry loop
        } catch (error: any) {
          attempt++;
          console.warn(`[ClientProviders] Attempt ${attempt} failed: ${error.message}`);
          
          // Don't retry - just set empty data and continue
          // This allows the page to render even if template data fails
          console.warn('[ClientProviders] ⚠️ Continuing with empty template data - page will render without custom sections');
          setSections([]);
          setHeadings([]);
          setLoading(false);
          break; // Exit loop immediately
        }
      }
    };

    // Don't block - fetch in background
    fetchTemplateData().catch(err => {
      console.error('[ClientProviders] Unhandled error in fetchTemplateData:', err);
      setSections([]);
      setHeadings([]);
      setLoading(false);
    });
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
                      <PageCreationProvider>
                        <SiteMapModalProvider>
                          <GlobalSettingsModalProvider>
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
                            <TemplateSectionEditModal />
                            <TemplateHeadingSectionEditModal />
                            <PageCreationModal />
                            <SiteMapModal />
                            <GlobalSettingsModal />
                          </GlobalSettingsModalProvider>
                        </SiteMapModalProvider>
                      </PageCreationProvider>
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

  // Don't block the entire page render on template data loading
  // The page will render with empty sections/headings and they'll populate when ready
  // if (loading) {
  //   return <SkeletonLoader />;
  // }

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
        <UniversalNewButton />
        <CommandPalette />
      </div>
    </>
  );
}