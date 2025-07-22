'use client';

import React from 'react';
import { useCurrency, SUPPORTED_CURRENCIES } from './CurrencyContext';

interface CurrencyInfoProps {
  className?: string;
}

export default function CurrencyInfo({ className = '' }: CurrencyInfoProps) {
  const { currentCurrency, exchangeRates, isLoading, error, lastUpdated } = useCurrency();
  
  const currentCurrencyInfo = SUPPORTED_CURRENCIES[currentCurrency];
  
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-gray-500 ${className}`}>
        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading rates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-red-600 ${className}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Using fallback rates</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-xs text-gray-600 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live rates</span>
      </div>
      {lastUpdated && (
        <span className="text-gray-500">
          • Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
      {exchangeRates[currentCurrency] && (
        <span className="text-gray-500">
          • {currentCurrency !== 'USD' && `1 USD = ${exchangeRates[currentCurrency].toFixed(currentCurrency === 'BTC' || currentCurrency === 'ETH' ? 8 : 4)} ${currentCurrency}`}
        </span>
      )}
    </div>
  );
}
