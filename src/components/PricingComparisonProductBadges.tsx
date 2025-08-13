"use client";

import React, { useEffect, useState } from 'react';
import { PricingComparisonProduct } from '@/types/product';
import { useSettings } from '@/context/SettingsContext';

interface PricingComparisonProductBadgesProps {
  onProductSelect?: (product: PricingComparisonProduct) => void;
  selectedProductId?: number;
}

const PricingComparisonProductBadges: React.FC<PricingComparisonProductBadgesProps> = ({
  onProductSelect,
  selectedProductId
}) => {
  const [products, setProducts] = useState<PricingComparisonProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchPricingComparisonProducts = async () => {
      if (!settings?.organization_id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const url = `/api/pricing-comparison-products?organizationId=${encodeURIComponent(settings.organization_id)}`;
        console.log('Fetching pricing comparison products for organization:', settings.organization_id);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          console.log('Pricing comparison products fetched successfully:', data);
          
          // Auto-select the first product if none is selected
          if (data.length > 0 && !selectedProductId && onProductSelect) {
            onProductSelect(data[0]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching pricing comparison products:', errorData);
          setError('Failed to load products');
        }
      } catch (error) {
        console.error('Network error fetching pricing comparison products:', error);
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingComparisonProducts();
  }, [settings?.organization_id, selectedProductId, onProductSelect]);

  const handleProductClick = (product: PricingComparisonProduct) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 h-12 w-32 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full">
        <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">
          No products available for pricing comparison
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            className={`
              flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap
              ${selectedProductId === product.id
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
              }
            `}
            style={{
              backgroundColor: selectedProductId === product.id 
                ? undefined 
                : product.background_color || '#ffffff'
            }}
          >
            <div className="flex items-center space-x-2">
              <span>{product.product_name}</span>
              {product.price_manual && (
                <span className={`
                  text-xs font-semibold
                  ${selectedProductId === product.id ? 'text-blue-100' : 'text-gray-500'}
                `}>
                  {product.currency_manual_symbol || '$'}{product.price_manual}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PricingComparisonProductBadges;
