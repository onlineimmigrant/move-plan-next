'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy, useRef } from 'react';
import Image from 'next/image';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { useBasket } from '@/context/BasketContext';
import { useAuth } from '@/context/AuthContext';
import { Disclosure } from '@headlessui/react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import LocalizedLink from './LocalizedLink';
import { useHeaderTranslations } from './header/useHeaderTranslations';
import { isAdminClient } from '@/lib/auth';
import { saveReturnUrl } from './LoginRegistration/hooks';

// Dynamic imports with ssr: false for client-only components (modals, language switcher)
// These need to be client-only to work properly in production
const LoginModal = dynamic(() => import('./LoginRegistration/LoginModal'), { 
  ssr: false,
  loading: () => null 
});
const RegisterModal = dynamic(() => import('./LoginRegistration/RegisterModal'), { 
  ssr: false,
  loading: () => null 
});
const ContactModal = dynamic(() => import('./contact/ContactModal'), { 
  ssr: false,
  loading: () => null 
});
const ModernLanguageSwitcher = dynamic(() => import('./ModernLanguageSwitcher'), { 
  ssr: false,
  loading: () => null 
});

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
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollYRef = useRef(0);
  const [isDesktop, setIsDesktop] = useState(true); // Default to true for SSR
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { basket } = useBasket();
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = !!session;
  const { settings } = useSettings();
  const t = useHeaderTranslations();
  const themeColors = useThemeColors();

  // Parse header_style JSONB structure
  const headerStyle = useMemo(() => {
    if (typeof settings.header_style === 'object' && settings.header_style !== null) {
      return {
        ...settings.header_style,
        is_gradient: settings.header_style.is_gradient || false,
        gradient: settings.header_style.gradient || undefined,
        logo: settings.header_style.logo || { url: '/', position: 'left', size: 'md' }
      };
    }
    // Fallback to default structure if legacy string or null
    return {
      type: 'default' as const,
      background: 'white',
      color: 'gray-700',
      color_hover: 'gray-900',
      menu_width: '7xl' as const,
      menu_items_are_text: true,
      is_gradient: false,
      gradient: undefined,
      logo: { url: '/', position: 'left', size: 'md' }
    };
  }, [settings.header_style]);

  // Extract individual values for easier use
  const headerType = headerStyle.type || 'default';
  const headerBackground = headerStyle.background || 'white';
  const headerColor = headerStyle.color || 'gray-700';
  const headerColorHover = headerStyle.color_hover || 'gray-900';
  const menuWidth = headerStyle.menu_width || '7xl';
  const globalMenuItemsAreText = headerStyle.menu_items_are_text ?? true;
  
  // Logo configuration
  const logoConfig = headerStyle.logo || { url: '/', position: 'left', size: 'md' };
  const logoUrl = logoConfig.url || '/';
  const logoPosition = logoConfig.position || 'left';
  const logoSize = logoConfig.size || 'md';
  
  // Map logo size to Tailwind height classes
  const logoHeightClass = logoSize === 'sm' ? 'h-8' : logoSize === 'lg' ? 'h-12' : 'h-10'; // sm=h-8, md=h-10, lg=h-12

  // Calculate header background style (gradient or solid color)
  const headerBackgroundStyle = useMemo(() => {
    // For transparent headers, handle special case
    if (headerType === 'transparent' && !isScrolled) {
      return { backgroundColor: 'transparent' };
    }
    
    // For ring_card_mini and mini, use full opacity
    if (headerType === 'ring_card_mini' || headerType === 'mini') {
      const baseStyle = getBackgroundStyle(
        headerStyle.is_gradient,
        headerStyle.gradient,
        headerBackground
      );
      return baseStyle;
    }
    
    // Get gradient or solid color background
    const baseStyle = getBackgroundStyle(
      headerStyle.is_gradient,
      headerStyle.gradient,
      headerBackground
    );
    
    // Add opacity for blur effect
    if (baseStyle.backgroundImage) {
      // Gradient: Keep as-is, opacity handled by backdrop-filter
      return baseStyle;
    } else if (baseStyle.backgroundColor) {
      // Solid color: Add opacity based on scroll state
      const opacity = isScrolled ? 'f2' : 'cc'; // 95% or 80%
      return {
        backgroundColor: baseStyle.backgroundColor + opacity
      };
    }
    
    return baseStyle;
  }, [headerType, isScrolled, headerStyle.is_gradient, headerStyle.gradient, headerBackground]);

  // Optimized scroll effect with throttling and direction detection
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const scrollThreshold = windowHeight * 0.1;
          
          // Update isScrolled state
          setIsScrolled(currentScrollY > scrollThreshold);
          
          // Detect if scrolling up (for glassmorphism effect)
          const isGoingUp = currentScrollY < lastScrollYRef.current && currentScrollY > 50;
          setIsScrollingUp(isGoingUp);
          
          // Hide/show header based on scroll direction
          // Always show when at the top (within 100px)
          if (currentScrollY < 100) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
            // Scrolling down and past 100px - hide header
            setIsVisible(false);
          } else if (currentScrollY < lastScrollYRef.current) {
            // Scrolling up - show header immediately
            setIsVisible(true);
          }
          
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array - only set up once!

  // Detect desktop/mobile for backdrop filter
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop(); // Check on mount
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await isAdminClient();
      setIsAdmin(adminStatus);
    };
    checkAdmin();
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
    // Save current page so user can return here after login
    if (pathname && !pathname.includes('/login')) {
      saveReturnUrl(pathname);
    }
    setIsLoginOpen(true);
  }, [pathname]);

  const handleSwitchToRegister = useCallback(() => {
    setIsLoginOpen(false);
    setTimeout(() => setIsRegisterOpen(true), 300);
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    setIsRegisterOpen(false);
    setTimeout(() => setIsLoginOpen(true), 300);
  }, []);

  const handleContactModal = useCallback(() => {
    setIsOpen(false);
    setIsContactOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsOpen(false);
    logout(); // Smart redirect logic is now handled in AuthContext
  }, [logout]);

  const handleMenuToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Helper functions for delayed menu closing
  const cancelCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenSubmenu(null);
    }, 300); // 300ms delay before closing
  }, [cancelCloseTimeout]);

  const handleMenuEnter = useCallback((itemId: number, hasSubitems: boolean) => {
    if (hasSubitems) {
      cancelCloseTimeout();
      setOpenSubmenu(itemId);
    }
  }, [cancelCloseTimeout]);

  const handleMenuLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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
                onMouseEnter={() => handleMenuEnter(item.id, displayedSubItems.length > 0)}
                onMouseLeave={handleMenuLeave}
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
                        <span 
                          className={`text-[15px] font-medium transition-colors duration-200 ${
                            isActive ? 'font-semibold' : ''
                          }`}
                          style={{
                            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                          }}
                        >{translatedDisplayName}</span>
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
                      <div 
                        className={`fixed left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] transition-all duration-200 mx-4 sm:mx-8 ${
                          openSubmenu === item.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}
                        style={{
                          // Calculate top position: banners height + nav height (64px) + gap (16px for visual separation)
                          top: `${fixedBannersHeight + 64 + 16}px`,
                          // Always use white background on desktop for mega menu (regardless of header type)
                          backgroundColor: 'white',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                          // Ensure pointer events work
                          pointerEvents: openSubmenu === item.id ? 'auto' : 'none'
                        }}
                        onMouseEnter={cancelCloseTimeout}
                        onMouseLeave={handleMenuLeave}
                      >
                        <div className="px-6 py-6 max-w-7xl mx-auto">
                          <h3 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedDisplayName}</h3>
                          
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
                                        className="object-contain rounded-t-lg p-2"
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
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                                      {translatedSubItemName}
                                    </h4>
                                    {translatedDescription && (
                                      <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
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
                          // Always use white background on desktop for dropdowns (regardless of header type)
                          backgroundColor: 'white',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                          // Ensure pointer events work
                          pointerEvents: openSubmenu === item.id ? 'auto' : 'none'
                        }}
                        onMouseEnter={cancelCloseTimeout}
                        onMouseLeave={handleMenuLeave}
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
                                  <span className="text-sm font-medium text-gray-900 block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
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
                      <div>
                        <Disclosure.Button
                          className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                          aria-label={t.toggleMenu(translatedDisplayName)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-left">
                              <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedDisplayName}</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
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
                                    <span className="text-sm font-medium block mb-1" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedSubItemName}</span>
                                    <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{displayDescription}</p>
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
                    className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                    aria-label={t.goTo(translatedDisplayName)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 text-left">
                        <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedDisplayName}</span>
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
          fixed
          left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${
            headerType === 'ring_card_mini' || headerType === 'mini'
              ? 'px-4 pt-6' // Container padding for ring_card_mini and mini - generous top spacing for floating effect
              : ''
          }
          ${
            // Apply glassmorphism when scrolling up (no borders, no shadows)
            isScrollingUp
              ? 'backdrop-blur-xl'
              // For transparent type: start transparent, become solid on scroll
              : headerType === 'transparent' 
              ? (isScrolled 
                  ? 'backdrop-blur-3xl border-b border-black/8 shadow-[0_1px_20px_rgba(0,0,0,0.08)]'
                  : 'bg-transparent border-b border-transparent'
                )
              // For ring_card_mini and mini: no backdrop blur, border handled on inner container
              : (headerType === 'ring_card_mini' || headerType === 'mini')
              ? ''
              // For other types: always have backdrop blur
              : (isScrolled 
                  ? 'backdrop-blur-3xl border-b border-black/8 shadow-[0_1px_20px_rgba(0,0,0,0.08)]' 
                  : 'md:backdrop-blur-2xl'
                )
          }
        `}
        style={{ 
          top: `${fixedBannersHeight}px`,
          // For 'fixed' type, always stay visible. For others, hide on scroll down (except when mobile menu is open)
          transform: (headerType === 'fixed' || isVisible || isOpen) ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: 'auto',
          // Apply glassmorphism background when scrolling up (70% opacity like breadcrumbs)
          ...(isScrollingUp 
            ? { 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }
            // For ring_card_mini and mini, don't apply background to outer nav
            : (headerType === 'ring_card_mini' || headerType === 'mini') 
            ? { backgroundColor: 'transparent' } 
            : headerBackgroundStyle
          ),
        }}
      >
      <div
        className={`
          mx-auto max-w-${menuWidth} py-2 px-4 pl-8 sm:px-6 flex justify-between items-center h-[64px]
          ${
            headerType === 'ring_card_mini'
              ? 'border border-gray-200 rounded-full shadow-sm'
              : headerType === 'mini'
              ? ''
              : ''
          }
        `}
        style={
          (headerType === 'ring_card_mini' || headerType === 'mini')
            ? headerBackgroundStyle
            : undefined
        }
      >
        {/* Logo Section */}
        <div 
          className={`flex items-center ${
            logoPosition === 'center' ? 'flex-1' : ''
          } ${
            logoPosition === 'right' ? 'order-2' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => router?.push(logoUrl)}
            className="cursor-pointer flex items-center text-gray-900 transition-all duration-200 flex-shrink-0"
            style={{
              ['--hover-color' as any]: themeColors.cssVars.primary.base,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = themeColors.cssVars.primary.base;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
            }}
            aria-label={t.goToHomepage}
            disabled={!router}
          >
            {settings?.image ? (
              <Image
                src={settings.image}
                alt="Logo"
                width={48}
                height={48}
                className={`${logoHeightClass} w-auto md:${logoHeightClass} max-[767px]:h-8`}
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
            <span 
              className="sr-only ml-2 tracking-tight text-xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${themeColors.cssVars.primary.lighter}, ${themeColors.cssVars.primary.light}, ${themeColors.cssVars.primary.base})`,
              }}
            >
              {settings?.site || 'Default Site Name'}
            </span>
          </button>
        </div>

        {/* Navigation Section */}
        <div 
          className={`hidden md:flex items-center ${
            logoPosition === 'center' ? 'flex-1 justify-center' : 'justify-center flex-1 ml-8 mr-8'
          } ${
            logoPosition === 'right' ? 'order-1 flex-1' : ''
          } relative`}
        >
          {/* Menu Items */}
          <div className="flex items-center justify-center space-x-8 text-sm">
            {renderMenuItems}
          </div>
          
          {/* Action Items - Right Side Group */}
          {logoPosition !== 'right' && (
            <div className="absolute right-0 flex items-center space-x-3">
              {/* Language Switcher - Hidden for ring_card_mini and mini */}
              {settings?.with_language_switch && headerType !== 'ring_card_mini' && headerType !== 'mini' && (
                <div className="hidden lg:block">
                  <ModernLanguageSwitcher />
                </div>
              )}
              
              {/* Basket */}
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
              
              {/* Profile/Login */}
              {isLoggedIn && headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
            <div 
              className="relative group"
              onMouseEnter={cancelCloseTimeout}
              onMouseLeave={handleMenuLeave}
            >
              <button
                type="button"
                className="p-3"
                title={isAdmin ? 'Admin' : t.profile}
                aria-label={t.openProfileMenu}
              >
                <HeroIcons.UserIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
              </button>
              
              {/* Mega menu profile dropdown */}
              <div 
                className="fixed left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mx-4 sm:mx-8"
                style={{
                  top: `${fixedBannersHeight + 64 + 16}px`,
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                }}
                onMouseEnter={cancelCloseTimeout}
                onMouseLeave={handleMenuLeave}
              >
                <div className="px-6 py-6 max-w-7xl mx-auto">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{isAdmin ? 'Admin' : t.profile}</h3>
                    </div>
                  </div>
                  
                  {/* Menu items in grid */}
                  <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {isAdmin ? (
                      <>
                        {/* Dashboard */}
                        <LocalizedLink
                          href="/admin"
                          className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          {/* Icon container */}
                          <div className="relative w-full h-32">
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                              <HeroIcons.Cog6ToothIcon className="h-10 w-10 text-gray-600" />
                            </div>
                          </div>
                          {/* Content below */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Dashboard
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Manage your account settings
                            </p>
                          </div>
                        </LocalizedLink>

                        {/* Tickets */}
                        <button
                          type="button"
                          onClick={handleContactModal}
                          className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full text-left"
                        >
                          {/* Icon container */}
                          <div className="relative w-full h-32">
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                              <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                          {/* Content below */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Tickets
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Get help and support
                            </p>
                          </div>
                        </button>

                        {/* Meetings */}
                        <LocalizedLink
                          href="/admin"
                          className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          {/* Icon container */}
                          <div className="relative w-full h-32">
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                              <HeroIcons.VideoCameraIcon className="h-10 w-10 text-gray-600" />
                            </div>
                          </div>
                          {/* Content below */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Meetings
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Schedule and manage meetings
                            </p>
                          </div>
                        </LocalizedLink>

                        {/* AI Agents */}
                        <LocalizedLink
                          href="/admin/ai/management"
                          className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          {/* Icon container */}
                          <div className="relative w-full h-32">
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                              <HeroIcons.CpuChipIcon className="h-10 w-10 text-gray-600" />
                            </div>
                          </div>
                          {/* Content below */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              AI Agents
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              Manage AI models and agents
                            </p>
                          </div>
                        </LocalizedLink>
                      </>
                    ) : (
                      <>
                        {/* Account */}
                        <LocalizedLink
                          href="/account"
                          className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          {/* Icon container */}
                          <div className="relative w-full h-32">
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                              <HeroIcons.UserIcon className="h-10 w-10 text-gray-600" />
                            </div>
                          </div>
                          {/* Content below */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {t.account}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {t.accountSettings}
                            </p>
                          </div>
                        </LocalizedLink>

                        {/* Contact */}
                        <button
                          type="button"
                          onClick={handleContactModal}
                          className="group/item block bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full text-left"
                        >
                          {/* Icon container */}
                          <div className="relative w-full h-32">
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-t-lg">
                              <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                          {/* Content below */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover/item:text-gray-700 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {t.contact}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {t.getHelpSupport}
                            </p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Logout button - separate at bottom */}
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-150"
                    >
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                        <HeroIcons.ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="text-sm font-medium" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.logout}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
            <button
              type="button"
              onClick={handleLoginModal}
              className="group cursor-pointer flex items-center justify-center p-3 text-gray-700 hover:text-gray-900 focus:outline-none transition-colors duration-200"
              title={t.login}
              aria-label={t.openLoginModal}
            >
              <HeroIcons.ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
            </button>
          ) : null}
            </div>
          )}
        </div>

        {/* Right Section (when logo is on right) */}
        {logoPosition === 'right' && (
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            {settings?.with_language_switch && headerType !== 'ring_card_mini' && headerType !== 'mini' && (
              <div className="hidden lg:block">
                <ModernLanguageSwitcher />
              </div>
            )}
            
            {/* Basket */}
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
            
            {/* Profile/Login - same logic as above */}
            {isLoggedIn && headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
              <button
                type="button"
                className="p-3"
                title={isAdmin ? 'Admin' : t.profile}
                aria-label={t.openProfileMenu}
              >
                <HeroIcons.UserIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
              </button>
            ) : headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
              <button
                type="button"
                onClick={handleLoginModal}
                className="group cursor-pointer flex items-center justify-center p-3 text-gray-700 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                title={t.login}
                aria-label={t.openLoginModal}
              >
                <HeroIcons.ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" />
              </button>
            ) : null}
          </div>
        )}

        <div className="flex items-center md:hidden flex-shrink-0">
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
            {isOpen ? <HeroIcons.XMarkIcon className="h-6 w-6" /> : <HeroIcons.Bars3BottomLeftIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>
      </nav>

      {/* Mobile menu - Background overlay for area around header */}
      {isOpen && (
        <>
          {/* Background for the area above, left, and right of header */}
          <div 
            className="md:hidden fixed inset-0 bg-white z-20"
            style={{
              top: `${fixedBannersHeight}px`,
              bottom: 0,
            }}
          />
          
          {/* Mobile menu content */}
          <div className="md:hidden fixed inset-0 bg-white overflow-y-auto z-30"
            style={{
              top: `${fixedBannersHeight + 64}px`, // Position directly below the header (no gap on mobile)
            }}
          >
          <div className="p-6 pb-8">
            {renderMobileMenuItems}
            
            {/* Profile section */}
            {isLoggedIn ? (
              <Disclosure>
                {({ open }) => (
                  <div className="mt-6">
                    <Disclosure.Button
                      className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                      aria-label="Toggle profile menu"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{isAdmin ? 'Admin' : t.profile}</span>
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
                      {isAdmin ? (
                        <>
                          <LocalizedLink
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <HeroIcons.Cog6ToothIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Dashboard</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Manage your account settings</p>
                            </div>
                          </LocalizedLink>
                          
                          <button
                            type="button"
                            onClick={handleContactModal}
                            className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Tickets</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Get help and support</p>
                            </div>
                          </button>
                          
                          <LocalizedLink
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <HeroIcons.VideoCameraIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Meetings</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Schedule and manage meetings</p>
                            </div>
                          </LocalizedLink>
                          
                          <LocalizedLink
                            href="/admin/ai/management"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <HeroIcons.CpuChipIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>AI Agents</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>Manage AI models and agents</p>
                            </div>
                          </LocalizedLink>
                          
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full p-4 text-red-600 hover:text-red-700 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                              <HeroIcons.ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.logout}</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <LocalizedLink
                            href="/account"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <HeroIcons.UserIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.account}</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.accountSettings}</p>
                            </div>
                          </LocalizedLink>
                          <button
                            type="button"
                            onClick={handleContactModal}
                            className="flex items-center space-x-3 w-full p-4 text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.contact}</span>
                              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.getHelpSupport}</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full p-4 text-red-600 hover:text-red-700 transition-colors duration-200"
                          >
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                              <HeroIcons.ArrowLeftOnRectangleIcon className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.logout}</span>
                            </div>
                          </button>
                        </>
                      )}
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
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.login}</span>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{t.signIn}</p>
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
        </>
      )}

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
};

export default Header;