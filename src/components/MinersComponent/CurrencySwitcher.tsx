'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from './CurrencyContext';

interface CurrencySwitcherProps {
  className?: string;
}

export default function CurrencySwitcher({ className = '' }: CurrencySwitcherProps) {
  const { currentCurrency, setCurrency, isLoading, error, lastUpdated } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = (currency: CurrencyCode) => {
    setCurrency(currency);
    setIsOpen(false);
  };

  const currentCurrencyInfo = SUPPORTED_CURRENCIES[currentCurrency];

  // Group currencies by type
  const fiatCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  const cryptoCurrencies: CurrencyCode[] = ['BTC', 'ETH'];
  const stablecoins: CurrencyCode[] = ['USDT', 'USDC', 'DAI'];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Currency Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:bg-white hover:border-blue-300/60 transition-all duration-200 shadow-sm hover:shadow-md group"
        disabled={isLoading}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{currentCurrencyInfo.flag}</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-gray-900 leading-none">
              {currentCurrency}
            </span>
            <span className="text-xs text-gray-500 leading-none">
              {currentCurrencyInfo.symbol}
            </span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Status Indicator */}
      {error && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
      {!error && !isLoading && lastUpdated && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Select Currency</h3>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-1">
                Using fallback rates
              </p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Fiat Currencies */}
            <div className="p-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Fiat Currencies
              </h4>
              <div className="space-y-1">
                {fiatCurrencies.map(currency => {
                  const info = SUPPORTED_CURRENCIES[currency];
                  return (
                    <button
                      key={currency}
                      onClick={() => handleCurrencySelect(currency)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-left ${
                        currentCurrency === currency
                          ? 'bg-blue-100/80 text-blue-900 border border-blue-200/60'
                          : 'hover:bg-gray-100/80 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{info.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{currency}</div>
                        <div className="text-xs text-gray-500 truncate">{info.name}</div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{info.symbol}</span>
                      {currentCurrency === currency && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cryptocurrencies */}
            <div className="p-3 border-t border-gray-200/60">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cryptocurrencies
              </h4>
              <div className="space-y-1">
                {cryptoCurrencies.map(currency => {
                  const info = SUPPORTED_CURRENCIES[currency];
                  return (
                    <button
                      key={currency}
                      onClick={() => handleCurrencySelect(currency)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-left ${
                        currentCurrency === currency
                          ? 'bg-orange-100/80 text-orange-900 border border-orange-200/60'
                          : 'hover:bg-gray-100/80 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{info.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{currency}</div>
                        <div className="text-xs text-gray-500 truncate">{info.name}</div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{info.symbol}</span>
                      {currentCurrency === currency && (
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stablecoins */}
            <div className="p-3 border-t border-gray-200/60">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-1.5a2.5 2.5 0 00-5 0v1h5v-1z" />
                </svg>
                Stablecoins
              </h4>
              <div className="space-y-1">
                {stablecoins.map(currency => {
                  const info = SUPPORTED_CURRENCIES[currency];
                  return (
                    <button
                      key={currency}
                      onClick={() => handleCurrencySelect(currency)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-left ${
                        currentCurrency === currency
                          ? 'bg-green-100/80 text-green-900 border border-green-200/60'
                          : 'hover:bg-gray-100/80 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{info.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{currency}</div>
                        <div className="text-xs text-gray-500 truncate">{info.name}</div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{info.symbol}</span>
                      {currentCurrency === currency && (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
