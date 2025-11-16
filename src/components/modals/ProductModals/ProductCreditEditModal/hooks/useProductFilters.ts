/**
 * useProductFilters Hook
 * 
 * Manages product filtering and sorting logic
 * Handles search, tab filtering, and sorting
 */

import { useMemo } from 'react';
import { Product, ProductFilters } from '../types';

interface UseProductFiltersProps {
  products: Product[];
  filters: ProductFilters;
}

interface UseProductFiltersReturn {
  filteredProducts: Product[];
}

/**
 * Hook for filtering and sorting products
 * 
 * @param products - Array of all products
 * @param filters - Current filter state
 * @returns Filtered and sorted products
 * 
 * @example
 * ```tsx
 * const { filteredProducts } = useProductFilters({
 *   products: allProducts,
 *   filters: {
 *     searchQuery: 'laptop',
 *     activeTab: 'active',
 *     sortBy: 'name'
 *   }
 * });
 * ```
 */
export function useProductFilters({
  products,
  filters,
}: UseProductFiltersProps): UseProductFiltersReturn {
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by tab (all/active/archived)
    if (filters.activeTab === 'active') {
      filtered = filtered.filter(p => p.is_displayed);
    } else if (filters.activeTab === 'archived') {
      filtered = filtered.filter(p => !p.is_displayed);
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(query) ||
        p.product_description?.toLowerCase().includes(query) ||
        p.product_tax_code?.toLowerCase().includes(query)
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.product_name.localeCompare(b.product_name);
        
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [products, filters]);

  return { filteredProducts };
}
