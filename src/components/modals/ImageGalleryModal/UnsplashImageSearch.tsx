'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';
import MediaTabToolbar from './MediaTabToolbar';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
    download_location: string;
  };
  alt_description: string | null;
  description: string | null;
  width: number;
  height: number;
}

interface UnsplashImageSearchProps {
  onSelectImage: (imageUrl: string, attribution: UnsplashAttribution) => void;
}

export interface UnsplashAttribution {
  photographer: string;
  photographer_url: string;
  photo_url: string;
  download_location: string;
}

// Cache for search results to avoid repeated API calls
const searchCache = new Map<string, { results: UnsplashImage[]; total_pages: number; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const UnsplashImageSearch = React.memo(function UnsplashImageSearch({ onSelectImage }: UnsplashImageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const themeColors = useThemeColors();
  const { primary } = themeColors;

  // Memoized cache key generator
  const getCacheKey = useCallback((query: string, pageNum: number) => {
    return `${query || 'featured'}_${pageNum}`;
  }, []);

  // Check if cached data is still valid
  const getCachedData = useCallback((cacheKey: string) => {
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, []);

  // Memoized load featured images function
  const loadFeaturedImages = useCallback(async () => {
    const cacheKey = getCacheKey('', 1);
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setImages(cached.results);
      setTotalPages(cached.total_pages);
      setPage(1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unsplash/featured');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load featured images');
      }

      const results = data.results || [];
      const total = data.total_pages || 1;
      
      // Cache the results
      searchCache.set(cacheKey, {
        results,
        total_pages: total,
        timestamp: Date.now()
      });

      setImages(results);
      setTotalPages(total);
      setPage(1);
    } catch (err) {
      console.error('Error loading featured images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [getCacheKey, getCachedData]);

  // Memoized search images function
  const searchImages = useCallback(async (query: string, pageNum: number) => {
    if (!query.trim()) {
      loadFeaturedImages();
      return;
    }

    const cacheKey = getCacheKey(query, pageNum);
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setImages(cached.results);
      setTotalPages(cached.total_pages);
      setPage(pageNum);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/unsplash/search?query=${encodeURIComponent(query)}&page=${pageNum}&per_page=20`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search images');
      }

      const results = data.results || [];
      const total = data.total_pages || 1;
      
      // Cache the results
      searchCache.set(cacheKey, {
        results,
        total_pages: total,
        timestamp: Date.now()
      });

      setImages(results);
      setTotalPages(total);
      setPage(pageNum);
    } catch (err) {
      console.error('Error searching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to search images');
    } finally {
      setIsLoading(false);
    }
  }, [getCacheKey, getCachedData, loadFeaturedImages]);

  // Debounced search with dependency on searchImages
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchImages(searchQuery, 1);
      } else {
        // Load featured images on empty search
        loadFeaturedImages();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchImages, loadFeaturedImages]);

  const handleImageSelect = useCallback(async (image: UnsplashImage) => {
    setSelectedImageId(image.id);

    // Trigger download tracking (required by Unsplash)
    try {
      await fetch('/api/unsplash/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: image.links.download_location }),
      });
    } catch (err) {
      console.error('Error tracking download:', err);
    }

    // Prepare attribution data
    const attribution: UnsplashAttribution = {
      photographer: image.user.name,
      photographer_url: image.user.links.html,
      photo_url: image.links.html,
      download_location: image.links.download_location,
    };

    // Use regular size for best quality/performance balance
    onSelectImage(image.urls.regular, attribution);
  }, [onSelectImage]);

  const handleNextPage = useCallback(() => {
    if (page < totalPages) {
      searchImages(searchQuery, page + 1);
    }
  }, [page, totalPages, searchQuery, searchImages]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      searchImages(searchQuery, page - 1);
    }
  }, [page, searchQuery, searchImages]);

  // Load featured images on mount
  useEffect(() => {
    loadFeaturedImages();
  }, [loadFeaturedImages]);

  const countsText = images.length > 0
    ? `${images.length} ${images.length === 1 ? 'photo' : 'photos'}`
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <MediaTabToolbar
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          if (!value.trim()) {
            loadFeaturedImages();
            setError(null);
          }
        }}
        searchPlaceholder="Search free high-resolution photos..."
        onRefresh={() => {
          if (searchQuery.trim()) {
            searchImages(searchQuery, 1);
          } else {
            loadFeaturedImages();
          }
        }}
        isRefreshing={isLoading}
        countsText={countsText}
        onSearchKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (searchQuery.trim()) {
              searchImages(searchQuery, 1);
            }
          }
        }}
      />

      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
              <p className="text-gray-600 dark:text-gray-400">Searching Unsplash...</p>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? 'No images found' : 'Start searching for images'}
              </p>
              <p className="text-sm text-gray-400">
                Try different keywords
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all"
                  style={selectedImageId === image.id ? {
                    boxShadow: `0 0 0 4px ${themeColors.cssVars.primary.base}`
                  } : undefined}
                  onMouseEnter={(e) => !selectedImageId && (e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${themeColors.cssVars.primary.base} 60%, transparent)`)}
                  onMouseLeave={(e) => !selectedImageId && (e.currentTarget.style.boxShadow = '')}
                  onClick={() => handleImageSelect(image)}
                >
                  <img
                    src={image.urls.small}
                    alt={image.alt_description || image.description || 'Unsplash image'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay with photographer info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-medium truncate">
                        Photo by{' '}
                        <a
                          href={`${image.user.links.html}?utm_source=codedharmony&utm_medium=referral`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {image.user.name}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Selected checkmark */}
                  {selectedImageId === image.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default UnsplashImageSearch;
