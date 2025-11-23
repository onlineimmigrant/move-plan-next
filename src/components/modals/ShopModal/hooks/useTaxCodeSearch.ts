/**
 * useTaxCodeSearch Hook
 * 
 * Manages tax code autocomplete functionality
 * Loads ~18,000 tax codes from JSON and provides filtered search
 */

import { useState, useMemo } from 'react';
import taxCodesData from '@/components/tax_codes.json';
import { TaxCode } from '../types';
import { MAX_TAX_CODE_RESULTS } from '../utils';

interface UseTaxCodeSearchReturn {
  filteredTaxCodes: TaxCode[];
  isLoading: boolean;
}

/**
 * Hook for tax code search and autocomplete
 * 
 * @param searchQuery - The search query to filter tax codes
 * @returns Filtered tax codes and loading state
 * 
 * @example
 * ```tsx
 * const { filteredTaxCodes, isLoading } = useTaxCodeSearch(searchTerm);
 * ```
 */
export function useTaxCodeSearch(searchQuery: string): UseTaxCodeSearchReturn {
  const [taxCodes] = useState<TaxCode[]>(taxCodesData);
  const [isLoading] = useState(false);

  /**
   * Filter tax codes based on search query
   * Searches in both description and code
   * Limits results for performance
   */
  const filteredTaxCodes = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show first 50 tax codes when no search query
      return taxCodes.slice(0, MAX_TAX_CODE_RESULTS);
    }

    const query = searchQuery.toLowerCase();
    
    return taxCodes
      .filter(tc =>
        tc.description.toLowerCase().includes(query) ||
        tc.product_tax_code.toLowerCase().includes(query)
      )
      .slice(0, MAX_TAX_CODE_RESULTS); // Limit results for performance
  }, [taxCodes, searchQuery]);

  return {
    filteredTaxCodes,
    isLoading,
  };
}
