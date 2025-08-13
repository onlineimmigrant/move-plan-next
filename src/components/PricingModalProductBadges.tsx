"use client";

import React, { useEffect, useState } from 'react';
import { PricingComparisonProduct } from '@/types/product';
import { useSettings } from '@/context/SettingsContext';

interface PricingModalProductBadgesProps {
  onProductSelect?: (product: PricingComparisonProduct) => void;
  selectedProductId?: number;
}

const PricingModalProductBadges: React.FC<PricingModalProductBadgesProps> = ({
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
        const url = `/api/pricing-comparison?organizationId=${encodeURIComponent(settings.organization_id)}&type=products`;
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
          
          // Auto-select the first product if none is selected and callback is provided
          if (data.length > 0 && !selectedProductId && onProductSelect) {
            // Use setTimeout to prevent immediate re-render during initial load
            setTimeout(() => {
              onProductSelect(data[0]);
            }, 0);
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
  }, [settings?.organization_id]); // Removed selectedProductId and onProductSelect from dependencies to prevent re-fetching

  const handleProductClick = (product: PricingComparisonProduct) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  // Always reserve space for the component to prevent layout shifts
  if (products.length <= 1) {
    return (
      <div className="flex justify-center mb-6 h-10 sm:h-12 items-center">
        {/* Reserve space even when hidden to prevent layout shift */}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center mb-6 h-10 sm:h-12 items-center">
        <div className="flex space-x-1 sm:space-x-1.5 bg-gray-50/60 backdrop-blur-sm p-1 sm:p-1.5 rounded-full border border-gray-200/40">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-6 w-16 sm:h-8 sm:w-20 bg-gray-100 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center mb-6 h-10 sm:h-12 items-center">
        {/* Reserve space for error state to prevent layout shift */}
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6 h-10 sm:h-12 items-center">
      <div className="flex space-x-1 sm:space-x-1.5 bg-gray-50/60 backdrop-blur-sm p-1 sm:p-1.5 rounded-full border border-gray-200/40 transition-all duration-300 ease-out">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            className={`
              px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ease-out whitespace-nowrap transform
              ${selectedProductId === product.id
                ? 'bg-white text-gray-800 shadow-sm border border-gray-200/60 scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 hover:scale-102 scale-100'
              }
            `}
          >
            {product.product_name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(PricingModalProductBadges);
