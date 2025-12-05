"use client";

import React, { useEffect, useState, useRef } from 'react';
import { PricingComparisonProduct } from '@/types/product';
import { useSettings } from '@/context/SettingsContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PRODUCT_TAB_STYLES } from '@/components/pricing/pricingModalStyles';

interface PricingModalProductBadgesProps {
  onProductSelect?: (product: PricingComparisonProduct) => void;
  selectedProductId?: number;
  initialProductIdentifier?: string | null;
}

const PricingModalProductBadges: React.FC<PricingModalProductBadgesProps> = ({
  onProductSelect,
  selectedProductId,
  initialProductIdentifier
}) => {
  const [products, setProducts] = useState<PricingComparisonProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
  const { settings } = useSettings();
  const themeColors = useThemeColors();
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
        // console.log('Fetching pricing comparison products for organization:', settings.organization_id);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          console.log('Successfully fetched pricing comparison products:', data);
          
          // Advanced product selection logic
          if (data.length > 0 && !selectedProductId && onProductSelect) {
            let productToSelect = data[0]; // Default to first product
            
            // If we have an initial product identifier, try to find a matching product
            if (initialProductIdentifier) {
              console.log('Looking for product with identifier:', initialProductIdentifier);
              
              // Try to find a matching product based on the identifier
              // console.log('PricingModalProductBadges: Looking for product with identifier:', initialProductIdentifier);
              // console.log('PricingModalProductBadges: Available products:', data.map((p: PricingComparisonProduct) => ({
              //   id: p.id,
              //   name: p.product_name,
              //   slug: p.slug,
              //   computed_identifier: p.product_name ? 
              //     p.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') : 
              //     'no_name'
              // })));
              
              // Try to find product by converted name first
              const foundByName = data.find((product: PricingComparisonProduct) => {
                if (!product.product_name) return false;
                const productIdentifier = product.product_name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '_')
                  .replace(/_+/g, '_')
                  .replace(/^_|_$/g, '');
                return productIdentifier === initialProductIdentifier;
              });
              
              // Try to find product by ID if name search fails
              const foundById = !foundByName ? data.find((product: PricingComparisonProduct) => 
                product.id.toString() === initialProductIdentifier
              ) : null;
              
              // Try to find by slug if both above fail
              const foundBySlug = !foundByName && !foundById ? data.find((product: PricingComparisonProduct) => 
                product.slug === initialProductIdentifier
              ) : null;
              
              const foundProduct = foundByName || foundById || foundBySlug;
              
              if (foundProduct) {
                productToSelect = foundProduct;
                const matchType = foundByName ? 'name' : foundById ? 'id' : 'slug';
                console.log(`Found matching product by ${matchType}:`, foundProduct);
              } else {
                console.log('No matching product found, using first product:', productToSelect);
              }
            }
            
            // Use setTimeout to prevent immediate re-render during initial load
            setTimeout(() => {
              onProductSelect(productToSelect);
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
  }, [settings?.organization_id, initialProductIdentifier]); // Include initialProductIdentifier to handle product selection when URL changes

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
    <div className="mb-6 flex items-center">
      <div className="w-full">
        <div className="flex justify-center">
          <nav 
            ref={scrollContainerRef}
            className={PRODUCT_TAB_STYLES.container}
            aria-label="Product selection"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
          >
            {products.map((product) => {
              const isActive = selectedProductId === product.id;
              const isHovered = hoveredProductId === product.id;
              
              return (
                <button
                  key={product.id}
                  data-product-id={product.id}
                  onClick={() => handleProductClick(product)}
                  onMouseEnter={() => setHoveredProductId(product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                  className={PRODUCT_TAB_STYLES.button.base}
                  style={{
                    ...(isActive
                      ? {
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                          color: 'white',
                          boxShadow: isHovered
                            ? `0 4px 12px ${themeColors.cssVars.primary.base}40`
                            : `0 2px 4px ${themeColors.cssVars.primary.base}30`,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: isHovered ? themeColors.cssVars.primary.hover : themeColors.cssVars.primary.base,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: isHovered ? `${themeColors.cssVars.primary.base}80` : `${themeColors.cssVars.primary.base}40`,
                        }),
                    scrollSnapAlign: 'center',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{product.product_name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PricingModalProductBadges);
