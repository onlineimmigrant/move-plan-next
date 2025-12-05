/**
 * FooterPreview Component
 * 
 * Exact mirror of the actual Footer.tsx component for live preview
 */

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { MenuItem, SubMenuItem } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

// Dynamically import ModernLanguageSwitcher
const ModernLanguageSwitcher = dynamic(() => import('@/components/ModernLanguageSwitcher'), {
  ssr: false,
  loading: () => <div className="text-sm">🌐 EN</div>
});

// Footer translations matching Footer.tsx
const FOOTER_TRANSLATIONS = {
  en: { 
    privacySettings: 'Privacy Settings',
    profile: 'Profile',
    dashboard: 'Dashboard',
    settings: 'Settings',
    logout: 'Logout',
    links: 'Links'
  },
  es: { 
    privacySettings: 'Configuración de privacidad',
    profile: 'Perfil',
    dashboard: 'Panel de control',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
    links: 'Enlaces'
  },
  fr: { 
    privacySettings: 'Paramètres de confidentialité',
    profile: 'Profil',
    dashboard: 'Tableau de bord',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    links: 'Liens'
  },
  de: { 
    privacySettings: 'Datenschutz-Einstellungen',
    profile: 'Profil',
    dashboard: 'Dashboard',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    links: 'Links'
  },
  ru: { 
    privacySettings: 'Настройки конфиденциальности',
    profile: 'Профиль',
    dashboard: 'Панель управления',
    settings: 'Настройки',
    logout: 'Выход',
    links: 'Ссылки'
  },
  zh: { 
    privacySettings: '隐私设置',
    profile: '个人资料',
    dashboard: '仪表板',
    settings: '设置',
    logout: '登出',
    links: '链接'
  },
  ja: { 
    privacySettings: 'プライバシー設定',
    profile: 'プロフィール',
    dashboard: 'ダッシュボード',
    settings: '設定',
    logout: 'ログアウト',
    links: 'リンク'
  }
};

// Hook to get translations based on current locale
function useFooterTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname?.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && FOOTER_TRANSLATIONS[pathLocale as keyof typeof FOOTER_TRANSLATIONS]) 
    ? pathLocale 
    : defaultLanguage;
  
  // Get translations for current locale or fallback to English
  const translations = FOOTER_TRANSLATIONS[currentLocale as keyof typeof FOOTER_TRANSLATIONS] || FOOTER_TRANSLATIONS.en;
  
  return translations;
}

interface FooterPreviewProps {
  menuItems: MenuItem[];
  footerStyle: string;
  footerStyleFull: any;
  previewRefreshing?: boolean;
  siteName?: string;
  onMenuItemClick?: (itemId: string, event: React.MouseEvent) => void;
}

export const FooterPreview: React.FC<FooterPreviewProps> = ({
  menuItems,
  footerStyle,
  footerStyleFull,
  previewRefreshing = false,
  siteName = 'Your Company',
  onMenuItemClick,
}) => {
  // Get translations based on current locale
  const translations = useFooterTranslations();
  
  // Get styles from footerStyleFull (matches Footer.tsx footerStyles)
  const footerStyles = {
    type: footerStyleFull?.type || footerStyle || 'default',
    background: footerStyleFull?.background || 'neutral-900',
    color: footerStyleFull?.color || 'neutral-400',
    colorHover: footerStyleFull?.color_hover || 'white',
    is_gradient: footerStyleFull?.is_gradient || false,
    gradient: footerStyleFull?.gradient || undefined
  };

  // Get actual color values
  const backgroundColor = getColorValue(footerStyles.background);
  const textColor = getColorValue(footerStyles.color);
  const hoverColor = getColorValue(footerStyles.colorHover);
  
  // Filter visible menu items - those marked for footer display
  const visibleMenuItems = menuItems.filter(item => item.is_displayed_on_footer);
  
  // Separate items with submenus from items without
  const itemsWithSubitems = visibleMenuItems.filter(item => 
    (item.website_submenuitem && item.website_submenuitem.length > 0) ||
    (item.submenu_items && item.submenu_items.length > 0)
  );
  
  const itemsWithoutSubitems = visibleMenuItems.filter(item => 
    (!item.website_submenuitem || item.website_submenuitem.length === 0) &&
    (!item.submenu_items || item.submenu_items.length === 0)
  );

  // Group items without subitems into columns (max 8 per column)
  const maxItemsPerColumn = 8;
  const groupedItemsWithoutSubitems: MenuItem[][] = [];
  for (let i = 0; i < itemsWithoutSubitems.length; i += maxItemsPerColumn) {
    groupedItemsWithoutSubitems.push(itemsWithoutSubitems.slice(i, i + maxItemsPerColumn));
  }

  // FooterLink component with hover state - matches Footer.tsx
  const FooterLink = ({ 
    href, 
    children, 
    className = '', 
    isHeading = false 
  }: { 
    href: string; 
    children: React.ReactNode; 
    className?: string; 
    isHeading?: boolean;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <a
        href={href}
        className={`transition-colors duration-200 ${className}`}
        style={{ 
          color: isHovered ? hoverColor : textColor,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </a>
    );
  };

  // Background style - matches Footer.tsx
  const backgroundStyle = footerStyles.is_gradient && footerStyles.gradient
    ? {
        background: `linear-gradient(to bottom right, ${getColorValue(footerStyles.gradient.from || footerStyles.background)}, ${getColorValue(footerStyles.gradient.to || footerStyles.background)})`,
      }
    : {
        backgroundColor: backgroundColor,
      };

  // Show message if no items
  if (visibleMenuItems.length === 0) {
    return (
      <footer
        className={`px-6 md:px-8 ${footerStyles.type === 'compact' ? 'py-4' : 'py-12'}`}
        role="contentinfo"
        style={{
          ...backgroundStyle,
          color: textColor,
          minHeight: footerStyles.type === 'compact' ? '200px' : '400px'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-lg font-medium mb-2" style={{ color: textColor }}>No menu items found</p>
            <p className="text-sm opacity-75" style={{ color: textColor }}>
              Toggle menu items in the "Menu Items" section to display them in the footer
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Map legacy/unsupported types to supported types (matches Footer.tsx)
  const typeAsString = footerStyles.type as string;
  let mappedType = footerStyles.type;
  
  if (typeAsString === 'light' || typeAsString === 'minimal') {
    mappedType = 'compact';
  } else if (typeAsString === 'stacked') {
    mappedType = 'default';
  }

  // Render different layouts based on type
  const renderDefaultFooter = () => (
    <>
      {/* Privacy Settings Button */}
      <div className="flex justify-between items-center mb-8">
        <button
          className="text-sm font-medium transition-colors duration-200"
          style={{ color: textColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = hoverColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = textColor;
          }}
        >
          {translations.privacySettings}
        </button>
      </div>

      {/* Navigation Grid */}
      <nav className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5" aria-label="Footer navigation">
        {/* Items with submenus */}
        {itemsWithSubitems.map((item) => {
          const submenuItems = item.website_submenuitem || item.submenu_items || [];
          return (
            <div key={item.id} className="col-span-1 min-h-[200px]">
              <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                <FooterLink href={item.url_name || '#'} isHeading={true}>
                  {item.display_name}
                </FooterLink>
              </h2>
              <ul className="space-y-2">
                {submenuItems
                  .filter((sub: SubMenuItem) => sub.is_displayed !== false)
                  .map((subItem: SubMenuItem) => (
                    <li key={subItem.id}>
                      <FooterLink href={subItem.url_name || '#'} className="text-sm">
                        {subItem.name}
                      </FooterLink>
                    </li>
                  ))}
              </ul>
            </div>
          );
        })}

        {/* Items without submenus */}
        {groupedItemsWithoutSubitems.map((group, index) => (
          <div key={`group-${index}`} className="col-span-1 min-h-[200px]">
            <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
              <FooterLink href={group[0]?.url_name || '#'} isHeading={true}>
                {itemsWithSubitems.length ? '' : translations.links}
              </FooterLink>
            </h2>
            <ul className="space-y-2">
              {group.map((item) => (
                <li key={item.id}>
                  <FooterLink href={item.url_name || '#'} className="text-sm">
                    {item.display_name}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Profile Column */}
        <div className="col-span-1 min-h-[200px]">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
            {translations.profile}
          </h2>
          <ul className="space-y-2">
            <li><FooterLink href="#" className="text-sm">{translations.dashboard}</FooterLink></li>
            <li><FooterLink href="#" className="text-sm">{translations.settings}</FooterLink></li>
            <li><FooterLink href="#" className="text-sm">{translations.logout}</FooterLink></li>
          </ul>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-12 pt-8 border-t" style={{ borderColor: `${textColor}33` }}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: textColor }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <ModernLanguageSwitcher openUpward={true} variant="footer" />
        </div>
      </div>
    </>
  );

  const renderCompactFooter = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Menu Links */}
        <nav className="flex flex-wrap gap-6 justify-center md:justify-start" aria-label="Footer navigation">
          {visibleMenuItems.slice(0, 5).map((item) => (
            <FooterLink key={item.id} href={item.url_name || '#'} className="text-sm">
              {item.display_name}
            </FooterLink>
          ))}
        </nav>

        {/* Right: Copyright & Language */}
        <div className="flex items-center gap-4">
          <p className="text-xs" style={{ color: textColor }}>
            © {new Date().getFullYear()} {siteName}
          </p>
          <ModernLanguageSwitcher openUpward={true} variant="footer" />
        </div>
      </div>
    </>
  );

  const renderGridFooter = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {/* Company Info */}
        <div>
          <h2 className="text-base font-semibold mb-4">{siteName}</h2>
          <p className="text-sm opacity-75" style={{ color: textColor }}>
            Your trusted partner for all your needs
          </p>
        </div>

        {/* Menu Columns */}
        {itemsWithSubitems.slice(0, 3).map((item) => {
          const submenuItems = item.website_submenuitem || item.submenu_items || [];
          return (
            <div key={item.id}>
              <h2 className="text-base font-semibold mb-4">
                <FooterLink href={item.url_name || '#'} isHeading={true}>
                  {item.display_name}
                </FooterLink>
              </h2>
              <ul className="space-y-2">
                {submenuItems
                  .filter((sub: SubMenuItem) => sub.is_displayed !== false)
                  .slice(0, 4)
                  .map((subItem: SubMenuItem) => (
                    <li key={subItem.id}>
                      <FooterLink href={subItem.url_name || '#'} className="text-sm">
                        {subItem.name}
                      </FooterLink>
                    </li>
                  ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="pt-6 border-t" style={{ borderColor: `${textColor}33` }}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: textColor }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <ModernLanguageSwitcher openUpward={true} variant="footer" />
        </div>
      </div>
    </>
  );

  const renderFooterContent = () => {
    switch (mappedType) {
      case 'compact':
        return renderCompactFooter();
      case 'grid':
        return renderGridFooter();
      case 'default':
      default:
        return renderDefaultFooter();
    }
  };

  return (
    <footer
      className={`px-6 md:px-8 ${footerStyles.type === 'compact' ? 'py-4' : 'py-12'}`}
      role="contentinfo"
      style={{
        ...backgroundStyle,
        color: textColor,
        minHeight: footerStyles.type === 'compact' ? '200px' : '400px'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {renderFooterContent()}
      </div>
    </footer>
  );
};

