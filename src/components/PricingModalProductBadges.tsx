"use client";

import React, { useEffect, useState, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll active product into center view on mobile
  const scrollToActiveProduct = (productId?: number) => {
    if (!scrollContainerRef.current || !productId) return;

    const container = scrollContainerRef.current;
    const activeButton = container.querySelector(`[data-product-id="${productId}"]`) as HTMLElement;
    
    if (activeButton) {
      const containerWidth = container.clientWidth;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      
      // Calculate scroll position to center the active button
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

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
      // Scroll to center the selected product on mobile after selection
      setTimeout(() => scrollToActiveProduct(product.id), 100);
    }
  };

  // Scroll to active product when selectedProductId changes
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      setTimeout(() => scrollToActiveProduct(selectedProductId), 200);
    }
  }, [selectedProductId, products]);

  // Always reserve space for the component to prevent layout shifts
  if (products.length === 0) {
    return (
      <div className="flex justify-center mb-6 h-8 sm:h-10 items-center">
        {/* Reserve space even when hidden to prevent layout shift */}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center mb-6 h-8 sm:h-10 items-center">
        <div className="flex overflow-x-auto scrollbar-hide space-x-1.5 sm:space-x-2 px-4 sm:px-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-6 w-16 sm:h-8 sm:w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse shadow-sm border border-gray-200 flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center mb-6 h-8 sm:h-10 items-center">
        {/* Reserve space for error state to prevent layout shift */}
      </div>
    );
  }

  return (
    <div className="mb-6 h-8 sm:h-10 flex items-center">
      {/* Mobile: Horizontally scrollable with centered active item */}
      <div className="w-full sm:flex sm:justify-center">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide space-x-1.5 sm:space-x-2 px-4 sm:px-0 sm:overflow-visible sm:justify-center"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {products.map((product, index) => (
            <button
              key={product.id}
              data-product-id={product.id}
              onClick={() => handleProductClick(product)}
              className={`
                relative px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium 
                transition-all duration-200 ease-out whitespace-nowrap transform hover:scale-105 active:scale-95
                flex-shrink-0 scroll-snap-align-center touch-manipulation
                ${selectedProductId === product.id
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg hover:shadow-xl border border-gray-700'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300'
                }
                before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:transition-opacity
                ${selectedProductId === product.id 
                  ? 'before:bg-gradient-to-r before:from-white/10 before:to-transparent hover:before:opacity-100' 
                  : 'before:bg-gradient-to-r before:from-white/50 before:to-transparent hover:before:opacity-100'
                }
                ${index === 0 ? 'ml-0' : ''}
                ${index === products.length - 1 ? 'mr-0' : ''}
              `}
              style={{ scrollSnapAlign: 'center' }}
            >
              <span className="relative z-10">{product.product_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PricingModalProductBadges);
