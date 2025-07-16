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
  [key: string]: any;
}

export interface BasketItem {
  plan: PricingPlan;
  quantity: number;
}

interface BasketContextType {
  basket: BasketItem[];
  addToBasket: (plan: PricingPlan) => Promise<void>;
  updateQuantity: (planId: number, quantity: number) => void;
  removeFromBasket: (planId: number) => void;
  clearBasket: () => void;
  totalItems: number;
  totalValue: number;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  const [basket, setBasket] = useState<BasketItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const savedBasket = localStorage.getItem('basket');
      if (savedBasket) {
        const parsedBasket = JSON.parse(savedBasket);
        if (Array.isArray(parsedBasket) && parsedBasket.every(item => 
          item && typeof item === 'object' && 'plan' in item && 'quantity' in item
        )) {
          return parsedBasket as BasketItem[];
        }
      }
    } catch (error) {
      console.error('Error parsing basket from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('basket');
    }
    return [];
  });

  // Memoized basket calculations for better performance
  const basketStats = useMemo(() => {
    const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = basket.reduce((sum, item) => {
      const price = item.plan.is_promotion && item.plan.promotion_price
        ? item.plan.promotion_price
        : item.plan.price;
      return sum + (price * item.quantity / 100);
    }, 0);
    
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

  const addToBasket = useCallback(async (plan: PricingPlan) => {
    const planWithFallback: PricingPlan = {
      ...plan,
      currency_symbol: plan.currency_symbol || '$',
    };
    
    setBasket((prev) => {
      const existingItem = prev.find((item) => item.plan.id === plan.id);
      if (existingItem) {
        return prev.map((item) =>
          item.plan.id === plan.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { plan: planWithFallback, quantity: 1 }];
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