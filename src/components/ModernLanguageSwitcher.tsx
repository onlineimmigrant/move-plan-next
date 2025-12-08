'use client';

import { Fragment, useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { LANGUAGE_LOCALE_MAP, getSupportedLocales, type Locale } from '@/lib/language-utils';
import { useSettings } from '@/context/SettingsContext';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

interface ModernLanguageSwitcherProps {
  zIndex?: number;
  onLanguageChange?: (locale: Locale) => void;
  preventNavigation?: boolean;
  openUpward?: boolean;
  variant?: 'light' | 'dark' | 'footer';
  fullWidthMobile?: boolean;
  // Header style props for matching menu items
  menuColor?: string;
  menuHoverColor?: string;
  menuFontSize?: string;
  menuFontWeight?: string;
}

export default function ModernLanguageSwitcher({ 
  zIndex = 20, 
  onLanguageChange,
  preventNavigation = false,
  openUpward = false,
  variant = 'light',
  fullWidthMobile = false,
  menuColor,
  menuHoverColor,
  menuFontSize,
  menuFontWeight
}: ModernLanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // State for hover-based dropdown
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownBottom, setDropdownBottom] = useState<number | null>(null);
  
  // Get default language from settings, fallback to 'en'
  const defaultLanguage = (settings?.language || 'en') as Locale;
  
  // Get supported locales from settings
  const supportedLocales = getSupportedLocales(settings as any);
  
  // Extract current locale from pathname
  const pathSegments = pathname.split('/');
  const urlLocale = supportedLocales.includes(pathSegments[1]) 
    ? pathSegments[1] as Locale
    : null;
  
  // Current locale: if URL has locale, use that; otherwise it's the database default (no prefix)
  const currentLocale = urlLocale || defaultLanguage;
  
  // Map menu font size to Tailwind classes (matching Header.tsx)
  const menuFontSizeClass = menuFontSize ? {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl'
  }[menuFontSize] || 'text-sm' : 'text-sm';
  
  // Map menu font weight to Tailwind classes (matching Header.tsx)
  const menuFontWeightClass = menuFontWeight ? {
    'thin': 'font-thin',
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold'
  }[menuFontWeight] || 'font-normal' : 'font-normal';
  
  // Get actual color values
  const textColor = menuColor ? getColorValue(menuColor) : undefined;
  const hoverTextColor = menuHoverColor ? getColorValue(menuHoverColor) : undefined;

  // Hover handlers for dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
    if (fullWidthMobile) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const gap = 8;
          setDropdownBottom(window.innerHeight - rect.top + gap);
        }
      });
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredItem(null);
    }, 150); // Small delay to allow moving to dropdown
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !fullWidthMobile) return;
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const gap = 8;
      setDropdownBottom(window.innerHeight - rect.top + gap);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true } as any);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update as any);
    };
  }, [isOpen, fullWidthMobile]);

  const handleLanguageChange = (newLocale: Locale) => {
    if (preventNavigation && onLanguageChange) {
      // Use callback instead of navigation when in widget context
      onLanguageChange(newLocale);
      return;
    }
    
    // Calculate the path without locale
    const segments = pathname.split('/');
    const pathWithoutLocale = urlLocale ? segments.slice(2).join('/') : segments.slice(1).join('/');
    
    // Handle the database default locale differently - no prefix
    let newPath: string;
    if (newLocale === defaultLanguage) {
      // Default language doesn't use a prefix, go to root or path without locale prefix
      newPath = pathWithoutLocale ? `/${pathWithoutLocale}` : '/';
    } else {
      // Other languages use locale prefix
      newPath = pathWithoutLocale ? `/${newLocale}/${pathWithoutLocale}` : `/${newLocale}`;
    }
    // Prevent scroll jump
    router.push(newPath, { scroll: false });
  };

  const getLanguageName = (locale: Locale) => {
    const languageNames: Record<Locale, string> = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ru': 'Русский',
      'it': 'Italiano',
      'pt': 'Português',
      'zh': '中文',
      'ja': '日本語',
      'pl': 'Polski'
    };
    return languageNames[locale] || locale.toUpperCase();
  };

  return (
    <div 
      ref={containerRef}
      className="relative inline-block text-left" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      suppressHydrationWarning
    >
      <div suppressHydrationWarning>
        <button
          type="button"
          className={`group relative inline-flex w-full justify-center items-center gap-x-2 rounded-lg px-3 py-2 ${menuFontSizeClass} ${menuFontWeightClass} focus:outline-none transition-colors duration-150 ${
            variant === 'dark' 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white' 
              : variant === 'footer'
              ? 'bg-transparent text-neutral-500 hover:text-neutral-400'
              : ''
          }`}
          style={variant !== 'dark' && variant !== 'footer' ? {
            color: isOpen ? (hoverTextColor || textColor || '') : (textColor || '')
          } : undefined}
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={(e) => {
            if (variant !== 'dark' && variant !== 'footer' && hoverTextColor) {
              e.currentTarget.style.color = hoverTextColor;
            }
          }}
          onMouseLeave={(e) => {
            if (variant !== 'dark' && variant !== 'footer') {
              e.currentTarget.style.color = isOpen ? (hoverTextColor || textColor || '') : (textColor || '');
            }
          }}
          suppressHydrationWarning
        >
          <span>{currentLocale.toUpperCase()}</span>
          <ChevronDownIcon 
            className={`h-4 w-4 transition-all duration-150 opacity-0 group-hover:opacity-100 ${isOpen ? 'rotate-180 opacity-100' : ''} ${
              variant === 'dark' 
                ? 'text-gray-400 group-hover:text-gray-200' 
                : variant === 'footer'
                ? 'text-neutral-500 group-hover:text-neutral-400'
                : ''
            }`}
            style={variant !== 'dark' && variant !== 'footer' ? {
              color: isOpen ? (hoverTextColor || textColor || '') : (textColor || '')
            } : undefined}
            onMouseEnter={(e) => {
              if (variant !== 'dark' && variant !== 'footer' && hoverTextColor) {
                e.currentTarget.style.color = hoverTextColor;
              }
            }}
            onMouseLeave={(e) => {
              if (variant !== 'dark' && variant !== 'footer') {
                e.currentTarget.style.color = isOpen ? (hoverTextColor || textColor || '') : (textColor || '');
              }
            }}
            aria-hidden="true" 
          />
        </button>
      </div>

      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div 
          className={`${fullWidthMobile ? 'fixed inset-x-0 md:absolute md:right-0 md:inset-x-auto' : 'absolute right-0'} ${fullWidthMobile ? '' : (openUpward ? 'bottom-full mb-2' : 'mt-2')} ${fullWidthMobile ? 'md:w-56' : 'w-56'} ${openUpward ? 'origin-bottom-right' : 'origin-top-right'} ${fullWidthMobile ? 'rounded-none shadow-none' : 'rounded-lg shadow-xl'} bg-white border border-gray-200 focus:outline-none`}
          style={{ 
            zIndex: zIndex + 10,
            boxShadow: fullWidthMobile ? 'none' : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            ...(fullWidthMobile ? { bottom: dropdownBottom ?? 0 } : {})
          }}
        >
          <div className="py-2 px-1">
            {supportedLocales.map((locale: string) => {
              const isActive = hoveredItem === locale;
              return (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  onMouseEnter={() => setHoveredItem(locale)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center w-full ${fullWidthMobile ? 'pl-6 pr-3 py-3 text-base font-semibold rounded-none' : 'px-3 py-2.5'} ${fullWidthMobile ? '' : `${menuFontSizeClass} ${menuFontWeightClass} rounded-md`} transition-all duration-150 ${
                    locale === currentLocale ? 'font-semibold' : ''
                  }`}
                  style={{
                    color: isActive ? (hoverTextColor || '#111827') : (textColor || '#374151'),
                    backgroundColor: isActive ? 'rgba(243, 244, 246, 0.8)' : (locale === currentLocale ? 'rgba(249, 250, 251, 0.5)' : 'transparent')
                  }}
                >
                  <span className="mr-3 text-xs font-medium opacity-60 w-8 text-center">
                    {locale.toUpperCase()}
                  </span>
                  <span className="flex-1 text-left">
                    {getLanguageName(locale)}
                  </span>
                  {locale === currentLocale && (
                    <span className="ml-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: textColor || '#374151' }}></div>
                    </span>
                  )}
                  {locale === defaultLanguage && (
                    <span className="ml-2 text-xs opacity-50">(Default)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Transition>
    </div>
  );
}
