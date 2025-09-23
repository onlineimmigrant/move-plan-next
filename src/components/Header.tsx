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
const ContactModal = dynamic(() => import('./ContactModal'), { ssr: false });
const ModernLanguageSwitcher = dynamic(() => import('./ModernLanguageSwitcher'), { ssr: false });

// Optimized icon imports - only import what we need
import {
  PlusIcon,
  MinusIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ShoppingCartIcon,
  UserIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { MenuItem, SubMenuItem, ReactIcon } from '@/types/menu';

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
  const [isMounted, setIsMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { basket } = useBasket();
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = !!session;
  const { settings } = useSettings();
  const t = useHeaderTranslations();

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

  useEffect(() => {
    setIsMounted(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('Menu items in Header:', JSON.stringify(menuItems, null, 2));
      console.log('Fixed banners height in Header:', fixedBannersHeight);
      
      // Debug: Check submenu descriptions
      menuItems?.forEach((item) => {
        if (item.website_submenuitem?.length) {
          console.log(`Menu "${item.display_name}" submenus:`, 
            item.website_submenuitem.map(sub => ({
              id: sub.id,
              name: sub.name,
              description: sub.description,
              description_translation: sub.description_translation
            }))
          );
        }
      });
    }
  }, [menuItems, fixedBannersHeight]);

  // Memoized functions for better performance
  const getIconName = useCallback((reactIcons: ReactIcon | ReactIcon[] | null | undefined): string | undefined => {
    if (!reactIcons) return undefined;
    if (Array.isArray(reactIcons)) {
      return reactIcons.length > 0 ? reactIcons[0].icon_name : undefined;
    }
    return reactIcons.icon_name;
  }, []);

  // Create a dynamic icon map for better performance
  const iconMap = useMemo(() => {
    const dynamicImport = async (iconName: string) => {
      try {
        const iconModule = await import('@heroicons/react/24/outline');
        return iconModule[iconName as keyof typeof iconModule];
      } catch (error) {
        console.log(`Icon not found for iconName: ${iconName}, defaulting to MapIcon`);
        return MapIcon;
      }
    };
    return { dynamicImport };
  }, []);

  const renderIcon = useCallback((iconName: string | undefined) => {
    if (!iconName) {
      return <MapIcon className="h-6 w-6 text-gray-600" />;
    }
    // For now, use MapIcon as fallback - can be enhanced with dynamic loading if needed
    return <MapIcon className="h-6 w-6 text-gray-600" />;
  }, []);

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

            return (
              <div key={item.id} className="relative group">
                {displayedSubItems.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className="group cursor-pointer flex items-center justify-center px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased"
                      title={translatedDisplayName}
                      aria-label={t.openMenuFor(translatedDisplayName)}
                    >
                      {settings?.menu_items_are_text ? (
                        <span className="text-[15px] font-medium text-gray-700 group-hover:text-gray-900 tracking-[-0.01em] transition-colors duration-300">{translatedDisplayName}</span>
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
                          {renderIcon(getIconName(item.react_icons))}
                        </div>
                      )}
                      <svg className="ml-1.5 h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Full-width Apple-style mega menu */}
                    <div className="fixed left-0 right-0 top-[calc(100%+0.5rem)] bg-white/95 backdrop-blur-3xl border border-black/8 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.15)] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in-0 zoom-in-95 mx-4 sm:mx-8"
                      style={{
                        backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                      }}
                    >
                      {/* Subtle top highlight */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                      
                      {/* Inner glow for depth */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
                      
                      <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                        <div className="mb-6">
                          <h3 className="text-[18px] font-semibold text-gray-900 mb-2 tracking-[-0.02em] antialiased">{translatedDisplayName}</h3>
                          <p className="text-[13px] text-gray-600 antialiased opacity-90">Explore our {translatedDisplayName.toLowerCase()} options and services</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                          {displayedSubItems.map((subItem, index) => {
                            const translatedSubItemName = currentLocale 
                              ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                              : subItem.name;

                            const translatedDescription = currentLocale && subItem.description_translation && subItem.description
                              ? getTranslatedMenuContent(subItem.description, subItem.description_translation, currentLocale)
                              : subItem.description;

                            const displayDescription = translatedDescription || `Learn more about ${translatedSubItemName.toLowerCase()} and discover how it can help you.`;

                            return (
                              <LocalizedLink
                                key={subItem.id}
                                href={subItem.url_name}
                                className="group/item relative overflow-hidden flex bg-gray-50/50 hover:bg-gray-100/60 backdrop-blur-sm rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:shadow-md border border-gray-200/40"
                              >
                                {/* Hover shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-700 ease-out"></div>
                                
                                {/* Image section - 1/3 width, full height */}
                                <div className="relative w-1/3 flex-shrink-0 min-h-[120px]">
                                  {subItem.image ? (
                                    <Image
                                      src={subItem.image}
                                      alt={translatedSubItemName}
                                      fill
                                      sizes="(max-width: 768px) 100px, (max-width: 1200px) 120px, 140px"
                                      className="object-cover rounded-l-2xl"
                                      loading="lazy"
                                      placeholder="blur"
                                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                                      onError={() =>
                                        console.error(
                                          `Failed to load image for submenu item ${translatedSubItemName}: ${subItem.image}`
                                        )
                                      }
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-l-2xl min-h-[120px]">
                                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Content section - 2/3 width */}
                                <div className="relative z-10 flex-1 flex items-center justify-between p-5">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[15px] font-semibold text-gray-900 mb-2 tracking-[-0.01em] antialiased group-hover/item:text-gray-800 transition-colors duration-300">
                                      {translatedSubItemName}
                                    </h4>
                                    <p className="text-[12px] text-gray-600 leading-relaxed antialiased opacity-80 group-hover/item:opacity-100 transition-opacity duration-300">
                                      {displayDescription}
                                    </p>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-400 group-hover/item:text-gray-600 group-hover/item:translate-x-1 transition-all duration-300 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </LocalizedLink>
                            );
                          })}
                        </div>
                        
                        {/* Featured section at bottom */}
                        <div className="mt-8 pt-6 border-t border-gray-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-[14px] font-medium text-gray-700 antialiased">Need help deciding?</h4>
                              <p className="text-[12px] text-gray-500 antialiased">Contact our team for personalized recommendations</p>
                            </div>
                            <button
                              onClick={() => setIsContactOpen(true)}
                              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-800 text-white text-[13px] font-medium rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] shadow-sm hover:shadow-md antialiased"
                            >
                              Contact Us
                            </button>
                          </div>
                        </div>
                      </div>
    
                      {/* Bottom accent */}
                      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent"></div>
                    </div>
                  </>
                ) : (
                  <LocalizedLink
                    href={item.url_name}
                    className="cursor-pointer flex items-center justify-center px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50  rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group antialiased"
                    title={translatedDisplayName}
                    aria-label={t.goTo(translatedDisplayName)}
                  >
                    {settings?.menu_items_are_text ? (
                      <span className="text-[15px] font-medium text-gray-700 group-hover:text-gray-900 tracking-[-0.01em] transition-colors duration-300">{translatedDisplayName}</span>
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
                        {renderIcon(getIconName(item.react_icons))}
                      </div>
                    )}
                  </LocalizedLink>
                )}
              </div>
            );
          })
      )}
    </>
  ), [filteredMenuItems, currentLocale, settings?.menu_items_are_text, t, setIsContactOpen]);

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
                      <div className="relative overflow-hidden bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/40">
                        <Disclosure.Button
                          className="group cursor-pointer flex items-center justify-between w-full p-4 hover:bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                          aria-label={t.toggleMenu(translatedDisplayName)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-left">
                              <span className="text-[15px] font-semibold text-gray-900 antialiased tracking-[-0.01em]">{translatedDisplayName}</span>
                              <p className="text-[12px] text-gray-600 antialiased opacity-80">
                                {displayedSubItems.length} {displayedSubItems.length === 1 ? 'option' : 'options'}
                              </p>
                            </div>
                          </div>
                          <div className="transition-all duration-300 group-hover:scale-105">
                            {open ? (
                              <MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            ) : (
                              <PlusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                            )}
                          </div>
                        </Disclosure.Button>
                        <Disclosure.Panel className="p-4 pt-0 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-300 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                          {/* Gradient fade at top for visual hierarchy */}
                          <div className="sticky top-0 h-4 bg-gradient-to-b from-white/90 to-transparent pointer-events-none z-10 -mt-2"></div>
                          {displayedSubItems.map((subItem) => {
                            // Get translated content for submenu item
                            const translatedSubItemName = currentLocale 
                              ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                              : subItem.name;

                            const translatedDescription = currentLocale && subItem.description_translation && subItem.description
                              ? getTranslatedMenuContent(subItem.description, subItem.description_translation, currentLocale)
                              : subItem.description;

                            const displayDescription = translatedDescription || `Learn more about ${translatedSubItemName.toLowerCase()}`;

                            return (
                              <LocalizedLink
                                key={subItem.id}
                                href={subItem.url_name}
                                onClick={() => setIsOpen(false)}
                                className="group/sub relative overflow-hidden flex bg-gray-50/50 hover:bg-gray-100/60 backdrop-blur-sm rounded-xl border border-gray-200/30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/sub:translate-x-full transition-transform duration-700 ease-out"></div>
                                
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
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-l-xl min-h-[60px]">
                                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Content section - 2/3 width */}
                                <div className="relative z-10 flex-1 flex items-center justify-between p-3">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[14px] font-medium text-gray-800 antialiased tracking-[-0.01em] mb-1 block">{translatedSubItemName}</span>
                                    <p className="text-[11px] text-gray-600 antialiased opacity-70 line-clamp-2">{displayDescription}</p>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-400 group-hover/sub:text-gray-600 group-hover/sub:translate-x-1 transition-all duration-300 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </LocalizedLink>
                            );
                          })}
                          {/* Gradient fade at bottom for visual hierarchy */}
                          <div className="sticky bottom-0 h-4 bg-gradient-to-t from-white/90 to-transparent pointer-events-none z-10 -mb-2"></div>
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>
                ) : (
                  <LocalizedLink
                    href={item.url_name}
                    onClick={() => setIsOpen(false)}
                    className="group cursor-pointer flex items-center space-x-3 w-full p-4 bg-white/50 hover:bg-gray-50/70 backdrop-blur-sm rounded-2xl border border-gray-200/40 focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                    aria-label={t.goTo(translatedDisplayName)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 text-left">
                        <span className="text-[15px] font-semibold text-gray-900 antialiased tracking-[-0.01em]">{translatedDisplayName}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </LocalizedLink>
                )}
              </div>
            );
          })
      )}
    </div>
  ), [filteredMenuItems, currentLocale, t, setIsOpen]);

  if (!isMounted) {
    // Optimized skeleton header to prevent layout shift during hydration
    return (
      <nav
        className="fixed left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl"
        style={{ 
          top: `${fixedBannersHeight}px`,
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
      >
        <div className={`mx-auto max-w-7xl p-4 pl-8 sm:px-6 flex justify-between items-center min-h-[64px]`}>
          <div className="flex items-center">
            <div className="h-8 w-32 bg-gray-200/60 animate-pulse rounded-lg"></div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="h-6 w-16 bg-gray-200/60 animate-pulse rounded-lg"></div>
            <div className="h-6 w-16 bg-gray-200/60 animate-pulse rounded-lg"></div>
            <div className="h-6 w-16 bg-gray-200/60 animate-pulse rounded-lg"></div>
          </div>
          <div className="md:hidden">
            <div className="h-6 w-6 bg-gray-200/60 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>      
      <nav
        className={`fixed left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-3xl border-b border-black/8 shadow-[0_1px_20px_rgba(0,0,0,0.08)]' 
            : 'bg-white/80 backdrop-blur-2xl'
        }`}
        style={{ 
          top: `${fixedBannersHeight}px`,
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
      >
      <div
        className={`mx-auto max-w-${settings?.menu_width || '7xl'} p-4 pl-8 sm:px-6 flex justify-between items-center min-h-[64px]`}
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
            {isMounted && totalItems > 0 && (
              <LocalizedLink
                href="/basket"
                className="cursor-pointer relative"
                aria-label={t.viewBasket(totalItems)}
              >
                <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </LocalizedLink>
            )}
            {isLoggedIn ? (
            <div className="relative group">
              <button
                type="button"
                className="group cursor-pointer flex items-center justify-center p-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased"
                title={t.profile}
                aria-label={t.openProfileMenu}
              >
                <UserIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-all duration-300 group-hover:scale-105" />
              </button>
              
              {/* Apple-style profile dropdown */}
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-3xl border border-black/8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                }}
              >
                {/* Top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                
                <div className="p-6">
                  {/* Profile header */}
                  <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200/50">
                    <div className="w-12 h-12 bg-gray-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900 antialiased tracking-[-0.01em]">Profile</h3>
                      <p className="text-[12px] text-gray-600 antialiased opacity-80">Manage your account settings</p>
                    </div>
                  </div>
                  
                  {/* Menu items */}
                  <div className="space-y-1">
                    <LocalizedLink
                      href="/account"
                      className="group/item relative overflow-hidden flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50/70 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-500 ease-out"></div>
                      <div className="relative z-10 w-8 h-8 bg-gray-100/80 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="relative z-10 flex-1">
                        <span className="text-[14px] font-medium text-gray-800 antialiased tracking-[-0.01em]">{t.account}</span>
                        <p className="text-[11px] text-gray-600 antialiased opacity-70">Account settings and preferences</p>
                      </div>
                      <svg className="relative z-10 w-4 h-4 text-gray-400 group-hover/item:text-gray-600 group-hover/item:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </LocalizedLink>

                    <button
                      type="button"
                      onClick={handleContactModal}
                      className="group/item relative overflow-hidden flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-gray-50/70 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-500 ease-out"></div>
                      <div className="relative z-10 w-8 h-8 bg-gray-100/80 rounded-lg flex items-center justify-center">
                        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="relative z-10 flex-1 text-left">
                        <span className="text-[14px] font-medium text-gray-800 antialiased tracking-[-0.01em]">{t.contact}</span>
                        <p className="text-[11px] text-gray-600 antialiased opacity-70">Get help and support</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group/item relative overflow-hidden flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-red-50/70 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] text-red-600 hover:text-red-700 mt-2 border-t border-gray-200/50 pt-4"
                    >
                      <div className="relative z-10 w-8 h-8 bg-red-100/80 rounded-lg flex items-center justify-center">
                        <ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="relative z-10 flex-1 text-left">
                        <span className="text-[14px] font-medium antialiased tracking-[-0.01em]">{t.logout}</span>
                        <p className="text-[11px] text-red-500 antialiased opacity-70">Sign out of your account</p>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Bottom accent */}
                <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent"></div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLoginModal}
              className="group cursor-pointer flex items-center justify-center p-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased"
              title={t.login}
              aria-label={t.openLoginModal}
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-800 transition-all duration-300 group-hover:scale-105" />
            </button>
          )}
          </div>
        </div>

        <div className="flex items-center md:hidden">
          {isMounted && totalItems > 0 && (
            <LocalizedLink
              href="/basket"
              className="cursor-pointer relative mr-4"
              aria-label={t.viewBasket(totalItems)}
            >
              <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </LocalizedLink>
          )}
          <button
            type="button"
            onClick={handleMenuToggle}
            className="group cursor-pointer p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] antialiased"
            aria-label={isOpen ? t.closeMenu : t.openMenu}
          >
            <div className="transition-all duration-300 group-hover:scale-105">
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </div>
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
                  <div className="relative overflow-hidden border-t border-gray-200/50 mt-6 pt-6">
                    <Disclosure.Button
                      className="group cursor-pointer flex items-center justify-between w-full p-4 bg-gray-50/50 hover:bg-gray-100/60 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                      aria-label="Toggle profile menu"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <span className="text-[15px] font-semibold text-gray-900 antialiased tracking-[-0.01em]">Profile</span>
                          <p className="text-[12px] text-gray-600 antialiased opacity-80">Account & settings</p>
                        </div>
                      </div>
                      <div className="transition-all duration-300 group-hover:scale-105">
                        {open ? (
                          <MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        ) : (
                          <PlusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        )}
                      </div>
                    </Disclosure.Button>
                    <Disclosure.Panel className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-300 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-hide">
                      <LocalizedLink
                        href="/account"
                        onClick={() => setIsOpen(false)}
                        className="group/item relative overflow-hidden flex items-center space-x-3 p-4 bg-white/50 hover:bg-gray-50/70 backdrop-blur-sm rounded-xl border border-gray-200/40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-700 ease-out"></div>
                        <div className="relative z-10 w-8 h-8 bg-gray-100/80 rounded-lg flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="relative z-10 flex-1">
                          <span className="text-[14px] font-medium text-gray-800 antialiased tracking-[-0.01em]">{t.account}</span>
                          <p className="text-[11px] text-gray-600 antialiased opacity-70">Settings & preferences</p>
                        </div>
                        <svg className="relative z-10 w-4 h-4 text-gray-400 group-hover/item:text-gray-600 group-hover/item:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </LocalizedLink>
                      <button
                        type="button"
                        onClick={handleContactModal}
                        className="group/item relative overflow-hidden flex items-center space-x-3 w-full p-4 bg-white/50 hover:bg-gray-50/70 backdrop-blur-sm rounded-xl border border-gray-200/40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-700 ease-out"></div>
                        <div className="relative z-10 w-8 h-8 bg-gray-100/80 rounded-lg flex items-center justify-center">
                          <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="relative z-10 flex-1 text-left">
                          <span className="text-[14px] font-medium text-gray-800 antialiased tracking-[-0.01em]">{t.contact}</span>
                          <p className="text-[11px] text-gray-600 antialiased opacity-70">Get help & support</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="group/item relative overflow-hidden flex items-center space-x-3 w-full p-4 bg-red-50/60 hover:bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/40 text-red-600 hover:text-red-700 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                      >
                        <div className="relative z-10 w-8 h-8 bg-red-100/80 rounded-lg flex items-center justify-center">
                          <ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="relative z-10 flex-1 text-left">
                          <span className="text-[14px] font-medium antialiased tracking-[-0.01em]">{t.logout}</span>
                          <p className="text-[11px] text-red-500 antialiased opacity-70">Sign out of account</p>
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
                  className="group cursor-pointer flex items-center justify-between w-full p-4 bg-gray-50/50 hover:bg-gray-100/60 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                  aria-label={t.openLoginModal}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-left">
                      <span className="text-[15px] font-semibold text-gray-900 antialiased tracking-[-0.01em]">{t.login}</span>
                      <p className="text-[12px] text-gray-600 antialiased opacity-80">Sign in to your account</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Close button at bottom for better UX */}
            <div className="mt-8 pt-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full group cursor-pointer flex items-center justify-center p-4 bg-gray-100/60 hover:bg-gray-200/60 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] antialiased"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-[14px] font-medium text-gray-700 antialiased tracking-[-0.01em]">Close Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
};

export default Header;