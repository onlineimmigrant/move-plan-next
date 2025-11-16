'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';

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

export default function UnsplashImageSearch({ onSelectImage }: UnsplashImageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Debounced search
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
  }, [searchQuery]);

  const loadFeaturedImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unsplash/featured');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load featured images');
      }

      setImages(data.results || []);
      setTotalPages(data.total_pages || 1);
      setPage(1);
    } catch (err) {
      console.error('Error loading featured images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const searchImages = async (query: string, pageNum: number) => {
    if (!query.trim()) {
      loadFeaturedImages();
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

      setImages(data.results || []);
      setTotalPages(data.total_pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Error searching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to search images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (image: UnsplashImage) => {
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
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      searchImages(searchQuery, page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      searchImages(searchQuery, page - 1);
    }
  };

  // Load featured images on mount
  useEffect(() => {
    loadFeaturedImages();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search free high-resolution photos..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Photos provided by{' '}
          <a
            href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Unsplash
          </a>
        </p>
      </div>

      {/* Image Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Searching Unsplash...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <PhotoIcon className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button onClick={() => searchImages(searchQuery, page)} variant="outline" className="mt-4">
                Try Again
              </Button>
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
                  className={`
                    relative aspect-square rounded-lg overflow-hidden cursor-pointer group
                    ${selectedImageId === image.id ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-400'}
                    transition-all
                  `}
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
}
