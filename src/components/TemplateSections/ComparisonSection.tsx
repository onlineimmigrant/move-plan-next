'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { ComparisonViewModel } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import PricingToggle from '@/components/pricing/PricingToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { comparisonAnalytics } from '@/lib/comparisonAnalytics';
import { buildCompetitorFeatureIndex, buildCompetitorPlanIndex, makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { Search, X, Info, Plus, Minus, ChevronDown } from 'lucide-react';
import { calculateCompetitorScore, getScoreColor, getScoreBadgeColor } from '@/lib/comparison/scoring';

// Lazy load the visual chart component to reduce initial bundle size
const FeatureCoverageChart = lazy(() => 
  import('@/components/comparison/Charts').then(module => ({ 
    default: module.FeatureCoverageChart 
  }))
);

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
  // If it's already a symbol or not in the map, return as is
  return currencyMap[code.toUpperCase()] || code;
};

const formatMoney = (value: number): string => {
  const fixed = value.toFixed(2);
  return fixed.endsWith('.00') ? value.toFixed(0) : fixed;
};

const TABLE_CELL_PADDING = 'p-2 sm:p-3';
const TABLE_FIRST_COL_WIDTH = 'w-40 sm:w-48';
const TABLE_COL_WIDTH = 'w-24 sm:w-32';
const TABLE_HEADER_TEXT = 'text-xs sm:text-sm font-semibold';

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
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[] | null>(null);
  const [showAddCompetitorMenu, setShowAddCompetitorMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [showScoringMethodology, setShowScoringMethodology] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const fetchDebounceTimerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<string, { data: ComparisonViewModel; timestamp: number }>>(new Map());
  const themeColors = useThemeColors();

  // Prefetch handler for plan hover
  const prefetchPlanData = useCallback((planId: string) => {
    const planParam = `&plan_id=${encodeURIComponent(planId)}`;
    const competitorParam = selectedCompetitorIds && selectedCompetitorIds.length > 0
      ? `&competitor_ids=${encodeURIComponent(selectedCompetitorIds.join(','))}`
      : '';
    const cacheKey = `${section.id}-${section.organization_id}${planParam}${competitorParam}`;
    
    // Only prefetch if not already cached
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    if (!cached || (now - cached.timestamp) >= 300000) {
      fetch(
        `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}${planParam}${competitorParam}`
      )
        .then(res => res.json())
        .then(data => {
          cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
          if (cacheRef.current.size > 10) {
            const firstKey = cacheRef.current.keys().next().value;
            if (firstKey) {
              cacheRef.current.delete(firstKey);
            }
          }
        })
        .catch(() => {
          // Silent fail on prefetch
        });
    }
  }, [section.id, section.organization_id, selectedCompetitorIds]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const planParam = selectedPlanId ? `&plan_id=${encodeURIComponent(selectedPlanId)}` : '';
      const competitorParam = selectedCompetitorIds && selectedCompetitorIds.length > 0
        ? `&competitor_ids=${encodeURIComponent(selectedCompetitorIds.join(','))}`
        : '';
      
      // Cache key based on params
      const cacheKey = `${section.id}-${section.organization_id}${planParam}${competitorParam}`;
      
      // Check cache (5 minute TTL)
      const cached = cacheRef.current.get(cacheKey);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < 300000) {
        setViewModel(cached.data);
        setLoading(false);
        return;
      }
      
      const response = await fetch(
        `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}${planParam}${competitorParam}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comparison data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('ComparisonSection - Received viewModel:', {
        competitors: data.competitors?.map((c: any) => ({
          id: c.id,
          name: c.name,
          features_count: c.data?.features?.length || 0,
          has_features_array: !!c.data?.features,
          sample_feature: c.data?.features?.[0]
        })),
        ourFeatures_count: data.ourFeatures?.length || 0,
        ourFeatures_sample: data.ourFeatures?.[0]
      });
      
      // Store in cache
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
      
      // Limit cache size to 10 entries
      if (cacheRef.current.size > 10) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }
      
      setViewModel(data);

      // If we haven't picked a plan yet, initialize it from the response
      if (!selectedPlanId) {
        const initialPlanId = data?.ourPricingPlans?.[0]?.id || data?.config?.selected_plan_id || null;
        if (initialPlanId) {
          setSelectedPlanId(initialPlanId);
        }
      }

      if (!selectedCompetitorIds) {
        const initialCompetitorIds = Array.isArray(data?.config?.competitor_ids) ? data.config.competitor_ids : [];
        if (initialCompetitorIds.length > 0) {
          setSelectedCompetitorIds(initialCompetitorIds);
        } else {
          // fallback to whatever was returned
          const returnedIds = (data?.competitors ?? []).map((c: any) => c.id).filter(Boolean);
          setSelectedCompetitorIds(returnedIds.length > 0 ? returnedIds : []);
        }
      }
      
      // Set currency and site name from the response
      if (data.currency) {
        setCurrency(getCurrencySymbol(data.currency));
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
  }, [section.id, section.organization_id, selectedPlanId, selectedCompetitorIds]);

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
  const competitorHeaders = useMemo(() => {
    const selected = viewModel?.competitors ?? [];
    const totalAvailable = viewModel?.availableCompetitors?.length ?? selected.length;
    const canRemoveCompetitors = totalAvailable > 1 && selected.length > 0;

    return selected.map((competitor) => (
      <th
        key={competitor.id}
        className={`group/competitor text-center ${TABLE_CELL_PADDING} ${TABLE_COL_WIDTH} ${TABLE_HEADER_TEXT} relative`}
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
              }}
              className="absolute top-1 right-1 h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hidden group-hover/competitor:inline-flex hover:bg-gray-50 focus:inline-flex"
              aria-label={`Remove ${competitor.name} from comparison`}
              title="Remove competitor"
            >
              <Minus className="h-4 w-4" />
            </button>
          )}
          {competitor.logo_url && (
            <img
              src={competitor.logo_url}
              alt={competitor.name}
              className="h-6 sm:h-8 w-auto object-contain"
            />
          )}
          <span className="text-xs sm:text-sm font-semibold">{competitor.name}</span>
        </div>
      </th>
    ));
  }, [viewModel?.competitors, viewModel?.availableCompetitors, setSelectedCompetitorIds]);

  const competitorPlanIndex = useMemo(
    () => buildCompetitorPlanIndex(viewModel?.competitors ?? []),
    [viewModel?.competitors]
  );

  const competitorFeatureIndex = useMemo(
    () => buildCompetitorFeatureIndex(viewModel?.competitors ?? []),
    [viewModel?.competitors]
  );

  // Filtered features based on search and differences toggle
  const filteredFeatures = useMemo(() => {
    if (!viewModel?.ourFeatures) return [];
    let features = viewModel.ourFeatures;
    
    // Filter by display_on_product_card setting (if configured to show only product card features)
    if (viewModel?.config?.features?.filter?.display_on_product) {
      features = features.filter(feature => feature.display_on_product_card === true);
    }
    
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
        const ourStatus = true; // Our features list represents features we offer
        const hasAnyDifference = viewModel.competitors.some(competitor => {
          const compFeature = competitorFeatureIndex
            .get(competitor.id)
            ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
          const compStatus = compFeature?.status === 'available';
          return ourStatus !== compStatus;
        });
        return hasAnyDifference;
      });
    }
    
    return features;
  }, [viewModel?.ourFeatures, viewModel?.competitors, viewModel?.config?.features?.filter?.display_on_product, searchQuery, showDifferencesOnly, section.id, competitorFeatureIndex]);

  // Toggle function for expandable feature row (expands both description and all competitor notes)
  const toggleFeatureExpansion = useCallback((featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  }, []);

  // Calculate chart data
  const priceChartData = useMemo(() => {
    if (!viewModel?.ourPricingPlans || viewModel.ourPricingPlans.length === 0) {
      return [];
    }
    if (!viewModel?.config || (viewModel.config.mode !== 'pricing' && viewModel.config.mode !== 'both')) {
      return [];
    }
    
    const plan = viewModel.ourPricingPlans[0];
    const isRecurring = plan.type === 'recurring';
    
    // Helper function to calculate add-on costs
    const calculateAddOns = (competitorId?: string) => {
      if (!competitorId) return 0; // Organization has 0 add-ons by default

      const competitorFeatures = competitorFeatureIndex.get(competitorId);
      
      const monthlyTotal = viewModel.ourFeatures.filter(feature => {
        if (viewModel.config.features?.filter?.display_on_product && !feature.display_on_product_card) {
          return false;
        }
        return true;
      }).reduce((total, feature) => {
        const competitorFeature = competitorFeatures?.get(
          makeCompetitorFeatureKey(feature.plan_id, feature.id)
        );
        
        if (competitorFeature?.status === 'amount' && competitorFeature?.unit === 'currency') {
          const amount = parseFloat(competitorFeature.amount || '0') || 0;
          return total + amount;
        }
        return total;
      }, 0);
      
      // Multiply by 12 if showing annual prices for recurring plans
      return (isRecurring && showYearly) ? monthlyTotal * 12 : monthlyTotal;
    };
    
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

    if (!ourPrice || ourPrice <= 0) {
      return [];
    }

    const data = [{
      name: siteName,
      planPrice: ourPrice,
      addOnCost: 0,
      price: ourPrice, // Total price for backward compatibility
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel?.competitors) {
      viewModel.competitors.forEach(competitor => {
        const compPlan = competitorPlanIndex.get(competitor.id)?.get(plan.id);
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
          
          if (compPrice && !isNaN(compPrice) && compPrice > 0) {
            const addOns = calculateAddOns(competitor.id);
            data.push({
              name: competitor.name,
              planPrice: compPrice,
              addOnCost: addOns,
              price: compPrice + addOns, // Total price
              color: '#6b7280',
            });
          }
        }
      });
    }
    return data;
  }, [viewModel?.ourPricingPlans, viewModel?.competitors, viewModel?.config, showYearly, siteName, themeColors, competitorPlanIndex, competitorFeatureIndex]);

  const featureCoverageData = useMemo(() => {
    if (!viewModel?.ourFeatures || viewModel.ourFeatures.length === 0) {
      return [];
    }
    if (!viewModel?.config || (viewModel.config.mode !== 'features' && viewModel.config.mode !== 'both')) {
      return [];
    }

    const totalFeatures = viewModel.ourFeatures.length;
    // All our features in the database are considered "available" for our organization
    const ourAvailableCount = totalFeatures;

    const data = [{
      name: siteName,
      coverage: 100, // We have all our features
      availableCount: ourAvailableCount,
      partialCount: 0,
      paidCount: 0,
      customCount: 0,
      totalCount: totalFeatures,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel?.competitors) {
      viewModel.competitors.forEach(competitor => {
        const competitorFeatures = competitorFeatureIndex.get(competitor.id);
        const statusCounts = {
          available: 0,
          partial: 0,
          paid: 0,
          custom: 0,
        };

        viewModel.ourFeatures.forEach(feature => {
          // Find the competitor's feature that matches the feature and plan
          const compFeature = competitorFeatures?.get(
            makeCompetitorFeatureKey(feature.plan_id, feature.id)
          );
          
          if (compFeature?.status === 'available') {
            statusCounts.available++;
          } else if (compFeature?.status === 'partial') {
            statusCounts.partial++;
          } else if (compFeature?.status === 'amount' && compFeature?.unit === 'currency') {
            statusCounts.paid++;
          } else if (compFeature?.status === 'amount' && compFeature?.unit === 'custom') {
            statusCounts.custom++;
          }
        });

        const coverage = viewModel.ourFeatures.length > 0
          ? Math.round((statusCounts.available / viewModel.ourFeatures.length) * 100)
          : 0;

        data.push({
          name: competitor.name,
          coverage,
          availableCount: statusCounts.available,
          partialCount: statusCounts.partial,
          paidCount: statusCounts.paid,
          customCount: statusCounts.custom,
          totalCount: viewModel.ourFeatures.length,
          color: '#6b7280',
        });
      });
    }

    return data;
  }, [viewModel?.ourFeatures, viewModel?.competitors, viewModel?.config, siteName, themeColors, competitorFeatureIndex]);

  useEffect(() => {
    // Debounce fetchData to avoid rapid-fire requests when switching plans/competitors
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
  const availablePricingPlans = viewModel.availablePricingPlans || ourPricingPlans;
  const availableCompetitors = viewModel.availableCompetitors || competitors;

  const canAddCompetitors = (availableCompetitors?.length || 0) > (competitors?.length || 0);
  const remainingCompetitors = (availableCompetitors ?? []).filter((c) => !competitors.some((sel) => sel.id === c.id));
  
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
          const canSwitchPlans = (availablePricingPlans?.length || 0) > 1;
          const selectedPlanLabel = plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name;

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
                          }}
                          className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.name} className="h-5 w-5 object-contain" />
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
          <div className="mb-12">
            {isRecurring && config.pricing?.show_interval === 'both' ? (
              <div className="flex items-center justify-between gap-2 sm:grid sm:grid-cols-3 sm:items-center mb-6">
                <div className="flex justify-start">
                  {addCompetitorControl}
                </div>
                <div className="flex justify-center">
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
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {viewModel?.currency ? (
                        <>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                            {viewModel.currency}
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
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div className="flex justify-start">
                  {addCompetitorControl}
                </div>
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {viewModel?.currency ? (
                        <>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
                            {viewModel.currency}
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
              </div>
            )}

            {/* Pricing Table */}
            <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className={`text-left ${TABLE_CELL_PADDING} ${TABLE_HEADER_TEXT} ${TABLE_FIRST_COL_WIDTH}`}>
                          {isRecurring ? 'Plan (Recurring)' : 'Plan (One-time)'}
                        </th>
                    <th
                      className={`text-center ${TABLE_CELL_PADDING} ${TABLE_HEADER_TEXT} ${TABLE_COL_WIDTH}`}
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
                        const monthlyPrice = plan.price ? formatMoney(plan.price / 100) : '—';
                        const annualPrice = plan.price ? formatMoney((plan.price * 12 * (1 - (plan.annual_size_discount || 0) / 100)) / 100) : '—';
                        const displayPrice = (isRecurring && showYearly) ? annualPrice : monthlyPrice;
                        const planName = plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name;
                        return (
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className={`${TABLE_CELL_PADDING} ${TABLE_FIRST_COL_WIDTH} whitespace-normal wrap-break-word`}>
                            {canSwitchPlans ? (
                              <div className="relative">
                                <select
                                  value={selectedPlanId ?? plan.id}
                                  onChange={(e) => {
                                    const nextPlanId = e.target.value;
                                    setSelectedPlanId(nextPlanId);
                                    setShowYearly(false);
                                  }}
                                  className="w-full appearance-none rounded-lg bg-white pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold text-gray-900 transition-all duration-200 focus-visible:outline-none cursor-pointer"
                                  style={{ 
                                    border: `2px solid ${themeColors.cssVars.primary.base}40`,
                                    '--tw-ring-color': themeColors.cssVars.primary.base,
                                  } as React.CSSProperties}
                                  onMouseEnter={(e) => e.currentTarget.style.border = `2px solid ${themeColors.cssVars.primary.base}60`}
                                  onMouseLeave={(e) => e.currentTarget.style.border = `2px solid ${themeColors.cssVars.primary.base}40`}
                                  onFocus={(e) => e.currentTarget.style.border = `2px solid ${themeColors.cssVars.primary.base}`}
                                  onBlur={(e) => e.currentTarget.style.border = `2px solid ${themeColors.cssVars.primary.base}40`}
                                  aria-label="Select plan for comparison"
                                >
                                  {availablePricingPlans.map((p) => {
                                    const label = p.package ? `${p.product_name} - ${p.package}` : p.product_name;
                                    return (
                                      <option 
                                        key={p.id} 
                                        value={p.id}
                                        onMouseEnter={() => prefetchPlanData(p.id)}
                                      >
                                        {label}
                                      </option>
                                    );
                                  })}
                                </select>
                                <ChevronDown 
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-transform duration-200"
                                  style={{ color: themeColors.cssVars.primary.base }}
                                />
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm font-medium">{planName}</div>
                            )}
                          </td>
                          <td
                            className={`${TABLE_CELL_PADDING} text-center text-sm sm:text-base font-bold ${TABLE_COL_WIDTH} tabular-nums`}
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
                            const competitorPlan = competitorPlanIndex
                              .get(competitor.id)
                              ?.get(plan.id);
                            return (
                              <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center ${TABLE_COL_WIDTH}`}>
                                {competitorPlan ? (
                                  <div>
                                    <div className="text-sm sm:text-base font-semibold tabular-nums">
                                      {(() => {
                                        const price = isRecurring 
                                          ? (showYearly && competitorPlan.yearly
                                            ? competitorPlan.yearly
                                            : competitorPlan.monthly || '—')
                                          : ((competitorPlan as any).price || '—');
                                        const numeric = Number(price);
                                        if (price === '—' || Number.isNaN(numeric)) return price;
                                        return formatMoney(numeric);
                                      })()}
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
                    <tfoot className="border-t-2 border-gray-300">
                      {(() => {
                        // Calculate add-on features cost (sum of currency-unit features)
                        const calculateAddOns = (competitorId?: string) => {
                          if (!competitorId) return 0; // Organization has 0 add-ons by default

                          const competitorFeatures = competitorFeatureIndex.get(competitorId);
                          
                          const monthlyTotal = ourFeatures.filter(feature => {
                            if (config.features?.filter?.display_on_product && !feature.display_on_product_card) {
                              return false;
                            }
                            return true;
                          }).reduce((total, feature) => {
                            const competitorFeature = competitorFeatures?.get(
                              makeCompetitorFeatureKey(feature.plan_id, feature.id)
                            );
                            
                            if (competitorFeature?.status === 'amount' && competitorFeature?.unit === 'currency') {
                              const amount = parseFloat(competitorFeature.amount || '0') || 0;
                              return total + amount;
                            }
                            return total;
                          }, 0);
                          
                          // Multiply by 12 if showing annual prices for recurring plans
                          return (isRecurring && showYearly) ? monthlyTotal * 12 : monthlyTotal;
                        };

                        const ourPlanPrice = plan.price ? (plan.price / 100) : 0;

                        return (
                          <>
                            {/* Add-on Features Row */}
                            <tr className="bg-gray-100 font-semibold">
                              <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm`}>Add-on Features</td>
                              <td
                                className={`${TABLE_CELL_PADDING} text-center text-xs sm:text-sm tabular-nums`}
                                style={{
                                  backgroundColor: config.ui?.highlight_ours
                                    ? themeColors.cssVars.primary.lighter + '20'
                                    : 'transparent',
                                }}
                              >
                                {formatMoney(0)}
                              </td>
                              {competitors.map((competitor) => {
                                const addOnCost = calculateAddOns(competitor.id);
                                return (
                                  <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center text-xs sm:text-sm tabular-nums`}>
                                    {addOnCost > 0 ? formatMoney(addOnCost) : '—'}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Total Cost Row */}
                            <tr className="bg-gray-200 font-bold">
                              <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm`}>Total Cost</td>
                              <td
                                className={`${TABLE_CELL_PADDING} text-center text-sm sm:text-base tabular-nums`}
                                style={{
                                  backgroundColor: config.ui?.highlight_ours
                                    ? themeColors.cssVars.primary.lighter + '30'
                                    : 'transparent',
                                  color: config.ui?.highlight_ours
                                    ? themeColors.cssVars.primary.base
                                    : 'inherit',
                                }}
                              >
                                {formatMoney(ourPlanPrice)}
                              </td>
                              {competitors.map((competitor) => {
                                const competitorPlan = competitorPlanIndex
                                  .get(competitor.id)
                                  ?.get(plan.id);
                                const planPrice = isRecurring
                                  ? (showYearly && competitorPlan?.yearly
                                    ? Number(competitorPlan.yearly)
                                    : Number(competitorPlan?.monthly || 0))
                                  : Number((competitorPlan as any)?.price || 0);
                                
                                const addOnCost = calculateAddOns(competitor.id);
                                const totalCost = planPrice + addOnCost;

                                return (
                                  <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center text-sm sm:text-base tabular-nums`}>
                                    {totalCost > 0 ? formatMoney(totalCost) : '—'}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Overall Score Row */}
                            {config.scoring?.enabled && (
                              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-indigo-200">
                                <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm font-semibold`}>
                                  <div className="flex items-center gap-2">
                                    Overall Score
                                    <button
                                      onClick={() => setShowScoringMethodology(!showScoringMethodology)}
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors"
                                      title="Show scoring methodology"
                                      aria-label="Toggle scoring methodology"
                                    >
                                      <Info className="w-3 h-3 text-indigo-600" />
                                    </button>
                                  </div>
                                </td>
                                <td
                                  className={`${TABLE_CELL_PADDING} text-center text-sm sm:text-base font-bold`}
                                  style={{
                                    backgroundColor: config.ui?.highlight_ours
                                      ? themeColors.cssVars.primary.lighter + '30'
                                      : 'transparent',
                                  }}
                                >
                                  <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                                    style={{
                                      backgroundColor: '#10b981',
                                      color: '#ffffff',
                                    }}
                                  >
                                    100/100
                                  </span>
                                </td>
                                {competitors.map((competitor) => {
                                  const competitorPlan = competitorPlanIndex
                                    .get(competitor.id)
                                    ?.get(plan.id);
                                  
                                  // Get ALL features from competitor data for this plan
                                  const competitorFeatures = competitor.data?.features?.filter(f => f.our_plan_id === plan.id) || [];
                                  
                                  // Count features by status
                                  const includedFeatures = competitorFeatures.filter(f => f.status === 'available').length;
                                  const partialFeatures = competitorFeatures.filter(f => f.status === 'partial').length;
                                  const unavailableFeatures = competitorFeatures.filter(f => f.status === 'unavailable').length;
                                  const paidFeatures = 0; // Not used in current data model
                                  const customFeatures = competitorFeatures.filter(f => f.status === 'amount').length;

                                  const planPrice = isRecurring
                                    ? (showYearly && competitorPlan?.yearly
                                      ? Number(competitorPlan.yearly)
                                      : Number(competitorPlan?.monthly || 0))
                                    : Number((competitorPlan as any)?.price || 0);
                                  
                                  const addOnCost = calculateAddOns(competitor.id);
                                  const totalPrice = planPrice + addOnCost;
                                  const ourPrice = plan.price ? (plan.price / 100) : 0;

                                  const scoreResult = calculateCompetitorScore({
                                    includedFeatures,
                                    partialFeatures,
                                    paidFeatures,
                                    customFeatures,
                                    totalFeatures: filteredFeatures.length,
                                    competitorPrice: totalPrice,
                                    ourPrice,
                                    pricingTransparency: competitorPlan ? 100 : 0,
                                  }, config.scoring?.weights ? {
                                    featureCoverage: config.scoring.weights.featureCoverage ?? 40,
                                    priceCompetitiveness: config.scoring.weights.priceCompetitiveness ?? 30,
                                    valueRatio: config.scoring.weights.valueRatio ?? 20,
                                    transparency: config.scoring.weights.transparency ?? 10,
                                  } : undefined);

                                  const scoreColor = getScoreColor(scoreResult.overall);
                                  const badgeColor = getScoreBadgeColor(scoreResult.overall);

                                  return (
                                    <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center`}>
                                      <div className="inline-flex flex-col items-center gap-1">
                                        <span
                                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                                          style={{
                                            backgroundColor: badgeColor.bg,
                                            color: badgeColor.text,
                                          }}
                                        >
                                          {scoreResult.overall}/100
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            )}

                            {/* Scoring Methodology Accordion */}
                            {config.scoring?.enabled && showScoringMethodology && (
                              <tr className="bg-blue-50 border-b border-indigo-200">
                                <td colSpan={2 + competitors.length} className="px-6 py-4">
                                  <div className="text-sm text-gray-700 space-y-3">
                                    <h4 className="font-semibold text-gray-900">How Scores Are Calculated</h4>
                                    <p className="text-xs text-gray-600">
                                      Scores are automatically calculated using objective criteria. Each competitor is evaluated on:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <span className="font-medium text-gray-900">Feature Coverage ({config.scoring?.weights?.featureCoverage || 40}%):</span>
                                        <span className="text-gray-600"> Percentage of features included vs. unavailable</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-900">Price Competitiveness ({config.scoring?.weights?.priceCompetitiveness || 30}%):</span>
                                        <span className="text-gray-600"> How pricing compares to ours</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-900">Value Ratio ({config.scoring?.weights?.valueRatio || 20}%):</span>
                                        <span className="text-gray-600"> Features per dollar (value for money)</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-900">Transparency ({config.scoring?.weights?.transparency || 10}%):</span>
                                        <span className="text-gray-600"> Pricing clarity and data availability</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 italic pt-2">
                                      ⚠️ Scores are based on publicly available data and should be used as one factor among many when making decisions.
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Feature Comparison */}
        {showFeatures && filteredFeatures.length > 0 && (
          <div>
            {searchQuery && (
              <div className="mb-3 text-sm font-normal text-gray-500">
                ({filteredFeatures.length} of {ourFeatures.length} features)
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className={`text-left ${TABLE_CELL_PADDING} ${TABLE_HEADER_TEXT} md:sticky md:left-0 bg-white ${TABLE_FIRST_COL_WIDTH}`}>
                      Feature
                    </th>
                    <th
                      className={`text-center ${TABLE_CELL_PADDING} ${TABLE_HEADER_TEXT} ${TABLE_COL_WIDTH}`}
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
                    // Group features by type and sort by order within each group
                    const groupedFeatures = filteredFeatures.reduce<Record<string, typeof filteredFeatures>>((acc, feature) => {
                      const type = feature.type || 'Other';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(feature);
                      return acc;
                    }, {});

                    // Sort features within each group by order
                    Object.keys(groupedFeatures).forEach(type => {
                      groupedFeatures[type].sort((a, b) => (a.order || 0) - (b.order || 0));
                    });

                    // Render grouped features with type headers
                    return Object.entries(groupedFeatures).map(([type, typeFeatures]) => (
                      <React.Fragment key={type}>
                        <tr className="bg-gray-50">
                          <td
                            colSpan={2 + competitors.length}
                            className="p-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600"
                          >
                            {type}
                          </td>
                        </tr>
                        {typeFeatures.map((feature) => {
                          const isExpanded = expandedFeatures.has(feature.id);
                          const detailsRowId = `feature-details-${feature.id}`;
                          const hasContent = feature.content && feature.content.trim();
                          const hasAnyNotes = competitors.some(c => {
                            const cf = competitorFeatureIndex
                              .get(c.id)
                              ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                            return cf?.note && cf.note.trim();
                          });
                          const showExpandIcon = hasContent || hasAnyNotes;
                          
                          return (
                            <React.Fragment key={feature.id}>
                              <tr
                                className={
                                  isExpanded
                                    ? 'hover:bg-gray-50'
                                    : 'border-b border-gray-100 hover:bg-gray-50'
                                }
                              >
                                <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm md:sticky md:left-0 bg-white font-semibold ${TABLE_FIRST_COL_WIDTH}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0 whitespace-normal wrap-break-word">
                                      {searchQuery ? highlightMatch(feature.name, searchQuery) : feature.name}
                                    </div>
                                    {showExpandIcon && (
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatureExpansion(feature.id)}
                                        className="shrink-0 mt-0.5 p-1 -mr-1 text-gray-400 hover:text-blue-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                                        style={{ outlineColor: themeColors.cssVars.primary.base }}
                                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${feature.name}`}
                                        aria-expanded={isExpanded}
                                        aria-controls={detailsRowId}
                                      >
                                        <Info className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                  {feature.description && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {searchQuery ? highlightMatch(feature.description, searchQuery) : feature.description}
                                    </div>
                                  )}
                                </td>
                                <td
                                  className={`${TABLE_CELL_PADDING} text-center ${TABLE_COL_WIDTH}`}
                                  style={{
                                    backgroundColor: config.ui?.highlight_ours
                                      ? themeColors.cssVars.primary.lighter + '20'
                                      : 'transparent',
                                  }}
                                >
                                  <span className="sr-only">Available</span>
                                  <span
                                    aria-hidden="true"
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: themeColors.cssVars.primary.base }}
                                    title="Available"
                                  />
                                </td>
                                {competitors.map((competitor) => {
                                  const competitorFeature = competitorFeatureIndex
                                    .get(competitor.id)
                                    ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                                  
                                  const status = competitorFeature?.status || 'unknown';
                                  const amount = competitorFeature?.amount;
                                  const unit = competitorFeature?.unit || 'custom';
                                  
                                  // Format display based on unit
                                  const formatAmount = () => {
                                    if (!amount) return null;
                                    if (unit === 'currency') {
                                      const numeric = Number(amount);
                                      if (Number.isNaN(numeric)) return amount;
                                      return formatMoney(numeric);
                                    }
                                    if (unit === 'custom') {
                                      return amount;
                                    }
                                    return `${amount} ${unit}`;
                                  };
                                  
                                  return (
                                    <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center ${TABLE_COL_WIDTH}`}>
                                      {status === 'available' && (
                                        <>
                                          <span className="sr-only">Available</span>
                                          <span
                                            aria-hidden="true"
                                            className="inline-block w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: themeColors.cssVars.primary.base }}
                                            title="Available"
                                          />
                                        </>
                                      )}
                                      {status === 'partial' && (
                                        <>
                                          <span className="sr-only">Partial</span>
                                          <span
                                            aria-hidden="true"
                                            className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"
                                            title="Partial"
                                          />
                                        </>
                                      )}
                                      {status === 'unavailable' && (
                                        <>
                                          <span className="sr-only">Unavailable</span>
                                          <span
                                            aria-hidden="true"
                                            className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"
                                            title="Unavailable"
                                          />
                                        </>
                                      )}
                                      {status === 'amount' && (
                                        <span
                                          className={`text-sm text-gray-700 tabular-nums ${unit === 'currency' ? 'font-semibold' : 'font-medium'}`}
                                        >
                                          {formatAmount()}
                                        </span>
                                      )}
                                      {status === 'unknown' && (
                                        <>
                                          <span className="sr-only">Unknown</span>
                                          <span
                                            aria-hidden="true"
                                            className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300"
                                            title="Unknown"
                                          />
                                        </>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                              {/* Expanded row for feature description and all competitor notes */}
                              {isExpanded && (
                                <tr id={detailsRowId}>
                                  <td className={`${TABLE_CELL_PADDING} pt-2 md:sticky md:left-0 bg-white align-top border-b border-gray-200 ${TABLE_FIRST_COL_WIDTH}`}>
                                    {hasContent && (
                                      <div className="text-xs text-gray-600 whitespace-normal wrap-break-word">
                                        {feature.content}
                                      </div>
                                    )}

                                    {hasAnyNotes && (
                                      <div className="mt-3 md:hidden">
                                        {competitors.map((competitor) => {
                                          const competitorFeature = competitorFeatureIndex
                                            .get(competitor.id)
                                            ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                                          const note = competitorFeature?.note;
                                          if (!note || !note.trim()) return null;
                                          return (
                                            <div key={competitor.id} className="mt-2">
                                              <div className="text-[11px] font-semibold text-gray-700">
                                                {competitor.name}
                                              </div>
                                              <div className="text-xs text-gray-600 whitespace-normal wrap-break-word">
                                                {note}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                  <td className={`${TABLE_CELL_PADDING} pt-2 align-top border-b border-gray-200 ${TABLE_COL_WIDTH}`}></td>
                                  {competitors.map((competitor) => {
                                    const competitorFeature = competitorFeatureIndex
                                      .get(competitor.id)
                                      ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                                    const note = competitorFeature?.note;
                                    
                                    return (
                                      <td key={competitor.id} className={`${TABLE_CELL_PADDING} pt-2 align-top border-b border-gray-200 ${TABLE_COL_WIDTH} text-center`}>
                                        {note && (
                                          <div className="hidden md:block text-xs text-gray-600 whitespace-normal wrap-break-word text-center">
                                            {note}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visual Charts */}
        {(priceChartData.length > 0 || featureCoverageData.length > 0) && (
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
                intervalLabel={(() => {
                  const plan = ourPricingPlans[0];
                  const isRecurring = plan?.type === 'recurring';
                  if (!isRecurring) return undefined;
                  return showYearly ? 'Annual' : 'Monthly';
                })()}
                isRecurring={ourPricingPlans[0]?.type === 'recurring'}
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
