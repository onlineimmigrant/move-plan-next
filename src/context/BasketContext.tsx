// /src/context/BasketContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

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
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('basket', JSON.stringify(basket));
        console.log('Basket saved to localStorage:', basket);
      } catch (error) {
        console.error('Error saving basket to localStorage:', error);
      }
    }
  }, [basket]);

  useEffect(() => {
    console.log('Basket updated:', basket);
  }, [basket]);

  const addToBasket = async (plan: PricingPlan) => {
    console.log('Adding to basket:', plan);
    const planWithFallback: PricingPlan = {
      ...plan,
      currency_symbol: plan.currency_symbol || 'USD',
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
  };

  const updateQuantity = (planId: number, quantity: number) => {
    console.log('Updating quantity for plan:', planId, 'to:', quantity);
    setBasket((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.plan.id !== planId);
      }
      const existingItem = prev.find((item) => item.plan.id === planId);
      if (existingItem) {
        return prev.map((item) =>
          item.plan.id === planId ? { ...item, quantity } : item
        );
      }
      return prev;
    });
  };

  const removeFromBasket = (planId: number) => {
    console.log('Removing from basket:', planId);
    setBasket((prev) => prev.filter((item) => item.plan.id !== planId));
  };

  const clearBasket = () => {
    console.log('Clearing basket');
    setBasket([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('basket');
    }
  };

  return (
    <BasketContext.Provider
      value={{ basket, addToBasket, updateQuantity, removeFromBasket, clearBasket }}
    >
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