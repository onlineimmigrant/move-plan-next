'use client';

import React, { useState } from 'react';
import { Switch } from '@headlessui/react';
import { useCookieTranslations } from './useCookieTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ServiceProps {
  service: {
    id: number;
    name: string;
    description: string;
    active: boolean;
    categoryName: string;
  };
  consent: { services: number[] };
  setConsent: React.Dispatch<React.SetStateAction<{ services: number[] }>>;
  isEssentialCategory: (name: string) => boolean;
}

const Service: React.FC<ServiceProps> = ({
  service,
  consent,
  setConsent,
  isEssentialCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCookieTranslations();
  const themeColors = useThemeColors();
  const isEssential = isEssentialCategory(service.categoryName);
  const isChecked = consent.services.includes(service.id);

  const handleToggle = () => {
    if (isEssential) return;

    if (isChecked) {
      setConsent((prev) => ({
        ...prev,
        services: prev.services.filter((id) => id !== service.id),
      }));
    } else {
      setConsent((prev) => ({
        ...prev,
        services: [...new Set([...prev.services, service.id])],
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className="flex items-center justify-between px-6 py-4 text-gray-700 hover:text-gray-900 hover:bg-white/60 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 focus:ring-offset-transparent group"
      >
        <div className="flex items-center space-x-4">
          <Switch
            checked={isChecked}
            onChange={handleToggle}
            disabled={isEssential}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
              isEssential
                ? 'bg-gray-300/80 cursor-not-allowed'
                : !isChecked
                ? 'bg-gray-300/80'
                : ''
            }`}
            style={isChecked && !isEssential ? { backgroundColor: themeColors.cssVars.primary.base } : {}}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm ${
                isChecked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </Switch>
          <h3 className="text-[15px] font-medium text-gray-800 antialiased tracking-[-0.01em]">{service.name}</h3>
        </div>
        <div className={`text-gray-500 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-gray-700 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
      {isOpen && (
        <div className="px-6 pb-5 pt-1 bg-gray-50/50 backdrop-blur-sm border-t border-gray-200/40">
          <div className="space-y-3 text-[13px] leading-relaxed text-gray-600 antialiased">
            <p>
              <span className="font-medium text-gray-800">{t.category}:</span>{' '}
              <span className="text-gray-600">{service.categoryName}</span>
            </p>
            <p>
              <span className="font-medium text-gray-800">{t.description}:</span>{' '}
              <span className="text-gray-600">{service.description || t.noDescription}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service;