import { useEffect, useState } from 'react';
import { detectUserCurrency } from '@/lib/currency';
import { PricingPlan } from '@/types/pricingplan';

/**
 * Hook to detect and manage user currency based on pricing plans
 */
export function useCurrencyDetection(pricingPlans: PricingPlan[]) {
  const [userCurrency, setUserCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    // Only detect currency after pricing plans are loaded for smart base currency detection
    if (pricingPlans.length > 0) {
      const detectedCurrency = detectUserCurrency(undefined, undefined, pricingPlans);
      setUserCurrency(detectedCurrency);
      
      // Set currency symbol based on detected currency
      const currencySymbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'PLN': 'zł',
        'RUB': '₽'
      };
      setCurrencySymbol(currencySymbols[detectedCurrency] || '$');
    }
  }, [pricingPlans]);

  return { userCurrency, currencySymbol };
}
