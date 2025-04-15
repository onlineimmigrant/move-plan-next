'use client';

import React, { useState, useEffect } from 'react';
import CookieSettings from './CookieSettings';
import { setCookie, getCookie, sendConsentToBackend } from '@/utils/cookieUtils';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { useAuth } from '@/context/AuthContext'; // Import useAuth for session

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
        <div className="fixed bottom-0 left-0 right-0 p-4 px-8 sm:px-16 z-50 flex justify-between items-center bg-white text-gray-800 opacity-90">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:flex-grow mr-5 text-center md:text-left">
              For your best experience, we use Cookies. See{' '}
              <a href="/terms" className="text-gray-800 hover:text-gray-500">
                <strong>Terms and Policies</strong>
              </a>{' '}
              and{' '}
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-800 hover:text-gray-500"
              >
                <strong>Privacy Settings</strong>
              </button>
            </div>
            <div className="flex justify-end items-center w-full sm:w-auto">
              <button
                onClick={handleRejectAll}
                className="mr-4 bg-gray-700 text-white py-1 px-5 rounded-md hover:bg-gray-300 text-sm md:w-auto w-full mt-2 md:mt-0"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="bg-gray-700 text-white py-1 px-5 rounded-md hover:bg-gray-300 text-sm md:w-auto w-full mt-2 md:mt-0"
              >
                Accept All
              </button>
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