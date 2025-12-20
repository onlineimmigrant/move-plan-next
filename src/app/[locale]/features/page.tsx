// src/app/features/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import Link from 'next/link';
import * as Icons from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, ArrowRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { getOrganizationId } from '@/lib/supabase';
import parse from 'html-react-parser';
import { useProductTranslations } from '@/components/product/useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import AdvancedSearchInput from '@/components/features/AdvancedSearchInput';
import { SliderNavigation } from '@/ui/SliderNavigation';

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
  const themeColors = useThemeColors();
  
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
    <Link 
      href={`/features/${feature.slug}`} 
      className="group h-full focus:outline-none rounded-3xl transition-all"
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${themeColors.cssVars.primary.base}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <div 
        className="h-full bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden flex flex-col transition-all duration-500 transform hover:scale-[1.03] hover:-translate-y-1 active:scale-[1.01] shadow-sm hover:shadow-xl border"
        style={{ borderColor: 'rgb(243 244 246)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = themeColors.cssVars.primary.light;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgb(243 244 246)';
        }}
      >
        {/* Content */}
        <div className="p-4 sm:p-10 flex flex-col flex-grow bg-gradient-to-br from-white to-gray-50 text-center gap-y-4">
          {/* Type Badge */}
          {feature.type && (
            <div className="flex justify-center mb-2">
              <span 
                className="inline-block px-4 py-1.5 text-xs font-medium rounded-full tracking-wide uppercase border shadow-sm"
                style={{
                  backgroundColor: themeColors.cssVars.primary.lighter,
                  color: themeColors.cssVars.primary.base,
                  borderColor: themeColors.cssVars.primary.light,
                }}
              >
                {feature.type}
              </span>
            </div>
          )}
          
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em] line-clamp-2">
            {feature.name}
          </h2>
          <div className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed line-clamp-3 flex-grow">
            {truncatedContent}
          </div>
          
          {/* Arrow Icon */}
          <div className="flex justify-center mt-2">
            <span 
              className="text-2xl group-hover:scale-125 group-hover:rotate-45 transition-all duration-300"
              style={{ color: themeColors.cssVars.primary.base }}
            >↗</span>
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
  const themeColors = useThemeColors();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSliderMode, setIsSliderMode] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);

  // Get translations
  const t = useProductTranslations();

  // Generate search suggestions from feature names and types
  const searchSuggestions = useMemo(() => {
    const names = features.map(f => f.name);
    const types = [...new Set(features.map(f => f.type).filter(Boolean))] as string[];
    return [...names, ...types];
  }, [features]);

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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {/* Elegant Header Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-thin text-gray-900 mb-6 tracking-tight leading-[1.1]">{t.t.featuresHeading}</h1>
          <div 
            className="w-32 h-1 mx-auto mb-8 rounded-full"
            style={{
              background: `linear-gradient(to right, transparent, ${themeColors.cssVars.primary.light}, transparent)`,
            }}
          ></div>
          <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 font-light max-w-2xl mx-auto leading-relaxed mb-10">
            {filteredFeatures.length === 0 
              ? t.t.noFeaturesAvailable
              : `Discover ${displayedFeatures.length} of ${filteredFeatures.length} available capabilities`
            }
          </p>
          
          {/* Advanced Search - Pricing Modal Style */}
          <AdvancedSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            suggestions={searchSuggestions}
            placeholder={t.t.searchFeatures}
          />
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
                  <div className="relative px-2 py-8">
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
                  </div>
                  
                  {/* Unified Slider Navigation */}
                  <SliderNavigation
                    onPrevious={prevSlide}
                    onNext={nextSlide}
                    currentIndex={currentSlide}
                    totalItems={totalSlides}
                    onDotClick={goToSlide}
                    showDots={true}
                    buttonPosition="bottom-right"
                    buttonVariant="minimal"
                    dotVariant="default"
                  />
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