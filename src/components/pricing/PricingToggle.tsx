import React, { useCallback, useEffect, useRef, useState } from 'react';

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
  translations: {
    monthly: string;
    annual: string;
  };
  variant?: 'fixed' | 'inline';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSavings?: boolean;
  annualSavings?: number;
}

export default function PricingToggle({
  isAnnual,
  onToggle,
  translations,
  variant = 'inline',
  className = '',
  size = 'md',
  showSavings = false,
  annualSavings = 20
}: PricingToggleProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Size configurations for exceptional responsiveness
  const sizeConfig = {
    sm: {
      container: 'p-0.5',
      button: 'px-3 text-xs',
      indicator: 'top-0.5 bottom-0.5',
      height: 'h-7',
      buttonWidth: 'min-w-[70px]'
    },
    md: {
      container: 'p-0.5',
      button: 'px-4 text-xs',
      indicator: 'top-0.5 bottom-0.5',
      height: 'h-8',
      buttonWidth: 'min-w-[80px]'
    },
    lg: {
      container: 'p-1',
      button: 'px-5 text-sm',
      indicator: 'top-1 bottom-1',
      height: 'h-10',
      buttonWidth: 'min-w-[90px]'
    }
  };

  const config = sizeConfig[size];
  const baseClasses = `relative flex items-stretch h-full bg-gradient-to-r from-gray-50/80 to-gray-100/80 ${config.container} rounded-full border border-gray-200/60 transition-all duration-300`;
  const backdropClasses = variant === 'fixed' ? 'backdrop-blur-md' : '';

  // Simplified toggle handler without animation guards (unnecessary complexity)
  const handleToggle = useCallback((newValue: boolean) => {
    setHasInteracted(true);
    onToggle(newValue);
  }, [onToggle]);

  // Remove keyboard navigation - not primary interaction pattern for pricing toggles
  // Focus on mouse/touch interactions which are more intuitive

  // Auto-save preference to localStorage
  useEffect(() => {
    if (hasInteracted) {
      localStorage.setItem('pricing-toggle-preference', isAnnual ? 'annual' : 'monthly');
    }
  }, [isAnnual, hasInteracted]);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('pricing-toggle-preference');
    if (saved && !hasInteracted) {
      onToggle(saved === 'annual');
    }
  }, [onToggle, hasInteracted]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Savings indicator */}
      {showSavings && isAnnual && (
        <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 animate-fade-in">
          Save {annualSavings}%
        </div>
      )}

      <div
        ref={containerRef}
        className={`flex items-center justify-center ${config.height}`}
      >
        <div className={`${baseClasses} ${backdropClasses}`}>
          {/* Background indicator */}
          <div
            className={`absolute ${config.indicator} rounded-full bg-white border border-gray-200/80 transition-transform duration-300 ease-out ${
              isAnnual ? 'translate-x-full' : 'translate-x-0'
            }`}
            style={{
              width: 'calc(50% - 2px)',
              left: '1px'
            }}
          />

          {/* Enhanced buttons with better hover states */}
          <button
            onClick={() => handleToggle(false)}
            className={`relative z-10 h-full ${config.button} ${config.buttonWidth} grid place-items-center leading-none rounded-full font-semibold transition-all duration-200 ${
              !isAnnual
                ? 'text-gray-900 transform scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:scale-102'
            }`}
          >
            {translations.monthly}
          </button>

          <button
            onClick={() => handleToggle(true)}
            className={`relative z-10 h-full ${config.button} ${config.buttonWidth} grid place-items-center leading-none rounded-full font-semibold transition-all duration-200 ${
              isAnnual
                ? 'text-gray-900 transform scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:scale-102'
            }`}
          >
            {translations.annual}
          </button>
        </div>
      </div>
    </div>
  );
}