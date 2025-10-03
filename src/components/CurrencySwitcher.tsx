// components/CurrencySwitcher.tsx - Optional currency switcher component
'use client';

import { useState, useEffect } from 'react';
import { SUPPORTED_CURRENCIES, setUserCurrency, getUserCurrency } from '@/lib/currency';

interface CurrencySwitcherProps {
  onCurrencyChange?: (currency: string) => void;
  className?: string;
}

export default function CurrencySwitcher({ onCurrencyChange, className = '' }: CurrencySwitcherProps) {
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const currency = getUserCurrency();
    setCurrentCurrency(currency);
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setCurrentCurrency(currency);
    setUserCurrency(currency);
    setIsOpen(false);
    
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    } else {
      // Refresh page to apply new currency
      window.location.reload();
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200"
      >
        <span>{SUPPORTED_CURRENCIES[currentCurrency as keyof typeof SUPPORTED_CURRENCIES]?.symbol}</span>
        <span>{currentCurrency}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => handleCurrencyChange(code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors duration-200 ${
                  code === currentCurrency ? 'bg-sky-50 text-sky-700' : 'text-gray-700'
                }`}
              >
                <span className="w-6">{info.symbol}</span>
                <span className="font-medium">{code}</span>
                <span className="text-gray-500 text-xs">{info.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}