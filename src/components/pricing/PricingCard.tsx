"use client";

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/20/solid';
import { PRICING_CONSTANTS } from '@/utils/pricingConstants';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Feature {
  id: string;
  name: string;
  slug: string;
  type?: string;
  order?: number;
}

interface PricingCardProps {
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  currencySymbol: string;
  annualCurrencySymbol?: string;
  isAnnual: boolean;
  hasOneTimePlans: boolean;
  annualSizeDiscount: number;
  isPromotion?: boolean;
  monthlyPromotionPrice?: number;
  annualPromotionPrice?: number;
  monthlyRecurringCount: number;
  annualRecurringCount: number;
  actualAnnualPrice?: number;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  highlighted?: boolean;
  features: string[];
  realFeatures?: Feature[];
  productSlug?: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  translations: {
    mostPopular: string;
    limitedTimeOffer: string;
    buyNow: string;
    getStarted: string;
    viewMore: string;
    viewLess: string;
  };
  isLoadingFeatures: boolean;
  searchQuery?: string;
  highlightMatch?: (text: string, query: string) => React.ReactNode;
}

const PricingCard = memo<PricingCardProps>(({
  name,
  description,
  monthlyPrice,
  annualPrice,
  currencySymbol,
  annualCurrencySymbol,
  isAnnual,
  hasOneTimePlans,
  annualSizeDiscount,
  isPromotion,
  monthlyPromotionPrice,
  annualPromotionPrice,
  monthlyRecurringCount,
  annualRecurringCount,
  actualAnnualPrice,
  buttonText,
  buttonVariant,
  highlighted,
  features,
  realFeatures,
  productSlug,
  isExpanded,
  onToggleExpanded,
  translations,
  isLoadingFeatures,
  searchQuery,
  highlightMatch,
}) => {
  const themeColors = useThemeColors();
  const primaryColor = themeColors.cssVars.primary.base;
  
  const displayCurrencySymbol = (isAnnual ? annualCurrencySymbol : currencySymbol) || currencySymbol;
  const displayPrice = hasOneTimePlans
    ? monthlyPrice
    : isAnnual
    ? annualPrice
    : monthlyPrice;
  const displayPromotionPrice = hasOneTimePlans
    ? monthlyPromotionPrice || monthlyPrice
    : isAnnual
    ? annualPromotionPrice || annualPrice
    : monthlyPromotionPrice || monthlyPrice;

  const maxFeatures = PRICING_CONSTANTS.MAX_VISIBLE_FEATURES;
  
  // Sort features by type and order to match comparison table
  const sortedFeatures = useMemo(() => {
    if (!realFeatures || realFeatures.length === 0) {
      return features;
    }
    
    // Create a map of feature name to order
    const featureOrderMap = new Map<string, { order: number; type: string }>();
    realFeatures.forEach(rf => {
      featureOrderMap.set(rf.name, { order: rf.order || 999, type: rf.type || 'features' });
    });
    
    // Type priority: modules -> features -> support -> bonus
    const typePriority: { [key: string]: number } = {
      'modules': 1,
      'features': 2,
      'support': 3,
      'bonus': 4
    };
    
    return [...features].sort((a, b) => {
      const aData = featureOrderMap.get(a);
      const bData = featureOrderMap.get(b);
      
      if (!aData && !bData) return 0;
      if (!aData) return 1;
      if (!bData) return -1;
      
      // First sort by type priority
      const aTypePriority = typePriority[aData.type.toLowerCase()] || 999;
      const bTypePriority = typePriority[bData.type.toLowerCase()] || 999;
      
      if (aTypePriority !== bTypePriority) {
        return aTypePriority - bTypePriority;
      }
      
      // Then sort by order within same type
      return aData.order - bData.order;
    });
  }, [features, realFeatures]);
  
  const featuresToShow = isExpanded ? sortedFeatures : sortedFeatures.slice(0, maxFeatures);
  const hasMoreFeatures = sortedFeatures.length > maxFeatures;

  // Memoize button styles to prevent recalculation on every render
  const buttonStyles = useMemo(() => ({
    primary: {
      background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
      color: 'white',
      boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}30`,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: themeColors.cssVars.primary.base,
      borderWidth: '2px',
      borderStyle: 'solid' as const,
      borderColor: themeColors.cssVars.primary.base,
    },
  }), [themeColors.cssVars.primary.base, themeColors.cssVars.primary.hover]);

  const calculateTotal = () => {
    if (hasOneTimePlans) return null;

    if (isAnnual) {
      if (actualAnnualPrice) {
        return `Total annual: ${annualCurrencySymbol || currencySymbol}${actualAnnualPrice.toFixed(PRICING_CONSTANTS.PRICE_DECIMALS)}`;
      }
      const price = isPromotion && annualPromotionPrice ? annualPromotionPrice : annualPrice;
      return `Total annual: ${annualCurrencySymbol || currencySymbol}${(price * annualRecurringCount).toFixed(PRICING_CONSTANTS.PRICE_DECIMALS)}`;
    }

    const price = isPromotion && monthlyPromotionPrice ? monthlyPromotionPrice : monthlyPrice;
    return `Total monthly: ${currencySymbol}${(price * monthlyRecurringCount).toFixed(PRICING_CONSTANTS.PRICE_DECIMALS)}`;
  };

  const discountPercent = annualSizeDiscount > 0
    ? Math.round(annualSizeDiscount)
    : Math.round(((monthlyPrice - annualPrice) / monthlyPrice) * 100);

  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-sm transition-all group ${
        highlighted
          ? 'border-blue-200/70 bg-blue-50/30'
          : 'border-gray-200/50 hover:border-gray-300/70'
      }`}
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none overflow-hidden"></div>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <span 
            className="text-white px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
              boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
            }}
          >
            {translations.mostPopular}
          </span>
        </div>
      )}

      <div className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery && highlightMatch ? highlightMatch(name, searchQuery) : name}
          </h3>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mb-2 font-light text-sm leading-relaxed">
              {searchQuery && highlightMatch ? highlightMatch(description, searchQuery) : description}
            </p>
          )}

          {/* Discount Badge */}
          <div className="flex justify-center mb-4 h-7">
            {!hasOneTimePlans && isAnnual && (
              <span 
                className="text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                  boxShadow: `0 4px 8px ${themeColors.cssVars.primary.base}30`,
                }}
              >
                Save {discountPercent}%
              </span>
            )}
          </div>

          {/* Price Display */}
          <div className="flex items-baseline justify-center mb-8">
            {isPromotion ? (
              <div className="flex flex-col items-center">
                <span className="text-sm text-sky-500 line-through mr-2">
                  {displayCurrencySymbol}
                  {displayPrice.toFixed(PRICING_CONSTANTS.PRICE_DECIMALS)}
                </span>
                <span className="text-4xl font-extralight text-gray-700">
                  {displayCurrencySymbol}
                  {displayPromotionPrice.toFixed(PRICING_CONSTANTS.PRICE_DECIMALS)}
                </span>
                <span className="text-xs text-gray-400 font-medium mt-1">
                  {translations.limitedTimeOffer}
                </span>
              </div>
            ) : (
              <>
                <span className="text-4xl font-extralight text-gray-700">
                  {displayCurrencySymbol}
                  {displayPrice.toFixed(PRICING_CONSTANTS.PRICE_DECIMALS)}
                </span>
                {!hasOneTimePlans && (
                  <span className="text-sm text-gray-500 ml-1 font-light">/month</span>
                )}
              </>
            )}
          </div>

          {/* Total Recurring Amount */}
          {!hasOneTimePlans && (
            <div className="text-center mb-4">
              <span className="text-xs text-gray-400 font-light">{calculateTotal()}</span>
            </div>
          )}

          {/* CTA Button */}
          <Link
            href={productSlug ? `/products/${productSlug}` : '#'}
            prefetch={true}
            className="inline-block w-full py-3.5 px-6 rounded-full font-medium text-sm transition-all group-hover:scale-[1.02] text-center"
            style={buttonVariant === 'primary' ? buttonStyles.primary : buttonStyles.secondary}
          >
            {buttonText === 'Buy Now' ? translations.buyNow : translations.getStarted}
          </Link>
        </div>

        {/* Features List */}
        <div className="space-y-4">
          <ul className="space-y-3">
            {isLoadingFeatures ? (
              Array.from({ length: 4 }).map((_, index) => (
                <li key={index} className="flex items-start animate-pulse">
                  <div className="h-4 w-4 bg-gray-200 rounded shrink-0 mt-0.5 mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </li>
              ))
            ) : features.length === 0 ? (
              null
            ) : (
              <>
                {featuresToShow.map((feature, index) => {
                  const realFeature = realFeatures?.find((rf) => rf.name === feature);
                  const isImportant = realFeature && ['modules', 'bonus', 'support'].includes(realFeature.type?.toLowerCase() || '');
                  const featureTextSize = isImportant ? 'text-base' : 'text-sm';
                  const featureWeight = isImportant ? 'font-medium' : 'font-light';

                  return (
                    <li key={index} className="flex items-start">
                      <CheckIcon 
                        className={`shrink-0 mt-0.5 mr-3 ${isImportant ? 'h-5 w-5' : 'h-4 w-4'}`} 
                        style={{ color: primaryColor }} 
                      />
                      {realFeature ? (
                        <Link
                          href={`/features/${realFeature.slug}`}
                          className={`text-gray-600 ${featureTextSize} ${featureWeight} leading-relaxed transition-colors px-1 -mx-1 rounded`}
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                            e.currentTarget.style.color = primaryColor;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#4b5563';
                          }}
                        >
                          {searchQuery && highlightMatch ? highlightMatch(feature, searchQuery) : feature}
                        </Link>
                      ) : (
                        <span className={`text-gray-600 ${featureTextSize} ${featureWeight} leading-relaxed`}>
                          {searchQuery && highlightMatch ? highlightMatch(feature, searchQuery) : feature}
                        </span>
                      )}
                    </li>
                  );
                })}

                {hasMoreFeatures && (
                  <li className="flex items-start">
                    <div className="h-4 w-4 shrink-0 mt-0.5 mr-3"></div>
                    <button
                      onClick={onToggleExpanded}
                      className="text-gray-500 text-sm font-medium transition-colors flex items-center gap-1 px-1 -mx-1 rounded"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                        e.currentTarget.style.color = primaryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      {isExpanded ? (
                        <>
                          {translations.viewLess}
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          {translations.viewMore} {features.length - maxFeatures}
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - only re-render if these props change
  return (
    prevProps.name === nextProps.name &&
    prevProps.description === nextProps.description &&
    prevProps.monthlyPrice === nextProps.monthlyPrice &&
    prevProps.annualPrice === nextProps.annualPrice &&
    prevProps.isAnnual === nextProps.isAnnual &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isLoadingFeatures === nextProps.isLoadingFeatures &&
    prevProps.features.length === nextProps.features.length &&
    prevProps.realFeatures?.length === nextProps.realFeatures?.length &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.realFeatures === nextProps.realFeatures
  );
});

PricingCard.displayName = 'PricingCard';

export default PricingCard;
