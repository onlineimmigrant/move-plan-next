/**
 * useProductData Hook
 * 
 * Manages product data fetching and state
 * Handles loading, error states, and product list management
 */

import { useState, useCallback } from 'react';
import { Product } from '../types';
import { API_ENDPOINTS } from '../utils';

interface UseProductDataProps {
  organizationId: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface UseProductDataReturn {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
}

/**
 * Hook for managing product data
 * 
 * @param organizationId - The organization ID to fetch products for
 * @param onToast - Callback for showing toast notifications
 * @returns Product data and management functions
 * 
 * @example
 * ```tsx
 * const { products, isLoading, error, fetchProducts } = useProductData({
 *   organizationId: settings.organization_id,
 *   onToast: showToast,
 * });
 * 
 * useEffect(() => {
 *   fetchProducts();
 * }, []);
 * ```
 */
export function useProductData({
  organizationId,
  onToast,
}: UseProductDataProps): UseProductDataReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.LIST_PRODUCTS);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      onToast(message, 'error');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  return {
    products,
    setProducts,
    isLoading,
    error,
    fetchProducts,
  };
}
