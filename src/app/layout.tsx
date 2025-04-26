import { AuthProvider } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CookieSettingsProvider } from '@/context/CookieSettingsContext';
import NavbarFooterWrapper from '@/components/NavbarFooterWrapper';
import CookieBanner from '@/components/CookieBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import TemplateSections from '@/components/TemplateSections';
import TemplateHeadingSections from '@/components/TemplateHeadingSections';

import { Settings } from '@/types/settings';
import { supabaseServer } from '@/lib/supabaseServerClient';
import './globals.css';

export const metadata = {
  title: 'My Next.js App',
  description: 'Sample admin app with Next.js 13',
};

async function getSettings(): Promise<Settings> {
  // Skip Supabase during build to avoid errors
  const isBuild = process.env.NODE_ENV === 'production' && !process.env.CI;
  if (isBuild) {
    return {
      id: 0,
      site: '',
      primary_color: { id: 0, name: 'gray-800', hex: '#000000', img_color: '', created_at: '' },
      secondary_color: { id: 0, name: 'sky-500', hex: '#0EA5E9', img_color: '', created_at: '' },
     
      primary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
      secondary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
      font_size_base: { id: 0, name: 'default', value: 16, description: '', created_at: '' },
      font_size_small: { id: 0, name: 'default', value: 14, description: '', created_at: '' },
      font_size_large: { id: 0, name: 'default', value: 18, description: '', created_at: '' },
      updated_at: '',
    };
  }

  try {
    const { data, error } = await supabaseServer
      .from('settings')
      .select(`
        id,
        site,
        primary_color:primary_color_id(id, name, hex, img_color, created_at),
        secondary_color:secondary_color_id(id, name, hex, img_color, created_at),
        footer_color:footer_color_id(id, name, hex, img_color, created_at),
        primary_font:primary_font_id(id, name, description, default_type, created_at),
        secondary_font:secondary_font_id(id, name, description, default_type, created_at),
        font_size_base:font_size_base_id(id, name, value, description, created_at),
        font_size_small:font_size_small_id(id, name, value, description, created_at),
        font_size_large:font_size_large_id(id, name, value, description, created_at),
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching settings:', error);
      return {
        id: 0,
        site: '',
        primary_color: { id: 0, name: 'gray-800', hex: '#000000', img_color: '', created_at: '' },
        secondary_color: { id: 0, name: 'sky-500', hex: '#0EA5E9', img_color: '', created_at: '' },
       
        primary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
        secondary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
        font_size_base: { id: 0, name: 'default', value: 16, description: '', created_at: '' },
        font_size_small: { id: 0, name: 'default', value: 14, description: '', created_at: '' },
        font_size_large: { id: 0, name: 'default', value: 18, description: '', created_at: '' },
        updated_at: '',
      };
    }

    console.log('Fetched settings:', data);

    const settings: Settings = {
      id: data.id,
      site: data.site,
      primary_color: data.primary_color?.[0] ?? {
        id: 0,
        name: 'gray-800',
        hex: '#000000',
        img_color: '',
        created_at: '',
      },
      secondary_color: data.secondary_color?.[0] ?? {
        id: 0,
        name: 'sky-500',
        hex: '#0EA5E9',
        img_color: '',
        created_at: '',
      },

      primary_font: data.primary_font?.[0] ?? {
        id: 0,
        name: 'default',
        description: '',
        default_type: false,
        created_at: '',
      },
      secondary_font: data.secondary_font?.[0] ?? {
        id: 0,
        name: 'default',
        description: '',
        default_type: false,
        created_at: '',
      },
      font_size_base: data.font_size_base?.[0] ?? {
        id: 0,
        name: 'default',
        value: '16px',
        description: '',
        created_at: '',
      },
      font_size_small: data.font_size_small?.[0] ?? {
        id: 0,
        name: 'default',
        value: '14px',
        description: '',
        created_at: '',
      },
      font_size_large: data.font_size_large?.[0] ?? {
        id: 0,
        name: 'default',
        value: '18px',
        description: '',
        created_at: '',
      },
      updated_at: data.updated_at,
    };

    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return {
      id: 0,
      site: '',
      primary_color: { id: 0, name: 'gray-800', hex: '#000000', img_color: '', created_at: '' },
      secondary_color: { id: 0, name: 'sky-500', hex: '#0EA5E9', img_color: '', created_at: '' },
     
      primary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
      secondary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
      font_size_base: { id: 0, name: 'default', value: 16, description: '', created_at: '' },
      font_size_small: { id: 0, name: 'default', value: 14, description: '', created_at: '' },
      font_size_large: { id: 0, name: 'default', value: 18, description: '', created_at: '' },
      updated_at: '',
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const headerData = {
    text_color: settings.primary_color.name,
    text_color_hover: settings.secondary_color.name,
    font_family: settings.primary_font.name.toLowerCase(),
    image_for_privacy_settings: '/images/logo.svg',
    site: settings.site,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'Company'}. All rights reserved.`,
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
                  <Breadcrumbs />
                  <div>{children}
  <TemplateHeadingSections />
                  <TemplateSections />

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
