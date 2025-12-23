'use client';

import React from 'react';
import { ComparisonCompetitor } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CheckIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import {
  buildCompetitorFeatureIndex,
  buildCompetitorPlanIndex,
  makeCompetitorFeatureKey,
} from '@/lib/comparison/indexes';

// Currency code to symbol mapping
const getCurrencySymbol = (code: string): string => {
  const currencyMap: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'INR': '₹',
    'RUB': '₽',
    'BRL': 'R$',
    'ZAR': 'R',
    'KRW': '₩',
    'MXN': 'MX$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'TRY': '₺',
    'AED': 'د.إ',
    'SAR': 'ر.س',
  };
  return currencyMap[code.toUpperCase()] || code;
};

interface ComparisonPreviewProps {
  config: any;
  competitors: ComparisonCompetitor[];
  pricingPlans: any[];
  features: any[];
  currency?: string;
  siteName?: string;
}

export function ComparisonPreview({
  config,
  competitors,
  pricingPlans,
  features,
  currency = '$',
  siteName = 'You'
}: ComparisonPreviewProps) {
  const themeColors = useThemeColors();
  const selectedCompetitors = competitors.filter(c => config.competitor_ids.includes(c.id));
  const plan = pricingPlans.find(p => p.id === config.selected_plan_id);

  const competitorPlanIndex = React.useMemo(
    () => buildCompetitorPlanIndex(selectedCompetitors),
    [selectedCompetitors]
  );
  const competitorFeatureIndex = React.useMemo(
    () => buildCompetitorFeatureIndex(selectedCompetitors),
    [selectedCompetitors]
  );

  const currencyCode = (() => {
    const raw = (config?.currency ?? currency);
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
    return undefined;
  })();

  const currencySymbol = currencyCode ? getCurrencySymbol(currencyCode) : currency;

  if (!config.selected_plan_id || selectedCompetitors.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          {!config.selected_plan_id
            ? "Please select a pricing plan first"
            : "Please select competitors to preview"
          }
        </p>
      </div>
    );
  }

  const showPricing = config.mode === 'pricing' || config.mode === 'both';
  const showFeatures = config.mode === 'features' || config.mode === 'both';
  const isRecurring = plan?.type === 'recurring';
  const planName = plan ? (plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name) : 'No plan selected';

  // Group features by type
  const groupedFeatures = features.reduce((acc: any, feature: any) => {
    const type = feature.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(feature);
    return acc;
  }, {});

  // Sort features within each group
  Object.keys(groupedFeatures).forEach(type => {
    groupedFeatures[type].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Comparison Preview</h3>
        <p className="text-sm text-gray-600 mb-6">
          This is how your comparison will appear to visitors.
        </p>
      </div>

      {/* Pricing Table */}
      {showPricing && plan && (
        <div>
          <div className="flex justify-end mb-3">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {currencyCode ? (
                <>
                  <span className="hidden sm:inline mr-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Currency
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                    {currencyCode}
                  </span>
                  <span className="mx-1 text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{currencySymbol}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline mr-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Currency
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{currencySymbol}</span>
                </>
              )}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold w-40 sm:w-48">
                    {isRecurring ? 'Plan (Recurring)' : 'Plan (One-time)'}
                  </th>
                  <th
                    className="text-center p-2 sm:p-3 text-xs sm:text-sm font-semibold w-24 sm:w-32"
                    style={{
                      backgroundColor: config.ui?.highlight_ours
                        ? themeColors.cssVars.primary.lighter + '40'
                        : 'transparent',
                    }}
                  >
                    {siteName}
                  </th>
                  {selectedCompetitors.map(comp => (
                    <th key={comp.id} className="text-center p-2 sm:p-3 text-xs sm:text-sm font-semibold w-24 sm:w-32">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium w-40 sm:w-48 whitespace-normal wrap-break-word">{planName}</td>
                  <td
                    className="p-2 sm:p-3 text-center text-sm sm:text-base font-bold w-24 sm:w-32 tabular-nums"
                    style={{
                      backgroundColor: config.ui?.highlight_ours
                        ? themeColors.cssVars.primary.lighter + '20'
                        : 'transparent',
                      color: config.ui?.highlight_ours
                        ? themeColors.cssVars.primary.base
                        : 'inherit',
                    }}
                  >
                    {plan.price ? `${currencySymbol}${(plan.price / 100).toFixed(0)}` : '—'}
                  </td>
                  {selectedCompetitors.map(competitor => {
                    const competitorPlan = competitorPlanIndex.get(competitor.id)?.get(plan.id);
                    return (
                      <td key={competitor.id} className="p-2 sm:p-3 text-center w-24 sm:w-32">
                        {competitorPlan ? (
                          <div>
                            <div className="text-sm sm:text-base font-semibold tabular-nums">
                              {(() => {
                                const price = isRecurring 
                                  ? (competitorPlan.monthly || '—')
                                  : ((competitorPlan as any).price || '—');
                                return price !== '—' ? `${currencySymbol}${price}` : price;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                {(() => {
                  // Calculate add-on features cost (sum of currency-unit features)
                  const calculateAddOns = (competitorId?: string) => {
                    if (!competitorId) return 0; // Organization has 0 add-ons by default
                    const competitorFeatures = competitorFeatureIndex.get(competitorId);
                    
                    const monthlyTotal = features.reduce((total, feature) => {
                      if (
                        config?.features?.filter?.display_on_product &&
                        !feature.display_on_product_card
                      ) {
                        return total;
                      }

                      const competitorFeature = competitorFeatures?.get(
                        makeCompetitorFeatureKey(feature.plan_id, feature.id)
                      );
                      
                      if (competitorFeature?.status === 'amount' && competitorFeature?.unit === 'currency') {
                        const amount = parseFloat(competitorFeature.amount || '0') || 0;
                        return total + amount;
                      }
                      return total;
                    }, 0);
                    
                    // Note: Preview doesn't have yearly toggle, so we don't multiply by 12 here
                    // If you add yearly toggle to preview, use: (isRecurring && showYearly) ? monthlyTotal * 12 : monthlyTotal
                    return monthlyTotal;
                  };

                  const ourPlanPrice = plan?.price ? (plan.price / 100) : 0;

                  return (
                    <>
                      {/* Add-on Features Row */}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">Add-on Features</td>
                        <td
                          className="p-2 sm:p-3 text-center text-xs sm:text-sm tabular-nums"
                          style={{
                            backgroundColor: config.ui?.highlight_ours
                              ? themeColors.cssVars.primary.lighter + '20'
                              : 'transparent',
                          }}
                        >
                          {currencySymbol}0
                        </td>
                        {selectedCompetitors.map((competitor) => {
                          const addOnCost = calculateAddOns(competitor.id);
                          return (
                            <td key={competitor.id} className="p-2 sm:p-3 text-center text-xs sm:text-sm tabular-nums">
                              {addOnCost > 0 ? `${currencySymbol}${addOnCost.toFixed(0)}` : '—'}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Total Cost Row */}
                      <tr className="bg-gray-200 font-bold">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">Total Cost</td>
                        <td
                          className="p-2 sm:p-3 text-center text-sm sm:text-base tabular-nums"
                          style={{
                            backgroundColor: config.ui?.highlight_ours
                              ? themeColors.cssVars.primary.lighter + '30'
                              : 'transparent',
                            color: config.ui?.highlight_ours
                              ? themeColors.cssVars.primary.base
                              : 'inherit',
                          }}
                        >
                          {currencySymbol}{ourPlanPrice.toFixed(0)}
                        </td>
                        {selectedCompetitors.map((competitor) => {
                          const competitorPlan = competitor.data?.plans?.find(
                            (p: any) => p.our_plan_id === plan?.id
                          );
                          const planPrice = isRecurring
                            ? parseFloat(String(competitorPlan?.monthly || '0'))
                            : parseFloat(String((competitorPlan as any)?.price || '0'));
                          
                          const addOnCost = calculateAddOns(competitor.id);
                          const totalCost = planPrice + addOnCost;

                          return (
                            <td key={competitor.id} className="p-2 sm:p-3 text-center text-sm sm:text-base tabular-nums">
                              {totalCost > 0 ? `${currencySymbol}${totalCost.toFixed(0)}` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Features Table */}
      {showFeatures && features.length > 0 && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold md:sticky md:left-0 bg-white w-40 sm:w-48">
                    Feature
                  </th>
                  <th
                    className="text-center p-2 sm:p-3 text-xs sm:text-sm font-semibold w-24 sm:w-32"
                    style={{
                      backgroundColor: config.ui?.highlight_ours
                        ? themeColors.cssVars.primary.lighter + '40'
                        : 'transparent',
                    }}
                  >
                    {siteName}
                  </th>
                  {selectedCompetitors.map(comp => (
                    <th key={comp.id} className="text-center p-2 sm:p-3 text-xs sm:text-sm font-semibold w-24 sm:w-32">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedFeatures).map(([type, typeFeatures]: [string, any]) => (
                  <React.Fragment key={type}>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2 + selectedCompetitors.length}
                        className="p-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600"
                      >
                        {type}
                      </td>
                    </tr>
                    {typeFeatures.map((feature: any) => (
                      <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm md:sticky md:left-0 bg-white font-medium w-40 sm:w-48 whitespace-normal wrap-break-word">
                          <div>{feature.name}</div>
                          {feature.description && (
                            <div className="text-xs text-gray-500 mt-1">{feature.description}</div>
                          )}
                        </td>
                        <td
                          className="p-2 sm:p-3 text-center w-24 sm:w-32"
                          style={{
                            backgroundColor: config.ui?.highlight_ours
                              ? themeColors.cssVars.primary.lighter + '20'
                              : 'transparent',
                          }}
                        >
                          <span className="text-green-600 text-xl">✓</span>
                        </td>
                        {selectedCompetitors.map((competitor) => {
                          // Find the competitor's feature that matches the feature and plan
                          const competitorFeature = competitor.data?.features?.find(
                            (f: any) => f.our_feature_id === feature.id && f.our_plan_id === feature.plan_id
                          );
                          const status = competitorFeature?.status || 'unknown';
                          const amount = competitorFeature?.amount;
                          const unit = competitorFeature?.unit || 'custom';

                          const formatAmount = () => {
                            if (!amount) return null;
                            if (unit === 'currency') {
                              return `${currencySymbol}${amount}`;
                            }
                            if (unit === 'custom') {
                              return amount;
                            }
                            return `${amount} ${unit}`;
                          };

                          return (
                            <td key={competitor.id} className="p-2 sm:p-3 text-center w-24 sm:w-32">
                              {status === 'available' && (
                                <span className="text-green-600 text-xl">✓</span>
                              )}
                              {status === 'partial' && (
                                <span className="text-yellow-600 text-xl">~</span>
                              )}
                              {status === 'unavailable' && (
                                <span className="text-red-600 text-xl">✕</span>
                              )}
                              {status === 'amount' && (
                                <span className="text-blue-600 text-sm font-medium">{formatAmount()}</span>
                              )}
                              {status === 'unknown' && (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Configuration Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Mode:</span>
            <span className="ml-2 capitalize">{config.mode || 'both'}</span>
          </div>
          <div>
            <span className="font-medium">Competitors:</span>
            <span className="ml-2">{selectedCompetitors.length}</span>
          </div>
          <div>
            <span className="font-medium">Features:</span>
            <span className="ml-2">{features.length}</span>
          </div>
          <div>
            <span className="font-medium">Pricing display:</span>
            <span className="ml-2">{config.pricing?.show_interval || 'both'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}