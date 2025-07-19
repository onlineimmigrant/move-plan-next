'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TfiWorld } from 'react-icons/tfi';
import Tabs from './Tabs';
import FooterButtons from './FooterButtons';
import { setCookie, sendConsentToBackend } from '@/utils/cookieUtils';
import { useAuth } from '../../context/AuthContext';
import { useCookieTranslations } from './useCookieTranslations';
import Link from 'next/link';
import Button from '@/ui/Button';
import CloseButton from '@/ui/CloseButton';

interface CookieSettingsProps {
  activeLanguages: string[];
  headerData: {
    image_for_privacy_settings?: string;
    site?: string;
  };
  closeSettings: () => void;
}

interface Category {
  id: number;
  name: string;
  description: string;
  cookie_service: { id: number; name: string; description: string; active: boolean }[];
}

interface Consent {
  services: number[];
}

const CookieSettings: React.FC<CookieSettingsProps> = ({
  headerData,
  closeSettings,
}) => {
  const { session } = useAuth();
  const translations = useCookieTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [consent, setConsent] = useState<Consent>({ services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Session:', session); // Debug session
    
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/cookies/categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched categories:', data);
        const validData: Category[] = Array.isArray(data)
          ? data.map((category) => ({
              id: category.id,
              name: category.name,
              description: category.description || '',
              cookie_service: Array.isArray(category.cookie_service)
                ? category.cookie_service.map((service: any) => ({
                    id: service.id,
                    name: service.name || '',
                    description: service.description || '',
                    active: service.active ?? false,
                  }))
                : [],
            }))
          : [];
        setCategories(validData);

        // Set essential service IDs
        const essentialServiceIds = validData
          .filter((category) => isEssentialCategory(category.name))
          .flatMap((category) => category.cookie_service.map((service) => service.id));
        console.log('Essential service IDs:', essentialServiceIds);
        if (essentialServiceIds.length === 0) {
          console.warn('No essential services found. Check cookie_category table.');
        }
        setConsent({ services: essentialServiceIds });
        
        return essentialServiceIds; // Return for use in fetchUserConsent
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setError('Failed to load categories. Please try again.');
        return [];
      }
    };

    const fetchUserConsent = async (essentialServiceIds: number[]) => {
      try {
        const accessToken = session?.access_token;
        const headers: Record<string, string> = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
        const response = await fetch('/api/cookies/consent', {
          headers,
          credentials: 'include', // Fallback to cookies
        });
        if (!response.ok) {
          console.warn('Failed to fetch user consent, using essential services only');
          return; // Just use essential services
        }
        const consentData = await response.json();
        console.log('Fetched consent:', consentData);
        // Merge with essential services
        const mergedServices = [
          ...new Set([
            ...(Array.isArray(consentData.services) ? consentData.services : []),
            ...essentialServiceIds,
          ]),
        ];
        setConsent({ services: mergedServices });
        console.log('Merged consent:', mergedServices);
      } catch (error) {
        console.error('Error fetching consent:', error);
        // Don't set error for consent - just use essential services
        console.log('Using essential services only due to consent fetch error');
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const essentialServiceIds = await fetchCategories();
        await fetchUserConsent(essentialServiceIds);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // No session dependency to avoid re-fetching

  // Log consent for debugging
  useEffect(() => {
    console.log('Consent state:', consent);
  }, [consent]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing stop');
        setLoading(false);
        if (categories.length === 0) {
          setError('Loading timed out. Please try refreshing the page.');
        }
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading, categories.length]);

  const isEssentialCategory = (categoryName: string) => {
    return categoryName.toLowerCase() === 'essential';
  };

  const handleConsent = async (consentGiven: boolean) => {
    const essentialServiceIds = categories
      .filter((category) => isEssentialCategory(category.name))
      .flatMap((category) => category.cookie_service.map((service) => service.id));

    let updatedServices: number[];
    if (consentGiven) {
      updatedServices = categories.flatMap((category) =>
        category.cookie_service.map((service) => service.id)
      );
    } else {
      updatedServices = essentialServiceIds;
    }

    const finalServices = [...new Set(updatedServices)];
    setConsent({ services: finalServices });
    setCookie('cookies_accepted', consentGiven.toString(), 365);

    try {
      const accessToken = session?.access_token || '';
      await sendConsentToBackend(consentGiven, finalServices, accessToken);
      closeSettings();
    } catch (error) {
      console.error('Error saving consent:', error);
      setError('Failed to save consent. Please try again.');
    }
  };

  const saveConsentSettings = async () => {
    try {
      const accessToken = session?.access_token || '';
      const headers: Record<string, string> = accessToken
        ? {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          }
        : { 'Content-Type': 'application/json' };
      const response = await fetch('/api/cookies/consent', {
        method: 'POST',
        headers,
        credentials: 'include', // Fallback to cookies
        body: JSON.stringify({
          consent_given: true,
          services: consent.services,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('Consent saved successfully');
      closeSettings();
    } catch (error) {
      console.error('Error saving consent settings:', error);
      setError('Failed to save settings. Please try again.');
    }
  };

  // Dragging event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = modalRef.current?.offsetWidth || 0;
    const modalHeight = modalRef.current?.offsetHeight || 0;

    const constrainedX = Math.max(
      -(viewportWidth - modalWidth) / 2,
      Math.min(newX, (viewportWidth - modalWidth) / 2)
    );
    const constrainedY = Math.max(
      -(viewportHeight - modalHeight) / 2,
      Math.min(newY, (viewportHeight - modalHeight) / 2)
    );

    setPosition({
      x: constrainedX,
      y: constrainedY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = modalRef.current?.offsetWidth || 0;
    const modalHeight = modalRef.current?.offsetHeight || 0;

    const constrainedX = Math.max(
      -(viewportWidth - modalWidth) / 2,
      Math.min(newX, (viewportWidth - modalWidth) / 2)
    );
    const constrainedY = Math.max(
      -(viewportHeight - modalHeight) / 2,
      Math.min(newY, (viewportHeight - modalHeight) / 2)
    );

    setPosition({
      x: constrainedX,
      y: constrainedY,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-[1000]">
        <div className="flex flex-col justify-center items-center h-full">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-sky-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-t-sky-500 absolute inset-0"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">{translations.loading}</p>
          <p className="mt-2 text-sm text-gray-500">{translations.managePreferences}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-[1000]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 backdrop-blur-sm p-8 max-w-md mx-auto m-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{translations.errorLoading}</h3>
            <p className="text-red-600 mb-6 text-sm leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={closeSettings} variant="close" className="px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-200">
                {translations.close}
              </Button>
              <Button onClick={() => window.location.reload()} variant="start" className="px-6 py-2.5 text-sm font-medium rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-200">
                {translations.rejectAll}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[1000]">
      <div
        ref={modalRef}
        className="bg-white/95 backdrop-blur-md shadow-2xl border border-white/20 w-full max-w-xl h-full sm:h-[90vh] max-h-screen flex flex-col rounded-none sm:rounded-2xl overflow-hidden transition-transform duration-300 ease-out"
        style={{
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Draggable Header */}
        <div
          className="flex justify-between items-center px-6 py-4 border-b border-gray-100/50 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center space-x-3">
            {headerData?.image_for_privacy_settings ? (
              <img
                src={headerData.image_for_privacy_settings}
                alt="Company logo"
                className="h-9 w-auto transition-transform duration-200 hover:scale-105"
              />
            ) : (
              !headerData?.site && (
                <img
                  className="h-9 w-auto transition-transform duration-200 hover:scale-105"
                  src="/images/logo.svg"
                  alt="Company"
                />
              )
            )}
            {!headerData?.image_for_privacy_settings && headerData?.site && (
              <h2 className="text-lg font-semibold text-gray-700 tracking-wide">{headerData.site}</h2>
            )}
          </div>
          <Button onClick={closeSettings} variant='close' className="p-2 rounded-full hover:bg-gray-100/80 transition-colors duration-200"> 
            <CloseButton/>
          </Button>
        </div>

        <div className="text-center px-6 py-6 bg-gradient-to-b from-white/60 to-transparent">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-4">{translations.privacySettings}</h2>
          <div className="flex justify-center space-x-6 mb-4">
            <Link
              href="/privacy-policy"
              className="relative font-medium text-sky-600 hover:text-sky-700 text-sm tracking-wide transition-all duration-300 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-sky-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {translations.privacyPolicy}
            </Link>
            <Link
              href="/cookie-policy"
              className="relative font-medium text-sky-600 hover:text-sky-700 text-sm tracking-wide transition-all duration-300 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-sky-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {translations.cookiePolicy}
            </Link>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto">
            {translations.managePreferences}
          </p>
        </div>

        <div className="flex-grow min-h-0 overflow-y-auto px-6 py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <Tabs
            categories={categories}
            consent={consent}
            setConsent={setConsent}
          />
        </div>

        <div className="px-6 py-4 bg-gradient-to-t from-white/80 to-transparent border-t border-gray-100/50">
          <FooterButtons
            saveConsentSettings={saveConsentSettings}
            handleConsent={handleConsent}
          />
        </div>
        
        <div className="flex justify-center px-6 py-3 bg-gray-50/50">
          <div className="flex items-center space-x-2 text-gray-400">
            <TfiWorld className="h-4 w-4" />
            <span className="text-xs font-medium tracking-wider">{translations.privacySettings}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieSettings;