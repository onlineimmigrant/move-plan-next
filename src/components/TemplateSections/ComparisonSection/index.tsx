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
import { CompetitorHeaders } from './components/CompetitorHeaders';
import { PricingControls } from './components/PricingControls';
import { ErrorDisplay } from './components/ErrorDisplay';
import { DisclaimerSection } from './components/DisclaimerSection';
import LoadingSkeleton from './components/LoadingSkeleton';
import { ComparisonErrorBoundary } from './components/ComparisonErrorBoundary';
import { usePerformanceMonitor, usePageLoadPerformance } from './components/PerformanceMonitor';
import { useChartData } from './hooks/useChartData';
import { useCompetitorManagement } from './hooks/useCompetitorManagement';
import { useInitialization } from './hooks/useInitialization';
import { FETCH_DEBOUNCE, TABLE_CELL_PADDING, TABLE_COL_WIDTH, TABLE_HEADER_TEXT, COMP_COL_BORDER } from './constants';
import { getCurrencySymbol } from './utils/formatting';

// Lazy load the visual chart component
const FeatureCoverageChart = lazy(() => 
  import('./components/Charts').then(module => ({ 
    default: module.FeatureCoverageChart 
  }))
);

/**
 * ComparisonSection displays a comprehensive product comparison table.
 * Features hierarchical feature organization, pricing comparison, and analytics tracking.
 * Optimized with React.memo, virtual scrolling, and performance monitoring.
 */
function ComparisonSectionContent({ section }: ComparisonSectionProps) {
  // Performance monitoring
  usePageLoadPerformance(section.id);
  usePerformanceMonitor('ComparisonSectionContent', { sectionId: section.id });
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

  // Initialize hub/module expansion and selected plan/competitors
  useInitialization({
    viewModel,
    selectedPlanId,
    setSelectedPlanId,
    selectedCompetitorIds,
    setSelectedCompetitorIds,
    sortedHubNames,
    sortedHierarchy,
    setExpandedHubs,
    setExpandedModules,
  });

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

  // Calculate chart data
  const { priceChartData, featureCoverageData } = useChartData(
    viewModel,
    showYearly,
    themeColors,
    competitorPlanIndex,
    competitorFeatureIndex
  );

  // Competitor management
  const { 
    handleRemoveCompetitor, 
    handleAddCompetitor, 
    remainingCompetitors, 
    canRemoveCompetitors 
  } = useCompetitorManagement({
    selectedCompetitorIds,
    setSelectedCompetitorIds,
    setShowAddCompetitorMenu,
    viewModelCompetitors: viewModel?.competitors,
    availableCompetitors: viewModel?.availableCompetitors,
  });

  if (loading && !viewModel) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => fetchData()} />;
  }

  if (!viewModel) {
    return null;
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
      <section className="py-10" aria-label="Product comparison">
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
                  <p className="text-sm text-gray-500 mt-2 no-print" role="status" aria-live="polite">
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

            {/* Pricing Controls */}
            {showPricing && plan && (
              <div className="mb-6">
                <PricingControls
                  showYearly={showYearly}
                  onToggleYearly={(isAnnual) => {
                    setShowYearly(isAnnual);
                    comparisonAnalytics.trackPricingToggle({
                      sectionId: section.id,
                      interval: isAnnual ? 'yearly' : 'monthly',
                    });
                  }}
                  isRecurring={isRecurring}
                  showInterval={config.pricing?.show_interval}
                  remainingCompetitors={remainingCompetitors}
                  showAddCompetitorMenu={showAddCompetitorMenu}
                  onToggleAddCompetitor={() => setShowAddCompetitorMenu(v => !v)}
                  onAddCompetitor={handleAddCompetitor}
                  currencyCode={viewModel?.currency ? currencyCode : undefined}
                  currencySymbol={currency}
                />
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
                competitorHeaders={
                  <CompetitorHeaders
                    competitors={competitors}
                    canRemoveCompetitors={canRemoveCompetitors}
                    onRemoveCompetitor={handleRemoveCompetitor}
                  />
                }
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
                    competitorHeaders={
                      <CompetitorHeaders
                        competitors={competitors}
                        canRemoveCompetitors={canRemoveCompetitors}
                        onRemoveCompetitor={handleRemoveCompetitor}
                      />
                    }
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
            <DisclaimerSection
              showDisclaimer={config.ui?.show_disclaimer}
              disclaimerText={config.ui?.disclaimer_text}
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default function ComparisonSection(props: ComparisonSectionProps) {
  return (
    <ComparisonErrorBoundary
      componentName="ComparisonSection"
      onError={(error, errorInfo) => {
        // Log to external monitoring service
        console.error('[ComparisonSection] Error:', error, errorInfo);
        
        // Track in analytics
        comparisonAnalytics['track']?.('component_error', {
          componentName: 'ComparisonSection',
          error: error.message,
          stack: error.stack,
        });
      }}
    >
      <ComparisonSectionContent {...props} />
    </ComparisonErrorBoundary>
  );
}
