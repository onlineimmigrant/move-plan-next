'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { useBasket } from '@/context/BasketContext';
import { useAuth } from '@/context/AuthContext';
import { Disclosure } from '@headlessui/react';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import LocalizedLink from './LocalizedLink';
import { useHeaderTranslations } from './header/useHeaderTranslations';

// Dynamic imports for better code splitting
const LoginModal = dynamic(() => import('./LoginModal'), { ssr: false });
const ContactModal = dynamic(() => import('./contact/ContactModal'), { ssr: false });
const ModernLanguageSwitcher = dynamic(() => import('./ModernLanguageSwitcher'), { ssr: false });

// Import all available Heroicons dynamically
import * as HeroIcons from '@heroicons/react/24/outline';
import { MenuItem, SubMenuItem, ReactIcon } from '@/types/menu';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

interface HeaderProps {
  companyLogo?: string;
  menuItems: MenuItem[] | undefined;
  fixedBannersHeight: number;
}

const Header: React.FC<HeaderProps> = ({
  companyLogo = '/images/logo.svg',
  menuItems = [],
  fixedBannersHeight = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default to true for SSR
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const { basket } = useBasket();
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = !!session;
  const { settings } = useSettings();
  const t = useHeaderTranslations();

  // Parse header_style JSONB structure
  const headerStyle = useMemo(() => {
    if (typeof settings.header_style === 'object' && settings.header_style !== null) {
      return settings.header_style;
    }
    // Fallback to default structure if legacy string or null
    return {
      type: 'default' as const,
      background: 'white',
      color: 'gray-700',
      color_hover: 'gray-900',
      menu_width: '7xl' as const,
      menu_items_are_text: true
    };
  }, [settings.header_style]);

  // Extract individual values for easier use
  const headerType = headerStyle.type || 'default';
  const headerBackground = headerStyle.background || 'white';
  const headerColor = headerStyle.color || 'gray-700';
  const headerColorHover = headerStyle.color_hover || 'gray-900';
  const menuWidth = headerStyle.menu_width || '7xl';
  const globalMenuItemsAreText = headerStyle.menu_items_are_text ?? true;

  // Optimized scroll effect with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const scrollThreshold = windowHeight * 0.1;
          setIsScrolled(scrollPosition > scrollThreshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect desktop/mobile for backdrop filter
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop(); // Check on mount
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Individual display mode per menu item
  // Each item can have its own menu_items_are_text setting
  // If not set, fall back to global header_style.menu_items_are_text
  const getItemDisplayMode = useCallback((item: MenuItem) => {
    // If explicitly set on the item, use that value
    if (item.menu_items_are_text !== undefined && item.menu_items_are_text !== null) {
      return item.menu_items_are_text;
    }
    // Fall back to global setting from header_style
    return globalMenuItemsAreText;
  }, [globalMenuItemsAreText]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Header Component Debug:');
      console.log('- Menu items:', JSON.stringify(menuItems, null, 2));
      console.log('- Fixed banners height:', fixedBannersHeight);
      console.log('- Header style JSONB:', headerStyle);
      console.log('- Header type:', headerType);
      console.log('- Menu width:', menuWidth);
      console.log('- Global menu items are text:', globalMenuItemsAreText);
      console.log('- Individual item display modes:', menuItems?.map(item => ({
        display_name: item.display_name,
        menu_items_are_text: item.menu_items_are_text,
        display_mode: getItemDisplayMode(item) ? 'text' : 'icon',
        has_react_icon_id: !!item.react_icon_id,
        icon_name: item.icon_name
      })));
      
      // Debug: Check submenu descriptions and images
      menuItems?.forEach((item) => {
        if (item.website_submenuitem?.length) {
          console.log(`Menu "${item.display_name}" submenus:`, 
            item.website_submenuitem.map(sub => ({
              id: sub.id,
              name: sub.name,
              description: sub.description,
              description_translation: sub.description_translation,
              image: sub.image,
              hasDescription: !!sub.description,
              hasDescriptionTranslation: !!sub.description_translation,
              hasImage: !!sub.image
            }))
          );
        }
      });
    }
  }, [menuItems, fixedBannersHeight, headerStyle, headerType, menuWidth, globalMenuItemsAreText, getItemDisplayMode]);

  // Memoized functions for better performance
  const getIconName = useCallback((item: MenuItem): string | undefined => {
    console.log(`[getIconName] Processing item: "${item.display_name}"`);
    console.log(`[getIconName] - icon_name (top-level):`, item.icon_name);
    console.log(`[getIconName] - react_icon_id:`, item.react_icon_id);
    console.log(`[getIconName] - react_icons:`, item.react_icons);
    
    // First check if icon_name is already extracted at top level
    if (item.icon_name) {
      console.log(`[getIconName] ✓ Using top-level icon_name: "${item.icon_name}"`);
      return item.icon_name;
    }
    
    // Otherwise extract from react_icons
    if (!item.react_icons) {
      console.log(`[getIconName] ✗ No react_icons found for item: "${item.display_name}"`);
      return undefined;
    }
    
    if (Array.isArray(item.react_icons)) {
      const iconName = item.react_icons.length > 0 ? item.react_icons[0].icon_name : undefined;
      console.log(`[getIconName] ✓ Extracted icon_name from array:`, iconName);
      return iconName;
    }
    
    const iconName = item.react_icons.icon_name;
    console.log(`[getIconName] ✓ Extracted icon_name from object:`, iconName);
    return iconName;
  }, []);

  // Create a dynamic icon component map from all HeroIcons
  const getIconComponent = useCallback((iconName: string | undefined) => {
    console.log(`[getIconComponent] Looking up icon: "${iconName}"`);
    
    if (!iconName) {
      console.log(`[getIconComponent] ✗ No iconName provided, using MapIcon`);
      return HeroIcons.MapIcon;
    }
    
    // Try to get the icon from HeroIcons namespace
    const IconComponent = (HeroIcons as any)[iconName];
    
    if (!IconComponent) {
      console.warn(`[getIconComponent] ✗ Icon "${iconName}" not found in HeroIcons, using MapIcon as fallback`);
      console.log(`[getIconComponent] Available icons sample:`, Object.keys(HeroIcons).slice(0, 10).join(', ') + '...');
      return HeroIcons.MapIcon;
    }
    
    console.log(`[getIconComponent] ✓ Found icon component for "${iconName}"`);
    return IconComponent;
  }, []);

  const renderIcon = useCallback((iconName: string | undefined) => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent className="h-6 w-6 text-gray-600" />;
  }, [getIconComponent]);

  // Memoize callback functions for better performance
  const handleHomeNavigation = useCallback(() => {
    setIsOpen(false);
    // Always navigate to the actual home page (root) - don't preserve locale
    router.push('/');
  }, [router]);

  const handleLoginModal = useCallback(() => {
    setIsOpen(false);
    setIsLoginOpen(true);
  }, []);

  const handleContactModal = useCallback(() => {
    setIsOpen(false);
    setIsContactOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsOpen(false);
    logout();
    // Always navigate to the actual home page (root) after logout
    router.push('/');
  }, [logout, router]);

  const handleMenuToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Memoize filtered menu items for performance
  const filteredMenuItems = useMemo(() => 
    menuItems.filter((item) => item.is_displayed && item.display_name !== 'Profile'),
    [menuItems]
  );

  // Memoize current locale calculation
  const currentLocale = useMemo(() => getLocaleFromPathname(pathname), [pathname]);

  // Memoize total items calculation
  const totalItems = useMemo(() => 
    basket.reduce((sum, item) => sum + item.quantity, 0),
    [basket]
  );

  const renderMenuItems = useMemo(() => (
    <>
      {filteredMenuItems.length === 0 ? (
        <span className="text-gray-500">{t.noMenuItems}</span>
      ) : (
        filteredMenuItems.map((item) => {
          const displayedSubItems = (item.website_submenuitem || [])
            .filter((subItem) => subItem.is_displayed !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          // Get translated content for menu item
          const translatedDisplayName = currentLocale 
            ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
            : item.display_name;

            // Check if current menu item is active
            const isActive = pathname.startsWith(`/${item.url_name}`) || 
                            displayedSubItems.some(subItem => pathname.startsWith(`/${subItem.url_name}`));

            // Check individual item's display mode
            const showAsText = getItemDisplayMode(item);

            return (
              <div 
                key={item.id} 
                className="relative"
                onMouseEnter={() => displayedSubItems.length > 0 && setOpenSubmenu(item.id)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                {displayedSubItems.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className="group cursor-pointer flex items-center justify-center px-4 py-2.5 rounded-xl focus:outline-none transition-colors duration-200"
                      style={{
                        // Apply color via inline style for both hex and Tailwind colors
                        color: getColorValue(headerColor),
                      }}
                      title={translatedDisplayName}
                      aria-label={t.openMenuFor(translatedDisplayName)}
                      onClick={() => setOpenSubmenu(openSubmenu === item.id ? null : item.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = getColorValue(headerColorHover);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = getColorValue(headerColor);
                      }}
                    >
                      {showAsText ? (
                        <span className={`text-[15px] font-medium transition-colors duration-200 ${
                          isActive ? 'font-semibold' : ''
                        }`}>{translatedDisplayName}</span>
                      ) : item.image ? (
                        <Image
                          src={item.image}
                          alt={translatedDisplayName}
                          width={24}
                          height={24}
                          className="h-6 w-6 text-gray-600 transition-all duration-300 group-hover:scale-105"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                          onError={() =>
                            console.error(
                              `Failed to load image for menu item ${translatedDisplayName}: ${item.image}`
                            )
                          }
                        />
                      ) : (
                        <div className="transition-all duration-300 group-hover:scale-105">
                          {renderIcon(getIconName(item))}
                        </div>
                      )}
                      <svg className="ml-1.5 h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Mega menu or simple dropdown based on items count */}
                    {displayedSubItems.length >= 2 ? (
                      // Full-width mega menu for 2+ items
                      <div className={`fixed left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] transition-all duration-200 mx-4 sm:mx-8 ${
                        openSubmenu === item.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                      }`}
                        style={{
                          // Calculate top position: banners height + nav height (64px) + gap (8px)
                          top: `${fixedBannersHeight + 64 + 8}px`,
                          // Ensure mega menu has solid background even with transparent header
                          backgroundColor: 'white',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                          // Ensure pointer events work
                          pointerEvents: openSubmenu === item.id ? 'auto' : 'none'
                        }}
                      >
                        <div className="px-6 py-6 max-w-7xl mx-auto">
                          <h3 className="text-base font-semibold text-gray-900 mb-4">{translatedDisplayName}</h3>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {displayedSubItems.map((subItem) => {
                              const translatedSubItemName = currentLocale 
                                ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                                : subItem.name;

                              const translatedDescription = subItem.description
                                ? (currentLocale 
                                    ? getTranslatedMenuContent(subItem.description, subItem.description_translation, currentLocale)
                                    : subItem.description)
                                : null;

                              return (
                                <LocalizedLink
                                  key={subItem.id}
                                  href={subItem.url_name}
                                  onClick={() => setOpenSubmenu(null)}
                                  className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                >
                                  {/* Image on top - full width */}
                                  <div className="relative w-full h-32">
                                    {subItem.image ? (
                                      <Image
                                        src={subItem.image}
                                        alt={translatedSubItemName}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        className="object-cover rounded-t-lg"
                                        loading="lazy"
                                        placeholder="blur"
                                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                                        onError={() =>
                                          console.error(
                                            `Failed to load image for submenu item ${translatedSubItemName}: ${subItem.image}`
                                          )
                                        }
                                      />
                                    ) : settings?.image ? (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg p-4">
                                        <div className="relative w-full h-full">
                                          <Image
                                            src={settings.image}
                                            alt="Logo"
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            className="object-contain"
                                            loading="lazy"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Content below image */}
                                  <div className="p-3">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200">
                                      {translatedSubItemName}
                                    </h4>
                                    {translatedDescription && (
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {translatedDescription}
                                      </p>
                                    )}
                                  </div>
                                </LocalizedLink>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Simple dropdown for < 2 items
                      <div 
                        className={`absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[60] transition-all duration-200 ${
                          openSubmenu === item.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}
                        style={{
                          // Ensure dropdown has solid background even with transparent header
                          backgroundColor: 'white',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                          // Ensure pointer events work
                          pointerEvents: openSubmenu === item.id ? 'auto' : 'none'
                        }}
                      >
                        <div className="p-2">
                          {displayedSubItems.map((subItem) => {
                            const translatedSubItemName = currentLocale 
                              ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                              : subItem.name;

                            return (
                              <LocalizedLink
                                key={subItem.id}
                                href={subItem.url_name}
                                onClick={() => setOpenSubmenu(null)}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                              >
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  {subItem.image ? (
                                    <Image
                                      src={subItem.image}
                                      alt={translatedSubItemName}
                                      fill
                                      sizes="40px"
                                      className="object-cover rounded"
                                      loading="lazy"
                                    />
                                  ) : settings?.image ? (
                                    <div className="relative w-full h-full flex items-center justify-center bg-gray-50 rounded p-1.5">
                                      <Image
                                        src={settings.image}
                                        alt="Logo"
                                        width={28}
                                        height={28}
                                        className="object-contain"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 block">
                                    {translatedSubItemName}
                                  </span>
                                </div>
                              </LocalizedLink>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="cursor-pointer transition-colors duration-200"
                    style={{
                      // Apply color via inline style for both hex and Tailwind colors
                      color: getColorValue(headerColor),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = getColorValue(headerColorHover);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = getColorValue(headerColor);
                    }}
                  >
                    <LocalizedLink
                      href={item.url_name}
                      onClick={() => setOpenSubmenu(null)}
                      className="flex items-center justify-center px-4 py-2.5 rounded-xl focus:outline-none transition-colors duration-200 group"
                      title={translatedDisplayName}
                      aria-label={t.goTo(translatedDisplayName)}
                    >
                      {showAsText ? (
                        <span className={`text-[15px] font-medium transition-colors duration-200 ${
                          // Only apply default classes if using hex colors
                          headerColor.startsWith('#') ? '' : (isActive ? 'font-semibold' : '')
                        }`}>{translatedDisplayName}</span>
                      ) : item.image ? (
                        <Image
                          src={item.image}
                          alt={translatedDisplayName}
                          width={24}
                          height={24}
                          className="h-6 w-6 text-gray-600 transition-all duration-300 group-hover:scale-105"
                          onError={() =>
                            console.error(
                              `Failed to load image for menu item ${translatedDisplayName}: ${item.image}`
                            )
                          }
                        />
                      ) : (
                        <div className="transition-all duration-300 group-hover:scale-105">
                          {renderIcon(getIconName(item))}
                        </div>
                      )}
                    </LocalizedLink>
                  </div>
                )}
              </div>
            );
          })
      )}
    </>
  ), [filteredMenuItems, currentLocale, getItemDisplayMode, t, pathname, openSubmenu, setOpenSubmenu, renderIcon, getIconName, settings?.image, headerColor, headerColorHover]);

  const renderMobileMenuItems = useMemo(() => (
    <div className="space-y-3">
      {filteredMenuItems.length === 0 ? (
        <div className="p-6 text-center h-[50vh] flex items-center justify-center">
          <span className="text-[14px] text-gray-500 antialiased">{t.noMenuItems}</span>
        </div>
      ) : (
        filteredMenuItems.map((item) => {
          const displayedSubItems = (item.website_submenuitem || [])
            .filter((subItem) => subItem.is_displayed !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            console.log(
              `Mobile rendering ${item.display_name}, displayedSubItems:`,
              JSON.stringify(displayedSubItems, null, 2)
            );

            // Get translated content for menu item
            const translatedDisplayName = currentLocale 
              ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
              : item.display_name;

            return (
              <div key={item.id} className="relative">
                {displayedSubItems.length > 0 ? (
                  <Disclosure>
                    {({ open }) => (
                      <div className="border-t border-gray-200/50">
                        <Disclosure.Button
                          className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                          aria-label={t.toggleMenu(translatedDisplayName)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-left">
                              <span className="text-sm font-semibold text-gray-900">{translatedDisplayName}</span>
                              <p className="text-xs text-gray-500">
                                {displayedSubItems.length} {displayedSubItems.length === 1 ? 'option' : 'options'}
                              </p>
                            </div>
                          </div>
                          <div className="transition-colors duration-200">
                            {open ? (
                              <HeroIcons.MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            ) : (
                              <HeroIcons.PlusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            )}
                          </div>
                        </Disclosure.Button>
                        <Disclosure.Panel className="mt-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                          {displayedSubItems.map((subItem) => {
                            // Get translated content for submenu item
                            const translatedSubItemName = currentLocale 
                              ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                              : subItem.name;

                            // Properly handle description with translation logic
                            const translatedDescription = subItem.description
                              ? (currentLocale 
                                  ? getTranslatedMenuContent(subItem.description, subItem.description_translation, currentLocale)
                                  : subItem.description)
                              : null;

                            const displayDescription = translatedDescription || `Learn more about ${translatedSubItemName.toLowerCase()}`;

                            // Debug: Track description logic (mobile)
                            if (process.env.NODE_ENV === 'development') {
                              console.log(`Mobile submenu "${subItem.name}" description logic:`, {
                                originalDescription: subItem.description,
                                hasTranslation: !!subItem.description_translation,
                                currentLocale,
                                translatedDescription,
                                displayDescription,
                                usingFallback: !translatedDescription
                              });
                            }

                            return (
                              <LocalizedLink
                                key={subItem.id}
                                href={subItem.url_name}
                                onClick={() => setIsOpen(false)}
                                className="flex text-gray-800 hover:text-gray-900 transition-colors duration-200"
                              >
                                {/* Image section - 1/3 width, full height */}
                                <div className="relative w-1/3 flex-shrink-0 min-h-[60px]">
                                  {subItem.image ? (
                                    <Image
                                      src={subItem.image}
                                      alt={translatedSubItemName}
                                      fill
                                      sizes="(max-width: 768px) 80px, 100px"
                                      className="object-cover rounded-l-xl"
                                      loading="lazy"
                                      placeholder="blur"
                                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                                      onError={() =>
                                        console.error(
                                          `Failed to load image for submenu item ${translatedSubItemName}: ${subItem.image}`
                                        )
                                      }
                                    />
                                  ) : settings?.image ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-l-xl p-3">
                                      <div className="relative w-full h-full">
                                        <Image
                                          src={settings.image}
                                          alt="Logo"
                                          fill
                                          sizes="(max-width: 768px) 80px, 100px"
                                          className="object-contain"
                                          loading="lazy"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-l-xl min-h-[60px]">
                                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Content section - 2/3 width */}
                                <div className="flex-1 flex items-center justify-between p-3">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block mb-1">{translatedSubItemName}</span>
                                    <p className="text-xs text-gray-500 line-clamp-2">{displayDescription}</p>
                                  </div>
                                </div>
                              </LocalizedLink>
                            );
                          })}
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>
                ) : (
                  <LocalizedLink
                    href={item.url_name}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200 border-t border-gray-200/50"
                    aria-label={t.goTo(translatedDisplayName)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 text-left">
                        <span className="text-sm font-semibold text-gray-900">{translatedDisplayName}</span>
                      </div>
                    </div>
                  </LocalizedLink>
                )}
              </div>
            );
          })
      )}
    </div>
  ), [filteredMenuItems, currentLocale, t, setIsOpen]);

  return (
    <>      
      <nav
        className={`
          ${headerType === 'scrolled' ? 'absolute' : 'fixed'} 
          left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${
            // For transparent type: start transparent, become solid on scroll
            headerType === 'transparent' 
              ? (isScrolled 
                  ? 'backdrop-blur-3xl border-b border-black/8 shadow-[0_1px_20px_rgba(0,0,0,0.08)]'
                  : 'bg-transparent border-b border-transparent'
                )
              // For other types: always have backdrop blur
              : (isScrolled 
                  ? 'backdrop-blur-3xl border-b border-black/8 shadow-[0_1px_20px_rgba(0,0,0,0.08)]' 
                  : 'md:backdrop-blur-2xl'
                )
          }
        `}
        style={{ 
          top: `${fixedBannersHeight}px`,
          // Ensure pointer events work even when transparent
          pointerEvents: 'auto',
          // Apply background color via inline style for both hex and Tailwind colors
          backgroundColor: (() => {
            if (headerType === 'transparent') {
              // Transparent type: no background until scrolled
              if (!isScrolled) return 'transparent';
              // When scrolled, show background with 95% opacity
              const bgColor = getColorValue(headerBackground);
              return bgColor + 'f2'; // Add 95% opacity (f2 in hex)
            } else {
              // Other types: always have background
              const bgColor = getColorValue(headerBackground);
              if (isScrolled) {
                return bgColor + 'f2'; // 95% opacity when scrolled
              } else {
                return bgColor + 'cc'; // 80% opacity when not scrolled
              }
            }
          })(),
          backdropFilter: (headerType === 'transparent' && isScrolled) || (headerType !== 'transparent' && (isScrolled || isDesktop)) 
            ? 'blur(24px) saturate(200%) brightness(105%)' 
            : 'none',
          WebkitBackdropFilter: (headerType === 'transparent' && isScrolled) || (headerType !== 'transparent' && (isScrolled || isDesktop))
            ? 'blur(24px) saturate(200%) brightness(105%)' 
            : 'none',
        }}
      >
      <div
        className={`mx-auto max-w-${menuWidth} p-4 pl-8 sm:px-6 flex justify-between items-center min-h-[64px]`}
      >
        <button
          type="button"
          onClick={handleHomeNavigation}
          className="cursor-pointer flex items-center text-gray-900 hover:text-sky-600 transition-all duration-200"
          aria-label={t.goToHomepage}
          disabled={!router}
        >
          {settings?.image ? (
            <Image
              src={settings.image}
              alt="Logo"
              width={40}
              height={40}
              className="h-8 w-auto"
              priority={true}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
              sizes="40px"
              quality={90}
              onLoad={() => {
                // Image loaded successfully
              }}
              onError={(e) => {
                console.error('Failed to load logo:', settings.image);
                e.currentTarget.src = companyLogo;
              }}
            />
          ) : (
            <span className="text-gray-500">{t.noLogoAvailable}</span>
          )}
          <span className="sr-only ml-2 tracking-tight text-xl font-extrabold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
            {settings?.site || 'Default Site Name'}
          </span>
        </button>

        <div className="hidden md:flex items-center justify-end w-full ml-8 relative">
          {/* Language Switcher - Absolute Right (Desktop Only) */}
          {settings?.with_language_switch && (
            <div className="absolute right-0 mr-4 hidden lg:block">
              <ModernLanguageSwitcher />
            </div>
          )}
          
          {/* All Items - Right Side (grouped) */}
          <div className={`flex items-center space-x-4 ${settings?.with_language_switch ? 'lg:mr-[120px]' : ''}`}>
            {/* Menu Items */}
            <div className="flex items-center space-x-6 text-sm">
              {renderMenuItems}
            </div>
            
            {/* Action Items */}
            {totalItems > 0 && (
              <LocalizedLink
                href="/basket"
                className="cursor-pointer relative"
                aria-label={t.viewBasket(totalItems)}
              >
                <HeroIcons.ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </LocalizedLink>
            )}
            {isLoggedIn ? (
            <div className="relative group">
              <button
                type="button"
                className="p-3"
                title={t.profile}
                aria-label={t.openProfileMenu}
              >
                <HeroIcons.UserIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
              </button>
              
              {/* Clean profile dropdown */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              >
                <div className="p-4">
                  {/* Profile header */}
                  <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-200">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <HeroIcons.UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{t.profile}</h3>
                      <p className="text-xs text-gray-500">{t.manageAccount}</p>
                    </div>
                  </div>
                  
                  {/* Menu items */}
                  <div className="space-y-1">
                    <LocalizedLink
                      href="/account"
                      className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <HeroIcons.UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{t.account}</span>
                        <p className="text-xs text-gray-500">{t.accountSettings}</p>
                      </div>
                    </LocalizedLink>

                    <button
                      type="button"
                      onClick={handleContactModal}
                      className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-gray-800">{t.contact}</span>
                        <p className="text-xs text-gray-500">{t.getHelpSupport}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-150 mt-2 border-t border-gray-200 pt-3"
                    >
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                        <HeroIcons.ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium">{t.logout}</span>
                        <p className="text-xs text-red-500">{t.signOutAccount}</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLoginModal}
              className="group cursor-pointer flex items-center justify-center p-3 text-gray-700 hover:text-gray-900 focus:outline-none transition-colors duration-200"
              title={t.login}
              aria-label={t.openLoginModal}
            >
              <HeroIcons.ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
            </button>
          )}
          </div>
        </div>

        <div className="flex items-center md:hidden">
          {totalItems > 0 && (
            <LocalizedLink
              href="/basket"
              className="cursor-pointer relative mr-4"
              aria-label={t.viewBasket(totalItems)}
            >
              <HeroIcons.ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </LocalizedLink>
          )}
          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-2.5 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            aria-label={isOpen ? t.closeMenu : t.openMenu}
          >
            {isOpen ? <HeroIcons.XMarkIcon className="h-6 w-6" /> : <HeroIcons.Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-white/95 backdrop-blur-3xl border-t border-black/8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-y-auto z-30"
          style={{
            top: `${fixedBannersHeight + 64}px`, // Position below the header
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
        >
          <div className="p-6 pb-8">
            {renderMobileMenuItems}
            
            {/* Profile section */}
            {isLoggedIn ? (
              <Disclosure>
                {({ open }) => (
                  <div className="border-t border-gray-200/50 mt-6 pt-6">
                    <Disclosure.Button
                      className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                      aria-label="Toggle profile menu"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <span className="text-sm font-semibold text-gray-900">{t.profile}</span>
                          <p className="text-xs text-gray-500">{t.accountSettings}</p>
                        </div>
                      </div>
                      <div className="transition-colors duration-200">
                        {open ? (
                          <HeroIcons.MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        ) : (
                          <HeroIcons.PlusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        )}
                      </div>
                    </Disclosure.Button>
                    <Disclosure.Panel className="mt-3 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-hide">
                      <LocalizedLink
                        href="/account"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <HeroIcons.UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">{t.account}</span>
                          <p className="text-xs text-gray-500">{t.accountSettings}</p>
                        </div>
                      </LocalizedLink>
                      <button
                        type="button"
                        onClick={handleContactModal}
                        className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">{t.contact}</span>
                          <p className="text-xs text-gray-500">{t.getHelpSupport}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full p-4 text-red-600 hover:text-red-700 transition-colors duration-200"
                      >
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                          <HeroIcons.ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">{t.logout}</span>
                          <p className="text-xs text-red-500">{t.signOutAccount}</p>
                        </div>
                      </button>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ) : (
              <div className="border-t border-gray-200/50 mt-6 pt-6">
                <button
                  type="button"
                  onClick={handleLoginModal}
                  className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                  aria-label={t.openLoginModal}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-left">
                      <span className="text-sm font-semibold text-gray-900">{t.login}</span>
                      <p className="text-xs text-gray-500">{t.signIn}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
};

export default Header;