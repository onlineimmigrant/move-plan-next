'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ComparisonViewModel } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import PricingToggle from '@/components/pricing/PricingToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { comparisonAnalytics } from '@/lib/comparisonAnalytics';
import { PriceComparisonChart, FeatureCoverageChart, ValueMetrics } from '@/components/comparison/Charts';
import { Search, X } from 'lucide-react';

interface ComparisonSectionProps {
  section: any;
}

function ComparisonSectionContent({ section }: ComparisonSectionProps) {
  const [viewModel, setViewModel] = useState<ComparisonViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showYearly, setShowYearly] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [siteName, setSiteName] = useState('You');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const themeColors = useThemeColors();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comparison data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setViewModel(data);
      
      // Set currency and site name from the response
      if (data.currency) {
        setCurrency(data.currency);
      }
      if (data.siteName) {
        setSiteName(data.siteName);
      }
      
      // Track comparison view
      comparisonAnalytics.trackComparisonView({
        sectionId: section.id,
        organizationId: section.organization_id,
        competitorCount: data.competitors?.length || 0,
        featureCount: data.ourFeatures?.length || 0,
        mode: data.config?.mode || 'both',
      });
    } catch (error: any) {
      console.error('Error fetching comparison data:', error);
      setError(error.message || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }, [section.id, section.organization_id]);

  // Search handlers (CRM-style with debouncing)
  const handleSearchChange = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      // Track feature search analytics
      if (value) {
        comparisonAnalytics.trackFeatureSearch({
          sectionId: section.id,
          query: value,
          resultsCount: 0, // Will be updated after filtering
        });
      }
    }, 180);
  }, [section.id]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowAutocomplete(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Highlight matching text in search results
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      
      return (
        <>
          {parts.map((part, index) => {
            if (!part) return null;
            // When splitting with a capturing group, matched parts appear at odd indices
            const isMatch = index % 2 === 1;
            return isMatch ? (
              <span key={index} style={{ backgroundColor: 'rgb(219 234 254)', color: 'rgb(30 64 175)', padding: '0 2px', borderRadius: '2px' }}>
                {part}
              </span>
            ) : (
              <React.Fragment key={index}>{part}</React.Fragment>
            );
          })}
        </>
      );
    } catch (e) {
      console.error('Error in highlightMatch:', e);
      return text;
    }
  }, []);

  // Memoized computations - must be before early returns
  const showPricing = useMemo(() => 
    viewModel?.config?.mode === 'pricing' || viewModel?.config?.mode === 'both',
    [viewModel?.config?.mode]
  );
  
  const showFeatures = useMemo(() => 
    viewModel?.config?.mode === 'features' || viewModel?.config?.mode === 'both',
    [viewModel?.config?.mode]
  );

  // Memoize competitor headers for performance
  const competitorHeaders = useMemo(() => 
    viewModel?.competitors?.map((competitor) => (
      <th key={competitor.id} className="text-center p-3">
        <div className="flex flex-col items-center gap-1">
          {competitor.logo_url && (
            <img src={competitor.logo_url} alt={competitor.name} className="h-8 w-auto object-contain" />
          )}
          <span className="text-sm font-semibold">{competitor.name}</span>
        </div>
      </th>
    )) || [],
    [viewModel?.competitors]
  );

  // Filtered features based on search and differences toggle
  const filteredFeatures = useMemo(() => {
    if (!viewModel?.ourFeatures) return [];
    let features = viewModel.ourFeatures;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      features = features.filter(feature => 
        feature.name.toLowerCase().includes(query) ||
        feature.description?.toLowerCase().includes(query)
      );
      
      // Track search
      comparisonAnalytics.trackFeatureSearch({
        sectionId: section.id,
        query: searchQuery,
        resultsCount: features.length,
      });
    }
    
    // Filter by differences only
    if (showDifferencesOnly && viewModel?.competitors) {
      features = features.filter(feature => {
        const ourStatus = feature.status === 'available';
        const hasAnyDifference = viewModel.competitors.some(competitor => {
          const compFeature = competitor.data?.features?.find((f: any) => f.feature_id === feature.id);
          const compStatus = compFeature?.status === 'available';
          return ourStatus !== compStatus;
        });
        return hasAnyDifference;
      });
    }
    
    return features;
  }, [viewModel?.ourFeatures, viewModel?.competitors, searchQuery, showDifferencesOnly, section.id]);

  // Calculate chart data
  const priceChartData = useMemo(() => {
    console.log('=== STARTING PRICE CHART DATA CALCULATION ===');
    console.log('viewModel:', viewModel);
    console.log('viewModel.competitors:', viewModel?.competitors);
    console.log('viewModel.ourPricingPlans:', viewModel?.ourPricingPlans);
    
    if (!viewModel?.ourPricingPlans || viewModel.ourPricingPlans.length === 0) {
      console.log('No pricing plans available');
      return [];
    }
    if (!viewModel?.config || (viewModel.config.mode !== 'pricing' && viewModel.config.mode !== 'both')) {
      console.log('Config mode does not include pricing:', viewModel?.config?.mode);
      return [];
    }
    
    const plan = viewModel.ourPricingPlans[0];
    const isRecurring = plan.type === 'recurring';
    
    // plan.price is in cents, so divide by 100
    let ourPrice = 0;
    if (plan.price) {
      if (isRecurring && showYearly) {
        // Calculate annual price with discount
        ourPrice = (plan.price * 12 * (1 - (plan.annual_size_discount || 0) / 100)) / 100;
      } else {
        // Monthly or one-time price
        ourPrice = plan.price / 100;
      }
    }

    console.log('Price data:', { plan, isRecurring, ourPrice, showYearly, rawPrice: plan.price });

    if (!ourPrice || ourPrice <= 0) {
      console.log('No price available for current selection');
      return [];
    }

    const data = [{
      name: siteName,
      price: ourPrice,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel?.competitors) {
      console.log('=== PROCESSING COMPETITORS FOR PRICING ===');
      console.log('Total competitors:', viewModel.competitors.length);
      console.log('Our plan ID to match:', plan.id);
      
      viewModel.competitors.forEach(competitor => {
        console.log(`\n--- Competitor: ${competitor.name} ---`);
        console.log('Raw competitor.data:', competitor.data);
        console.log('competitor.data.plans exists?', !!competitor.data?.plans);
        console.log('competitor.data.plans:', competitor.data?.plans);
        
        // Find the competitor's plan that matches our selected plan
        const compPlan = competitor.data?.plans?.find((p: any) => {
          console.log('Checking plan:', p, 'against our_plan_id:', plan.id);
          return p.our_plan_id === plan.id;
        });
        
        console.log('Found matching plan?', !!compPlan);
        
        if (compPlan) {
          // CompetitorPlan has monthly and yearly fields for recurring plans
          let compPrice = 0;
          
          if (isRecurring) {
            // For recurring plans, use yearly or monthly based on toggle
            compPrice = showYearly ? (compPlan.yearly || 0) : (compPlan.monthly || 0);
          } else {
            // For one-time plans, try monthly first (legacy single price field)
            compPrice = compPlan.monthly || compPlan.yearly || (compPlan as any).price || 0;
          }
          
          // Ensure it's a number
          compPrice = Number(compPrice);
          
          console.log('Competitor price:', { name: competitor.name, compPrice, compPlan, isRecurring, showYearly, type: typeof compPrice });
          
          if (compPrice && !isNaN(compPrice) && compPrice > 0) {
            data.push({
              name: competitor.name,
              price: compPrice,
              color: '#6b7280',
            });
          } else {
            console.log('Skipping competitor - invalid price:', { name: competitor.name, compPrice, isRecurring, showYearly });
          }
        } else {
          console.log('No matching plan found for competitor:', { name: competitor.name, ourPlanId: plan.id });
        }
      });
    }

    console.log('=== FINAL PRICE CHART DATA ===');
    console.log('Total items in priceChartData:', data.length);
    console.log('All prices:', data.map(d => ({ name: d.name, price: d.price })));
    console.log('Price range:', data.length > 0 ? `${Math.min(...data.map(d => d.price))} - ${Math.max(...data.map(d => d.price))}` : 'N/A');
    console.log('===============================');
    return data;
  }, [viewModel?.ourPricingPlans, viewModel?.competitors, viewModel?.config, showYearly, siteName, themeColors]);

  const featureCoverageData = useMemo(() => {
    if (!viewModel?.ourFeatures || viewModel.ourFeatures.length === 0) {
      console.log('No features available');
      return [];
    }
    if (!viewModel?.config || (viewModel.config.mode !== 'features' && viewModel.config.mode !== 'both')) {
      console.log('Config mode does not include features:', viewModel?.config?.mode);
      return [];
    }

    const totalFeatures = viewModel.ourFeatures.length;
    // All our features in the database are considered "available" for our organization
    const ourAvailableCount = totalFeatures;

    console.log('Feature coverage data:', { totalFeatures, ourAvailableCount, features: viewModel.ourFeatures });

    const data = [{
      name: siteName,
      coverage: 100, // We have all our features
      availableCount: ourAvailableCount,
      totalCount: totalFeatures,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel?.competitors) {
      viewModel.competitors.forEach(competitor => {
        const availableCount = viewModel.ourFeatures.filter(feature => {
          const compFeature = competitor.data.features?.find((f: any) => f.our_feature_id === feature.id);
          return compFeature?.status === 'available';
        }).length;

        const coverage = viewModel.ourFeatures.length > 0
          ? Math.round((availableCount / viewModel.ourFeatures.length) * 100)
          : 0;

        data.push({
          name: competitor.name,
          coverage,
          availableCount,
          totalCount: viewModel.ourFeatures.length,
          color: '#6b7280',
        });
      });
    }

    return data;
  }, [viewModel?.ourFeatures, viewModel?.competitors, viewModel?.config, siteName, themeColors]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4">
        <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Comparison</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!viewModel) {
    return null;
  }

  const { competitors, ourPricingPlans, ourFeatures, config } = viewModel;
  
  // Handle case where config is undefined or missing
  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Comparison configuration is missing. Please configure this section in the admin panel.</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    <section className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {section.section_title || 'Compare Plans'}
          </h2>
          {section.section_description && (
            <p className="text-xl text-gray-600">{section.section_description}</p>
          )}
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2 no-print">
              Showing {filteredFeatures.length} of {ourFeatures.length} features
            </p>
          )}
        </div>



        {/* Filter Controls */}
        {showFeatures && ourFeatures.length > 0 && (
          <div className="mb-6 no-print flex justify-start md:justify-end">
            {/* CRM-Style Search */}
            <div className="relative w-full md:w-auto md:min-w-[320px] max-w-md">
              {/* Search Icon */}
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className={`h-5 w-5 transition-all duration-200 ${
                  searchQuery ? 'text-gray-600 dark:text-gray-300 scale-110' : 'text-gray-400'
                }`} />
              </span>
              
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                role="search"
                aria-label="Search features"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={(e) => {
                  setShowAutocomplete(true);
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  setTimeout(() => {
                    setShowAutocomplete(false);
                  }, 200);
                }}
                className="w-full pl-12 pr-24 py-3.5 text-base border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{
                  '--tw-ring-color': themeColors.primary,
                } as React.CSSProperties}
              />
              
              {/* Right Side Icons */}
              <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
                {/* Clear Button */}
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
                
                {/* Keyboard Shortcut Hint */}
                <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 rounded-md">
                  <kbd>⌘</kbd><kbd>K</kbd>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Comparison */}
        {showPricing && ourPricingPlans.length > 0 && (() => {
          const plan = ourPricingPlans[0]; // Single plan only
          const isRecurring = plan.type === 'recurring';
          
          return (
          <div className="mb-12">
            {isRecurring && config.pricing?.show_interval === 'both' && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center">
                  <PricingToggle
                    isAnnual={showYearly}
                    onToggle={(isAnnual) => {
                      setShowYearly(isAnnual);
                      comparisonAnalytics.trackPricingToggle({
                        sectionId: section.id,
                        interval: isAnnual ? 'yearly' : 'monthly',
                      });
                    }}
                    translations={{
                      monthly: 'Monthly',
                      annual: 'Annual'
                    }}
                    variant="inline"
                    size="md"
                  />
                </div>
              </div>
            )}

            {/* Pricing Table */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-base font-semibold">
                  {isRecurring ? 'Recurring Plan' : 'One-Time Purchase'}
                </h4>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {currency}
                </span>
              </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 text-sm font-semibold w-48">Plan</th>
                    <th
                      className="text-center p-3 text-sm font-semibold"
                      style={{
                        backgroundColor: config.ui?.highlight_ours
                          ? themeColors.cssVars.primary.lighter + '40'
                          : 'transparent',
                      }}
                    >
                      {siteName}
                    </th>
                    {competitorHeaders}
                  </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const monthlyPrice = plan.price ? (plan.price / 100).toFixed(0) : '—';
                        const annualPrice = plan.price ? ((plan.price * 12 * (1 - (plan.annual_size_discount || 0) / 100)) / 100).toFixed(0) : '—';
                        const displayPrice = (isRecurring && showYearly) ? annualPrice : monthlyPrice;
                        const planName = plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name;
                        return (
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-sm font-medium">{planName}</td>
                          <td
                            className="p-3 text-center text-base font-bold"
                            style={{
                              backgroundColor: config.ui?.highlight_ours
                                ? themeColors.cssVars.primary.lighter + '20'
                                : 'transparent',
                              color: config.ui?.highlight_ours
                                ? themeColors.cssVars.primary.base
                                : 'inherit',
                            }}
                          >
                            {displayPrice}
                          </td>
                          {competitors.map((competitor) => {
                            const competitorPlan = competitor.data.plans.find(
                              (p) => p.our_plan_id === plan.id
                            );
                            return (
                              <td key={competitor.id} className="p-3 text-center">
                                {competitorPlan ? (
                                  <div>
                                    <div className="text-base font-semibold">
                                      {isRecurring 
                                        ? (showYearly && competitorPlan.yearly
                                          ? competitorPlan.yearly
                                          : competitorPlan.monthly || '—')
                                        : ((competitorPlan as any).price || '—')}
                                    </div>
                                    {competitorPlan.note && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {competitorPlan.note}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
          );
        })()}

        {/* Feature Comparison */}
        {showFeatures && filteredFeatures.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Features Comparison
              {searchQuery && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredFeatures.length} of {ourFeatures.length} features)
                </span>
              )}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 text-sm font-semibold sticky left-0 bg-white w-48">
                      Feature
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold"
                      style={{
                        backgroundColor: config.ui?.highlight_ours
                          ? themeColors.cssVars.primary.lighter + '40'
                          : 'transparent',
                      }}
                    >
                      {siteName}
                    </th>
                    {competitorHeaders}
                  </tr>
                </thead>
                <tbody>
                  {filteredFeatures.map((feature) => (
                    <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm sticky left-0 bg-white font-medium">
                        <div>
                          {searchQuery ? highlightMatch(feature.name, searchQuery) : feature.name}
                        </div>
                        {feature.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {searchQuery ? highlightMatch(feature.description, searchQuery) : feature.description}
                          </div>
                        )}
                      </td>
                      <td
                        className="p-3 text-center"
                        style={{
                          backgroundColor: config.ui?.highlight_ours
                            ? themeColors.cssVars.primary.lighter + '20'
                            : 'transparent',
                        }}
                      >
                        <span className="text-green-600 text-xl">✓</span>
                      </td>
                      {competitors.map((competitor) => {
                        const competitorFeature = competitor.data.features.find(
                          (f) => f.our_feature_id === feature.id
                        );
                        const status = competitorFeature?.status || 'unknown';
                        
                        return (
                          <td key={competitor.id} className="p-3 text-center">
                            {status === 'available' && (
                              <span className="text-green-600 text-xl">✓</span>
                            )}
                            {status === 'partial' && (
                              <span className="text-yellow-600 text-xl">~</span>
                            )}
                            {status === 'unavailable' && (
                              <span className="text-red-600 text-xl">✕</span>
                            )}
                            {status === 'unknown' && (
                              <span className="text-gray-400">—</span>
                            )}
                            {competitorFeature?.note && (
                              <div className="text-xs text-gray-500 mt-1">
                                {competitorFeature.note}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Value Metrics */}
        <div className="mt-12">
        <ValueMetrics
          metrics={[
            {
              label: 'Competitors',
              value: competitors.length,
              icon: <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            },
            {
              label: 'Features',
              value: ourFeatures.length,
              icon: <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            },
            {
              label: `${siteName} Advantage`,
              value: (() => {
                if (!competitors || competitors.length === 0) return ourFeatures.length;
                // Count features that we have but competitors don't have as 'available'
                return ourFeatures.filter(ourFeature => {
                  // Check if ALL competitors either don't have this feature or have it as non-available
                  const hasAdvantage = competitors.every(competitor => {
                    const compFeature = competitor.data?.features?.find(
                      (cf: any) => cf.our_feature_id === ourFeature.id
                    );
                    // We have advantage if competitor doesn't have it or has it as unavailable/partial/unknown
                    return !compFeature || compFeature.status !== 'available';
                  });
                  return hasAdvantage;
                }).length;
              })(),
              icon: <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            },
            {
              label: 'Price Range',
              value: (() => {
                const dataLength = priceChartData?.length || 0;
                console.log('>>> Price Range Metric - priceChartData:', { dataLength, data: priceChartData });
                
                if (dataLength === 0) return 'N/A';
                if (dataLength === 1) return `${currency}${Math.round(priceChartData[0].price).toLocaleString()}`;
                
                const prices = priceChartData.map(d => d.price);
                const minPrice = Math.round(Math.min(...prices));
                const maxPrice = Math.round(Math.max(...prices));
                const result = `${currency}${minPrice.toLocaleString()} - ${currency}${maxPrice.toLocaleString()}`;
                
                console.log('>>> Price Range Result:', result);
                return result;
              })(),
              icon: <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
          ]}
        />

        {/* Visual Charts */}
        {(priceChartData.length > 0 || featureCoverageData.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8 no-print">
            {priceChartData.length > 0 && (
              <PriceComparisonChart data={priceChartData} currency={currency} />
            )}
            {featureCoverageData.length > 0 && (
              <FeatureCoverageChart data={featureCoverageData} />
            )}
          </div>
        )}
        </div>

        {/* Disclaimer */}
        {config.ui?.show_disclaimer && (
          <div className="mt-8 text-center text-sm text-gray-500">
            {config.ui.disclaimer_text ||
              'Pricing and feature information is based on publicly available data and may not be current. Please verify with providers.'}
          </div>
        )}
      </div>
    </section>
    </>
  );
}

export default function ComparisonSection(props: ComparisonSectionProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="py-10 px-4">
          <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Comparison Section Error
            </h3>
            <p className="text-sm text-red-700">
              An unexpected error occurred while rendering the comparison section.
              Please refresh the page or contact support if the problem persists.
            </p>
          </div>
        </div>
      }
    >
      <ComparisonSectionContent {...props} />
    </ErrorBoundary>
  );
}
