'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider, useCookieSettings } from '@/context/CookieSettingsContext';
import { BannerProvider } from '@/context/BannerContext';
import { PostEditModalProvider } from '@/components/modals/PostEditModal/context';
import { TemplateSectionEditProvider } from '@/components/modals/TemplateSectionModal/context';
import { TemplateHeadingSectionEditProvider } from '@/components/modals/TemplateHeadingSectionModal/context';
import { PageCreationProvider } from '@/components/modals/PageCreationModal/context';
import { SiteMapModalProvider } from '@/components/modals/SiteMapModal/context';
import { GlobalSettingsModalProvider } from '@/components/modals/GlobalSettingsModal/context';
import { HeroSectionEditProvider } from '@/components/modals/HeroSectionModal/context';
import { HeaderEditProvider } from '@/components/modals/HeaderEditModal/context';
import { FooterEditProvider } from '@/components/modals/FooterEditModal/context';
import { LayoutManagerProvider } from '@/components/modals/LayoutManagerModal/context';
import { ShopModalProvider } from '@/components/modals/ShopModal';
import { ToastProvider } from '@/components/Shared/ToastContainer';
import { MeetingProvider, useMeetingContext } from '@/context/MeetingContext';
import { PageSectionsProvider } from '@/context/PageSectionsContext';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import { BannerContainer } from '@/components/banners/BannerContainer';
import DefaultLocaleCookieManager from '@/components/DefaultLocaleCookieManager';
import SkeletonLoader from '@/components/SkeletonLoader';
import DynamicLanguageUpdater from '@/components/DynamicLanguageUpdater';
import { ThemeProvider } from '@/components/ThemeProvider';

// Lazy load non-critical components
const Breadcrumbs = dynamic(() => import('@/components/Breadcrumbs'), {
  ssr: false,
  loading: () => null
});
const UnifiedSections = dynamic(() => import('@/components/UnifiedSections'), {
  ssr: false,
  loading: () => null
});

// Lazy load all modals - they're only needed when user interacts
const PostEditModal = dynamic(() => import('@/components/modals/PostEditModal/PostEditModal'), { 
  ssr: false, 
  loading: () => null 
});
const TemplateSectionEditModal = dynamic(() => import('@/components/modals/TemplateSectionModal/TemplateSectionEditModal'), { 
  ssr: false, 
  loading: () => null 
});
const TemplateHeadingSectionEditModal = dynamic(() => import('@/components/modals/TemplateHeadingSectionModal/TemplateHeadingSectionEditModal'), { 
  ssr: false, 
  loading: () => null 
});
const PageCreationModal = dynamic(() => import('@/components/modals/PageCreationModal/PageCreationModal'), { 
  ssr: false, 
  loading: () => null 
});
const SiteMapModal = dynamic(() => import('@/components/modals/SiteMapModal/SiteMapModal'), { 
  ssr: false, 
  loading: () => null 
});
const GlobalSettingsModal = dynamic(() => import('@/components/modals/GlobalSettingsModal/GlobalSettingsModal'), { 
  ssr: false, 
  loading: () => null 
});
const HeroSectionEditModal = dynamic(() => import('@/components/modals/HeroSectionModal/HeroSectionEditModal'), { 
  ssr: false, 
  loading: () => null 
});
const HeaderEditModal = dynamic(() => import('@/components/modals/HeaderEditModal/HeaderEditModal'), { 
  ssr: false, 
  loading: () => null 
});
const FooterEditModal = dynamic(() => import('@/components/modals/FooterEditModal/FooterEditModal'), { 
  ssr: false, 
  loading: () => null 
});
const LayoutManagerModal = dynamic(() => import('@/components/modals/LayoutManagerModal/LayoutManagerModal'), { 
  ssr: false, 
  loading: () => null 
});
const ShopModal = dynamic(() => import('@/components/modals/ShopModal/ShopModal'), { 
  ssr: false, 
  loading: () => null 
});
const UniversalNewButton = dynamic(() => import('@/components/AdminQuickActions/UniversalNewButton'), { 
  ssr: false, 
  loading: () => null 
});
const CommandPalette = dynamic(() => import('@/components/AdminQuickActions/CommandPalette'), { 
  ssr: false, 
  loading: () => null 
});
const UnifiedModalManager = dynamic(() => import('@/components/modals/UnifiedMenu').then(mod => ({ default: mod.UnifiedModalManager })), { 
  ssr: false, 
  loading: () => null 
});
const MeetingsAccountToggleButton = dynamic(() => import('@/components/modals/MeetingsModals').then(mod => ({ default: mod.MeetingsAccountToggleButton })), { 
  ssr: false, 
  loading: () => null 
});

// Lazy load chat widget - only when enabled
const ChatHelpWidgetLazy = dynamic(() => import('@/components/ChatHelpWidget'), {
  ssr: false,
  loading: () => null
});

// Conditionally load VideoCall only when meeting is active
function VideoCallLoader() {
  const { videoCallOpen } = useMeetingContext();
  const [VideoCallComponent, setVideoCallComponent] = useState<any>(null);

  useEffect(() => {
    if (videoCallOpen && !VideoCallComponent) {
      // Dynamically import only when needed
      import('@/components/modals/MeetingsModals/ManagedVideoCall').then(mod => {
        setVideoCallComponent(() => mod.default);
      });
    }
  }, [videoCallOpen, VideoCallComponent]);

  if (!videoCallOpen || !VideoCallComponent) return null;
  return <VideoCallComponent />;
}

// Create lazy wrapper components to avoid SSR bailout error
import CookieBannerComponent from '@/components/cookie/CookieBanner';
import CookieSettingsComponent from '@/components/cookie/CookieSettings';
import { hideNavbarFooterPrefixes, hideFooterOnlyPrefixes } from '@/lib/hiddenRoutes';
import { getBaseUrl } from '@/lib/utils';
import { TemplateSection } from '@/types/template_section';
import { TemplateHeadingSection } from '@/types/template_heading_section';
import { useBanner } from '@/context/BannerContext';
import { Banner } from '@/components/banners/types';
import { MenuItem } from '@/types/menu';

// Wrapper component for standalone CookieSettings modal (opened from Footer)
function StandaloneCookieSettings({ 
  headerData, 
  activeLanguages, 
  cookieCategories 
}: { 
  headerData: any; 
  activeLanguages: string[]; 
  cookieCategories: any[];
}) {
  const { showSettings, setShowSettings } = useCookieSettings();
  
  if (!showSettings) return null;
  
  return (
    <CookieSettingsComponent
      closeSettings={() => setShowSettings(false)}
      headerData={headerData}
      activeLanguages={activeLanguages}
      categories={cookieCategories}
    />
  );
}

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
  cookieCategories?: any[];
  cookieAccepted?: boolean;
  templateSections?: TemplateSection[];
  templateHeadingSections?: TemplateHeadingSection[];
  pathnameFromServer?: string;
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
  cookieCategories = [],
  cookieAccepted = false,
  templateSections = [],
  templateHeadingSections = [],
  pathnameFromServer,
}: ClientProvidersProps) {
  const pathname = usePathname() || '/'; // Use client-side pathname for navigation updates
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [headings, setHeadings] = useState<TemplateHeadingSection[]>([]);
  const [loading, setLoading] = useState(false); // Start with false to avoid blocking initial render
  const cache = useMemo(() => new Map<string, { sections: TemplateSection[]; headings: TemplateHeadingSection[] }>(), []);
  
  // Phase 2: Lazy load cookie banner - delay until page is idle for better LCP/FCP
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    // Only show banner if user hasn't accepted cookies
    if (!cookieAccepted) {
      // Use requestIdleCallback for optimal timing, fallback to setTimeout
      const showBanner = () => {
        // Double-check cookie on client side (in case it changed)
        const hasCookie = typeof document !== 'undefined' && document.cookie.includes('cookies_accepted=true');
        if (!hasCookie) {
          setShowCookieBanner(true);
        }
      };

      if ('requestIdleCallback' in window) {
        // Wait until browser is idle (better than fixed delay)
        const idleId = requestIdleCallback(showBanner, { timeout: 5000 });
        return () => cancelIdleCallback(idleId);
      } else {
        // Fallback for browsers without requestIdleCallback (Safari)
        const timer = setTimeout(showBanner, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [cookieAccepted]);

  // Create QueryClient instance with optimized settings
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1, // Reduce retries for faster failures
        retryDelay: 1000, // Faster retry timing
      },
      mutations: {
        retry: 0, // No retries for mutations
      },
    },
  }));

  useEffect(() => {
    const fetchTemplateData = async () => {
      const maxRetries = 1; // Only try once - fail fast
      const timeout = 5000; // Reduced from 10s to 5s for faster failures
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          const urlPage = pathname === '/' ? '/home' : pathname;
          const cacheKey = urlPage;

          if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey)!;
            setSections(cachedData.sections);
            setHeadings(cachedData.headings);
            setLoading(false);
            return;
          }

          // Only set loading if we're actually fetching (not using cache)
          setLoading(true);

          const clientBaseUrl = getBaseUrl(false);
          const timeoutPromise: Promise<never> = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
          );

          const startTime = Date.now();

          const [sectionsResult, headingsResult] = await Promise.all([
            Promise.race([
              fetch(`${clientBaseUrl}/api/template-sections?url_page=${encodeURIComponent(urlPage)}`, {
                cache: 'no-store',
                // Add priority hint for faster loading
                priority: 'low', // Template sections are not critical for initial render
              } as any),
              timeoutPromise,
            ]),
            Promise.race([
              fetch(`${clientBaseUrl}/api/template-heading-sections?url_page=${encodeURIComponent(urlPage)}`, {
                cache: 'no-store',
                priority: 'low',
              } as any),
              timeoutPromise,
            ]),
          ]);

          const fetchTime = Date.now() - startTime;

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

  const showNavbarFooter = useMemo(() => 
    !hideNavbarFooterPrefixes.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BannerProvider>
          <BasketProvider>
            <SettingsProvider initialSettings={settings}>
              <ThemeProvider>
                <MeetingProvider>
                  <PageSectionsProvider 
                    initialTemplateSections={templateSections}
                    initialTemplateHeadingSections={templateHeadingSections}
                  >
                    <ToastProvider>
                    <HeaderEditProvider>
                      <FooterEditProvider>
                        <LayoutManagerProvider>
                          <PostEditModalProvider>
                            <TemplateSectionEditProvider>
                              <TemplateHeadingSectionEditProvider>
                              <HeroSectionEditProvider>
                                <PageCreationProvider>
                                  <SiteMapModalProvider>
                                    <GlobalSettingsModalProvider>
                                      <ShopModalProvider>
                                    <DynamicLanguageUpdater />
                                    <DefaultLocaleCookieManager />
                                    <CookieSettingsProvider>
                                {/* VideoCall Modal - Only load when meeting is active */}
                                <VideoCallLoader />
                                <BannerAwareContent
                                  key={`${pathname}-${showNavbarFooter}`}
                                  showNavbarFooter={showNavbarFooter}
                                  menuItems={menuItems}
                                  loading={loading}
                                  headerData={headerData}
                                  activeLanguages={activeLanguages}
                                  cookieCategories={cookieCategories}
                                  cookieAccepted={cookieAccepted}
                                  pathname={pathname}
                                >
                                  {children}
                                </BannerAwareContent>
                              {/* Phase 2: Lazy-loaded CookieBanner with 1.5s delay for better LCP */}
                              {showCookieBanner && (
                                <Suspense fallback={null}>
                                  <CookieBannerComponent 
                                    headerData={headerData} 
                                    activeLanguages={activeLanguages}
                                    categories={cookieCategories}
                                  />
                                </Suspense>
                              )}
                              {/* Standalone CookieSettings for Footer "Privacy Settings" button */}
                              <Suspense fallback={null}>
                                <StandaloneCookieSettings 
                                  headerData={headerData}
                                  activeLanguages={activeLanguages}
                                  cookieCategories={cookieCategories}
                                />
                              </Suspense>
                            </CookieSettingsProvider>
                            <PostEditModal />
                            <TemplateSectionEditModal />
                            <TemplateHeadingSectionEditModal />
                            <HeroSectionEditModal />
                            <PageCreationModal />
                            <SiteMapModal />
                            <GlobalSettingsModal />
                            <ShopModal />
                            <HeaderEditModal />
                            <FooterEditModal />
                            <LayoutManagerModal />
                          </ShopModalProvider>
                          </GlobalSettingsModalProvider>
                        </SiteMapModalProvider>
                      </PageCreationProvider>
                    </HeroSectionEditProvider>
                  </TemplateHeadingSectionEditProvider>
                  </TemplateSectionEditProvider>
                </PostEditModalProvider>
              </LayoutManagerProvider>
            </FooterEditProvider>
          </HeaderEditProvider>
        </ToastProvider>
                  </PageSectionsProvider>
              </MeetingProvider>
            </ThemeProvider>
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
  cookieCategories,
  cookieAccepted,
  pathname,
}: {
  children: React.ReactNode;
  showNavbarFooter: boolean;
  menuItems: MenuItem[] | undefined;
  loading: boolean;
  headerData: any;
  activeLanguages: string[];
  cookieCategories: any[];
  cookieAccepted: boolean;
  pathname: string;
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
              <UnifiedSections initialPathname={pathname} />
              <Breadcrumbs />
              <BannerContainer banners={nonFixedBanners} />
            </main>
          </NavbarFooterWrapper>
        ) : (
          <main className="w-full">
            {children}
            <UnifiedSections initialPathname={pathname} />
            <Breadcrumbs />
            <BannerContainer banners={nonFixedBanners} />
          </main>
        )}
        {/* UnifiedMenu replaces: ChatHelpWidget, UniversalNewButton, MeetingsAccountToggleButton */}
        {/* Only show globally for non-admin/account pages (they have their own navigation) */}
        {!pathname.startsWith('/admin') && !pathname.startsWith('/account') && (
          <UnifiedModalManager />
        )}
        <CommandPalette />
      </div>
    </>
  );
}