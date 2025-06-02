'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SEOProvider } from '@/context/SEOContext';
import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider } from '@/context/CookieSettingsContext';
import { BannerProvider } from '@/context/BannerContext';
import SEOWrapper from '@/components/SEOWrapper';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import TemplateSections from '@/components/TemplateSections';
import TemplateHeadingSections from '@/components/TemplateHeadingSections';
import { BannerContainer } from '@/components/banners/BannerContainer';
import { hideNavbarFooterPrefixes } from '@/lib/hiddenRoutes';
import { TemplateSection } from '@/types/template_section';
import { TemplateHeadingSection } from '@/types/template_heading_section';

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
}

export default function ClientProviders({
  children,
  defaultSEOData,
  settings,
  headerData,
  activeLanguages,
  heroData,
}: ClientProvidersProps) {
  const pathname = usePathname();
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [headings, setHeadings] = useState<TemplateHeadingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        setLoading(true);

        // Construct the API URLs using the current pathname
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const urlPage = pathname === '/' ? '/home' : pathname;

        // Fetch template sections
        const sectionsResponse = await fetch(
          `${baseUrl}/api/template-sections?url_page=${encodeURIComponent(urlPage)}`,
          { cache: 'force-cache' }
        );
        if (!sectionsResponse.ok) {
          const errorData = await sectionsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch template sections');
        }
        const sectionsData = await sectionsResponse.json();
        console.log('Fetched template sections in ClientProviders:', sectionsData);
        setSections(sectionsData || []);

        // Fetch template heading sections
        const headingsResponse = await fetch(
          `${baseUrl}/api/template-heading-sections?url_page=${encodeURIComponent(urlPage)}`,
          { cache: 'force-cache' }
        );
        if (!headingsResponse.ok) {
          const errorData = await headingsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch template heading sections');
        }
        const headingsData = await headingsResponse.json();
        console.log('Fetched template heading sections in ClientProviders:', headingsData);
        setHeadings(headingsData || []);
      } catch (error) {
        console.error('Error fetching template data in ClientProviders:', error);
        setSections([]);
        setHeadings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [pathname]);

  const showNavbarFooter = !hideNavbarFooterPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <SEOProvider>
      <AuthProvider>
        <BasketProvider>
          <SettingsProvider initialSettings={settings}>
            <CookieSettingsProvider>
              <BannerProvider>
                <SEOWrapper defaultSEOData={defaultSEOData} />
                {loading ? (
                  <div className="text-center py-12">Loading template sections...</div>
                ) : showNavbarFooter ? (
                  <NavbarFooterWrapper>
                    <div className="">
                      {children}
                      <TemplateHeadingSections  />
                      <TemplateSections  />
                      <Breadcrumbs />
                      <BannerContainer />
                    </div>
                  </NavbarFooterWrapper>
                ) : (
                  <div className="-mt-12">
                    {children}
                    <TemplateHeadingSections  />
                    <TemplateSections  />
                    <BannerContainer />
                  </div>
                )}
                <CookieBanner headerData={headerData} activeLanguages={activeLanguages} />
              </BannerProvider>
            </CookieSettingsProvider>
          </SettingsProvider>
        </BasketProvider>
      </AuthProvider>
    </SEOProvider>
  );
}