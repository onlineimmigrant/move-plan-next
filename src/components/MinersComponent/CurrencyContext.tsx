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

  // Fetch exchange rates from CoinGecko API
  const fetchExchangeRates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // CoinGecko API endpoints from environment variables
      const fiatRatesUrl = process.env.NEXT_PUBLIC_COINGECKO_RATES_URL || 'https://api.coingecko.com/api/v3/exchange_rates';
      const cryptoRatesUrl = process.env.NEXT_PUBLIC_COINGECKO_CRYPTO_URL || 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,dai&vs_currencies=usd,eur,gbp,jpy,cad,aud,chf,cny';

      const [fiatResponse, cryptoResponse] = await Promise.all([
        fetch(fiatRatesUrl),
        fetch(cryptoRatesUrl)
      ]);

      if (!fiatResponse.ok || !cryptoResponse.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const fiatData = await fiatResponse.json();
      const cryptoData = await cryptoResponse.json();

      // Process fiat exchange rates (CoinGecko uses BTC as base, we need USD as base)
      const btcToUsd = fiatData.rates.usd.value;
      const rates: ExchangeRates = {
        USD: 1, // Base currency
      };

      // Convert fiat currencies from BTC base to USD base
      Object.entries(fiatData.rates).forEach(([code, data]: [string, any]) => {
        if (code.toUpperCase() !== 'USD' && SUPPORTED_CURRENCIES[code.toUpperCase() as CurrencyCode]) {
          rates[code.toUpperCase()] = data.value / btcToUsd;
        }
      });

      // Add cryptocurrency rates (already in USD)
      rates.BTC = 1 / cryptoData.bitcoin.usd;
      rates.ETH = 1 / cryptoData.ethereum.usd;
      rates.USDT = 1 / cryptoData.tether.usd;
      rates.USDC = 1 / cryptoData['usd-coin'].usd;
      rates.DAI = 1 / cryptoData.dai.usd;

      setExchangeRates(rates);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError('Failed to fetch exchange rates');
      
      // Fallback rates if API fails
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
    
    fetchExchangeRates();
    
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
