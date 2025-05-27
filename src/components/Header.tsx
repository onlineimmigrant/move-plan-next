'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBasket } from '../context/BasketContext';
import { useAuth } from '../context/AuthContext';
import { Disclosure } from '@headlessui/react';
import * as HeroIcons from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import LoginModal from './LoginModal';
import ContactModal from './ContactModal';

// Explicitly import the required icons
import {
  PlusIcon,
  MinusIcon,
  Bars3BottomRightIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  ShoppingCartIcon,
  UserIcon,
  MapIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

// Types
interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  image?: string;
  react_icon_id?: number;
  react_icons?: { icon_name: string };
  website_submenuitem?: SubMenuItem[];
}

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  description?: string;
}

interface HeaderProps {
  companyLogo?: string;
}

const Header: React.FC<HeaderProps> = ({ companyLogo = '/images/logo.svg' }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { basket } = useBasket();
  const { session, logout } = useAuth();
  const router = useRouter();
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const isLoggedIn = !!session;
  const { settings } = useSettings();

  // Fetch menu items from the API route on mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }
        const data: MenuItem[] = await response.json();
        console.log('Fetched menu items:', data);
        data.forEach((item) => {
          console.log(`Menu item: ${item.display_name}, icon_name: ${item.react_icons?.icon_name}`);
        });
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setIsMounted(true);
      }
    };

    fetchMenuItems();
  }, []);

  // Debug: Log the state
  useEffect(() => {
    console.log('isLoggedIn:', isLoggedIn);
    console.log('session:', session);
    console.log('menuItems:', menuItems);
    console.log('isOpen:', isOpen);
    console.log('isLoginOpen:', isLoginOpen);
    console.log('isContactOpen:', isContactOpen);
  }, [isLoggedIn, session, menuItems, isOpen, isLoginOpen, isContactOpen]);

  const handleToggle = () => {
    console.log('Toggling isOpen from', isOpen, 'to', !isOpen);
    setIsOpen(!isOpen);
  };

  const handleMainPage = () => {
    setIsOpen(false);
    router.push('/');
  };

  const handleLogoutAction = () => {
    setIsOpen(false);
    logout();
    router.push('/');
  };

  const handleShowLogin = () => {
    setIsOpen(false);
    setIsLoginOpen(true);
  };

  const handleShowContact = () => {
    setIsOpen(false);
    setIsContactOpen(true);
  };

  // Function to dynamically render the icon based on icon_name
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

  // Common menu items rendering for desktop
  const renderMenuItems = () => (
    <>
      {menuItems.length === 0 ? (
        <span className="text-gray-500">No menu items available</span>
      ) : (
        menuItems
          .filter((item) => item.is_displayed && item.display_name !== 'Profile')
          .map((item) => (
            <div key={item.id} className="relative group">
              <button
                type="button"
                className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                title={item.display_name}
                aria-label={`Open ${item.display_name} menu`}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.display_name}
                    width={24}
                    height={24}
                    className="h-6 w-6 text-gray-600"
                  />
                ) : (
                  renderIcon(item.react_icons?.icon_name)
                )}
              </button>
              {item.website_submenuitem && item.website_submenuitem.length > 0 && (
                <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50">
                  {item.website_submenuitem.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.url_name}
                      className="cursor-pointer block px-8 py-4 text-gray-700 hover:bg-sky-50 text-sm font-medium transition-colors duration-200"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
      )}
    </>
  );

  // Common menu items rendering for mobile
  const renderMobileMenuItems = () => (
    <>
      {menuItems.length === 0 ? (
        <span className="block px-6 py-6 text-gray-500">No menu items available</span>
      ) : (
        menuItems
          .filter((item) => item.is_displayed && item.display_name !== 'Profile')
          .map((item) => (
            <Disclosure key={item.id}>
              {({ open }) => (
                <div>
                  <Disclosure.Button
                    className="cursor-pointer flex items-center justify-between w-full px-6 py-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                    aria-label={`Toggle ${item.display_name} menu`}
                  >
                    <span className="text-base font-medium text-gray-700">{item.display_name}</span>
                    {item.website_submenuitem && item.website_submenuitem.length > 0 && (
                      open ? (
                        <MinusIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                      )
                    )}
                  </Disclosure.Button>
                  {item.website_submenuitem && item.website_submenuitem.length > 0 && (
                    <Disclosure.Panel className="pl-8">
                      {item.website_submenuitem.map((subItem) => (
                        <Link
                          key={subItem.id}
                          href={subItem.url_name}
                          onClick={() => setIsOpen(false)}
                          className="cursor-pointer block px-6 py-6 text-gray-700 hover:bg-gray-200 border-b border-gray-200 transition-colors duration-200"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </Disclosure.Panel>
                  )}
                </div>
              )}
            </Disclosure>
          ))
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-gray-200 bg-white">
      <div className="p-4 sm:px-6 flex justify-between items-center">
        {/* Logo */}
        <button
          type="button"
          onClick={handleMainPage}
          className="cursor-pointer flex items-center text-gray-900 hover:text-sky-600 transition-all duration-200"
          aria-label="Go to homepage"
        >
          <Image src={companyLogo} alt="Logo" width={40} height={40} className="h-8 w-auto" />
          <span className="sr-only ml-2 tracking-tight text-xl font-extrabold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent">
            {settings?.site || ''}
          </span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          {renderMenuItems()}
          {isMounted && totalItems > 0 && (
            <Link
              href="/basket"
              className="cursor-pointer relative"
              aria-label={`View basket with ${totalItems} items`}
            >
              <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>
          )}
          {isLoggedIn ? (
            <div className="relative group">
              <button
                type="button"
                className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
                title="Profile"
                aria-label="Open profile menu"
              >
                <UserIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50">
                <Link
                  href="/account"
                  className="cursor-pointer block px-8 py-4 text-gray-700 hover:bg-sky-50 text-sm font-medium transition-colors duration-200"
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={handleShowContact}
                  className="cursor-pointer block w-full text-left px-8 py-4 text-gray-700 hover:bg-sky-50 text-sm font-medium transition-colors duration-200"
                >
                  Contact
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAction}
                  className="cursor-pointer block w-full text-left px-8 py-4 text-gray-700 hover:bg-sky-50 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleShowLogin}
              className="cursor-pointer flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
              title="Login"
              aria-label="Open login modal"
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600" />
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden">
          {isMounted && totalItems > 0 && (
            <Link
              href="/basket"
              className="cursor-pointer relative mr-4"
              aria-label={`View basket with ${totalItems} items`}
            >
              <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className="cursor-pointer text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md p-1 transition-all duration-200"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3BottomRightIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
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
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="cursor-pointer block px-6 py-6 text-gray-700 hover:bg-gray-200 border-b border-gray-200 transition-colors duration-200"
                    >
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleShowContact();
                      }}
                      className="cursor-pointer block w-full text-left px-6 py-6 text-gray-700 hover:bg-gray-200 border-b border-gray-200 transition-colors duration-200"
                    >
                      Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogoutAction();
                      }}
                      className="cursor-pointer block w-full text-left px-6 py-6 text-gray-700 hover:bg-sky-50 rounded-md font-medium transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ) : (
            <button
              type="button"
              onClick={handleShowLogin}
              className="cursor-pointer flex items-center justify-between w-full px-6 py-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200"
              aria-label="Open login modal"
            >
              <span className="text-base font-medium text-gray-700">Login</span>
              <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </nav>
  );
};

export default Header;