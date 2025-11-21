// lib/currency.ts - Multi-currency support utilities

export interface CurrencyPrice {
  price: number;
  symbol: string;
  currency: string;
  source: 'multi_currency' | 'multi_currency_base' | 'legacy_single';
}

export interface StripePriceData {
  priceId: string;
  currency: string;
  source: 'multi_currency' | 'multi_currency_base' | 'legacy_single';
}

export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' },
  RUB: { symbol: '₽', name: 'Russian Ruble' }
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Helper function to detect the most common base currency from pricing plans
export const detectBaseCurrencyFromPlans = (pricingPlans?: any[]): string => {
  if (!pricingPlans || pricingPlans.length === 0) {
    return 'GBP'; // Default fallback
  }

  // Count occurrences of each base_currency
  const currencyCount: Record<string, number> = {};
  
  pricingPlans.forEach(plan => {
    if (plan.base_currency && SUPPORTED_CURRENCIES[plan.base_currency as SupportedCurrency]) {
      currencyCount[plan.base_currency] = (currencyCount[plan.base_currency] || 0) + 1;
    }
  });

  // Find the most common base currency
  const sortedCurrencies = Object.entries(currencyCount)
    .sort(([,a], [,b]) => b - a)
    .map(([currency]) => currency);


  return sortedCurrencies[0] || 'GBP';
};

// Currency-aware pricing with fallback to existing fields
export const getPriceForCurrency = (pricingPlan: any, targetCurrency: string = 'USD'): CurrencyPrice | null => {
  // Handle null or undefined pricingPlan
  if (!pricingPlan) {
    return null;
  }
  
  // 1. Try multi-currency prices first (new system)
  if (pricingPlan.prices_multi_currency && Object.keys(pricingPlan.prices_multi_currency).length > 0) {
    const multiCurrencyPrices = pricingPlan.prices_multi_currency;
    
    // Check for exact currency match
    if (multiCurrencyPrices[targetCurrency]) {
      return {
        price: multiCurrencyPrices[targetCurrency].price / 100, // Multi-currency prices are stored in cents
        symbol: multiCurrencyPrices[targetCurrency].symbol,
        currency: targetCurrency,
        source: 'multi_currency'
      };
    }
    
    // Fallback to base currency within multi-currency
    const baseCurrency = pricingPlan.base_currency || 'USD';
    if (multiCurrencyPrices[baseCurrency]) {
      return {
        price: multiCurrencyPrices[baseCurrency].price / 100, // Multi-currency prices are stored in cents
        symbol: multiCurrencyPrices[baseCurrency].symbol,
        currency: baseCurrency,
        source: 'multi_currency_base'
      };
    }
  }
  
  // 2. Fallback to existing single-currency system (backward compatibility)
  if (pricingPlan.price && pricingPlan.currency_symbol) {
    return {
      price: pricingPlan.price / 100, // Legacy prices are also stored in cents, need to divide by 100
      symbol: pricingPlan.currency_symbol,
      currency: pricingPlan.currency || 'USD',
      source: 'legacy_single'
    };
  }
  
  // 3. Final fallback to null (no price available)
  return null;
};

// Stripe Price ID selection with backward compatibility
export const getStripePriceId = (pricingPlan: any, targetCurrency: string = 'USD'): StripePriceData | null => {
  // Handle null or undefined pricingPlan
  if (!pricingPlan) {
    return null;
  }
  
  // 1. Try multi-currency Stripe price IDs first (new system)
  if (pricingPlan.stripe_price_ids && Object.keys(pricingPlan.stripe_price_ids).length > 0) {
    const stripePriceIds = pricingPlan.stripe_price_ids;
    
    // Check for exact currency match
    if (stripePriceIds[targetCurrency]) {
      return {
        priceId: stripePriceIds[targetCurrency],
        currency: targetCurrency,
        source: 'multi_currency'
      };
    }
    
    // Fallback to base currency
    const baseCurrency = pricingPlan.base_currency || 'USD';
    if (stripePriceIds[baseCurrency]) {
      return {
        priceId: stripePriceIds[baseCurrency],
        currency: baseCurrency,
        source: 'multi_currency_base'
      };
    }
  }
  
  // 2. Fallback to existing single Stripe price ID (backward compatibility)
  if (pricingPlan.stripe_price_id) {
    return {
      priceId: pricingPlan.stripe_price_id,
      currency: pricingPlan.currency || 'USD',
      source: 'legacy_single'
    };
  }
  
  return null;
};

// Currency detection from various sources
export const getCurrencyFromLocale = (): string => {
  if (typeof window === 'undefined') return 'USD';
  
  const locale = navigator.language || 'en-US';
  const localeToCurrency: { [key: string]: string } = {
    'en-US': 'USD', 'en-CA': 'USD',
    'de': 'EUR', 'fr': 'EUR', 'it': 'EUR', 'es': 'EUR', 'nl': 'EUR',
    'en-GB': 'GBP',
    'pl': 'PLN',
    'ru': 'RUB'
  };
  
  // Try full locale first, then language code
  return localeToCurrency[locale] || localeToCurrency[locale.split('-')[0]] || 'USD';
};

// Currency preference management
export const setUserCurrency = (currency: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `preferred_currency=${currency}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }
};

export const getUserCurrency = (baseCurrency: string = 'GBP'): string => {
  if (typeof document === 'undefined') return baseCurrency;
  const match = document.cookie.match(/preferred_currency=([^;]+)/);
  return match ? match[1] : baseCurrency;
};

// Country to currency mapping for geolocation
export const getCurrencyByCountry = (country: string, baseCurrency: string = 'GBP'): string => {
  const countryToCurrency: { [key: string]: string } = {
    'US': 'USD', 'CA': 'USD',
    'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'AT': 'EUR', 'BE': 'EUR',
    'GB': 'GBP',
    'PL': 'PLN',
    'RU': 'RUB'
  };
  return countryToCurrency[country] || baseCurrency;
};

// Get user currency from multiple sources with priority
export const detectUserCurrency = (headers?: Headers, baseCurrency?: string, pricingPlans?: any[]): string => {
  
  // Determine smart base currency from pricing plans if not provided
  const smartBaseCurrency = baseCurrency || detectBaseCurrencyFromPlans(pricingPlans);
  
  // 1. Check user preference (cookie)
  const preferredCurrency = getUserCurrency(smartBaseCurrency);
  if (preferredCurrency !== smartBaseCurrency) {
    return preferredCurrency;
  }
  
  // 2. Check geolocation from headers (Vercel/middleware)
  if (headers) {
    const userCurrency = headers.get('x-user-currency');
    const userCountry = headers.get('x-user-country');
    
    if (userCurrency && SUPPORTED_CURRENCIES[userCurrency as SupportedCurrency]) {
      return userCurrency;
    }
  }
  
  // 3. Check browser locale (client-side fallback)
  const localeCurrency = getCurrencyFromLocale();
  if (SUPPORTED_CURRENCIES[localeCurrency as SupportedCurrency]) {
    return localeCurrency;
  }
  
  // 4. Default fallback to smart base currency
  return smartBaseCurrency;
};