'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useBasket } from '@/context/BasketContext';
import { useAuth } from '@/context/AuthContext';
import { Disclosure } from '@headlessui/react';
import * as HeroIcons from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import LoginModal from './LoginModal';
import ContactModal from './ContactModal';
import ModernLanguageSwitcher from './ModernLanguageSwitcher';
import LocalizedLink from './LocalizedLink';
import { useHeaderTranslations } from './header/useHeaderTranslations';
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
import { MenuItem, SubMenuItem, ReactIcon } from '@/types/menu'; // Import ReactIcon explicitly

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
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const isLoggedIn = !!session;
  const { settings } = useSettings();
  const t = useHeaderTranslations();

  // Get current locale for translations
  const currentLocale = getLocaleFromPathname(pathname);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollThreshold = windowHeight * 0.1;
      setIsScrolled(scrollPosition > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    console.log('Menu items in Header:', JSON.stringify(menuItems, null, 2));
    console.log('Fixed banners height in Header:', fixedBannersHeight);
  }, [menuItems, fixedBannersHeight]);

  const getIconName = (reactIcons: ReactIcon | ReactIcon[] | null | undefined): string | undefined => {
    if (!reactIcons) return undefined;
    if (Array.isArray(reactIcons)) {
      return reactIcons.length > 0 ? reactIcons[0].icon_name : undefined;
    }
    return reactIcons.icon_name;
  };

  const renderIcon = (iconName: string | undefined) => {
    if (!iconName) {
      console.log('No icon name provided, defaulting to MapIcon');
      return <MapIcon className="h-6 w-6 text-gray-600" />;
    }
    const IconComponent = (HeroIcons as any)[iconName];
    if (!IconComponent) {
      console.log(`Icon not found for iconName: ${iconName}, defaulting to MapIcon`);
      return <MapIcon className="h-6 w-6 text-gray-600" />;
    }
    return <IconComponent className="h-6 w-6 text-gray-600" />;
  };

  const renderMenuItems = () => (
    <>
      {menuItems.length === 0 ? (
        <span className="text-gray-500">{t.noMenuItems}</span>
      ) : (
        menuItems
          .filter((item) => item.is_displayed && item.display_name !== 'Profile')
          .map((item) => {
            const displayedSubItems = (item.website_submenuitem || []).filter(
              (subItem) => subItem.is_displayed !== false
            );
            console.log(
              `Desktop rendering ${item.display_name}, displayedSubItems:`,
              JSON.stringify(displayedSubItems, null, 2)
            );

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
                      className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                      title={translatedDisplayName}
                      aria-label={t.openMenuFor(translatedDisplayName)}
                    >
                      {settings?.menu_items_are_text ? (
                        <span className="text-base font-medium text-gray-700">{translatedDisplayName}</span>
                      ) : item.image ? (
                        <Image
                          src={item.image}
                          alt={translatedDisplayName}
                          width={24}
                          height={24}
                          className="h-6 w-6 text-gray-600"
                          onError={() =>
                            console.error(
                              `Failed to load image for menu item ${translatedDisplayName}: ${item.image}`
                            )
                          }
                        />
                      ) : (
                        renderIcon(getIconName(item.react_icons))
                      )}
                    </button>
                    <div className="absolute right-0 w-56 bg-white rounded-lg shadow-xl z-50 hidden group-hover:block">
                      {displayedSubItems.map((subItem) => {
                        // Get translated content for submenu item
                        const translatedSubItemName = currentLocale 
                          ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                          : subItem.name;

                        return (
                          <LocalizedLink
                            key={subItem.id}
                            href={subItem.url_name}
                            className="block px-8 py-4 text-gray-700 hover:bg-sky-50 text-sm font-medium transition-colors duration-200"
                          >
                            {translatedSubItemName}
                          </LocalizedLink>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <LocalizedLink
                    href={item.url_name}
                    className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                    title={translatedDisplayName}
                    aria-label={t.goTo(translatedDisplayName)}
                  >
                    {settings?.menu_items_are_text ? (
                      <span className="text-base font-medium text-gray-700">{translatedDisplayName}</span>
                    ) : item.image ? (
                      <Image
                        src={item.image}
                        alt={translatedDisplayName}
                        width={24}
                        height={24}
                        className="h-4 w-6 text-gray-600"
                        onError={() =>
                          console.error(
                            `Failed to load image for menu item ${translatedDisplayName}: ${item.image}`
                          )
                        }
                      />
                    ) : (
                      renderIcon(getIconName(item.react_icons))
                    )}
                  </LocalizedLink>
                )}
              </div>
            );
          })
      )}
    </>
  );

  const renderMobileMenuItems = () => (
    <>
      {menuItems.length === 0 ? (
        <span className="block px-6 py-6 text-gray-500">{t.noMenuItems}</span>
      ) : (
        menuItems
          .filter((item) => item.is_displayed && item.display_name !== 'Profile')
          .map((item) => {
            const displayedSubItems = (item.website_submenuitem || []).filter(
              (subItem) => subItem.is_displayed !== false
            );
            console.log(
              `Mobile rendering ${item.display_name}, displayedSubItems:`,
              JSON.stringify(displayedSubItems, null, 2)
            );

            // Get translated content for menu item
            const translatedDisplayName = currentLocale 
              ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
              : item.display_name;

            return (
              <Disclosure key={item.id}>
                {({ open }) => (
                  <div>
                    {displayedSubItems.length > 0 ? (
                      <>
                        <Disclosure.Button
                          className="cursor-pointer flex items-center justify-between w-full px-6 py-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                          aria-label={t.toggleMenu(translatedDisplayName)}
                        >
                          <span className="text-base font-medium text-gray-700">{translatedDisplayName}</span>
                          {open ? (
                            <MinusIcon className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <PlusIcon className="h-5 w-5" aria-hidden="true" />
                          )}
                        </Disclosure.Button>
                        <Disclosure.Panel className="pl-8">
                          {displayedSubItems.map((subItem) => {
                            // Get translated content for submenu item
                            const translatedSubItemName = currentLocale 
                              ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                              : subItem.name;

                            return (
                              <LocalizedLink
                                key={subItem.id}
                                href={subItem.url_name}
                                onClick={() => setIsOpen(false)}
                                className="block px-6 py-6 text-gray-700 hover:bg-gray-200 border-b border-gray-200 transition-colors duration-200"
                              >
                                {translatedSubItemName}
                              </LocalizedLink>
                            );
                          })}
                        </Disclosure.Panel>
                      </>
                    ) : (
                      <LocalizedLink
                        href={item.url_name}
                        onClick={() => setIsOpen(false)}
                        className="cursor-pointer flex items-center justify-between w-full px-6 py-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                        aria-label={t.goTo(translatedDisplayName)}
                      >
                        <span className="text-base font-medium text-gray-700">{translatedDisplayName}</span>
                      </LocalizedLink>
                    )}
                  </div>
                )}
              </Disclosure>
            );
          })
      )}
    </>
  );

  if (!isMounted) {
    return null;
  }

  return (
    <nav
      className={`fixed left-0 right-0 z-40 opacity-95 transition-all duration-200 ${
        isScrolled ? 'border-gray-200 bg-white' : 'bg-transparent'
      }`}
      style={{ top: `${fixedBannersHeight}px` }}
    >
      <div
        className={`mx-auto max-w-${settings?.menu_width || '7xl'} p-4 pl-8 sm:px-6 flex justify-between items-center`}
      >
        <button
          type="button"
          onClick={() => {
            console.log('Navigating to main page');
            setIsOpen(false);
            router.push('/');
          }}
          className="cursor-pointer flex items-center text-gray-900 hover:text-sky-600 transition-all duration-200"
          aria-label={t.goToHomepage}
          disabled={!router}
        >
          {settings?.image ? (
            <img
              src={settings.image}
              alt="Logo"
              width={40}
              height={40}
              className="h-8 w-auto"
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
              {renderMenuItems()}
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
                className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                title={t.profile}
                aria-label={t.openProfileMenu}
              >
                <UserIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div className="absolute right-0 w-56 bg-white rounded-lg shadow-xl z-50 hidden group-hover:block">
                <LocalizedLink
                  href="/account"
                  className="block px-8 py-4 text-gray-700 hover:bg-sky-50 text-sm font-medium transition-colors duration-200"
                >
                  {t.account}
                </LocalizedLink>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Opening contact modal');
                    setIsOpen(false);
                    setIsContactOpen(true);
                  }}
                  className="block w-full text-left px-8 py-4 text-gray-700 hover:bg-sky-50 text-sm font-medium transition-colors duration-200"
                >
                  {t.contact}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Logging out');
                    setIsOpen(false);
                    logout();
                    router.push('/');
                  }}
                  className="block w-full text-left px-8 py-4 text-gray-700 hover:bg-sky-50 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                console.log('Opening login modal');
                setIsOpen(false);
                setIsLoginOpen(true);
              }}
              className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
              title={t.login}
              aria-label={t.openLoginModal}
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600" />
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
            onClick={() => {
              console.log('Toggling isOpen from', isOpen, 'to', !isOpen);
              setIsOpen(!isOpen);
            }}
            className="cursor-pointer text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md p-1 transition-all duration-200"
            aria-label={isOpen ? t.closeMenu : t.openMenu}
          >
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg max-h-[70vh] overflow-y-auto">
          {renderMobileMenuItems()}
          {isLoggedIn ? (
            <Disclosure>
              {({ open }) => (
                <div>
                  <Disclosure.Button
                    className="cursor-pointer flex items-center justify-between w-full px-6 py-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                    aria-label="Toggle profile menu"
                  >
                    <span className="text-base font-medium text-gray-700">Profile</span>
                    {open ? (
                      <MinusIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                  <Disclosure.Panel className="pl-8">
                    <LocalizedLink
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="block px-6 py-6 text-gray-700 hover:bg-gray-200 border-b border-gray-200 transition-colors duration-200"
                    >
                      {t.account}
                    </LocalizedLink>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsContactOpen(true);
                      }}
                      className="block w-full text-left px-6 py-6 text-gray-700 hover:bg-gray-200 border-b border-gray-200 transition-colors duration-200"
                    >
                      {t.contact}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                        router.push('/');
                      }}
                      className="block w-full text-left px-6 py-6 text-gray-700 hover:bg-sky-50 rounded-md font-medium transition-colors duration-200"
                    >
                      {t.logout}
                    </button>
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsLoginOpen(true);
              }}
              className="cursor-pointer flex items-center justify-between w-full px-6 py-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
              aria-label={t.openLoginModal}
            >
              <span className="text-base font-medium text-gray-700">{t.login}</span>
              <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </nav>
  );
};

export default Header;