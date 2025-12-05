"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CheckIcon, XMarkIcon as XMarkIconSmall } from '@heroicons/react/20/solid';
import { PRICING_CONSTANTS } from '@/utils/pricingConstants';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Feature {
  id: string;
  name: string;
  slug: string;
  type: 'features' | 'modules' | 'support' | 'bonus' | string;
  order: number;
  content?: string;
}

interface SamplePricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  monthlyRecurringCount: number;
  annualRecurringCount: number;
  actualAnnualPrice?: number;
  annualSizeDiscount?: number;
  planId?: string | number; // Support both UUID string and numeric IDs
  realFeatures?: Feature[];
  productSlug?: string;
  order: number;
  isPromotion?: boolean;
  promotionPrice?: number;
  monthlyPromotionPrice?: number;
  annualPromotionPrice?: number;
  currencySymbol?: string;
  annualCurrencySymbol?: string;
}

interface PricingComparisonTableProps {
  plans: SamplePricingPlan[];
  isAnnual: boolean;
  hasOneTimePlans: boolean;
  currencySymbol: string;
  translations: {
    features: string;
    limitedTimeOffer: string;
  };
}

// Helper function to get all unique features from real feature data, grouped by type
const getAllFeaturesGroupedByType = (plans: SamplePricingPlan[]): { [type: string]: Feature[] } => {
  const featuresMap: { [type: string]: Feature[] } = {};

  plans.forEach(plan => {
    if (plan.realFeatures && plan.realFeatures.length > 0) {
      plan.realFeatures.forEach(feature => {
        const featureType = feature.type || 'features';
        if (!featuresMap[featureType]) {
          featuresMap[featureType] = [];
        }

        if (!featuresMap[featureType].some(f => f.id === feature.id)) {
          featuresMap[featureType].push(feature);
        }
      });
    }
  });

  Object.keys(featuresMap).forEach(type => {
    featuresMap[type].sort((a, b) => (a.order || PRICING_CONSTANTS.DEFAULT_PLAN_ORDER) - (b.order || PRICING_CONSTANTS.DEFAULT_PLAN_ORDER));
  });

  return featuresMap;
};

// Helper function to check if a plan has a specific real feature (explicit only, no inheritance)
const planHasRealFeature = (plan: SamplePricingPlan, feature: Feature, allPlans: SamplePricingPlan[]): boolean => {
  // Only check if the feature is explicitly linked to this plan
  return plan.realFeatures?.some(f => f.id === feature.id) || false;
};

// Legacy helper for string-based features
const getAllFeatures = (plans: SamplePricingPlan[]): string[] => {
  const allFeatures = plans.flatMap(plan => plan.features);
  return [...new Set(allFeatures)];
};

const planHasFeature = (planIndex: number, feature: string, plans: SamplePricingPlan[]): boolean => {
  if (plans[planIndex].features.includes(feature)) {
    return true;
  }

  for (let i = 0; i < planIndex; i++) {
    if (plans[i].features.includes(feature)) {
      return true;
    }
  }

  return false;
};

export default function PricingComparisonTable({
  plans,
  isAnnual,
  hasOneTimePlans,
  currencySymbol,
  translations,
}: PricingComparisonTableProps) {
  const themeColors = useThemeColors();
  const primaryColor = themeColors.cssVars.primary.base;
  
  const featuresGroupedByType = useMemo(() => getAllFeaturesGroupedByType(plans), [plans]);
  const hasRealFeatures = Object.keys(featuresGroupedByType).length > 0;

  const orderedTypes = useMemo(() => {
    const allTypes = Object.keys(featuresGroupedByType);
    const result: string[] = [];
    
    // Normalize to lowercase for comparison
    const normalizedTypes = allTypes.map(t => ({ original: t, lower: t.toLowerCase() }));
    
    // 1. Modules first
    const modulesType = normalizedTypes.find(t => t.lower === 'modules');
    if (modulesType) result.push(modulesType.original);
    
    // 2. Features second
    const featuresType = normalizedTypes.find(t => t.lower === 'features');
    if (featuresType) result.push(featuresType.original);
    
    // 3. Other types (except support and bonus) in alphabetical order
    const other = normalizedTypes
      .filter(t => 
        t.lower !== 'modules' && 
        t.lower !== 'features' && 
        t.lower !== 'support' && 
        t.lower !== 'bonus'
      )
      .map(t => t.original)
      .sort();
    result.push(...other);
    
    // 4. Support
    const supportType = normalizedTypes.find(t => t.lower === 'support');
    if (supportType) result.push(supportType.original);
    
    // 5. Bonus last
    const bonusType = normalizedTypes.find(t => t.lower === 'bonus');
    if (bonusType) result.push(bonusType.original);
    
    return result;
  }, [featuresGroupedByType]);

  return (
    <div className="max-w-6xl mx-auto mb-20">
      <div className="text-center mb-12">
        <h3 className="text-2xl font-extralight text-gray-700 mb-4">
          {translations.features}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                  {translations.features}
                </th>
                {plans.map((plan) => (
                  <th key={`${plan.planId}-${plan.name}`} className="text-center py-4 px-6 min-w-[120px]">
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      {plan.name}
                    </div>
                    <div className="flex flex-col items-center">
                      {plan.isPromotion ? (
                        <>
                          <span className="text-sm text-sky-500 line-through">
                            {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}
                            {hasOneTimePlans ? plan.monthlyPrice : (isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                          </span>
                          <div className="text-lg font-extralight text-gray-600">
                            {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}
                            {hasOneTimePlans
                              ? (plan.monthlyPromotionPrice || plan.monthlyPrice)
                              : (isAnnual
                                ? (plan.annualPromotionPrice || plan.annualPrice)
                                : (plan.monthlyPromotionPrice || plan.monthlyPrice)
                              )
                            }
                            {!hasOneTimePlans && (
                              <span className="text-xs text-gray-500">/mo</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {translations.limitedTimeOffer}
                          </span>
                        </>
                      ) : (
                        <div className="text-lg font-extralight text-gray-600">
                          {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}
                          {hasOneTimePlans ? plan.monthlyPrice : (isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                          {!hasOneTimePlans && (
                            <span className="text-xs text-gray-500">/mo</span>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasRealFeatures ? (
                orderedTypes.map((featureType) => {
                  const features = featuresGroupedByType[featureType];
                  if (!features || features.length === 0) return null;

                  const needsSubtitle = featureType !== 'features';
                  let typeDisplayName = '';

                  if (needsSubtitle) {
                    if (featureType === 'modules') {
                      typeDisplayName = 'Modules';
                    } else if (featureType === 'support') {
                      typeDisplayName = 'Support';
                    } else if (featureType === 'bonus') {
                      typeDisplayName = 'Bonus';
                    } else {
                      typeDisplayName = featureType.charAt(0).toUpperCase() + featureType.slice(1);
                    }
                  }

                  let rowIndex = 0;

                  return (
                    <React.Fragment key={featureType}>
                      {needsSubtitle && (
                        <tr className="border-b border-gray-200" style={{ backgroundColor: `${primaryColor}08` }}>
                          <td className="py-4 px-6 text-base font-bold text-gray-900" colSpan={plans.length + 1}>
                            {typeDisplayName}
                          </td>
                        </tr>
                      )}

                      {features.map((feature) => {
                        const currentRowIndex = rowIndex++;
                        const isImportant = ['modules', 'bonus', 'support'].includes(featureType.toLowerCase());
                        const textSize = isImportant ? 'text-base' : 'text-sm';
                        const fontWeight = isImportant ? 'font-medium' : 'font-normal';
                        const rowPadding = isImportant ? 'py-5' : 'py-4';
                        
                        return (
                          <tr 
                            key={feature.id} 
                            className={`border-b border-gray-100 ${currentRowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${isImportant ? 'bg-opacity-60' : ''}`}
                            tabIndex={0}
                            role="row"
                            aria-label={`Feature: ${feature.name}`}
                          >
                            <td className={`${rowPadding} px-6 ${textSize} text-gray-700 ${fontWeight}`}>
                              <Link
                                href={`/features/${feature.slug}`}
                                className="transition-colors px-1 -mx-1 rounded focus:outline-none focus:ring-2"
                                style={{ backgroundColor: 'transparent', outlineColor: primaryColor }}
                                onFocus={(e) => {
                                  e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                                  e.currentTarget.style.color = primaryColor;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#374151';
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                                  e.currentTarget.style.color = primaryColor;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#374151';
                                }}
                              >
                                {feature.name}
                              </Link>
                            </td>
                            {plans.map((plan) => (
                              <td key={`${plan.planId}-${feature.id}`} className="text-center py-4 px-6">
                                {planHasRealFeature(plan, feature, plans) ? (
                                  <CheckIcon className="h-5 w-5 mx-auto" style={{ color: primaryColor }} />
                                ) : (
                                  <XMarkIconSmall className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                getAllFeatures(plans).map((feature, index) => (
                  <tr key={feature} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-4 px-6 text-sm text-gray-700 font-light">
                      {feature}
                    </td>
                    {plans.map((plan, planIndex) => (
                      <td key={`${plan.name}-${feature}`} className="text-center py-4 px-6">
                        {planHasFeature(planIndex, feature, plans) ? (
                          <CheckIcon className="h-5 w-5 mx-auto" style={{ color: primaryColor }} />
                        ) : (
                          <XMarkIconSmall className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
