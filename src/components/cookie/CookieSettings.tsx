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
import CloseIcon from '@/ui/CloseIcon';

interface CookieSettingsProps {
  activeLanguages: string[];
  headerData: {
    image_for_privacy_settings?: string;
    site?: string;
  };
  closeSettings: () => void;
  categories?: Category[];
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
  categories: initialCategories = [],
}) => {
  const { session } = useAuth();
  const translations = useCookieTranslations();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [consent, setConsent] = useState<Consent>({ services: [] });
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [error, setError] = useState<string | null>(null);

  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Session:', session); // Debug session
    
    const fetchCategories = async () => {
      // Skip fetch if categories provided from props
      if (initialCategories.length > 0) {
        console.log('Using categories from props:', initialCategories);
        setCategories(initialCategories);
        
        // Set essential service IDs from props
        const essentialServiceIds = initialCategories
          .filter((category) => isEssentialCategory(category.name))
          .flatMap((category) => category.cookie_service.map((service) => service.id));
        console.log('Essential service IDs from props:', essentialServiceIds);
        setConsent({ services: essentialServiceIds });
        
        return essentialServiceIds;
      }
      
      // Fallback: fetch if not provided
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
        const organizationId = process.env.NEXT_PUBLIC_TENANT_ID;
        
        const headers: Record<string, string> = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
          
        const url = organizationId 
          ? `/api/cookies/consent?organization_id=${organizationId}`
          : '/api/cookies/consent';
          
        const response = await fetch(url, {
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
      // Only set loading if we need to fetch
      if (initialCategories.length === 0) {
        setLoading(true);
      }
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
  }, [initialCategories]); // Add initialCategories as dependency

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
      const organizationId = process.env.NEXT_PUBLIC_TENANT_ID;
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }

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
          organization_id: organizationId,
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
      <div className="fixed inset-0 flex items-center justify-center bg-black/25 backdrop-blur-sm z-[1000]">
        <div className="flex flex-col justify-center items-center h-full">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-gray-200/60"></div>
            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-t-gray-700 absolute inset-0"></div>
          </div>
          <p className="mt-8 text-gray-800 font-medium text-[15px] antialiased">{translations.loading}</p>
          <p className="mt-2 text-[13px] text-gray-600 antialiased opacity-90">{translations.managePreferences}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/25 backdrop-blur-sm z-[1000]">
        <div className="bg-white/90 backdrop-blur-3xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/8 p-9 max-w-md mx-auto m-6"
          style={{
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-50/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-[18px] font-semibold text-gray-900 mb-4 tracking-[-0.01em] antialiased">{translations.errorLoading}</h3>
            <p className="text-red-600 mb-7 text-[14px] leading-relaxed antialiased opacity-90">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={closeSettings} className="group flex items-center justify-center px-6 py-3 text-[14px] font-medium text-gray-700 bg-gray-50/80 hover:bg-gray-100/90 active:bg-gray-150/90 backdrop-blur-sm rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-300/40 focus:ring-offset-2 focus:ring-offset-transparent">
                <span className="transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] antialiased">
                  {translations.close}
                </span>
              </button>
              <button onClick={() => window.location.reload()} className="group relative overflow-hidden flex items-center justify-center px-6 py-3 text-[14px] font-semibold text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-600/25 focus:ring-offset-2 focus:ring-offset-transparent shadow-[0_4px_16px_rgba(75,85,99,0.24)] hover:shadow-[0_6px_20px_rgba(75,85,99,0.32)]">
                <span className="relative z-20 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.95] antialiased">
                  {translations.rejectAll}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/25 backdrop-blur-sm z-[1000]">
      <div
        ref={modalRef}
        className="bg-white/90 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/8 w-full max-w-2xl h-full sm:h-[85vh] max-h-screen flex flex-col rounded-none sm:rounded-[28px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
          backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Draggable Header - Apple refined */}
        <div
          className="flex justify-between items-center px-7 py-5 border-b border-black/6 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
          
          <div className="flex items-center space-x-4">
            {headerData?.image_for_privacy_settings ? (
              <img
                src={headerData.image_for_privacy_settings}
                alt="Company logo"
                className="h-8 w-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
              />
            ) : (
              !headerData?.site && (
                <img
                  className="h-8 w-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
                  src="/images/logo.svg"
                  alt="Company"
                />
              )
            )}
            {!headerData?.image_for_privacy_settings && headerData?.site && (
              <h2 className="text-[16px] font-semibold text-gray-800 tracking-[-0.01em] antialiased">{headerData.site}</h2>
            )}
          </div>
          <button 
            onClick={closeSettings} 
            className="group flex items-center justify-center p-2.5 rounded-full hover:bg-black/5 active:bg-black/10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-black/8 focus:ring-offset-2 focus:ring-offset-transparent"
          > 
            <div className="w-4 h-4 flex items-center justify-center text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
              <CloseIcon/>
            </div>
          </button>
        </div>

        <div className="text-center px-7 py-8 bg-gradient-to-b from-white/40 to-transparent">
          <h2 className="mb-2 text-[22px] font-semibold text-gray-900 tracking-[-0.02em]  antialiased leading-tight">{translations.privacySettings}</h2>
                    <p className="mb-2 text-gray-600 text-[13px] leading-relaxed max-w-md mx-auto antialiased opacity-90">
            {translations.managePreferences}
          </p>
          <div className="flex justify-center space-x-8">
            <Link
              href="/privacy-policy"
              className="relative text-[14px] font-medium text-gray-600 hover:text-gray-800 tracking-normal transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-2 focus:outline-none after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gray-700 after:transition-all after:duration-300 hover:after:w-full antialiased"
            >
              {translations.privacyPolicy}
            </Link>
            <Link
              href="/cookie-policy"
              className="relative text-[14px] font-medium text-gray-600 hover:text-gray-800 tracking-normal transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-2 focus:outline-none after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gray-700 after:transition-all after:duration-300 hover:after:w-full antialiased"
            >
              {translations.cookiePolicy}
            </Link>
          </div>

        </div>

        <div className="flex-grow min-h-0 overflow-y-auto px-7 py-1 scrollbar-thin scrollbar-thumb-gray-400/40 scrollbar-track-transparent hover:scrollbar-thumb-gray-500/50">
          <Tabs
            categories={categories}
            consent={consent}
            setConsent={setConsent}
          />
        </div>

        <div className="px-7 py-6 bg-gradient-to-t from-white/60 to-transparent border-t border-black/6">
          <FooterButtons
            saveConsentSettings={saveConsentSettings}
            handleConsent={handleConsent}
          />
        </div>
        
        <div className="flex justify-center px-7 py-4 bg-white/30">
          <div className="flex items-center space-x-2.5 text-gray-500">
            <TfiWorld className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium tracking-wide uppercase opacity-80 antialiased">{translations.privacySettings}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieSettings;