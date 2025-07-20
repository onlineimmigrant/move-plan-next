// src/app/features/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import * as Icons from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, ArrowRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { getOrganizationId } from '@/lib/supabase';
import parse from 'html-react-parser';
import { useProductTranslations } from '@/components/product/useProductTranslations';

interface Feature {
  id: string;
  created_at: string;
  name: string;
  feature_image?: string;
  content: string | null; // Allow null
  slug: string;
  display_content: boolean;
  display_on_product: boolean;
  type?: string;
  package?: string;
  description?: string;
  type_display?: string;
  organization_id: string | null;
}

// Memoized Feature Card Component for better performance
const FeatureCard = memo(({ feature, t }: { feature: Feature; t: any }) => {
  const IconComponent = useMemo(() => {
    return Icons[feature.feature_image as keyof typeof Icons] || BeakerIcon;
  }, [feature.feature_image]);

  const truncatedContent = useMemo(() => {
    if (!feature.content) return t.t.noContentAvailable;
    
    const words = feature.content.split(' ');
    const truncated = words.slice(0, 12).join(' ') + (words.length > 12 ? '...' : '');
    return parse(truncated);
  }, [feature.content, t.t.noContentAvailable]);

  return (
    <Link href={`/features/${feature.slug}`} className="group h-full">
      <div className="h-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-sky-200 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative">
          <IconComponent className="h-6 w-6 text-sky-500 absolute top-4 right-4 group-hover:text-sky-600 transition-colors duration-200" />
          <div className="p-6 flex flex-col flex-grow">
            <h2 className="text-lg line-clamp-2 font-semibold text-gray-900 mb-3 group-hover:text-sky-600 transition-colors duration-200 leading-tight">
              {feature.name}
            </h2>
            <div className="text-sm text-gray-600 font-light line-clamp-3 flex-grow leading-relaxed">
              {truncatedContent}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-transparent flex-shrink-0 flex justify-between items-center border-t border-gray-100/50">
          {feature.type ? (
            <>
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide group-hover:opacity-60 transition-opacity duration-200">
                {feature.type}
              </span>
              <ArrowRightIcon className="h-4 w-4 text-sky-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
            </>
          ) : (
            <div className="flex-1 flex justify-end">
              <ArrowRightIcon className="h-4 w-4 text-sky-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Loading Skeleton Component
const FeatureCardSkeleton = memo(() => (
  <div className="h-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
    <div className="px-6 py-4 border-t border-gray-100/50">
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
));

FeatureCardSkeleton.displayName = 'FeatureCardSkeleton';

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(20); // Limit to 20 initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get translations
  const t = useProductTranslations();

  // Constants for pagination
  const ITEMS_PER_PAGE = 20;
  const LOAD_MORE_INCREMENT = 20;

  // Set mounted state for client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Optimized search with debouncing
  const debouncedSearchQuery = useMemo(() => {
    const timer = setTimeout(() => searchQuery, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoized filtered and sorted features
  const filteredFeatures = useMemo(() => {
    if (!isMounted) return [];
    
    return features
      .filter(feature => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        return [feature.name, feature.content, feature.type]
          .some(field => field?.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        // Prioritize features with images
        if (a.feature_image && !b.feature_image) return -1;
        if (!a.feature_image && b.feature_image) return 1;
        
        // Sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
  }, [features, searchQuery, isMounted]);

  // Memoized displayed features with pagination
  const displayedFeatures = useMemo(() => {
    return filteredFeatures.slice(0, displayedCount);
  }, [filteredFeatures, displayedCount]);

  // Check if there are more features to load
  const hasMoreFeatures = useMemo(() => {
    return filteredFeatures.length > displayedCount;
  }, [filteredFeatures.length, displayedCount]);

  // Reset displayed count when search query changes
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  // Optimized fetch function with error handling
  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const organizationId = await getOrganizationId(baseUrl);
      
      if (!organizationId) {
        throw new Error('Organization not found');
      }

      const response = await fetch(`/api/features?organization_id=${organizationId}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch features`);
      }

      const data = await response.json();
      console.log('Fetched features:', data);
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching features:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch features';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle load more functionality
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setDisplayedCount(prev => Math.min(prev + LOAD_MORE_INCREMENT, filteredFeatures.length));
    setIsLoadingMore(false);
  }, [filteredFeatures.length]);

  // Early return for loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header Skeleton */}
          <div className="rounded-3xl shadow-lg border border-gray-200 p-6 mb-8 backdrop-blur-sm bg-white/95">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="mt-4 sm:mt-0 animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg w-80"></div>
              </div>
            </div>
          </div>
          
          {/* Features Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <FeatureCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="rounded-3xl shadow-lg border border-red-200 p-8 backdrop-blur-sm bg-white/95">
            <div className="p-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
              <BeakerIcon className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.t.unableToLoadFeatures}</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={fetchFeatures}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200"
            >
              {t.t.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Enhanced Header Section */}
        <div className="rounded-3xl shadow-lg border border-gray-200 p-6 mb-8 backdrop-blur-sm bg-white/95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center space-x-4 mb-6 sm:mb-0">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl shadow-lg">
                <BeakerIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.t.featuresHeading}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredFeatures.length === 0 
                    ? t.t.noFeaturesAvailable
                    : `${t.t.showingFeatures} ${displayedFeatures.length} ${t.t.of} ${filteredFeatures.length} ${t.t.features.toLowerCase()}`
                  }
                </p>
              </div>
            </div>
            
            {/* Enhanced Search Input */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.t.searchFeatures}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all duration-300 placeholder:text-gray-400"
                aria-label={t.t.searchFeatures}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/5 to-cyan-500/5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Features Content */}
        {filteredFeatures.length === 0 ? (
          /* Enhanced Empty State */
          <div className="rounded-3xl shadow-lg border border-gray-200 p-12 text-center backdrop-blur-sm bg-white/95">
            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
              <BeakerIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {searchQuery ? `${t.t.noFeaturesFound} "${searchQuery}"` : t.t.noFeaturesAvailable}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {searchQuery 
                ? t.t.tryAdjustingSearchFeatures
                : t.t.featuresWillAppear
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-200"
              >
                {t.t.clearSearch}
              </button>
            )}
          </div>
        ) : (
          /* Enhanced Features Grid */
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} t={t} />
              ))}
            </div>

            {/* Load More Section */}
            {hasMoreFeatures && (
              <div className="text-center">
                <div className="rounded-2xl shadow-lg border border-gray-200 p-6 backdrop-blur-sm bg-white/95">
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-gray-600">
                      {t.t.showingFeatures} {displayedFeatures.length} {t.t.of} {filteredFeatures.length} {t.t.features.toLowerCase()}
                    </p>
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t.t.loading}
                        </>
                      ) : (
                        <>
                          {t.t.loadMoreFeatures}
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show all loaded message when all features are displayed */}
            {!hasMoreFeatures && filteredFeatures.length > ITEMS_PER_PAGE && (
              <div className="text-center">
                <div className="rounded-2xl shadow-lg border border-gray-200 p-4 backdrop-blur-sm bg-white/95">
                  <p className="text-sm text-gray-600 flex items-center justify-center">
                    <BeakerIcon className="w-4 h-4 mr-2 text-sky-500" />
                    {t.t.allFeaturesLoaded} ({filteredFeatures.length})
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}