import { useState } from 'react';
import type { Order, OrderItem, CreateOrderRequest } from '@/types/orders';

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: CreateOrderRequest): Promise<{ order?: Order; order_items?: OrderItem[] }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      return { order: data.order, order_items: data.order_items };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (orderId: string): Promise<{ order?: Order; order_items?: OrderItem[] }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders?order_id=${orderId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      return { order: data.order, order_items: data.order_items };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrders = async (): Promise<Order[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      return data.orders || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (
    orderId: string,
    updates: {
      status?: string;
      payment_status?: string;
      stripe_payment_intent_id?: string;
      notes?: string;
    }
  ): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, ...updates }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update order');
      }

      return data.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrder,
    getOrder,
    getOrders,
    updateOrder,
  };
}
