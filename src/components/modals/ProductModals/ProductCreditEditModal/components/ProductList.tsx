/**
 * ProductList Component
 * 
 * Displays a grid/list view of products with loading states and empty states
 * Follows TicketList architecture patterns
 */

import React from 'react';
import { ProductListItem } from './ProductListItem';
import type { Product } from '../types';

interface ProductListProps {
  products: Product[];
  selectedProductId?: string | null;
  isLoading: boolean;
  searchQuery?: string;
  activeTab?: 'all' | 'active' | 'archived';
  onProductSelect: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductDelete?: (productId: string) => void;
  isDeleting?: boolean;
}

export function ProductList({
  products,
  selectedProductId,
  isLoading,
  searchQuery = '',
  activeTab = 'all',
  onProductSelect,
  onProductEdit,
  onProductDelete,
  isDeleting = false,
}: ProductListProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div 
        className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        role="status" 
        aria-label="Loading products" 
        aria-live="polite"
      >
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="animate-pulse bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-slate-200 dark:border-gray-700 rounded-xl p-4"
            aria-hidden="true"
          >
            {/* Image skeleton */}
            <div className="h-48 bg-slate-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            
            {/* Title skeleton */}
            <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            
            {/* Description skeleton */}
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
            
            {/* Badges skeleton */}
            <div className="flex gap-2">
              <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded-full w-16"></div>
              <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded-full w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    const hasActiveFilters = searchQuery || activeTab !== 'all';
    
    return (
      <div 
        className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 dark:text-slate-500 p-8" 
        role="status" 
        aria-label="No products found"
      >
        <svg 
          className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
          {hasActiveFilters ? 'No products found' : 'No products yet'}
        </h3>
        <p className="text-sm text-center max-w-sm">
          {hasActiveFilters 
            ? 'Try adjusting your search or filter criteria'
            : 'Get started by creating your first product'
          }
        </p>
      </div>
    );
  }

  // Product grid
  return (
    <div 
      className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-label={`${products.length} product${products.length === 1 ? '' : 's'}`}
    >
      {products.map((product) => (
        <ProductListItem
          key={product.id}
          product={product}
          isSelected={selectedProductId === product.id}
          searchQuery={searchQuery}
          onClick={onProductSelect}
          onEdit={onProductEdit}
          onDelete={onProductDelete}
          isDeleting={isDeleting && selectedProductId === product.id}
        />
      ))}
    </div>
  );
}
