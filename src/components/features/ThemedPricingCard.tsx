// src/components/features/ThemedPricingCard.tsx
'use client';

import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PricingPlan {
  id: string;
  slug?: string;
  product_name: string;
  product_slug: string;
  package?: string;
  measure?: string;
  price: number;
  currency: string;
  currency_symbol?: string;
  is_promotion?: boolean;
  promotion_price?: number;
  product?: {
    links_to_image?: string;
    is_displayed?: boolean;
  };
}

export default function ThemedPricingCard({ plan, featureName }: { plan: PricingPlan; featureName: string }) {
  const themeColors = useThemeColors();
  
  // Convert prices from cents to actual currency units
  const displayPrice = plan.is_promotion && plan.promotion_price 
    ? (plan.promotion_price / 100).toFixed(2)
    : (plan.price / 100).toFixed(2);
  
  const originalPrice = (plan.price / 100).toFixed(2);
  
  // Use currency_symbol field with fallback
  const currencySymbol = plan.currency_symbol || '£';

  // Get product image
  const productImage = plan.product?.links_to_image;

  return (
    <Link 
      href={`/products/${plan.product_slug}`}
      className="group block h-full focus:outline-none rounded-3xl transition-all"
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${themeColors.cssVars.primary.base}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <div 
        className="h-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 active:scale-[1.01] transition-all duration-500 overflow-hidden flex flex-col relative border hover:border-opacity-100"
        style={{
          borderColor: 'rgb(243 244 246)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = themeColors.cssVars.primary.light;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgb(243 244 246)';
        }}
      >
        {/* Feature Included Badge */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/95 backdrop-blur-sm border border-emerald-200 rounded-full shadow-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Included</span>
          </div>
        </div>
        
        {/* Product Image Header (if available) */}
        {productImage && (
          <div className="w-full h-40 relative overflow-hidden">
            <div 
              className="absolute inset-0 z-10"
              style={{
                background: `linear-gradient(to bottom right, ${themeColors.cssVars.primary.lighter}80, ${themeColors.cssVars.primary.light}40)`,
              }}
            ></div>
            <img 
              src={productImage} 
              alt={plan.product_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
        )}

        {/* Card Content */}
        <div className="p-8 sm:p-12 flex flex-col grow bg-gradient-to-br from-white to-gray-50 text-center gap-y-4">
          {/* Refined Badge */}
          {plan.measure && (
            <div className="flex justify-center">
              <span 
                className="inline-block px-4 py-1.5 text-xs font-medium rounded-full tracking-wide uppercase border"
                style={{
                  backgroundColor: themeColors.cssVars.primary.lighter,
                  color: themeColors.cssVars.primary.base,
                  borderColor: themeColors.cssVars.primary.light,
                }}
              >
                {plan.measure}
              </span>
            </div>
          )}
          
          {/* Elegant Title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em]">
            {plan.product_name}
          </h3>
          
          {/* Refined Price Display */}
          <div className="flex flex-col items-center grow justify-center">
            {plan.is_promotion && plan.promotion_price && (
              <span className="text-sm text-gray-400 line-through mb-1 font-light">
                {currencySymbol}{originalPrice}
              </span>
            )}
            <div className="flex items-baseline">
              <span className="text-gray-600 text-lg font-normal mr-1">{currencySymbol}</span>
              <span className="text-4xl font-semibold text-gray-900 tracking-tight">{displayPrice}</span>
            </div>
            {plan.is_promotion && (
              <span 
                className="text-xs font-medium mt-2 tracking-wide"
                style={{ color: themeColors.cssVars.primary.base }}
              >
                Limited Time Offer
              </span>
            )}
          </div>

          {/* Arrow Icon */}
          <div className="flex justify-center mt-2">
            <span 
              className="text-2xl group-hover:scale-125 group-hover:rotate-45 transition-all duration-300"
              style={{ color: themeColors.cssVars.primary.base }}
            >↗</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
