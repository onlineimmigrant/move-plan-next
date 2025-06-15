'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation'; // Add usePathname
import { useBasket } from '../context/BasketContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import ProgressBar from './product/ProgressBar';

// Heroicons
import {
  Bars3BottomRightIcon,
  XMarkIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MinusIcon,
  MapIcon,
  ArchiveBoxIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

// Headless UI
import { Disclosure } from '@headlessui/react';

// Use the useAuth hook from your AuthContext
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { basket } = useBasket();
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path
  const { session, logout } = useAuth();

  // Set isMounted to true after the component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine the current stage based on the pathname
  const getCurrentStage = () => {
    if (pathname.startsWith('/products/') || pathname === '/basket') {
      return 1; // Stage 1: Basket
    }
    if (
      pathname.startsWith('/pricing-plans/') &&
      (pathname.includes('/combined-checkout') || pathname.split('/').length === 3)
    ) {
      return 2; // Stage 2: Review
    }
    return 0; // No stage (hide ProgressBar)
  };

  const currentStage = getCurrentStage();

  const handleToggle = () => setIsOpen(!isOpen);

  const isLoggedIn = !!session;

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

  const CONNECTED_APP_URL = 'https://app.letspring.com';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-green-50 to-transparent  border-gray-200 ">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={handleMainPage}
            className="flex items-center text-gray-900 hover:text-green-600 transition-colors duration-200"
          >
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="ml-2 tracking-tight text-xl sm:text-xl font-extrabold bg-gradient-to-r from-green-400 via-green-500 to-green-700 bg-clip-text text-transparent">
              Let Spring
            </span>
          </button>
        </div>
{/*  
        <div className="flex items-center gap-4">
          <Link href="/products">
            <span className="text-gray-700 hover:text-gray-900">Products</span>
          </Link>
          <Link href="/features">
            <span className="text-gray-700 hover:text-gray-900">Features</span>
          </Link>
        </div>*/}
              {/* ProgressBar for large devices */}
      {isMounted && totalItems > 0 && currentStage > 0 && (
        <div className="hidden md:block">
          <ProgressBar stage={currentStage} />
        </div>
      )}


        {/* Right side icons */}
        <div className="flex items-center">
          {/* Desktop icons */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            {isLoggedIn ? (
              <>
                {/* Budget Menu */}
                <div className="relative group">
                  <button
                    className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    title="Budget"
                  >
                    <MapIcon className="h-6 w-6 text-gray-600" />
                  </button>
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50 py-2">
                    <Link
                      href="/budget"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Budget Overview
                    </Link>
                    <Link
                      href="/pet-relocation"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Pet Relocation
                    </Link>
                    <Link
                      href="/legal-docs"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Legal Docs
                    </Link>
                    <Link
                      href="/insurance"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Insurance
                    </Link>
                    <Link
                      href="/settling-in"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Settling In
                    </Link>
                  </div>
                </div>

                {/* Stuff Menu */}
                <div className="relative group">
                  <button
                    className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    title="Stuff"
                  >
                    <ArchiveBoxIcon className="h-6 w-6 text-gray-600" />
                  </button>
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50 py-2">
                    <Link
                      href="/packing"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Packing
                    </Link>
                    <Link
                      href="/sale-items"
                      className="block px-4 py-2 text-gray-700 hover:bg-green-50 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Sale Items
                    </Link>
                  </div>
                </div>

                {/* Basket Icon (Desktop) */}
                {isMounted && totalItems > 0 && (
                  <Link href="/basket" className="relative">
                    <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  </Link>
                )}

                {/* Profile Menu (Links to connected app) */}
                <div className="relative group">
                  <button
                    className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    title="Profile"
                  >
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </button>
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl hidden group-hover:block z-50 py-2">
                    <a
                      href={`${CONNECTED_APP_URL}/profile`}
                      className="block w-full text-left px-4 py-2 text-gray-700 
                                 hover:bg-green-50 rounded-md text-sm font-medium 
                                 transition-colors duration-200"
                    >
                      Profile
                    </a>
                    <a
                      href={`${CONNECTED_APP_URL}/relocation-plans`}
                      className="block w-full text-left px-4 py-2 text-gray-700 
                                 hover:bg-green-50 rounded-md text-sm font-medium 
                                 transition-colors duration-200"
                    >
                      Relocation Plans
                    </a>
                    <a
                      href={`${CONNECTED_APP_URL}/moving-strategy`}
                      className="block w-full text-left px-4 py-2 text-gray-700 
                                 hover:bg-green-50 rounded-md text-sm font-medium 
                                 transition-colors duration-200"
                    >
                      Moving Strategy
                    </a>
                    <a
                      href={`${CONNECTED_APP_URL}/todo`}
                      className="block w-full text-left px-4 py-2 text-gray-700 
                                 hover:bg-green-50 rounded-md text-sm font-medium 
                                 transition-colors duration-200"
                    >
                      To-Do
                    </a>
                    <button
                      onClick={handleLogoutAction}
                      className="block w-full text-left px-4 py-2 text-gray-700 
                                 hover:bg-green-50 rounded-md text-sm font-medium 
                                 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Basket Icon (Desktop) */}
                {isMounted && totalItems > 0 && (
                  <Link href="/basket" className="relative">
                    <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  </Link>
                )}

                {/* Login */}
                <button
                  onClick={handleShowLogin}
                  className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 
                             rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 
                             transition-all duration-200"
                  title="Login"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-600" />
                </button>

                {/* Register */}
                <button
                  onClick={handleShowRegister}
                  className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 
                             rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 
                             transition-all duration-200"
                  title="Register"
                >
                  <UserPlusIcon className="h-6 w-6 text-gray-600" />
                </button>
              </>
            )}
          </div>

          {/* Mobile icons (Basket icon before toggle button) */}
          <div className="flex items-center md:hidden">
            {isMounted && totalItems > 0 && (
              <Link href="/basket" className="relative mr-4 order-1">
                <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-gray-900" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </Link>
            )}
            <button
              onClick={handleToggle}
              className="text-gray-600 hover:text-gray-800 focus:outline-none 
                         focus:ring-2 focus:ring-green-500 rounded-md p-1 transition-all duration-200 order-2"
            >
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3BottomRightIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          {isLoggedIn ? (
            <>
              {/* Budget Menu */}
              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className="flex items-center justify-between w-full px-6 py-3 
                                 hover:bg-gray-50 focus:outline-none focus:ring-2 
                                 focus:ring-green-500 transition-all duration-200"
                    >
                      <span className="text-base font-medium text-gray-700">Budget</span>
                      {open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                    </Disclosure.Button>
                    <Disclosure.Panel className="pl-8">
                      <Link
                        href="/budget"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 rounded-md 
                                   text-sm font-medium transition-colors duration-200"
                      >
                        Budget Overview
                      </Link>
                      <Link
                        href="/pet-relocation"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 
                                   rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Pet Relocation
                      </Link>
                      <Link
                        href="/legal-docs"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 
                                   rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Legal Docs
                      </Link>
                      <Link
                        href="/insurance"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 
                                   rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Insurance
                      </Link>
                      <Link
                        href="/settling-in"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 
                                   rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Settling In
                      </Link>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Stuff Menu */}
              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className="flex items-center justify-between w-full px-6 py-3 
                                 hover:bg-gray-50 focus:outline-none focus:ring-2 
                                 focus:ring-green-500 transition-all duration-200"
                    >
                      <span className="text-base font-medium text-gray-700">Stuff</span>
                      {open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                    </Disclosure.Button>
                    <Disclosure.Panel className="pl-8">
                      <Link
                        href="/packing"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 
                                   rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Packing
                      </Link>
                      <Link
                        href="/sale-items"
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-2 text-gray-700 hover:bg-green-50 
                                   rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Sale Items
                      </Link>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Profile Menu (Links to connected app) */}
              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className="flex items-center justify-between w-full px-6 py-3 
                                 hover:bg-gray-50 focus:outline-none focus:ring-2 
                                 focus:ring-green-500 transition-all duration-200"
                    >
                      <span className="text-base font-medium text-gray-700">Profile</span>
                      {open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                    </Disclosure.Button>
                    <Disclosure.Panel className="pl-8">
                      <a
                        href={`${CONNECTED_APP_URL}/profile`}
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-left px-6 py-2 text-gray-700 
                                   hover:bg-green-50 rounded-md text-sm font-medium 
                                   transition-colors duration-200"
                      >
                        Profile
                      </a>
                      <a
                        href={`${CONNECTED_APP_URL}/relocation-plans`}
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-left px-6 py-2 text-gray-700 
                                   hover:bg-green-50 rounded-md text-sm font-medium 
                                   transition-colors duration-200"
                      >
                        Relocation Plans
                      </a>
                      <a
                        href={`${CONNECTED_APP_URL}/moving-strategy`}
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-left px-6 py-2 text-gray-700 
                                   hover:bg-green-50 rounded-md text-sm font-medium 
                                   transition-colors duration-200"
                      >
                        Moving Strategy
                      </a>
                      <a
                        href={`${CONNECTED_APP_URL}/todo`}
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-left px-6 py-2 text-gray-700 
                                   hover:bg-green-50 rounded-md text-sm font-medium 
                                   transition-colors duration-200"
                      >
                        To-Do
                      </a>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleLogoutAction();
                        }}
                        className="block w-full text-left px-6 py-2 text-gray-700 
                                   hover:bg-green-50 rounded-md text-sm font-medium 
                                   transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            </>
          ) : (
            <>
              <button
                onClick={handleShowLogin}
                className="flex items-center justify-between w-full px-6 py-3 
                           hover:bg-gray-50 focus:outline-none focus:ring-2 
                           focus:ring-green-500 transition-all duration-200"
              >
                <span className="text-base font-medium text-gray-700">Login</span>
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleShowRegister}
                className="flex items-center justify-between w-full px-6 py-3 
                           hover:bg-gray-50 focus:outline-none focus:ring-2 
                           focus:ring-green-500 transition-all duration-200"
              >
                <span className="text-base font-medium text-gray-700">Register</span>
                <UserPlusIcon className="h-5 w-5 text-gray-600" />
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;