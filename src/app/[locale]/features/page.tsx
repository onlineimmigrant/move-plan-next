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
      <div className="h-full bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 overflow-hidden flex flex-col transition-all duration-500 transform hover:-translate-y-1">
        {/* Icon Header */}
        <div className="w-full h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
          <IconComponent className="h-8 w-8 text-gray-600 group-hover:text-gray-800 group-hover:scale-110 transition-all duration-300" />
        </div>
        
        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          <h2 className="text-lg font-extralight text-gray-700 mb-3 group-hover:text-gray-900 transition-colors duration-200 leading-tight tracking-tight line-clamp-2">
            {feature.name}
          </h2>
          <div className="text-sm text-gray-500 font-light line-clamp-3 flex-grow leading-relaxed mb-4">
            {truncatedContent}
          </div>
          
          {/* Type Badge */}
          {feature.type && (
            <span className="inline-block px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full uppercase tracking-wide border border-gray-100 self-start">
              {feature.type}
            </span>
          )}
        </div>
        
        {/* Bottom Section */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <div className="inline-flex items-center text-gray-500 text-xs font-medium uppercase tracking-wide group-hover:text-gray-700 transition-colors duration-200">
            <span className="mr-2">Learn More</span>
            <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </Link>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Loading Skeleton Component
const FeatureCardSkeleton = memo(() => (
  <div className="h-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
    <div className="w-full h-20 bg-gray-100"></div>
    <div className="p-6">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </div>
    <div className="px-6 py-4 border-t border-gray-100">
      <div className="h-3 bg-gray-200 rounded w-24 ml-auto"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          {/* Header Skeleton */}
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
              <div className="h-12 bg-gray-200 rounded-full w-80 mx-auto"></div>
            </div>
          </div>
          
          {/* Features Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 text-center">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12">
            <BeakerIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-extralight text-gray-700 mb-4 tracking-tight">{t.t.unableToLoadFeatures}</h2>
            <p className="text-gray-500 font-light mb-8 leading-relaxed">{error}</p>
            <button
              onClick={fetchFeatures}
              className="inline-flex items-center px-8 py-3 bg-gray-800 text-white rounded-full font-medium text-sm hover:bg-gray-900 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {t.t.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
        {/* Elegant Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-extralight text-gray-700 mb-4 tracking-tight">{t.t.featuresHeading}</h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6"></div>
          <p className="text-gray-500 font-light text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {filteredFeatures.length === 0 
              ? t.t.noFeaturesAvailable
              : `Discover ${displayedFeatures.length} of ${filteredFeatures.length} available capabilities`
            }
          </p>
          
          {/* Elegant Search Input */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t.t.searchFeatures}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-300 placeholder:text-gray-400"
              aria-label={t.t.searchFeatures}
            />
          </div>
        </div>

        {/* Features Content */}
        {filteredFeatures.length === 0 ? (
          /* Elegant Empty State */
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center">
            <BeakerIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-extralight text-gray-700 mb-3 tracking-tight">
              {searchQuery ? `No features found for "${searchQuery}"` : t.t.noFeaturesAvailable}
            </h3>
            <p className="text-gray-500 font-light mb-8 max-w-md mx-auto leading-relaxed">
              {searchQuery 
                ? t.t.tryAdjustingSearchFeatures
                : t.t.featuresWillAppear
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center px-8 py-3 border border-gray-200 text-sm font-light rounded-full text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {t.t.clearSearch}
              </button>
            )}
          </div>
        ) : (
          /* Elegant Features Grid */
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {displayedFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} t={t} />
              ))}
            </div>

            {/* Load More Section */}
            {hasMoreFeatures && (
              <div className="text-center">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-gray-500 font-light">
                      Showing {displayedFeatures.length} of {filteredFeatures.length} features
                    </p>
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center px-8 py-3 bg-gray-800 text-white rounded-full font-medium text-sm hover:bg-gray-900 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
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
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                  <p className="text-sm text-gray-500 font-light flex items-center justify-center">
                    <BeakerIcon className="w-4 h-4 mr-2 text-gray-400" />
                    All features loaded ({filteredFeatures.length})
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