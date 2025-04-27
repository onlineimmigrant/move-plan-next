import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider } from '@/context/CookieSettingsContext';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import TemplateSections from '@/components/TemplateSections';
import TemplateHeadingSections from '@/components/TemplateHeadingSections';
import { getSettings } from '@/lib/getSettings'; // Import the separated function
import './globals.css';

export const metadata = {
  title: 'My Next.js App',
  description: 'Sample admin app with Next.js 13',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const headerData = {
    text_color: settings.primary_color.name,
    text_color_hover: settings.secondary_color.name,
    font_family: settings.primary_font.name.toLowerCase(),
    image_for_privacy_settings: '/images/logo.svg',
    site: settings.site,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || ''}. All rights reserved.`,
  };

  const activeLanguages = ['en', 'es', 'fr'];

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <BasketProvider>
            <SettingsProvider initialSettings={settings}>
              <CookieSettingsProvider>
                <NavbarFooterWrapper>
                  <div className="">
                    {children}
                    <TemplateHeadingSections />
                    <TemplateSections />
                    <Breadcrumbs />
                  </div>
                </NavbarFooterWrapper>
                <CookieBanner headerData={headerData} activeLanguages={activeLanguages} />
              </CookieSettingsProvider>
            </SettingsProvider>
          </BasketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}