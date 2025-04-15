// src/components/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useBasket } from '../context/BasketContext';
import { useAuth } from '../context/AuthContext';
import { Disclosure } from '@headlessui/react';
import * as HeroIcons from '@heroicons/react/24/outline';
import { useSettings } from "@/context/SettingsContext";

// Explicitly import the required icons
import {
  PlusIcon,
  MinusIcon,
  Bars3BottomRightIcon,
  XMarkIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  ShoppingCartIcon,
  UserIcon,
  MapIcon,
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
  const { basket } = useBasket();
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const isLoggedIn = !!session;
  const CONNECTED_APP_URL = 'https://app.letspring.com';
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
        // Log the icon names for debugging
        data.forEach(item => {
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

  // Debug: Log the state of isLoggedIn, menuItems, and isOpen
  useEffect(() => {
    console.log('isLoggedIn:', isLoggedIn);
    console.log('session:', session);
    console.log('menuItems:', menuItems);
    console.log('isOpen:', isOpen);
  }, [isLoggedIn, session, menuItems, isOpen]);

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
    router.push('/login');
  };

  const handleShowLogin = () => {
    setIsOpen(false);
    router.push('/login');
  };

  const handleShowRegister = () => {
    setIsOpen(false);
    router.push('/register');
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-green-50 to-transparent border-gray-200">
      <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <button onClick={handleMainPage} className="flex items-center text-gray-900 hover:text-green-600 transition-colors duration-200">
          <Image src={companyLogo} alt="Logo" width={40} height={40} className="h-8 w-auto" />
          <span className="ml-2 tracking-tight text-xl font-extrabold bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent">
              {settings?.site}
          </span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          {isLoggedIn ? (
            <>
              {menuItems.length === 0 ? (
                <span className="text-gray-500">No menu items available</span>
              ) : (
                menuItems
                  .filter(item => item.is_displayed && item.display_name !== 'Profile') // Exclude Profile from dynamic rendering
                  .map((item) => (
                    <div key={item.id} className="relative group">
                      <button
                        className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        title={item.display_name}
                      >
                        {item.image ? (
                          <Image src={item.image} alt={item.display_name} width={24} height={24} className="h-6 w-6 text-gray-600" />
                        ) : (
                          renderIcon(item.react_icons?.icon_name)
                        )}
                      </button>
                      {item.website_submenuitem && item.website_submenuitem.length > 0 && (
                        <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50 py-2">
                          {item.website_submenuitem.map((subItem) => (
                            <Link
                              key={subItem.id}
                              href={subItem.url_name}
                              className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
              )}

              {/* Profile Menu (with only Logout) */}
              <div className="relative group">
                <button
                  className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  title="Profile"
                >
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </button>
                <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50 py-2">
                  <button
                    onClick={handleLogoutAction}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Basket Icon */}
              {isMounted && totalItems > 0 && (
                <Link href="/basket" className="relative">
                  <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                </Link>
              )}
            </>
          ) : (
            <>
              {isMounted && totalItems > 0 && (
                <Link href="/basket" className="relative">
                  <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                </Link>
              )}
              <button onClick={handleShowLogin} className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200" title="Login">
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-600" />
              </button>
              <button onClick={handleShowRegister} className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200" title="Register">
                <UserPlusIcon className="h-6 w-6 text-gray-600" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden">
          {isMounted && totalItems > 0 && (
            <Link href="/basket" className="relative mr-4">
              <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>
          )}
          <button onClick={handleToggle} className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md p-1 transition-all duration-200">
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3BottomRightIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          {isLoggedIn ? (
            <>
              {menuItems.length === 0 ? (
                <span className="block px-6 py-3 text-gray-500">No menu items available</span>
              ) : (
                menuItems
                  .filter(item => item.is_displayed && item.display_name !== 'Profile') // Exclude Profile from dynamic rendering
                  .map((item) => (
                    <Disclosure key={item.id}>
                      {({ open }) => (
                        <div>
                          <Disclosure.Button className="flex items-center justify-between w-full px-6 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200">
                            <span className="text-base font-medium text-gray-700">{item.display_name}</span>
                            {item.website_submenuitem && item.website_submenuitem.length > 0 && (open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />)}
                          </Disclosure.Button>
                          {item.website_submenuitem && item.website_submenuitem.length > 0 && (
                            <Disclosure.Panel className="pl-8">
                              {item.website_submenuitem.map((subItem) => (
                                <Link
                                  key={subItem.id}
                                  href={subItem.url_name}
                                  onClick={() => setIsOpen(false)}
                                  className="block px-6 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
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

              {/* Profile Menu (with only Logout) */}
              <Disclosure>
                {({ open }) => (
                  <div>
                    <Disclosure.Button className="flex items-center justify-between w-full px-6 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200">
                      <span className="text-base font-medium text-gray-700">Profile</span>
                      {open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                    </Disclosure.Button>
                    <Disclosure.Panel className="pl-8">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleLogoutAction();
                        }}
                        className="block w-full text-left px-6 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            </>
          ) : (
            <div>
              <button
                onClick={handleShowLogin}
                className="flex items-center justify-between w-full px-6 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
              >
                <span className="text-base font-medium text-gray-700">Login</span>
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleShowRegister}
                className="flex items-center justify-between w-full px-6 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
              >
                <span className="text-base font-medium text-gray-700">Register</span>
                <UserPlusIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Header;