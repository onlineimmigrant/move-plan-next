import React, { useRef, useEffect, useState } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { organizationTypes } from './types';

interface OrganizationType {
  value: string;
  label: string;
  icon: string;
}

interface OrganizationTypeSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}

export const OrganizationTypeSelect: React.FC<OrganizationTypeSelectProps> = ({ 
  label, 
  name, 
  value = 'services',
  onChange,
  disabled = false
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // For platform organizations, include platform type but make it disabled
  // For other organizations, filter out platform and general types
  const availableTypes = organizationTypes.filter(type => {
    if (value === 'platform') {
      // Show all types including platform when current value is platform
      return !['general'].includes(type.value);
    } else {
      // Hide platform and general for non-platform organizations
      return !['platform', 'general'].includes(type.value);
    }
  });
  
  const selectedType = organizationTypes.find(type => type.value === value) || availableTypes[0];

  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const handleChange = (newValue: string) => {
    if (!disabled) {
      onChange(name, newValue);
      setIsOpen(false);
    }
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 max-h-60 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl py-2 text-sm focus:outline-none border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      }}
    >
      {availableTypes.map((type) => {
        const isDisabledType = type.value === 'platform' && disabled;
        return (
          <button
            key={type.value}
            onClick={() => !isDisabledType && handleChange(type.value)}
            disabled={isDisabledType}
            className={`relative select-none py-3 pl-4 pr-10 w-full text-left transition-colors duration-200 ${
              isDisabledType
                ? 'cursor-not-allowed opacity-50 text-gray-400 bg-gray-50/50'
                : type.value === value 
                  ? 'cursor-pointer bg-sky-100/60 text-sky-900 hover:bg-sky-50/80 hover:text-sky-900' 
                  : 'cursor-pointer text-gray-900 hover:bg-sky-50/80 hover:text-sky-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{type.icon}</span>
              <span className="block truncate text-sm font-light">{type.label}</span>
              {isDisabledType && (
                <span className="text-gray-400 text-xs">🔒</span>
              )}
            </div>
            {type.value === value && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sky-600">
                <CheckIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-light text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`relative w-full rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200/60 py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-300 focus:outline-none ${
            disabled 
              ? 'cursor-not-allowed opacity-60 bg-gray-50/50' 
              : 'cursor-pointer hover:border-gray-300 hover:shadow-md hover:bg-white/70 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{selectedType?.icon}</span>
            <span className="block truncate text-sm font-light text-gray-900">
              {selectedType?.label}
            </span>
          </div>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>
        
        {!disabled && dropdownContent}
        
        {/* Click outside handler */}
        {isOpen && !disabled && (
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
      
      {/* Help text for platform organizations */}
      {disabled && value === 'platform' && (
        <p className="text-xs text-amber-600 font-light mt-1 flex items-center space-x-1">
          <span>🔒</span>
          <span>Platform organization type cannot be changed to preserve administrative privileges</span>
        </p>
      )}
    </div>
  );
};
