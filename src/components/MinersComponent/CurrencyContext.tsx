'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported currencies with their symbols and names
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  BTC: { symbol: '₿', name: 'Bitcoin', flag: '₿' },
  ETH: { symbol: 'Ξ', name: 'Ethereum', flag: 'Ξ' },
  USDT: { symbol: '$', name: 'Tether (USDT)', flag: '₮' },
  USDC: { symbol: '$', name: 'USD Coin', flag: '🔵' },
  DAI: { symbol: '$', name: 'Dai Stablecoin', flag: '◈' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currentCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  exchangeRates: ExchangeRates;
  isLoading: boolean;
  error: string | null;
  convertAmount: (amount: number, fromCurrency?: CurrencyCode) => number;
  formatAmount: (amount: number, currency?: CurrencyCode) => string;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('EUR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch exchange rates from CoinGecko API with retry logic
  const fetchExchangeRates = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setIsLoading(true);
        setError(null);
      }

      // CoinGecko API endpoints from environment variables
      const fiatRatesUrl = process.env.NEXT_PUBLIC_COINGECKO_RATES_URL || 'https://api.coingecko.com/api/v3/exchange_rates';
      const cryptoRatesUrl = process.env.NEXT_PUBLIC_COINGECKO_CRYPTO_URL || 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,dai&vs_currencies=usd,eur,gbp,jpy,cad,aud,chf,cny';

      console.log('Fetching exchange rates from:', { fiatRatesUrl, cryptoRatesUrl });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      let fiatResponse, cryptoResponse;
      
      try {
        [fiatResponse, cryptoResponse] = await Promise.all([
          fetch(fiatRatesUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }),
          fetch(cryptoRatesUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          })
        ]);

        clearTimeout(timeoutId);

        console.log('Response status:', { fiat: fiatResponse.status, crypto: cryptoResponse.status });

        if (!fiatResponse.ok) {
          const fiatText = await fiatResponse.text();
          console.error('Fiat API Error:', fiatResponse.status, fiatText);
          throw new Error(`Fiat API failed: ${fiatResponse.status} - ${fiatText}`);
        }
        
        if (!cryptoResponse.ok) {
          const cryptoText = await cryptoResponse.text();
          console.error('Crypto API Error:', cryptoResponse.status, cryptoText);
          throw new Error(`Crypto API failed: ${cryptoResponse.status} - ${cryptoText}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

      const fiatData = await fiatResponse.json();
      const cryptoData = await cryptoResponse.json();

      // Validate API response structure
      if (!fiatData.rates || !fiatData.rates.usd) {
        throw new Error('Invalid fiat rates response structure');
      }

      if (!cryptoData.bitcoin || !cryptoData.ethereum) {
        throw new Error('Invalid crypto rates response structure');
      }

      // Process fiat exchange rates (CoinGecko uses BTC as base, we need USD as base)
      const btcToUsd = fiatData.rates.usd.value;
      const rates: ExchangeRates = {
        USD: 1, // Base currency
      };

      // Convert fiat currencies from BTC base to USD base
      Object.entries(fiatData.rates).forEach(([code, data]: [string, any]) => {
        const upperCode = code.toUpperCase();
        if (upperCode !== 'USD' && SUPPORTED_CURRENCIES[upperCode as CurrencyCode] && data?.value) {
          rates[upperCode] = data.value / btcToUsd;
        }
      });

      // Add cryptocurrency rates (already in USD) with validation
      if (cryptoData.bitcoin?.usd) rates.BTC = 1 / cryptoData.bitcoin.usd;
      if (cryptoData.ethereum?.usd) rates.ETH = 1 / cryptoData.ethereum.usd;
      if (cryptoData.tether?.usd) rates.USDT = 1 / cryptoData.tether.usd;
      if (cryptoData['usd-coin']?.usd) rates.USDC = 1 / cryptoData['usd-coin'].usd;
      if (cryptoData.dai?.usd) rates.DAI = 1 / cryptoData.dai.usd;

      setExchangeRates(rates);
      setLastUpdated(new Date());
      setRetryCount(0); // Reset retry count on success
      console.log('Exchange rates updated successfully:', rates);
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Retry logic - try up to 3 times with increasing delays
      if (retryCount < 3 && !isRetry) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchExchangeRates(true), delay);
        return;
      }
      
      setError(`Failed to fetch exchange rates: ${errorMessage}`);
      
      // Fallback rates if API fails after all retries
      console.log('Using fallback exchange rates after retry attempts');
      setExchangeRates({
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        BTC: 0.000023,
        ETH: 0.00034,
        USDT: 1.001,
        USDC: 1.002,
        DAI: 1.003,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert amount from one currency to another
  const convertAmount = (amount: number, fromCurrency: CurrencyCode = 'USD'): number => {
    if (!exchangeRates[fromCurrency] || !exchangeRates[currentCurrency]) {
      return amount;
    }
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency];
    return usdAmount * exchangeRates[currentCurrency];
  };

  // Format amount with proper currency symbol and decimals
  const formatAmount = (amount: number, currency: CurrencyCode = currentCurrency): string => {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    const convertedAmount = convertAmount(amount);
    
    // Determine decimal places based on currency type
    let decimals = 2;
    if (['BTC', 'ETH'].includes(currency)) {
      decimals = 6;
    } else if (['USDT', 'USDC', 'DAI'].includes(currency)) {
      decimals = 3;
    } else if (currency === 'JPY') {
      decimals = 0;
    }

    const formatted = convertedAmount.toFixed(decimals);
    
    // Remove trailing zeros for crypto
    if (['BTC', 'ETH'].includes(currency)) {
      const trimmed = parseFloat(formatted).toString();
      return `${currencyInfo.symbol}${trimmed}`;
    }
    
    return `${currencyInfo.symbol}${formatted}`;
  };

  const setCurrency = (currency: CurrencyCode) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
  };

  // Load saved currency preference and fetch rates on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferred-currency') as CurrencyCode;
    if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
      setCurrentCurrency(savedCurrency);
    }
    
    // Check if we're online before trying to fetch
    if (navigator.onLine) {
      fetchExchangeRates();
    } else {
      console.log('Offline - using fallback rates');
      setError('No internet connection - using fallback rates');
      setExchangeRates({
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        BTC: 0.000023,
        ETH: 0.00034,
        USDT: 1.001,
        USDC: 1.002,
        DAI: 1.003,
      });
      setIsLoading(false);
    }
    
    // Refresh rates every 5 minutes, but only if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchExchangeRates();
      }
    }, 5 * 60 * 1000);
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Back online - fetching fresh rates');
      fetchExchangeRates();
    };
    
    const handleOffline = () => {
      console.log('Gone offline - will use cached rates');
      setError('No internet connection - using cached rates');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    exchangeRates,
    isLoading,
    error,
    convertAmount,
    formatAmount,
    lastUpdated,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
