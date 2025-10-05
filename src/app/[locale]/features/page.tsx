// src/app/features/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
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
      <div className="h-full neomorphic rounded-3xl overflow-hidden flex flex-col transition-all duration-500 transform hover:scale-[1.02]">
        {/* Icon Header */}
        <div className="w-full h-20 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative group-hover:from-white group-hover:to-gray-50 transition-all duration-300">
          <IconComponent className="h-10 w-10 text-gray-500 group-hover:text-gray-700 group-hover:scale-110 transition-all duration-300 opacity-90" />
        </div>
        
        {/* Content */}
        <div className="p-8 sm:p-12 flex flex-col flex-grow bg-gradient-to-br from-white to-gray-50 text-center gap-y-4">
          {/* Type Badge */}
          {feature.type && (
            <div className="flex justify-center mb-2">
              <span className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
                {feature.type}
              </span>
            </div>
          )}
          
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em] line-clamp-2">
            {feature.name}
          </h2>
          <div className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed line-clamp-3 flex-grow tracking-wider">
            {truncatedContent}
          </div>
          
          {/* Arrow Icon */}
          <div className="flex justify-center mt-2">
            <span className="text-xl text-sky-500 group-hover:text-sky-600 group-hover:scale-110 transition-all duration-200">↗</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

FeatureCard.displayName = 'FeatureCard';

// Loading Skeleton Component
const FeatureCardSkeleton = memo(() => (
  <div className="h-full neomorphic rounded-3xl overflow-hidden animate-pulse">
    <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-50"></div>
    <div className="p-8 sm:p-12 bg-gradient-to-br from-white to-gray-50 text-center">
      {/* Type badge skeleton */}
      <div className="flex justify-center mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
      {/* Title skeleton */}
      <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
      </div>
      {/* Arrow skeleton */}
      <div className="flex justify-center mt-4">
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
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
  const [isSliderMode, setIsSliderMode] = useState(true); // Toggle between slider and grid
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);

  // Get translations
  const t = useProductTranslations();

  // Constants for pagination and slider
  const ITEMS_PER_PAGE = 20;
  const LOAD_MORE_INCREMENT = 20;
  
  // Slider configuration - 3 cards visible on desktop, responsive for smaller devices
  const getItemsPerSlide = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= 1280) return 3; // xl: 3 cards
    if (width >= 1024) return 2; // lg: 2 cards
    if (width >= 768) return 2;  // md: 2 cards
    return 1; // mobile: 1 card
  };
  
  const [itemsPerSlide, setItemsPerSlide] = useState(3);

  // Set mounted state for client-side hydration
  useEffect(() => {
    setIsMounted(true);
    setItemsPerSlide(getItemsPerSlide());
    
    // Update items per slide on window resize
    const handleResize = () => {
      setItemsPerSlide(getItemsPerSlide());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    // Disable slider when searching
    setIsSliderMode(searchQuery.trim() === '');
  }, [searchQuery]);
  
  // Slider functions
  const showLoadMoreInSlider = hasMoreFeatures && isSliderMode;
  const totalItems = displayedFeatures.length;
  const totalSlides = totalItems + (showLoadMoreInSlider ? 1 : 0);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index % totalSlides);
  };

  // Get items for current slide with circular wrapping
  const getCurrentSlideItems = () => {
    const items = [];
    
    for (let i = 0; i < itemsPerSlide; i++) {
      const index = (currentSlide + i) % totalSlides;
      
      // If this is the last position and we need to show Load More
      if (showLoadMoreInSlider && index === totalItems) {
        items.push('LOAD_MORE_CARD');
      } else {
        items.push(displayedFeatures[index % totalItems]);
      }
    }
    return items;
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) {
      nextSlide();
    }
    if (touchEndX.current - touchStartX.current > 75) {
      prevSlide();
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (isSliderMode && isAutoPlaying && totalSlides > 1) {
      autoPlayInterval.current = setInterval(() => {
        nextSlide();
      }, 5000);

      return () => {
        if (autoPlayInterval.current) {
          clearInterval(autoPlayInterval.current);
        }
      };
    }
  }, [isSliderMode, isAutoPlaying, currentSlide, totalSlides]);

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
          <div className="neomorphic rounded-3xl p-12 sm:p-16">
            <BeakerIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-thin text-gray-900 mb-4 tracking-tight">{t.t.unableToLoadFeatures}</h2>
            <p className="text-gray-600 font-light mb-10 leading-relaxed">{error}</p>
            <button
              onClick={fetchFeatures}
              className="inline-flex items-center px-8 py-3 bg-gray-800 text-white rounded-full font-light text-sm hover:bg-gray-900 transition-all duration-300 shadow-sm hover:shadow-md"
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
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 mb-6 tracking-tight leading-none">{t.t.featuresHeading}</h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-8"></div>
          <p className="text-lg sm:text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed mb-10">
            {filteredFeatures.length === 0 
              ? t.t.noFeaturesAvailable
              : `Discover ${displayedFeatures.length} of ${filteredFeatures.length} available capabilities`
            }
          </p>
          
          {/* Search Bar - Help Section Style */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-white to-sky-100 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl"></div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none z-10">
                <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-sky-500 transition-colors duration-300" />
              </div>
              <input
                type="text"
                placeholder={t.t.searchFeatures}
                value={searchQuery}
                onChange={handleSearchChange}
                className="relative block w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-gray-50/80 backdrop-blur-sm border-0 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white transition-all duration-500 text-base sm:text-lg font-normal hover:bg-gray-100/80"
                aria-label={t.t.searchFeatures}
              />
            </div>
          </div>
        </div>

        {/* Features Content */}
        {filteredFeatures.length === 0 ? (
          /* Elegant Empty State */
          <div className="neomorphic rounded-3xl p-12 sm:p-16 text-center">
            <BeakerIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl sm:text-2xl font-thin text-gray-900 mb-4 tracking-tight">
              {searchQuery ? `No features found for "${searchQuery}"` : t.t.noFeaturesAvailable}
            </h3>
            <p className="text-gray-600 font-light mb-10 max-w-md mx-auto leading-relaxed">
              {searchQuery 
                ? t.t.tryAdjustingSearchFeatures
                : t.t.featuresWillAppear
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center px-8 py-3 neomorphic text-sm font-light rounded-full text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t.t.clearSearch}
              </button>
            )}
          </div>
        ) : (
          /* Features Display - Slider or Grid */
          <div className="space-y-12">
            {isSliderMode && totalItems > 0 ? (
              /* Slider Mode */
              <div 
                className="relative w-full overflow-hidden"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Slider Container - Wider on large devices */}
                <div className="px-0 sm:px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                  <div className="relative px-12 sm:px-16 md:px-20 lg:px-24 xl:px-28 2xl:px-32 py-8">
                    {/* Feature Cards - Horizontal Flex Layout */}
                    <div className="flex items-stretch justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-12 min-h-[450px] sm:min-h-[500px] md:min-h-[550px]">
                      {getCurrentSlideItems().map((item, idx) => {
                        if (item === 'LOAD_MORE_CARD') {
                          return (
                            <div 
                              key="load-more-card" 
                              className="flex-1 min-w-[250px] max-w-[400px]"
                            >
                              <div className="h-full neomorphic rounded-3xl overflow-hidden flex flex-col transition-all duration-500 transform hover:scale-[1.02] cursor-pointer" onClick={handleLoadMore}>
                                {/* Icon Header */}
                                <div className="w-full h-20 bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center relative hover:from-sky-100 hover:to-sky-200 transition-all duration-300">
                                  <ArrowRightIcon className="h-10 w-10 text-sky-500 hover:text-sky-600 transition-all duration-300 opacity-90" />
                                </div>
                                
                                {/* Content */}
                                <div className="p-8 sm:p-12 flex flex-col flex-grow bg-gradient-to-br from-white to-sky-50/30 text-center gap-y-4 justify-center">
                                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em]">
                                    {isLoadingMore ? 'Loading...' : t.t.loadMoreFeatures || 'Load More Features'}
                                  </h2>
                                  <div className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed tracking-wider">
                                    {isLoadingMore ? (
                                      <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                                      </div>
                                    ) : (
                                      `Click to load ${LOAD_MORE_INCREMENT} more features`
                                    )}
                                  </div>
                                  
                                  {/* Arrow Icon */}
                                  {!isLoadingMore && (
                                    <div className="flex justify-center mt-2">
                                      <span className="text-xl text-sky-500 hover:text-sky-600 transition-all duration-200">↓</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        const feature = item as Feature;
                        return (
                          <div 
                            key={feature.id} 
                            className="flex-1 min-w-[250px] max-w-[400px]"
                          >
                            <FeatureCard feature={feature} t={t} />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Navigation Arrows - Outside container on large devices */}
                    {totalSlides > itemsPerSlide && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-0 sm:left-2 md:left-4 lg:-left-4 xl:-left-6 2xl:-left-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200/50 z-10"
                          aria-label="Previous slide"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-0 sm:right-2 md:right-4 lg:-right-4 xl:-right-6 2xl:-right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200/50 z-10"
                          aria-label="Next slide"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Dot Indicators - Limited to max 10 dots */}
                  {totalSlides > itemsPerSlide && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: Math.min(totalSlides, 10) }).map((_, index) => {
                        // Calculate which dot should be active
                        const activeDot = totalSlides <= 10 ? currentSlide : Math.floor((currentSlide / totalSlides) * 10);
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              // If we have more items than dots, map dot position to item position
                              const targetSlide = totalSlides <= 10 ? index : Math.floor((index / 10) * totalSlides);
                              goToSlide(targetSlide);
                            }}
                            className={`transition-all duration-300 rounded-full ${
                              index === activeDot
                                ? 'w-8 h-2 bg-gray-700'
                                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Grid Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayedFeatures.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} t={t} />
                ))}
              </div>
            )}

            {/* Load More Section - Only show in grid mode */}
            {!isSliderMode && hasMoreFeatures && (
              <div className="text-center">
                <div className="neomorphic rounded-3xl p-8">
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm sm:text-base text-gray-600 font-light">
                      Showing {displayedFeatures.length} of {filteredFeatures.length} features
                    </p>
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center px-8 py-3 bg-gray-800 text-white rounded-full font-light text-sm hover:bg-gray-900 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
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

            {/* Show all loaded message when all features are displayed - Only in grid mode */}
            {!isSliderMode && !hasMoreFeatures && filteredFeatures.length > ITEMS_PER_PAGE && (
              <div className="text-center">
                <div className="neomorphic rounded-3xl p-6">
                  <p className="text-sm text-gray-600 font-light flex items-center justify-center">
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