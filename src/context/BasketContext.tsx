'use client';

import { createContext, useContext, useState } from 'react';

type PricingPlan = {
  id?: number;
  slug?: string;
  package?: string;
  measure?: string;
  currency: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: any[] | any;
  buy_url?: string;
  product_id?: number;
  [key: string]: any;
};

type BasketItem = {
  plan: PricingPlan;
  quantity: number;
};

type BasketContextType = {
  basket: BasketItem[];
  addToBasket: (plan: PricingPlan) => void;
  updateQuantity: (planId: number, quantity: number) => void;
  removeFromBasket: (planId: number) => void;
  clearBasket: () => void;
};

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [basket, setBasket] = useState<BasketItem[]>([]);

  const addToBasket = (plan: PricingPlan) => {
    setBasket((prevBasket) => {
      const existingItem = prevBasket.find((item) => item.plan.id === plan.id);
      if (existingItem) {
        return prevBasket.map((item) =>
          item.plan.id === plan.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevBasket, { plan, quantity: 1 }];
    });
  };

  const updateQuantity = (planId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromBasket(planId);
      return;
    }
    setBasket((prevBasket) =>
      prevBasket.map((item) =>
        item.plan.id === planId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromBasket = (planId: number) => {
    setBasket((prevBasket) => prevBasket.filter((item) => item.plan.id !== planId));
  };

  const clearBasket = () => {
    setBasket([]);
  };

  return (
    <BasketContext.Provider
      value={{ basket, addToBasket, updateQuantity, removeFromBasket, clearBasket }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}