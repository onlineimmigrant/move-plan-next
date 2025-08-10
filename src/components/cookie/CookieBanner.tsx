'use client';

import React, { useState, useEffect } from 'react';
import CookieSettings from './CookieSettings';
import { setCookie, getCookie, sendConsentToBackend } from '@/utils/cookieUtils';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { useAuth } from '@/context/AuthContext'; 
import { useCookieTranslations } from './useCookieTranslations';
import Link from 'next/link';
import Button from '@/ui/Button';


interface CookieBannerProps {
  headerData: {
    text_color?: string;
    text_color_hover?: string;
    image_for_privacy_settings?: string;
  };
  activeLanguages: string[];
}

interface Category {
  id: number;
  name: string;
  description: string;
  services: { id: number; name: string; description: string }[];
}

const CookieBanner: React.FC<CookieBannerProps> = ({ headerData, activeLanguages }) => {
  const { session } = useAuth(); // Get session
  const translations = useCookieTranslations();
  const [isVisible, setIsVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { showSettings, setShowSettings } = useCookieSettings();

  useEffect(() => {
    const accepted = getCookie('cookies_accepted');
    setIsVisible(accepted !== 'true');

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
  }, []);

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
            <div 
              className="relative overflow-hidden rounded-[28px] bg-white/90 backdrop-blur-3xl border border-black/8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in slide-in-from-bottom-6 fade-in-0"
              style={{ 
                backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)'
              }}
            >
              {/* Subtle top highlight with gradient */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              
              {/* Inner glow for depth */}
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative px-7 py-6 sm:px-9 sm:py-8">
                <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                  {/* Content Section - Enhanced Apple typography */}
                  <div className="flex-1 max-w-md">
                    <h2 className="text-[17px] font-semibold text-gray-900 leading-tight mb-3 tracking-[-0.01em] antialiased">
                      Privacy & Cookies
                    </h2>
                    <p className="text-[14px] leading-[1.45] text-gray-600 font-normal antialiased opacity-90">
                      {translations.cookieNotice}
                    </p>
                  </div>

                  {/* Actions Section - Refined Apple button system */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-2.5 sm:flex-shrink-0">
                    {/* Subtle tertiary action */}
                    <button
                      onClick={() => setShowSettings(true)}
                      className="group relative flex items-center justify-center px-5 py-3 text-[14px] font-medium text-gray-700 bg-transparent hover:bg-black/4 active:bg-black/8 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-black/8 focus:ring-offset-2 focus:ring-offset-transparent"
                    >
                      <span className="relative z-10 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] antialiased">
                        {translations.settings}
                      </span>
                      {/* Subtle ripple effect */}
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/3 transition-colors duration-300"></div>
                    </button>
                    
                    {/* Refined secondary action */}
                    <button
                      onClick={handleRejectAll}
                      className="group relative flex items-center justify-center px-6 py-3 text-[14px] font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/90 active:bg-gray-150/90 backdrop-blur-sm rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-300/40 focus:ring-offset-2 focus:ring-offset-transparent shadow-sm hover:shadow-md"
                    >
                      <span className="relative z-10 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] antialiased">
                        {translations.rejectAll}
                      </span>
                    </button>
                    
                    {/* Premium Apple primary button - Elegant gray */}
                    <button
                      onClick={handleAcceptAll}
                      className="group relative overflow-hidden flex items-center justify-center px-7 py-3 text-[14px] font-semibold text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-600/25 focus:ring-offset-2 focus:ring-offset-transparent shadow-[0_4px_16px_rgba(75,85,99,0.24)] hover:shadow-[0_6px_20px_rgba(75,85,99,0.32)]"
                    >
                      <span className="relative z-20 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.95] antialiased">
                        {translations.acceptAll}
                      </span>
                      {/* Enhanced shine animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                      {/* Subtle inner highlight */}
                      <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Refined bottom accent */}
              <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-black/4 to-transparent"></div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <CookieSettings
          closeSettings={() => setShowSettings(false)}
          headerData={headerData}
          activeLanguages={activeLanguages}
        />
      )}
    </>
  );
};

export default CookieBanner;