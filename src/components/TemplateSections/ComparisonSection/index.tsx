'use client';

import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PricingToggle from '@/components/pricing/PricingToggle';
import { useThemeColors } from '@/hooks/useThemeColors';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { comparisonAnalytics } from '@/lib/comparisonAnalytics';
import { Plus, Minus } from 'lucide-react';
import { ComparisonSectionProps } from './types';
import { useComparisonData } from './hooks/useComparisonData';
import { useCompetitorIndexes } from './hooks/useCompetitorIndexes';
import { useComparisonFilters } from './hooks/useComparisonFilters';
import { useAccordionState } from './hooks/useAccordionState';
import { useComparisonHierarchy } from './hooks/useComparisonHierarchy';
import { SearchBar } from './components/SearchBar';
import { PricingTable } from './components/PricingTable';
import { FeatureTable } from './components/FeatureTable';
import { FeatureTableHeader } from './components/FeatureTable/FeatureTableHeader';
import { FETCH_DEBOUNCE, TABLE_CELL_PADDING, TABLE_COL_WIDTH, TABLE_HEADER_TEXT, COMP_COL_BORDER } from './constants';
import { getCurrencySymbol } from './utils/formatting';

// Lazy load the visual chart component
const FeatureCoverageChart = lazy(() => 
  import('@/components/comparison/Charts').then(module => ({ 
    default: module.FeatureCoverageChart 
  }))
);

function ComparisonSectionContent({ section }: ComparisonSectionProps) {
  // UI State
  const [showYearly, setShowYearly] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[] | null>(null);
  const [showAddCompetitorMenu, setShowAddCompetitorMenu] = useState(false);
  const [showScoringMethodology, setShowScoringMethodology] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout>();
  
  // Theme colors
  const themeColors = useThemeColors();
  
  // Data & state hooks
  const { viewModel, loading, error, fetchData } = useComparisonData(section, selectedPlanId, selectedCompetitorIds);
  const { competitorFeatureIndex, competitorPlanIndex } = useCompetitorIndexes(viewModel);
  const { 
    searchQuery, 
    setSearchQuery, 
    showDifferencesOnly, 
    setShowDifferencesOnly,
    filteredFeatures,
    clearSearch
  } = useComparisonFilters(viewModel, competitorFeatureIndex, section.id);
  
  const {
    expandedHubs,
    expandedModules,
    expandedFeatures,
    setExpandedHubs,
    setExpandedModules,
    toggleHub,
    toggleModule,
    toggleFeatureExpansion,
  } = useAccordionState();

  const { sortedHierarchy, sortedHubNames, aggregatedStatusCache } = useComparisonHierarchy(
    filteredFeatures,
    viewModel?.competitors,
    competitorFeatureIndex
  );

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, FETCH_DEBOUNCE);
    
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Initialize hub expansion - always keep one open
  useEffect(() => {
    setExpandedHubs((prev) => {
      if (sortedHubNames.length === 0) {
        return prev.size === 0 ? prev : new Set();
      }

      const next = new Set<string>();
      for (const hubName of prev) {
        if (sortedHubNames.includes(hubName)) next.add(hubName);
      }
      if (next.size === 0) next.add(sortedHubNames[0]);

      if (next.size === prev.size) {
        let identical = true;
        for (const hubName of prev) {
          if (!next.has(hubName)) {
            identical = false;
            break;
          }
        }
        if (identical) return prev;
      }

      return next;
    });
  }, [sortedHubNames, setExpandedHubs]);

  // Initialize module expansion - all modules expanded by default
  useEffect(() => {
    if (!viewModel?.ourFeatures) return;
    
    const allModuleKeys = new Set<string>();
    sortedHierarchy.forEach(({ hubName, sortedModules }) => {
      sortedModules.forEach(({ moduleName }) => {
        allModuleKeys.add(`${hubName}|${moduleName}`);
      });
    });
    
    setExpandedModules(allModuleKeys);
  }, [viewModel?.ourFeatures, sortedHierarchy, setExpandedModules]);

  // Initialize selected plan and competitors
  useEffect(() => {
    if (!selectedPlanId && viewModel?.ourPricingPlans?.[0]) {
      const initialPlanId = viewModel.ourPricingPlans[0].id || viewModel.config?.selected_plan_id || null;
      if (initialPlanId) {
        setSelectedPlanId(initialPlanId);
      }
    }
    if (!selectedCompetitorIds && viewModel) {
      const initialCompetitorIds = Array.isArray(viewModel.config?.competitor_ids) 
        ? viewModel.config.competitor_ids 
        : [];
      if (initialCompetitorIds.length > 0) {
        setSelectedCompetitorIds(initialCompetitorIds);
      } else {
        // fallback to whatever was returned
        const returnedIds = (viewModel.competitors ?? []).map(c => c.id).filter(Boolean);
        setSelectedCompetitorIds(returnedIds.length > 0 ? returnedIds : []);
      }
    }
  }, [viewModel?.ourPricingPlans, viewModel?.competitors, viewModel?.config, selectedPlanId, selectedCompetitorIds]);

  // Debounced search handler
  const handleSearchChange = React.useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setShowAutocomplete(true);
      // Track feature search analytics
      if (value) {
        comparisonAnalytics.trackFeatureSearch({
          sectionId: section.id,
          query: value,
          resultsCount: 0, // Will be updated after filtering
        });
      }
    }, 180);
  }, [setSearchQuery, section.id]);

  const handleClearSearch = React.useCallback(() => {
    clearSearch();
    setShowAutocomplete(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [clearSearch]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fetch data when selectedPlanId or selectedCompetitorIds change (with debouncing)
  const fetchDebounceTimerRef = React.useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (fetchDebounceTimerRef.current) {
      clearTimeout(fetchDebounceTimerRef.current);
    }
    
    fetchDebounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, 150);
    
    return () => {
      if (fetchDebounceTimerRef.current) {
        clearTimeout(fetchDebounceTimerRef.current);
      }
    };
  }, [fetchData]);

  // Memoize competitor headers with remove functionality and logos/links
  const competitorHeaders = useMemo(() => {
    const selected = viewModel?.competitors ?? [];
    const totalAvailable = viewModel?.availableCompetitors?.length ?? selected.length;
    const canRemoveCompetitors = totalAvailable > 1 && selected.length > 0;

    return selected.map((competitor) => (
      <th
        key={competitor.id}
        className={`group/competitor text-center ${TABLE_CELL_PADDING} ${TABLE_COL_WIDTH} ${TABLE_HEADER_TEXT} relative overflow-hidden ${COMP_COL_BORDER}`}
      >
        <div className="flex flex-col items-center gap-1">
          {canRemoveCompetitors && (
            <button
              type="button"
              onClick={() => {
                setShowAddCompetitorMenu(false);
                setSelectedCompetitorIds((prev) => {
                  const current = (prev && prev.length > 0)
                    ? prev
                    : (viewModel?.competitors ?? []).map((c) => c.id);
                  return current.filter((id) => id !== competitor.id);
                });
                // comparisonAnalytics.trackCompetitorRemove - not yet implemented
              }}
              className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hidden group-hover/competitor:inline-flex hover:bg-gray-50 focus:inline-flex"
              aria-label={`Remove ${competitor.name} from comparison`}
              title="Remove competitor"
            >
              <Minus className="h-4 w-4" />
            </button>
          )}
          {(competitor as any).logo_url && (
            <img
              src={(competitor as any).logo_url}
              alt={competitor.name}
              className="h-6 sm:h-8 w-auto object-contain"
            />
          )}
          {(competitor as any).website_url ? (
            <a 
              href={(competitor as any).website_url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-xs sm:text-sm font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {competitor.name}
            </a>
          ) : (
            <span className="text-xs sm:text-sm font-semibold">{competitor.name}</span>
          )}
        </div>
      </th>
    ));
  }, [viewModel?.competitors, viewModel?.availableCompetitors, section.id]);

  // Calculate chart data
  const priceChartData = useMemo(() => {
    if (!viewModel?.ourPricingPlans || viewModel.ourPricingPlans.length === 0) return [];
    if (!viewModel?.config || (viewModel.config.mode !== 'pricing' && viewModel.config.mode !== 'both')) return [];

    const plan = viewModel.ourPricingPlans[0];
    const isRecurring = plan.type === 'recurring';
    const siteName = viewModel.siteName || 'You';

    const calculateAddOns = (competitorId?: string) => {
      if (!competitorId) return 0;
      const competitorFeatures = competitorFeatureIndex.get(competitorId);
      const monthlyTotal = (viewModel.ourFeatures || []).reduce((total, feature) => {
        const competitorFeature = competitorFeatures?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
        if (competitorFeature?.status === 'amount' && competitorFeature?.unit === 'currency') {
          const amount = parseFloat(competitorFeature.amount || '0') || 0;
          return total + amount;
        }
        return total;
      }, 0);
      return (isRecurring && showYearly) ? monthlyTotal * 12 : monthlyTotal;
    };

    const ourPlanPrice = plan.price ? (plan.price / 100) : 0;
    const ourPrice = isRecurring && showYearly
      ? ourPlanPrice * 12 * (1 - (plan.annual_size_discount || 0) / 100)
      : ourPlanPrice;

    const data: any[] = [{
      name: siteName,
      planPrice: ourPrice,
      addOnCost: 0,
      price: ourPrice,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel.competitors) {
      viewModel.competitors.forEach(competitor => {
        const compPlan = competitorPlanIndex.get(competitor.id)?.get(plan.id);
        if (compPlan) {
          let compPrice = isRecurring
            ? (showYearly && compPlan.yearly ? Number(compPlan.yearly) : Number(compPlan.monthly || 0))
            : Number((compPlan as any).price || 0);
          
          if (compPrice && !isNaN(compPrice) && compPrice > 0) {
            const addOns = calculateAddOns(competitor.id);
            data.push({
              name: competitor.name,
              planPrice: compPrice,
              addOnCost: addOns,
              price: compPrice + addOns,
              color: '#6b7280',
            });
          }
        }
      });
    }
    return data;
  }, [viewModel, showYearly, themeColors, competitorPlanIndex, competitorFeatureIndex]);

  const featureCoverageData = useMemo(() => {
    if (!viewModel?.ourFeatures || viewModel.ourFeatures.length === 0) return [];
    if (!viewModel?.config || (viewModel.config.mode !== 'features' && viewModel.config.mode !== 'both')) return [];

    const totalFeatures = viewModel.ourFeatures.length;
    const siteName = viewModel.siteName || 'You';

    const data: any[] = [{
      name: siteName,
      coverage: 100,
      availableCount: totalFeatures,
      partialCount: 0,
      paidCount: 0,
      customCount: 0,
      totalCount: totalFeatures,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel.competitors) {
      viewModel.competitors.forEach(competitor => {
        const competitorFeatures = competitorFeatureIndex.get(competitor.id);
        const statusCounts = { available: 0, partial: 0, paid: 0, custom: 0 };

        viewModel.ourFeatures.forEach(feature => {
          const compFeature = competitorFeatures?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
          if (compFeature?.status === 'available') statusCounts.available++;
          else if (compFeature?.status === 'partial') statusCounts.partial++;
          else if (compFeature?.status === 'amount' && compFeature?.unit === 'currency') statusCounts.paid++;
          else if (compFeature?.status === 'amount' && compFeature?.unit === 'custom') statusCounts.custom++;
        });

        const coverage = totalFeatures > 0 ? Math.round((statusCounts.available / totalFeatures) * 100) : 0;
        data.push({
          name: competitor.name,
          coverage,
          availableCount: statusCounts.available,
          partialCount: statusCounts.partial,
          paidCount: statusCounts.paid,
          customCount: statusCounts.custom,
          totalCount: totalFeatures,
          color: '#6b7280',
        });
      });
    }
    return data;
  }, [viewModel, themeColors, competitorFeatureIndex]);

  if (loading && !viewModel) {
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!viewModel) {
    return (
      <div className="py-10 text-center text-gray-500">
        <p>No comparison data available.</p>
      </div>
    );
  }

  const config = viewModel.config;
  if (!config) {
    return (
      <div className="py-10 text-center text-gray-500">
        <p>Comparison configuration is missing. Please configure this section in the admin panel.</p>
      </div>
    );
  }

  // Get data for rendering
  const plan = viewModel.ourPricingPlans?.find(p => p.id === selectedPlanId) || viewModel.ourPricingPlans?.[0];
  const competitors = viewModel.competitors || [];
  const ourFeatures = viewModel.ourFeatures || [];
  const siteName = viewModel.siteName || 'You';
  const organizationLogo = viewModel.organizationLogo;
  const currencyCode = viewModel.currency || 'USD';
  const currency = getCurrencySymbol(currencyCode);
  
  const showPricing = config.mode === 'pricing' || config.mode === 'both';
  const showFeatures = config.mode === 'features' || config.mode === 'both';
  const isRecurring = plan?.type === 'recurring';

  // Prefetch handler for plan switching
  const prefetchPlanData = (planId: string) => {
    // TODO: Implement prefetch logic
  };

  // Plan selection state
  const ourPricingPlans = viewModel.ourPricingPlans || [];
  const availablePricingPlans = viewModel.availablePricingPlans || ourPricingPlans;
  
  // Filter available plans to only show plans from the same product as the current plan
  const filteredAvailablePlans = ourPricingPlans[0]?.product_name
    ? availablePricingPlans.filter(p => p.product_name === ourPricingPlans[0].product_name)
    : availablePricingPlans;
  
  const canSwitchPlans = (config.ui?.allow_plan_selection ?? true) && (filteredAvailablePlans?.length || 0) > 1;

  // Add/remove competitors
  const remainingCompetitors = (viewModel.availableCompetitors || []).filter(
    c => !selectedCompetitorIds?.includes(c.id)
  );
  const canAddCompetitors = remainingCompetitors.length > 0;

  const addCompetitorControl = canAddCompetitors ? (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowAddCompetitorMenu((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        aria-label="Add competitor"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add</span>
      </button>

      {showAddCompetitorMenu && remainingCompetitors.length > 0 && (
        <div className="absolute left-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
          <div className="p-2">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Add competitor
            </div>
            <div className="mt-1 max-h-64 overflow-auto">
              {remainingCompetitors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const next = Array.from(new Set([...(selectedCompetitorIds ?? competitors.map((cc) => cc.id)), c.id]));
                    setSelectedCompetitorIds(next);
                    setShowAddCompetitorMenu(false);
                    // comparisonAnalytics.trackCompetitorAdd - not yet implemented
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {(c as any).logo_url ? (
                    <img src={(c as any).logo_url} alt={c.name} className="h-5 w-5 object-contain" />
                  ) : (
                    <div className="h-5 w-5 rounded bg-gray-100" />
                  )}
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;

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
      <section className="py-10">
        <div className="max-w-7xl mx-auto">
          <div className="w-full overflow-hidden">
            {/* Header */}
            {((config.ui?.show_title ?? true) || (config.ui?.show_description ?? true)) && (
              <div className="text-center mb-8">
                {(config.ui?.show_title ?? true) && (
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {(section as any).section_title || section.title || 'Compare Plans'}
                  </h2>
                )}
                {(config.ui?.show_description ?? true) && ((section as any).section_description || section.description) && (
                  <p className="text-xl text-gray-600">{(section as any).section_description || section.description}</p>
                )}
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2 no-print">
                    Showing {filteredFeatures.length} of {ourFeatures.length} features
                  </p>
                )}
              </div>
            )}

            {/* Search Bar - positioned after header, before pricing controls */}
            {(config.ui?.show_search ?? true) && showFeatures && (
              <div className="mb-6 no-print flex justify-start md:justify-end">
                <div className="w-full md:w-auto md:min-w-[320px] max-w-md">
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showDifferencesOnly={showDifferencesOnly}
                    setShowDifferencesOnly={setShowDifferencesOnly}
                    clearSearch={handleClearSearch}
                    hideDifferencesToggle={true}
                    themeColors={themeColors}
                    onSearchChange={handleSearchChange}
                  />
                </div>
              </div>
            )}

            {/* Pricing Toggle with Add Competitor and Currency Badge */}
            {showPricing && plan && (
              <div className="mb-6">
                {isRecurring && config.pricing?.show_interval === 'both' ? (
                  <div className="flex items-center justify-between gap-2 sm:grid sm:grid-cols-3 sm:items-center">
                    <div className="flex justify-start">
                      {addCompetitorControl}
                    </div>
                    <div className="flex justify-center">
                      <PricingToggle
                        isAnnual={showYearly}
                        onToggle={(isAnnual) => {
                          setShowYearly(isAnnual);
                          comparisonAnalytics.trackPricingToggle({
                            sectionId: section.id,
                            interval: isAnnual ? 'yearly' : 'monthly',
                          });
                        }}
                        translations={{ monthly: 'Monthly', annual: 'Annual' }}
                        variant="inline"
                        size="md"
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {viewModel?.currency ? (
                          <>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                              {currencyCode}
                            </span>
                            <span className="mx-1 text-gray-400 dark:text-gray-500">·</span>
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{currency}</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{currency}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div className="flex justify-start">
                      {addCompetitorControl}
                    </div>
                    <div className="flex justify-end">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {viewModel?.currency ? (
                          <>
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                              {currencyCode}
                            </span>
                            <span className="mx-1 text-gray-400 dark:text-gray-500">·</span>
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{currency}</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{currency}</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comparison Tables */}
            {plan && showPricing && (
              <PricingTable
                plan={plan}
                competitors={competitors}
                competitorPlanIndex={competitorPlanIndex}
                competitorFeatureIndex={competitorFeatureIndex}
                ourFeatures={ourFeatures}
                themeColors={themeColors}
                config={config}
                siteName={siteName}
                isRecurring={isRecurring}
                showYearly={showYearly}
                selectedPlanId={selectedPlanId}
                canSwitchPlans={canSwitchPlans}
                filteredAvailablePlans={filteredAvailablePlans}
                organizationLogo={organizationLogo}
                competitorHeaders={competitorHeaders}
                setSelectedPlanId={setSelectedPlanId}
                setShowYearly={setShowYearly}
                prefetchPlanData={prefetchPlanData}
                showScoringMethodology={showScoringMethodology}
                setShowScoringMethodology={setShowScoringMethodology}
                filteredFeatures={filteredFeatures}
              />
            )}

            {/* Feature Comparison Table */}
            {showFeatures && ourFeatures.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <FeatureTableHeader
                    config={config}
                    themeColors={themeColors}
                    siteName={siteName}
                    organizationLogo={organizationLogo}
                    competitorHeaders={competitorHeaders}
                  />
                  <tbody>
                    <FeatureTable
                      sortedHierarchy={sortedHierarchy}
                      competitors={competitors}
                      config={config}
                      themeColors={themeColors}
                      competitorFeatureIndex={competitorFeatureIndex}
                      aggregatedStatusCache={aggregatedStatusCache}
                      expandedHubs={expandedHubs}
                      expandedModules={expandedModules}
                      expandedFeatures={expandedFeatures}
                      toggleHub={toggleHub}
                      toggleModule={toggleModule}
                      toggleFeatureExpansion={toggleFeatureExpansion}
                      searchQuery={searchQuery}
                      makeCompetitorFeatureKey={makeCompetitorFeatureKey}
                    />
                  </tbody>
                </table>
              </div>
            )}

            {/* Visual Charts */}
            {(config.ui?.show_visuals ?? true) && (priceChartData.length > 0 || featureCoverageData.length > 0) && (
              <div className="mt-12 mb-8 no-print">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-16">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
                  </div>
                }>
                  <FeatureCoverageChart
                    featureData={featureCoverageData}
                    priceData={priceChartData}
                    currency={currency}
                    intervalLabel={isRecurring ? (showYearly ? 'Annual' : 'Monthly') : undefined}
                    isRecurring={isRecurring}
                    showYearly={showYearly}
                    onToggleInterval={(isYearly) => {
                      setShowYearly(isYearly);
                      comparisonAnalytics.trackPricingToggle({
                        sectionId: section.id,
                        interval: isYearly ? 'yearly' : 'monthly',
                      });
                    }}
                  />
                </Suspense>
              </div>
            )}

            {/* Disclaimer */}
            {config.ui?.show_disclaimer && (
              <div className="mt-8 text-center text-sm text-gray-500">
                {config.ui.disclaimer_text ||
                  'Pricing and feature information is based on publicly available data and may not be current. Please verify with providers.'}
              </div>
            )}
          </div>
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
