// app/ClientProviders.tsx
'use client';

import { usePathname } from 'next/navigation';
import { SEOProvider } from '@/context/SEOContext';
import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider } from '@/context/CookieSettingsContext';
import SEOWrapper from '@/components/SEOWrapper';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import TemplateSections from '@/components/TemplateSections';
import TemplateHeadingSections from '@/components/TemplateHeadingSections';
import { hideNavbarFooterPrefixes } from '@/lib/hiddenRoutes';

interface ClientProvidersProps {
  children: React.ReactNode;
  defaultSEOData: any;
  settings: any;
  headerData: any;
  activeLanguages: string[];
}

export default function ClientProviders({
  children,
  defaultSEOData,
  settings,
  headerData,
  activeLanguages,
}: ClientProvidersProps) {
  const pathname = usePathname();

  const showNavbarFooter = !hideNavbarFooterPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <SEOProvider>
      <AuthProvider>
        <BasketProvider>
          <SettingsProvider initialSettings={settings}>
            <CookieSettingsProvider>
              <SEOWrapper defaultSEOData={defaultSEOData} />
              {showNavbarFooter ? (
                <NavbarFooterWrapper>
                  <div className="">
                    {children}
                    <TemplateHeadingSections />
                    <TemplateSections />
                    <Breadcrumbs />
                  </div>
                </NavbarFooterWrapper>
              ) : (
                <div className="-mt-12">
                  {children}
                  <TemplateHeadingSections />
                  <TemplateSections />
                  
                </div>
              )}
              <CookieBanner headerData={headerData} activeLanguages={activeLanguages} />
            </CookieSettingsProvider>
          </SettingsProvider>
        </BasketProvider>
      </AuthProvider>
    </SEOProvider>
  );
}