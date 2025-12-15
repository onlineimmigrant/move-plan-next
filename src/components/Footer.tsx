'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { MenuItem, SubMenuItem } from '@/types/menu';
import ModernLanguageSwitcher from './ModernLanguageSwitcher';
import LocalizedLink from './LocalizedLink';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import { FooterType } from '@/types/settings';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { usePrefetchLink } from '@/hooks/usePrefetchLink';

// Shared hooks
import { useNavigation } from '@/hooks/shared/useNavigation';
import { useMenuData } from '@/hooks/shared/useMenuData';
import { useComponentStyles } from '@/hooks/shared/useComponentStyles';

// Footer-specific
import { useFooterTranslations } from './footer/useFooterTranslations';
import { 
  useAccordionState, 
  useFooterVisibility, 
  useFooterStyles,
  getLinkStyles 
} from './footer/hooks';
import { FooterLink } from './footer/components/FooterLink';

//import SRAValidationBadge from "./SRAValidationBadge";


const ContactModal = dynamic(() => import('./contact/ContactModal'), { 
  ssr: false,
  loading: () => null
});

const LegalNoticeModal = dynamic(() => import('./legal/LegalNoticeModal'), {
  ssr: false,
  loading: () => null
});


interface FooterProps {
  menuItems?: MenuItem[];
}

const Footer: React.FC<FooterProps> = ({ menuItems = [] }) => {
  const { session, logout } = useAuth();
  const { settings } = useSettings();
  const { setShowSettings } = useCookieSettings();
  const { isAdmin } = useAuth();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  
  // Footer visibility and accordion state
  const { isReady, isVisible, footerRef } = useFooterVisibility();
  const { openAccordions, toggleAccordion } = useAccordionState();
  
  // Use shared navigation hook
  const { router, pathname, currentLocale } = useNavigation();
  
  // Use shared menu data hook
  const { footerMenuItems: filteredMenuItems, translateMenuItem } = useMenuData({
    menuItems,
    currentLocale,
    filterForFooter: true,
  });
  
  // Web Vitals monitoring for Footer performance
  useWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Footer] ${metric.name}: ${metric.value}ms (${metric.rating})`);
    }
  });

  // Use translations with fallback
  const translations = useFooterTranslations();
  
  // Get current locale for menu translations
  // REMOVED: Now using shared useNavigation hook
  
  const isAuthenticated = !!session;
  const maxItemsPerColumn = 8;

  // Memoize menu grouping logic
  const { itemsWithSubitems, itemsWithoutSubitems, groupedItemsWithoutSubitems } = useMemo(() => {
    const safeMenuItems = filteredMenuItems; // Use filtered menu items from shared hook
    const itemsWithSubitems = safeMenuItems.filter(
      (item) => item.website_submenuitem?.length
    );
    const itemsWithoutSubitems = safeMenuItems.filter(
      (item) => !item.website_submenuitem?.length
    );
    const groupedItems: MenuItem[][] = [];
    for (let i = 0; i < itemsWithoutSubitems.length; i += maxItemsPerColumn) {
      groupedItems.push(itemsWithoutSubitems.slice(i, i + maxItemsPerColumn));
    }
    return {
      itemsWithSubitems,
      itemsWithoutSubitems, // Add ungrouped items for mobile accordion
      groupedItemsWithoutSubitems: groupedItems,
    };
  }, [filteredMenuItems]);

  // Memoize handlers
  const handleLogout = useMemo(() => () => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleNavigation = useMemo(() => (path: string) => () => router.push(path), [router]);

  const handleContactModal = useCallback(() => {
    setIsContactOpen(true);
  }, []);

  // Footer styles from hook
  const footerStyles = useFooterStyles({ footerStyle: settings?.footer_style });

  // Debug: Log legal notice settings
  useEffect(() => {
    console.log('👣 [Footer] Legal Notice settings:', {
      has_legal_notice: !!settings.legal_notice,
      enabled: settings.legal_notice?.enabled,
      enabled_type: typeof settings.legal_notice?.enabled,
      full_legal_notice: settings.legal_notice,
      footer_type: footerStyles.type
    });
  }, [settings.legal_notice, footerStyles.type]);

  // Render footer based on type
  const renderFooterContent = () => {
    // Map legacy/unsupported types to supported types
    const typeAsString = footerStyles.type as string;
    let mappedType: FooterType = footerStyles.type;
    
    if (typeAsString === 'light' || typeAsString === 'minimal') {
      mappedType = 'compact';
    } else if (typeAsString === 'stacked') {
      mappedType = 'default';
    }
    
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

  // DEFAULT FOOTER - Current multi-column grid
  const renderDefaultFooter = () => (
    <>
      <div className="flex justify-between items-center mb-2 md:mb-8 pb-4 border-b border-gray-200/50 md:border-0 md:pb-0">
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={() => setShowSettings(true)}
            className="text-base font-semibold pl-6 md:pl-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            style={{
              color: getColorValue(footerStyles.color)
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.color);
            }}
            aria-label={translations.privacySettings}
          >
            {translations.privacySettings}
          </button>
        </div>
      </div>

      {/* Mobile: Single column accordion | Desktop: Grid layout */}
      <nav className="md:hidden space-y-2" aria-label="Footer navigation (mobile)">
        {menuItems.length === 0 ? (
          <span className="text-neutral-500 text-sm">No menu items available</span>
        ) : (
          <>
            {/* Menu items with subitems */}
            {itemsWithSubitems.map((item) => {
              const translatedDisplayName = currentLocale 
                ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                : item.display_name;
              const isOpen = openAccordions.has(`menu-${item.id}`);

              return (
                <div key={item.id} className="border-b border-gray-200/50">
                  <button
                    onClick={() => toggleAccordion(`menu-${item.id}`)}
                    className="w-full flex items-center justify-between pl-6 pr-4 py-4 transition-colors duration-200"
                    style={{ color: getColorValue(footerStyles.color) }}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold">{translatedDisplayName}</span>
                    {isOpen ? (
                      <ChevronDown 
                        className="w-5 h-5 transition-transform duration-200 flex-shrink-0"
                        style={{ color: getColorValue(footerStyles.color) }}
                      />
                    ) : (
                      <ChevronRight 
                        className="w-5 h-5 transition-transform duration-200 flex-shrink-0"
                        style={{ color: getColorValue(footerStyles.color) }}
                      />
                    )}
                  </button>
                  {isOpen && (
                    <ul className="pb-3 space-y-2 pl-6">
                      {item.website_submenuitem
                        ?.map((subItem) => {
                          const translatedSubItemName = currentLocale 
                            ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                            : subItem.name;
                          return (
                            <li key={subItem.id}>
                              <FooterLink href={subItem.url_name || '#'} className="text-sm" footerStyles={footerStyles}>
                                {translatedSubItemName}
                              </FooterLink>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* Items without subitems (grouped) */}
            {itemsWithoutSubitems.length > 0 && (
              <div className="border-b border-gray-200/50">
                <button
                  onClick={() => toggleAccordion('menu-other')}
                  className="w-full flex items-center justify-between pl-6 pr-4 py-4 transition-colors duration-200"
                  style={{ color: getColorValue(footerStyles.color) }}
                  aria-expanded={openAccordions.has('menu-other')}
                >
                  <span className="text-base font-semibold">{translations.quickLinks || 'Quick Links'}</span>
                  {openAccordions.has('menu-other') ? (
                    <ChevronDown 
                      className="w-5 h-5 transition-transform duration-200 flex-shrink-0"
                      style={{ color: getColorValue(footerStyles.color) }}
                    />
                  ) : (
                    <ChevronRight 
                      className="w-5 h-5 transition-transform duration-200 flex-shrink-0"
                      style={{ color: getColorValue(footerStyles.color) }}
                    />
                  )}
                </button>
                {openAccordions.has('menu-other') && (
                  <ul className="pb-3 space-y-2 pl-6">
                    {itemsWithoutSubitems.map((item) => {
                      const translatedDisplayName = currentLocale 
                        ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                        : item.display_name;
                      return (
                        <li key={item.id}>
                          <FooterLink href={item.url_name || '#'} className="text-sm" footerStyles={footerStyles}>
                            {translatedDisplayName}
                          </FooterLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Admin/Profile section */}
            <div className="border-b border-gray-200/50">
              <button
                onClick={() => toggleAccordion('menu-profile')}
                className="w-full flex items-center justify-between pl-6 pr-4 py-4 transition-colors duration-200"
                style={{ color: getColorValue(footerStyles.color) }}
                aria-expanded={openAccordions.has('menu-profile')}
              >
                <span className="text-base font-semibold">{isAdmin ? translations.admin : translations.profile}</span>
                {openAccordions.has('menu-profile') ? (
                  <ChevronDown 
                    className="w-5 h-5 transition-transform duration-200 flex-shrink-0"
                    style={{ color: getColorValue(footerStyles.color) }}
                  />
                ) : (
                  <ChevronRight 
                    className="w-5 h-5 transition-transform duration-200 flex-shrink-0"
                    style={{ color: getColorValue(footerStyles.color) }}
                  />
                )}
              </button>
              {openAccordions.has('menu-profile') && (
                <ul className="pb-3 space-y-2 pl-6">
                  {isAuthenticated ? (
                    <>
                      {isAdmin && (
                        <>
                          <li><FooterLink href="/admin" className="text-sm" footerStyles={footerStyles}>{translations.dashboard}</FooterLink></li>
                          <li>
                            <button
                              type="button"
                              onClick={handleContactModal}
                              className="text-sm transition-colors duration-200"
                              style={{ color: getColorValue(footerStyles.color) }}
                            >
                              {translations.tickets}
                            </button>
                          </li>
                          <li><FooterLink href="/admin" className="text-sm" footerStyles={footerStyles}>{translations.meetings}</FooterLink></li>
                          <li><FooterLink href="/admin/ai/management" className="text-sm" footerStyles={footerStyles}>{translations.aiAgents}</FooterLink></li>
                        </>
                      )}
                      <li>
                        <button
                          onClick={handleLogout}
                          type="button"
                          className="text-sm transition-colors duration-200"
                          style={{ color: getColorValue(footerStyles.color) }}
                        >
                          {translations.logout}
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button
                        onClick={() => router.push('/auth/login')}
                        type="button"
                        className="text-sm transition-colors duration-200"
                        style={{ color: getColorValue(footerStyles.color) }}
                      >
                        {translations.login}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Legal Notice - Mobile only */}
            {settings.legal_notice?.enabled && (
              <div className="md:hidden border-b border-gray-200/50 -mx-0">
                <button
                  onClick={() => setShowLegalNotice(true)}
                  className="w-full text-left pl-6 pr-4 py-4 text-base font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 flex items-center justify-between"
                  style={{
                    color: getColorValue(footerStyles.color)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = getColorValue(footerStyles.color);
                  }}
                  aria-label={translations.legalNotice}
                >
                  <span>{translations.legalNotice}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Language Switcher - Mobile only */}
            {settings?.with_language_switch && (
              <div className="border-b border-gray-200/50 -mx-0 md:mx-0">
                <div className="w-full flex items-center justify-between pl-6 pr-4 py-4">
                  <span className="text-base font-semibold" style={{ color: getColorValue(footerStyles.color) }}>
                    {translations.language || 'Language'}
                  </span>
                  <div className="md:hidden absolute left-0 right-0 flex justify-end pr-4">
                    <ModernLanguageSwitcher openUpward={true} variant="footer" fullWidthMobile={true} />
                  </div>
                  <div className="hidden md:flex items-center">
                    <ModernLanguageSwitcher openUpward={true} variant="footer" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Desktop: Grid layout (hidden on mobile) */}
      <nav className="hidden md:grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5" aria-label="Footer navigation">
        {menuItems.length === 0 ? (
          <span className="text-neutral-500 text-sm">No menu items available</span>
        ) : (
          <>
            {itemsWithSubitems.map((item) => {
              const translatedDisplayName = currentLocale 
                ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                : item.display_name;

              return (
                <div key={item.id} className="col-span-1 min-h-[200px]">
                  <h2 className="text-base font-semibold mb-4">
                    <FooterLink
                      href={item.url_name || '#'}
                      className="transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                      isHeading={true}
                      footerStyles={footerStyles}
                    >
                      {translatedDisplayName}
                    </FooterLink>
                  </h2>
                  <ul className="space-y-2">
                    {item.website_submenuitem
                      ?.map((subItem) => {
                        const translatedSubItemName = currentLocale 
                          ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                          : subItem.name;

                        return (
                          <li key={subItem.id}>
                            <FooterLink
                              href={subItem.url_name || '#'}
                              className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                              footerStyles={footerStyles}
                            >
                              {translatedSubItemName}
                            </FooterLink>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              );
            })}

            {groupedItemsWithoutSubitems.map((group, index) => (
              <div key={`group-${index}`} className="col-span-1 min-h-[200px]">
                <h2 className="text-base font-semibold mb-4">
                  <FooterLink
                    href={group[0]?.url_name || '#'}
                    className="transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    isHeading={true}
                    footerStyles={footerStyles}
                  >
                    {itemsWithSubitems.length ? '' : translations.links}
                  </FooterLink>
                </h2>
                <ul className="space-y-2">
                  {group.map((item) => {
                    const translatedDisplayName = currentLocale 
                      ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                      : item.display_name;

                    return (
                      <li key={item.id}>
                        <FooterLink
                          href={item.url_name || '#'}
                          className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          footerStyles={footerStyles}
                        >
                          {translatedDisplayName}
                        </FooterLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="col-span-1 min-h-[200px]">
              <h2 className="text-base font-semibold mb-4">
                <span 
                  className="transition-colors duration-200"
                  style={{ color: getColorValue(footerStyles.color) }}
                >
                  {isAdmin ? translations.admin : translations.profile}
                </span>
              </h2>
              <ul className="space-y-2">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <>
                        <li>
                          <FooterLink href="/admin" className="text-sm" footerStyles={footerStyles}>
                            {translations.dashboard}
                          </FooterLink>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={handleContactModal}
                            className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                            style={{
                              color: getColorValue(footerStyles.color)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = getColorValue(footerStyles.color);
                            }}
                            aria-label={translations.tickets}
                          >
                            {translations.tickets}
                          </button>
                        </li>
                        <li>
                          <FooterLink href="/admin" className="text-sm" footerStyles={footerStyles}>
                            {translations.meetings}
                          </FooterLink>
                        </li>
                        <li>
                          <FooterLink href="/admin/ai/management" className="text-sm" footerStyles={footerStyles}>
                            {translations.aiAgents}
                          </FooterLink>
                        </li>
                      </>
                    )}
                    <li>
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                        style={{
                          color: getColorValue(footerStyles.color)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = getColorValue(footerStyles.color);
                        }}
                        aria-label={translations.logout}
                      >
                        {translations.logout}
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={handleNavigation('/login')}
                        className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                        style={{
                          color: getColorValue(footerStyles.color)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = getColorValue(footerStyles.color);
                        }}
                        aria-label={translations.login}
                      >
                        {translations.login}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleNavigation('/register')}
                        className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                        style={{
                          color: getColorValue(footerStyles.color)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = getColorValue(footerStyles.color);
                        }}
                        aria-label={translations.register}
                      >
                        {translations.register}
                      </button>
                    </li>
                  </>
                )}
                {settings.legal_notice?.enabled && (
                  <li>
                    <button
                      onClick={() => setShowLegalNotice(true)}
                      type="button"
                      className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                      style={{
                        color: getColorValue(footerStyles.color)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = getColorValue(footerStyles.color);
                      }}
                      aria-label={translations.legalNotice}
                    >
                      {translations.legalNotice}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </nav>

      <div className="mt-12 md:border-t border-gray-200/50 md:pt-6">
        {/* Footer Disclaimer (if enabled) */}
        {settings.legal_notice?.show_footer_disclaimer && settings.legal_notice?.footer_disclaimer && (
          <div className="mb-6">
            <p className="text-sm opacity-70 text-left" style={{ color: getColorValue(footerStyles.color) }}>
              {settings.legal_notice.footer_disclaimer}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <small className="text-sm" style={{ color: getColorValue(footerStyles.color), opacity: 0.7 }}>
            © {new Date().getFullYear()} {settings?.site || 'Company'}. {translations.allRightsReserved}.
          </small>
          {settings?.with_language_switch && (
            <div className="hidden md:block">
              <ModernLanguageSwitcher openUpward={true} variant="footer" />
            </div>
          )}
        </div>
      </div>
    </>
  );

  // LIGHT FOOTER - Minimal single-column centered
  const renderLightFooter = () => (
    <div className="text-center max-w-4xl mx-auto">
      <nav className="mb-8" aria-label="Footer navigation">
        <ul className="flex flex-wrap justify-center gap-6">
          {itemsWithSubitems.slice(0, 5).map((item) => {
            const translatedDisplayName = currentLocale 
              ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
              : item.display_name;
            return (
              <li key={item.id}>
                <FooterLink href={item.url_name || '#'} className="text-sm font-medium" footerStyles={footerStyles}>
                  {translatedDisplayName}
                </FooterLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="border-t border-opacity-20 pt-6 space-y-4" style={{ borderColor: getColorValue(footerStyles.color) }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm hover:underline transition-colors duration-200"
            style={{ color: getColorValue(footerStyles.color) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.color);
            }}
            aria-label={translations.privacySettings}
          >
            {translations.privacySettings}
          </button>
          {settings.legal_notice?.enabled && (
            <button
              onClick={() => setShowLegalNotice(true)}
              className="text-sm hover:underline transition-colors duration-200"
              style={{ color: getColorValue(footerStyles.color) }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = getColorValue(footerStyles.color);
              }}
              aria-label={translations.legalNotice}
            >
              {translations.legalNotice}
            </button>
          )}
        </div>
        {settings.legal_notice?.show_footer_disclaimer && settings.legal_notice?.footer_disclaimer && (
          <p className="text-xs opacity-70 text-left mb-4" style={{ color: getColorValue(footerStyles.color) }}>
            {settings.legal_notice.footer_disclaimer}
          </p>
        )}
        <p className="text-xs opacity-60" style={{ color: getColorValue(footerStyles.color) }}>
          © {new Date().getFullYear()} {settings?.site || 'Company'}. {translations.allRightsReserved}.
        </p>
        {settings?.with_language_switch && (
          <ModernLanguageSwitcher openUpward={true} variant="footer" />
        )}
      </div>
    </div>
  );

  // COMPACT FOOTER - Horizontal navigation bar style
  const renderCompactFooter = () => (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-6">
        <nav className="flex flex-wrap justify-center md:justify-start gap-6" aria-label="Footer navigation">
          {[...itemsWithSubitems, ...groupedItemsWithoutSubitems.flat()].slice(0, 6).map((item) => {
            const translatedDisplayName = currentLocale 
              ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
              : item.display_name;
            return (
              <FooterLink key={item.id} href={item.url_name || '#'} className="text-sm" footerStyles={footerStyles}>
                {translatedDisplayName}
              </FooterLink>
            );
          })}
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm transition-colors duration-200"
            style={{ color: getColorValue(footerStyles.color) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.color);
            }}
            aria-label={translations.privacySettings}
          >
            {translations.privacySettings}
          </button>
          {settings.legal_notice?.enabled && (
            <button
              onClick={() => setShowLegalNotice(true)}
              className="text-sm transition-colors duration-200"
              style={{ color: getColorValue(footerStyles.color) }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = getColorValue(footerStyles.color);
              }}
              aria-label={translations.legalNotice}
            >
              {translations.legalNotice}
            </button>
          )}
        </nav>
        
        <div className="flex items-center gap-6">
          {settings?.with_language_switch && (
            <ModernLanguageSwitcher openUpward={true} variant="footer" />
          )}
          <p className="text-xs whitespace-nowrap" style={{ color: getColorValue(footerStyles.color) }}>
            © {new Date().getFullYear()} {settings?.site || 'Company'}
          </p>
        </div>
      </div>
    </div>
  );

  // STACKED FOOTER - Vertical sections with dividers
  const renderStackedFooter = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      {itemsWithSubitems.map((item, index) => {
        const translatedDisplayName = currentLocale 
          ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
          : item.display_name;
        return (
          <div 
            key={item.id} 
            className={`py-6 ${index > 0 ? 'border-t' : ''}`}
            style={{ borderColor: index > 0 ? `${getColorValue(footerStyles.color)}33` : undefined }}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">
              <FooterLink href={item.url_name || '#'} isHeading={true} footerStyles={footerStyles}>
                {translatedDisplayName}
              </FooterLink>
            </h2>
            <ul className="flex flex-wrap justify-center gap-4">
              {item.website_submenuitem?.map((subItem) => {
                const translatedSubItemName = currentLocale 
                  ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                  : subItem.name;
                return (
                  <li key={subItem.id}>
                    <FooterLink href={subItem.url_name || '#'} className="text-sm" footerStyles={footerStyles}>
                      {translatedSubItemName}
                    </FooterLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      
      <div className="border-t pt-6 text-center" style={{ borderColor: `${getColorValue(footerStyles.color)}33` }}>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm transition-colors duration-200"
            style={{ color: getColorValue(footerStyles.color) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getColorValue(footerStyles.color);
            }}
            aria-label={translations.privacySettings}
          >
            {translations.privacySettings}
          </button>
          {settings.legal_notice?.enabled && (
            <button
              onClick={() => setShowLegalNotice(true)}
              className="text-sm transition-colors duration-200"
              style={{ color: getColorValue(footerStyles.color) }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = getColorValue(footerStyles.color);
              }}
              aria-label={translations.legalNotice}
            >
              {translations.legalNotice}
            </button>
          )}
          {settings?.with_language_switch && (
            <ModernLanguageSwitcher openUpward={true} variant="footer" />
          )}
        </div>
        {settings.legal_notice?.show_footer_disclaimer && settings.legal_notice?.footer_disclaimer && (
          <p className="text-xs opacity-70 text-left mb-4" style={{ color: getColorValue(footerStyles.color) }}>
            {settings.legal_notice.footer_disclaimer}
          </p>
        )}
        <p className="text-xs" style={{ color: getColorValue(footerStyles.color) }}>
          © {new Date().getFullYear()} {settings?.site || 'Company'}. {translations.allRightsReserved}.
        </p>
      </div>
    </div>
  );

  // MINIMAL FOOTER - Ultra-clean minimal design
  const renderMinimalFooter = () => (
    <div className="max-w-4xl mx-auto text-center py-8">
      <nav className="mb-6" aria-label="Footer navigation">
        <ul className="flex flex-wrap justify-center gap-8 text-sm">
          {[...itemsWithSubitems, ...groupedItemsWithoutSubitems.flat()].slice(0, 4).map((item) => {
            const translatedDisplayName = currentLocale 
              ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
              : item.display_name;
            return (
              <li key={item.id}>
                <FooterLink href={item.url_name || '#'} footerStyles={footerStyles}>{translatedDisplayName}</FooterLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="space-y-3">
        <button
          onClick={() => setShowSettings(true)}
          className="text-xs opacity-60 hover:opacity-100 transition-all duration-200"
          style={{ color: getColorValue(footerStyles.color) }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = getColorValue(footerStyles.color);
          }}
          aria-label={translations.privacySettings}
        >
          {translations.privacySettings}
        </button>
        <p className="text-xs opacity-50" style={{ color: getColorValue(footerStyles.color) }}>
          © {new Date().getFullYear()} {settings?.site || 'Company'}
        </p>
      </div>
    </div>
  );

  // GRID FOOTER - Balanced 4-column grid
  const renderGridFooter = () => {
    const allItems = [...itemsWithSubitems, ...groupedItemsWithoutSubitems.flat()];
    const columns = 4;
    const itemsPerColumn = Math.ceil(allItems.length / columns);
    const gridColumns = Array.from({ length: columns }, (_, i) => 
      allItems.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
    );

    return (
      <>
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12" aria-label="Footer navigation">
          {gridColumns.map((column, colIndex) => (
            <div key={`col-${colIndex}`}>
              <ul className="space-y-3">
                {column.map((item) => {
                  const translatedDisplayName = currentLocale 
                    ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
                    : item.display_name;
                  return (
                    <li key={item.id}>
                      <FooterLink href={item.url_name || '#'} className="text-sm" footerStyles={footerStyles}>
                        {translatedDisplayName}
                      </FooterLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        
        <div className="border-t pt-6" style={{ borderColor: `${getColorValue(footerStyles.color)}33` }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowSettings(true)}
                className="text-sm transition-colors duration-200"
                style={{ color: getColorValue(footerStyles.color) }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = getColorValue(footerStyles.colorHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = getColorValue(footerStyles.color);
                }}
                aria-label={translations.privacySettings}
              >
                {translations.privacySettings}
              </button>
              <p className="text-xs" style={{ color: getColorValue(footerStyles.color) }}>
                © {new Date().getFullYear()} {settings?.site || 'Company'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {settings?.with_language_switch && (
                <ModernLanguageSwitcher openUpward={true} variant="footer" />
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  // Rest of the component remains unchanged
  return (
    <>
      <footer 
        ref={footerRef}
        className={`px-6 ${footerStyles.type === 'compact' ? 'py-4' : 'py-12'}`}
        role="contentinfo"
        style={{
          ...getBackgroundStyle(
            footerStyles.is_gradient,
            footerStyles.gradient,
            footerStyles.background
          ),
          color: getColorValue(footerStyles.color),
          minHeight: footerStyles.type === 'compact' ? '200px' : '400px',
          contentVisibility: 'auto',
          containIntrinsicSize: footerStyles.type === 'compact' ? '0 200px' : '0 400px'
        }}
      >
        <div className="max-w-7xl mx-auto" style={{ opacity: (isReady && isVisible) ? 1 : 0, transition: 'opacity 0.15s ease-in' }}>
          {(isReady && isVisible) && (
            <>
              {renderFooterContent()}
              
              {/* SRA Validation Badge - Temporarily disabled */}
              {/* <div 
                className="mt-8 pt-8 border-t text-center"
                style={{ borderColor: `${getColorValue(footerStyles.color)}33` }}
              >
                <SRAValidationBadge />
              </div> */}
            </>
          )}
        </div>
      </footer>
      <Suspense fallback={null}>
        <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      </Suspense>
      {settings.legal_notice?.enabled && (
        <Suspense fallback={null}>
          <LegalNoticeModal isOpen={showLegalNotice} onClose={() => setShowLegalNotice(false)} />
        </Suspense>
      )}
    </>
  );
};

export default React.memo(Footer, (prevProps, nextProps) => {
  return (
    prevProps.menuItems?.length === nextProps.menuItems?.length &&
    JSON.stringify(prevProps.menuItems?.[0]?.id) === JSON.stringify(nextProps.menuItems?.[0]?.id)
  );
});