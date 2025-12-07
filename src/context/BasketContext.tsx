// /src/context/BasketContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface PricingPlan {
  id: number;
  slug?: string;
  package?: string;
  measure?: string;
  currency: string;
  currency_symbol: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: { status: string }[];
  buy_url?: string;
  product_id?: number;
  product_name?: string;
  links_to_image?: string;
  type?: 'recurring' | 'one_time' | string;
  stripe_price_id?: string;
  stripe_price_id_annual?: string;
  [key: string]: any;
}

export interface BasketItem {
  plan: PricingPlan;
  quantity: number;
  billingCycle?: 'monthly' | 'annual';
  stripePriceId?: string;
}

interface BasketContextType {
  basket: BasketItem[];
  addToBasket: (plan: PricingPlan, billingCycle?: 'monthly' | 'annual') => Promise<void>;
  updateQuantity: (planId: number, quantity: number) => void;
  removeFromBasket: (planId: number) => void;
  clearBasket: () => void;
  totalItems: number;
  totalValue: number;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  // Defer localStorage read to avoid blocking initial render
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load basket from localStorage after initial render (non-blocking)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedBasket = localStorage.getItem('basket');
      if (savedBasket) {
        const parsedBasket = JSON.parse(savedBasket);
        if (Array.isArray(parsedBasket) && parsedBasket.every(item => 
          item && typeof item === 'object' && 'plan' in item && 'quantity' in item
        )) {
          setBasket(parsedBasket as BasketItem[]);
        }
      }
    } catch (error) {
      console.error('Error parsing basket from localStorage:', error);
      localStorage.removeItem('basket');
    }
    setIsHydrated(true);
  }, []);

  // Memoized basket calculations for better performance
  const basketStats = useMemo(() => {
    const getUnitAmount = (bi: BasketItem) => {
      const p: any = bi.plan || {};
      const baseMonthly = typeof p.computed_price === 'number' ? p.computed_price : ((p.price ?? 0) / 100);
      const type = p.type || p.recurring_interval ? 'recurring' : 'one_time';
      if (bi.billingCycle === 'annual' && type === 'recurring') {
        const commitmentMonths = p.commitment_months || 12;
        const discountRaw = p.annual_size_discount;
        let multiplier = 1;
        if (typeof discountRaw === 'number') {
          if (discountRaw > 1) multiplier = (100 - discountRaw) / 100; else if (discountRaw > 0 && discountRaw <= 1) multiplier = discountRaw;
        }
        return baseMonthly * commitmentMonths * multiplier;
      }
      // Monthly/one-time: prefer computed price; fallback to cents
      if (typeof p.computed_price === 'number') return p.computed_price;
      // Include promotion if only cents are available
      const cents = (p.is_promotion && typeof p.promotion_price === 'number') ? p.promotion_price : (p.price ?? 0);
      return cents / 100;
    };

    const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = basket.reduce((sum, item) => sum + getUnitAmount(item) * item.quantity, 0);

    return { totalItems, totalValue };
  }, [basket]);

  // Debounced localStorage save for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('basket', JSON.stringify(basket));
        } catch (error) {
          console.error('Error saving basket to localStorage:', error);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [basket]);

  const addToBasket = useCallback(async (plan: PricingPlan, billingCycle: 'monthly' | 'annual' = 'monthly') => {
    const planWithFallback: PricingPlan = {
      ...plan,
      currency_symbol: plan.currency_symbol || '$',
    };
    
    // Determine the correct Stripe Price ID
    const isRecurring = plan.type === 'recurring';
    let stripePriceId: string | undefined;
    
    if (isRecurring && billingCycle === 'annual' && plan.stripe_price_id_annual) {
      stripePriceId = plan.stripe_price_id_annual;
    } else if (plan.stripe_price_id) {
      stripePriceId = plan.stripe_price_id;
    }
    
    setBasket((prev) => {
      const existingItem = prev.find((item) => item.plan.id === plan.id && item.billingCycle === billingCycle);
      if (existingItem) {
        return prev.map((item) =>
          item.plan.id === plan.id && item.billingCycle === billingCycle
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { plan: planWithFallback, quantity: 1, billingCycle, stripePriceId }];
    });
  }, []);

  const updateQuantity = useCallback((planId: number, quantity: number) => {
    setBasket((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.plan.id !== planId);
      }
      
      return prev.map((item) =>
        item.plan.id === planId ? { ...item, quantity } : item
      );
    });
  }, []);

  const removeFromBasket = useCallback((planId: number) => {
    setBasket((prev) => prev.filter((item) => item.plan.id !== planId));
  }, []);

  const clearBasket = useCallback(() => {
    setBasket([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('basket');
    }
  }, []);

  const contextValue = useMemo(() => ({
    basket,
    addToBasket,
    updateQuantity,
    removeFromBasket,
    clearBasket,
    ...basketStats,
  }), [basket, addToBasket, updateQuantity, removeFromBasket, clearBasket, basketStats]);

  return (
    <BasketContext.Provider value={contextValue}>
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};