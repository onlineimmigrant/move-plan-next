'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { setCookie, getCookie, sendConsentToBackend } from '@/utils/cookieUtils';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { useAuth } from '@/context/AuthContext'; 
import { useCookieTranslations } from './useCookieTranslations';
import Link from 'next/link';
import Button from '@/ui/Button';

// Dynamic import for CookieSettings - only loads when settings button clicked
const CookieSettings = dynamic(() => import('./CookieSettings'), {
  ssr: false,
  loading: () => null,
});


interface CookieBannerProps {
  headerData: {
    text_color?: string;
    text_color_hover?: string;
    image_for_privacy_settings?: string;
  };
  activeLanguages: string[];
  categories?: any[]; // Use any[] to accept server-side data format
}

interface Category {
  id: number;
  name: string;
  description: string;
  services: { id: number; name: string; description: string }[];
}

const CookieBanner: React.FC<CookieBannerProps> = ({ headerData, activeLanguages, categories: initialCategories = [] }) => {
  const { session } = useAuth(); // Get session
  const translations = useCookieTranslations();
  const [isVisible, setIsVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const { showSettings, setShowSettings } = useCookieSettings();

  useEffect(() => {
    const accepted = getCookie('cookies_accepted');
    setIsVisible(accepted !== 'true');

    // Only fetch categories if not provided from props
    if (initialCategories.length === 0) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/cookies/categories');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const validData = Array.isArray(data)
            ? data.map((category) => ({
                id: category.id,
                name: category.name,
                description: category.description_en || '',
                services: Array.isArray(category.cookie_service) ? category.cookie_service : [],
              }))
            : [];
          setCategories(validData);
        } catch (error) {
          console.error('Error fetching categories:', error);
          setCategories([]);
        }
      };
      fetchCategories();
    } else {
      // Use categories from props and map cookie_service to services
      const mappedCategories = initialCategories.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        services: Array.isArray(category.cookie_service) ? category.cookie_service : [],
      }));
      setCategories(mappedCategories);
    }
  }, [initialCategories]);

  const handleAcceptAll = async () => {
    setIsVisible(false);
    setCookie('cookies_accepted', 'true', 365);

    const allServiceIds = categories.flatMap((category) =>
      Array.isArray(category.services) ? category.services.map((service) => service.id) : []
    );
    try {
      await sendConsentToBackend(true, allServiceIds, session?.access_token);
    } catch (error) {
      console.error('Error sending accept all consent:', error);
    }
  };

  const handleRejectAll = async () => {
    setIsVisible(false);
    setCookie('cookies_accepted', 'false', 365);

    const essentialServiceIds = categories
      .filter((category) => category.name.toLowerCase() === 'essential')
      .flatMap((category) =>
        Array.isArray(category.services) ? category.services.map((service) => service.id) : []
      );

    try {
      await sendConsentToBackend(false, essentialServiceIds, session?.access_token);
    } catch (error) {
      console.error('Error sending reject all consent:', error);
    }
  };

  return (
    <>
      {isVisible && (
        <div className="fixed inset-x-0 bottom-0 z-75 p-4 sm:p-6">
          <div className="mx-auto max-w-3xl">
            {/* Optimized glassmorphism design - using will-change and transform for better performance */}
            <div 
              className="relative overflow-hidden rounded-[28px] bg-white/90 backdrop-blur-3xl border border-black/8 shadow-[0_20px_60px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out hover:shadow-[0_24px_72px_rgba(0,0,0,0.12),0_12px_24px_rgba(0,0,0,0.06)]"
              style={{
                backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                willChange: 'transform, opacity',
              }}
            >
              {/* Optimized gradient overlays - using single layer with better performance */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent pointer-events-none" />
              
              {/* Optimized shine effect - using transform3d for GPU acceleration */}
              <div 
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ willChange: 'opacity' }}
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine"
                  style={{ 
                    transform: 'translateZ(0)',
                    animation: 'shine 3s ease-in-out infinite',
                  }}
                />
              </div>

              <div className="relative px-6 py-5 sm:px-8 sm:py-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Content Section - Enhanced Typography */}
                  <div className="flex-1 max-w-md">
                    <h2 className="text-base font-semibold text-gray-900 tracking-tight leading-tight mb-2 antialiased">
                      Privacy & Cookies
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-600/90 antialiased">
                      {translations.cookieNotice}
                    </p>
                  </div>

                  {/* Actions Section - Premium Button Styles */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-shrink-0">
                    {/* Settings Button */}
                    <button
                      onClick={() => setShowSettings(true)}
                      className="relative px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 group overflow-hidden"
                      style={{ willChange: 'transform' }}
                    >
                      <span className="relative z-10">{translations.settings}</span>
                      <div className="absolute inset-0 bg-gray-100/0 group-hover:bg-gray-100/80 transition-all duration-300 rounded-full" />
                    </button>
                    
                    {/* Reject Button */}
                    <button
                      onClick={handleRejectAll}
                      className="relative px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/60 hover:bg-gray-200/80 backdrop-blur-sm rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 overflow-hidden group"
                      style={{ willChange: 'transform' }}
                    >
                      <span className="relative z-10">{translations.rejectAll}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                    
                    {/* Accept Button - Premium Style */}
                    <button
                      onClick={handleAcceptAll}
                      className="relative px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] overflow-hidden group"
                      style={{ willChange: 'transform' }}
                    >
                      <span className="relative z-10">{translations.acceptAll}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <CookieSettings
          closeSettings={() => setShowSettings(false)}
          headerData={headerData}
          activeLanguages={activeLanguages}
          categories={initialCategories}
        />
      )}
    </>
  );
};

export default CookieBanner;