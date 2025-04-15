'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TfiWorld } from 'react-icons/tfi';
import Tabs from './cookie-settings/Tabs';
import FooterButtons from './cookie-settings/FooterButtons';
import { setCookie, sendConsentToBackend } from '@/utils/cookieUtils';
import { useAuth } from '../context/AuthContext';

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
        const validData = Array.isArray(data)
          ? data.map((category) => ({
              id: category.id,
              name: category.name,
              description: category.description || '',
              services: Array.isArray(category.cookie_service) ? category.cookie_service : [],
            }))
          : [];
        setCategories(validData);

        // Set essential service IDs
        const essentialServiceIds = validData
          .filter((category) => isEssentialCategory(category.name))
          .flatMap((category) => category.services.map((service) => service.id));
        console.log('Essential service IDs:', essentialServiceIds);
        if (essentialServiceIds.length === 0) {
          console.warn('No essential services found. Check cookie_category table.');
        }
        setConsent({ services: essentialServiceIds });
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setError('Failed to load categories. Please try again.');
      }
    };

    const fetchUserConsent = async () => {
      try {
        const accessToken = session?.access_token || '';
        const headers = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
        const response = await fetch('/api/cookies/consent', {
          headers,
          credentials: 'include', // Fallback to cookies
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const consentData = await response.json();
        console.log('Fetched consent:', consentData);
        // Merge with essential services
        const essentialServiceIds = categories
          .filter((category) => isEssentialCategory(category.name))
          .flatMap((category) => category.services.map((service) => service.id));
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
        setError('Failed to load consent data. Please try again.');
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await fetchCategories();
      await fetchUserConsent();
      setLoading(false);
    };

    fetchData();
  }, []); // No session dependency to avoid re-fetching

  // Log consent for debugging
  useEffect(() => {
    console.log('Consent state:', consent);
  }, [consent]);

  const isEssentialCategory = (categoryName: string) => {
    return categoryName.toLowerCase() === 'essential';
  };

  const handleConsent = async (consentGiven: boolean) => {
    const essentialServiceIds = categories
      .filter((category) => isEssentialCategory(category.name))
      .flatMap((category) => category.services.map((service) => service.id));

    let updatedServices: number[];
    if (consentGiven) {
      updatedServices = categories.flatMap((category) =>
        category.services.map((service) => service.id)
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
      const headers = accessToken
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
      <div className="fixed inset-0 flex items-center justify-center !bg-gray-50 z-[1000]">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center !bg-gray-50 z-[1000]">
        <div className="flex justify-center items-center h-full text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center !bg-gray-transparent z-[1000]">
      <div
        ref={modalRef}
        className="p-4 shadow sm:p-4 bg-white w-full max-w-xl h-full sm:h-[90vh] max-h-screen flex flex-col border border-gray-200 rounded-md sm:rounded-md"
        style={{
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Draggable Header */}
        <div
          className="flex justify-between items-center px-6 py-2 cursor-grab"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center">
            {headerData?.image_for_privacy_settings ? (
              <img
                src={headerData.image_for_privacy_settings}
                alt="Company logo"
                className="h-8"
              />
            ) : (
              <img
                className="h-8"
                src="/images/logo.svg"
                alt="Company"
              />
            )}
            <h2 className="ml-4 text-xl font-bold text-gray-400">{headerData?.site}</h2>
          </div>
          <button
            onClick={closeSettings}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-2xl font-semibold p-1 rounded-md transition-colors duration-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-2">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-widest">Privacy Settings</h2>
          <div className="flex space-x-4 mb-3">
            <a
              href="/privacy-policy"
              className="font-medium text-teal-600 hover:text-teal-700 text-sm tracking-wide transition-colors duration-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Privacy Policy
            </a>
            <a
              href="/cookie-policy"
              className="font-medium text-teal-600 hover:text-teal-700 text-sm tracking-wide transition-colors duration-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Cookie Policy
            </a>
          </div>
          <p className="text-gray-500 text-sm tracking-wider">
            This tool helps you manage consent to third-party technologies collecting and processing personal data on our website.
          </p>
        </div>

        <div className="flex-grow min-h-0 overflow-y-auto px-6 py-2">
          <Tabs
            categories={categories}
            consent={consent}
            setConsent={setConsent}
          />
        </div>

        <div className="px-6 py-2">
          <FooterButtons
            saveConsentSettings={saveConsentSettings}
            handleConsent={handleConsent}
          />
        </div>
        <div className="flex justify-between px-6 py-1">
          <TfiWorld className="text-gray-500 h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default CookieSettings;