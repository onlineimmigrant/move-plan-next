'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy, useRef, Suspense } from 'react';
import Image from 'next/image';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { useBasket } from '@/context/BasketContext';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import LocalizedLink from './LocalizedLink';
import { useHeaderTranslations } from './header/useHeaderTranslations';
import { saveReturnUrl } from './LoginRegistration/hooks';
import { useWebVitals } from '@/hooks/useWebVitals';
import { usePrefetchLink } from '@/hooks/usePrefetchLink';

// Shared hooks
import { useNavigation } from '@/hooks/shared/useNavigation';
import { useMenuData } from '@/hooks/shared/useMenuData';
import { useComponentStyles } from '@/hooks/shared/useComponentStyles';

// Header-specific hooks
import { 
  useMenuState, 
  useMenuHandlers, 
  useScrollBehavior, 
  useResponsiveBreakpoint,
  useHeaderStyles 
} from './header/hooks';

// Extracted Header components
import { 
  MegaMenu,
  SimpleDropdown, 
  UserMenu, 
  BasketIcon, 
  HeaderLogo,
  DesktopMenu,
  MobileMenu,
  DesktopActions,
  MobileProfileSection
} from './header/components';

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

// Import Disclosure components normally instead of dynamically
import { Disclosure } from '@headlessui/react';

// Optimized icon loading (for admin/account menus only)
import { 
  ChevronDownIcon, 
  Bars3Icon, 
  Bars3BottomLeftIcon,
  XMarkIcon, 
  ShoppingCartIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  VideoCameraIcon,
  CpuChipIcon,
  MinusIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { MenuItem, SubMenuItem } from '@/types/menu';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

// Prefetched Menu Link Component - Memoized for performance
interface PrefetchedMenuLinkProps {
  href: string;
  onClick?: () => void;
  className?: string;
  title?: string;
  'aria-label'?: string;
  children: React.ReactNode;
}

const PrefetchedMenuLinkComponent: React.FC<PrefetchedMenuLinkProps> = ({ 
  href, 
  onClick, 
  className, 
  title, 
  'aria-label': ariaLabel, 
  children 
}) => {
  const prefetchHandlers = usePrefetchLink({
    url: href,
    prefetchOnHover: true,
    delay: 100,
  });

  return (
    <LocalizedLink
      {...prefetchHandlers}
      href={href}
      onClick={onClick}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </LocalizedLink>
  );
};

// Memoize to prevent re-renders when props haven't changed
const PrefetchedMenuLink = React.memo(PrefetchedMenuLinkComponent, (prevProps, nextProps) => {
  return (
    prevProps.href === nextProps.href &&
    prevProps.className === nextProps.className &&
    prevProps.title === nextProps.title &&
    prevProps['aria-label'] === nextProps['aria-label'] &&
    prevProps.children === nextProps.children
  );
});

interface HeaderProps {
  companyLogo?: string;
  menuItems: MenuItem[] | undefined;
  fixedBannersHeight: number;
}

const HeaderComponent: React.FC<HeaderProps> = ({
  companyLogo = '/images/logo.svg',
  menuItems = [],
  fixedBannersHeight = 0,
}) => {
  // Modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Context hooks
  const { isAdmin } = useAuth();
  const { basket } = useBasket();
  const { session, logout } = useAuth();
  const isLoggedIn = !!session;
  const { settings } = useSettings();
  const t = useHeaderTranslations();
  const themeColors = useThemeColors();
  
  // Shared hooks
  const { router, pathname, currentLocale, navigate } = useNavigation();
  const { headerMenuItems: filteredMenuItems, translateMenuItem } = useMenuData({
    menuItems,
    currentLocale,
    filterForHeader: true,
  });
  
  // Menu state management (extracted hook)
  const {
    isOpen,
    setIsOpen,
    openSubmenu,
    setOpenSubmenu,
    hoveredSubmenuItem,
    setHoveredSubmenuItem,
    closeTimeoutRef,
    cancelCloseTimeout,
    closeSubmenuWithDelay,
  } = useMenuState();
  
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
    return {
      type: 'default' as const,
      background: 'white',
      color: 'gray-700',
      color_hover: 'gray-900',
      menu_width: '7xl' as const,
      menu_items_are_text: true,
      menu_font_size: 'base',
      menu_font_weight: 'normal',
      profile_item_visible: true,
      is_gradient: false,
      gradient: undefined,
      logo: { url: '/', position: 'left', size: 'md' }
    };
  }, [settings.header_style]);
  
  // Scroll behavior (extracted hook) - must be before useHeaderStyles
  const { isScrolled, isVisible, isScrollingUp } = useScrollBehavior({ headerType: headerStyle.type || 'default' });
  
  // Header styles (extracted hook)
  const {
    headerType,
    headerColor,
    headerColorHover,
    menuWidth,
    menuFontSize,
    menuFontWeight,
    profileItemVisible,
    logoUrl,
    logoPosition,
    logoHeightClass,
    menuFontSizeClass,
    menuFontWeightClass,
    headerBackgroundStyle,
  } = useHeaderStyles({ headerStyle, isScrolled });
  
  // Responsive breakpoint (extracted hook)
  const { responsiveBreakpoint, isDesktop } = useResponsiveBreakpoint({ 
    menuItemsCount: filteredMenuItems.length 
  });
  
  // Menu handlers (extracted hook)
  const {
    handleMenuEnter,
    handleMenuLeave,
    handleSubmenuItemHover,
    toggleMobileMenu,
    closeMobileMenu,
  } = useMenuHandlers({
    setOpenSubmenu,
    setHoveredSubmenuItem,
    cancelCloseTimeout,
    closeSubmenuWithDelay,
    setIsOpen,
  });
  
  // Web Vitals monitoring for Header performance
  useWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Header] ${metric.name}: ${metric.value}ms (${metric.rating})`);
    }
  });

  // Memoize callback functions for better performance
  const handleHomeNavigation = useCallback(() => {
    closeMobileMenu();
    router.push('/');
  }, [router, closeMobileMenu]);

  const handleLoginModal = useCallback(() => {
    closeMobileMenu();
    if (pathname && !pathname.includes('/login')) {
      saveReturnUrl(pathname);
    }
    setIsLoginOpen(true);
  }, [pathname, closeMobileMenu]);

  const handleSwitchToRegister = useCallback(() => {
    setIsLoginOpen(false);
    setTimeout(() => setIsRegisterOpen(true), 300);
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    setIsRegisterOpen(false);
    setTimeout(() => setIsLoginOpen(true), 300);
  }, []);

  const handleContactModal = useCallback(() => {
    closeMobileMenu();
    setIsContactOpen(true);
  }, [closeMobileMenu]);

  const handleLogout = useCallback(() => {
    closeMobileMenu();
    logout();
  }, [logout, closeMobileMenu]);

  const handleMenuToggle = useCallback(() => {
    if (pathname.includes('/blog') && !isOpen) {
      window.dispatchEvent(new Event('openBlogSearch'));
    } else {
      toggleMobileMenu();
    }
  }, [isOpen, pathname, toggleMobileMenu]);

  // Helper function for submenu enter/leave
  const handleSubmenuEnter = useCallback(() => {
    cancelCloseTimeout();
  }, [cancelCloseTimeout]);

  const handleSubmenuLeave = useCallback(() => {
    closeSubmenuWithDelay();
  }, [closeSubmenuWithDelay]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [closeTimeoutRef]);
  
  // Memoize total items calculation
  const totalItems = useMemo(() => 
    basket.reduce((sum, item) => sum + item.quantity, 0),
    [basket]
  );

  // Set mounted state to prevent hydration mismatch for basket
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>      
      <nav
        className={`site-header 
          fixed
          left-0 right-0 z-[9999] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          overflow-visible
          ${
            headerType === 'ring_card_mini' || headerType === 'mini'
              ? 'px-4 pt-6' // Container padding for ring_card_mini and mini - generous top spacing for floating effect
              : ''
          }
          ${
            // For transparent type: check if at top first
            headerType === 'transparent' 
              ? (!isScrolled 
                  ? 'bg-transparent'
                  : isScrollingUp
                  ? 'backdrop-blur-xl'
                  : 'backdrop-blur-3xl shadow-[0_1px_20px_rgba(0,0,0,0.08)]'
                )
              // Apply glassmorphism when scrolling up (no borders, no shadows) for non-transparent types
              : isScrollingUp && isScrolled
              ? 'backdrop-blur-xl'
              // For ring_card_mini and mini: no backdrop blur, border handled on inner container
              : (headerType === 'ring_card_mini' || headerType === 'mini')
              ? ''
              // For other types: always have backdrop blur
              : (isScrolled 
                  ? 'backdrop-blur-3xl shadow-[0_1px_20px_rgba(0,0,0,0.08)]' 
                  : 'md:backdrop-blur-2xl'
                )
          }
        `}
        style={{ 
          top: 0,
          marginTop: `${fixedBannersHeight}px`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          // For 'fixed' type, always stay visible. For others, hide on scroll down (except when mobile menu is open)
          transform: (headerType === 'fixed' || isVisible || isOpen) ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: (headerType === 'fixed' || isVisible || isOpen) ? 'auto' : 'none',
          // CSS content-visibility for paint optimization
          contentVisibility: 'auto' as const,
          containIntrinsicSize: 'auto 80px',
          // Apply glassmorphism background when scrolling up, but not at top
          ...(isScrollingUp && isScrolled
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
          overflow-visible
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
          <LocalizedLink
            href="/"
            className={`cursor-pointer flex items-center text-gray-900 transition-all duration-200 flex-shrink-0 hover:opacity-80 ${pathname.includes('/blog') ? 'hidden sm:flex' : 'flex'}`}
            aria-label={t.goToHomepage}
          >
            {headerStyle?.logo?.url ? (
              <Image
                src={headerStyle.logo.url}
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
                  console.error('Failed to load logo:', headerStyle.logo.url);
                  e.currentTarget.src = companyLogo;
                }}
              />
            ) : (
              <span className="text-gray-500">{t.noLogoAvailable}</span>
            )}
          </LocalizedLink>
        </div>

        {/* Navigation Section */}
        <div 
          className={`hidden ${responsiveBreakpoint}:flex items-center relative ${
            logoPosition === 'center' ? 'flex-1 justify-center' : 'justify-center flex-1 ml-8 mr-8'
          } ${
            logoPosition === 'right' ? 'order-1 flex-1' : ''
          } relative`}
        >
          {/* Menu Items */}
          <div className="flex items-center justify-center space-x-8 text-sm">
            <DesktopMenu
              filteredMenuItems={filteredMenuItems}
              currentLocale={currentLocale}
              pathname={pathname}
              openSubmenu={openSubmenu}
              headerColor={headerColor}
              headerColorHover={headerColorHover}
              hoveredSubmenuItem={hoveredSubmenuItem}
              fixedBannersHeight={fixedBannersHeight}
              menuFontSizeClass={menuFontSizeClass}
              menuFontWeightClass={menuFontWeightClass}
              themeColors={themeColors}
              settings={settings}
              translations={t}
              setOpenSubmenu={setOpenSubmenu}
              handleMenuEnter={handleMenuEnter}
              handleMenuLeave={handleMenuLeave}
              handleSubmenuEnter={handleSubmenuEnter}
              handleSubmenuLeave={handleSubmenuLeave}
              handleSubmenuItemHover={handleSubmenuItemHover}
              translateMenuItem={translateMenuItem}
              PrefetchedMenuLink={PrefetchedMenuLink}
            />
          </div>
          
          {/* Action Items - Right Side Group */}
          {logoPosition !== 'right' && (
            <DesktopActions
              isMounted={isMounted}
              totalItems={totalItems}
              profileItemVisible={profileItemVisible}
              isLoggedIn={isLoggedIn}
              isDesktop={isDesktop}
              headerType={headerType}
              isAdmin={isAdmin}
              fixedBannersHeight={fixedBannersHeight}
              headerColor={headerColor}
              headerColorHover={headerColorHover}
              translations={t}
              cancelCloseTimeout={cancelCloseTimeout}
              handleMenuLeave={handleMenuLeave}
              handleLoginModal={handleLoginModal}
              handleContactModal={handleContactModal}
              handleLogout={handleLogout}
            />
          )}
          
          {/* Language Switcher - Positioned after profile/login */}
          {settings?.with_language_switch && headerType !== 'ring_card_mini' && headerType !== 'mini' && logoPosition !== 'right' && (
            <div className="hidden lg:block ml-3">
              <ModernLanguageSwitcher 
                menuColor={headerColor}
                menuHoverColor={headerColorHover}
                menuFontSize={menuFontSize}
                menuFontWeight={menuFontWeight}
              />
            </div>
          )}
        </div>

        {/* Right Section (when logo is on right) */}
        {logoPosition === 'right' && (
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            {settings?.with_language_switch && headerType !== 'ring_card_mini' && headerType !== 'mini' && (
              <div className="hidden lg:block">
                <ModernLanguageSwitcher 
                  menuColor={headerColor}
                  menuHoverColor={headerColorHover}
                  menuFontSize={menuFontSize}
                  menuFontWeight={menuFontWeight}
                />
              </div>
            )}
            
            {/* Basket */}
            {isMounted && totalItems > 0 && (
              <LocalizedLink
                href="/basket"
                className="cursor-pointer relative"
                aria-label={t.viewBasket(totalItems)}
              >
                <ShoppingCartIcon 
                  className="w-6 h-6 transition-colors duration-200" 
                  style={{ color: getColorValue(headerColor) }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
                />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </LocalizedLink>
            )}
            
            {/* Profile/Login - same logic as above */}
            {(profileItemVisible || !isDesktop) && isLoggedIn && headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
              <button
                type="button"
                className="p-3"
                title={isAdmin ? 'Admin' : t.profile}
                aria-label={t.openProfileMenu}
              >
                <UserIcon 
                  className="h-6 w-6 transition-colors duration-200" 
                  style={{ color: getColorValue(headerColor) }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
                />
              </button>
            ) : (profileItemVisible || !isDesktop) && headerType !== 'ring_card_mini' && headerType !== 'mini' ? (
              <button
                type="button"
                onClick={handleLoginModal}
                className="cursor-pointer flex items-center justify-center p-3 focus:outline-none transition-colors duration-200"
                title={t.login}
                aria-label={t.openLoginModal}
              >
                <ArrowLeftOnRectangleIcon 
                  className="h-6 w-6 transition-colors duration-200" 
                  style={{ color: getColorValue(headerColor) }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
                />
              </button>
            ) : null}
          </div>
        )}

        <div className={`flex items-center ${responsiveBreakpoint}:hidden flex-shrink-0`}>
          {isMounted && totalItems > 0 && (
            <LocalizedLink
              href="/basket"
              className="cursor-pointer relative mr-4"
              aria-label={t.viewBasket(totalItems)}
            >
              <ShoppingCartIcon 
                className="w-6 h-6 transition-colors duration-200" 
                style={{ color: getColorValue(headerColor) }}
                onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
                onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
              />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </LocalizedLink>
          )}
          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100/80 active:bg-gray-200/80 transition-all duration-200 backdrop-blur-sm"
            aria-label={isOpen ? t.closeMenu : t.openMenu}
            {...(pathname.includes('/blog') && !isOpen ? { 'data-blog-search-trigger': true } : {})}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" style={{ color: getColorValue(headerColor) }} />
            ) : pathname.includes('/blog') ? (
              <div className="relative">
                <MagnifyingGlassIcon 
                  className="h-6 w-6 transition-transform duration-200 hover:scale-110" 
                  style={{ color: getColorValue(headerColor), strokeWidth: 2.5 }} 
                />
              </div>
            ) : (
              <Bars3BottomLeftIcon className="h-6 w-6" style={{ color: getColorValue(headerColor) }} />
            )}
          </button>
        </div>
      </div>
      </nav>

      {/* Mobile menu - Background overlay for area around header */}
      {isOpen && (
        <>
          {/* Background for the area above, left, and right of header */}
          <div 
            className={`${responsiveBreakpoint}:hidden fixed inset-0 bg-white z-20`}
            style={{
              top: `${fixedBannersHeight}px`,
              bottom: 0,
            }}
          />
          
          {/* Mobile menu content */}
          <div className={`${responsiveBreakpoint}:hidden fixed inset-0 bg-white overflow-y-auto z-30`}
            style={{
              top: `${fixedBannersHeight + 64}px`, // Position directly below the header (no gap on mobile)
            }}
          >
          <div className="p-6 pb-8">
            <MobileMenu
              filteredMenuItems={filteredMenuItems}
              currentLocale={currentLocale}
              settings={settings}
              translations={t}
              setIsOpen={setIsOpen}
            />
            
            {/* Profile section */}
            <MobileProfileSection
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
              translations={t}
              setIsOpen={setIsOpen}
              handleContactModal={handleContactModal}
              handleLogout={handleLogout}
              handleLoginModal={handleLoginModal}
            />
          </div>
        </div>
        </>
      )}

      <Suspense fallback={null}>
        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)}
          onSwitchToRegister={handleSwitchToRegister}
        />
      </Suspense>
      <Suspense fallback={null}>
        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => setIsRegisterOpen(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      </Suspense>
    </>
  );
};

const Header = React.memo(HeaderComponent, (prevProps, nextProps) => {
  return (
    prevProps.companyLogo === nextProps.companyLogo &&
    prevProps.menuItems?.length === nextProps.menuItems?.length &&
    prevProps.fixedBannersHeight === nextProps.fixedBannersHeight
  );
});

Header.displayName = 'Header';

export default Header;