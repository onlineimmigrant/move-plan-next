'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PexelsPhoto {
  id: number;
  url: string;
  thumbnail: string;
  photographer: string;
  photographer_url: string;
  photo_url: string;
  avg_color?: string;
  width: number;
  height: number;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  thumbnail: string;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  user: {
    name: string;
    url: string;
  };
  url: string;
}

interface PexelsImageSearchProps {
  onSelectImage: (url: string, attribution?: PexelsAttributionData, isVideo?: boolean, videoData?: any) => void;
}

export default function PexelsImageSearch({ onSelectImage }: PexelsImageSearchProps) {
  const [mediaType, setMediaType] = useState<'photos' | 'videos'>('photos');
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [includeAttribution, setIncludeAttribution] = useState(false); // Optional attribution
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  
  const themeColors = useThemeColors();
  const { primary } = themeColors;

  const searchMedia = useCallback(async (searchQuery: string, pageNum: number = 1, type: 'photos' | 'videos' = mediaType) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = type === 'photos' ? '/api/pexels/search' : '/api/pexels/videos';
      const response = await fetch(
        `${endpoint}?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&per_page=30`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} from Pexels`);
      }

      const data = await response.json();

      if (type === 'photos') {
        if (pageNum === 1) {
          setPhotos(data.photos);
        } else {
          setPhotos(prev => [...prev, ...data.photos]);
        }
      } else {
        if (pageNum === 1) {
          setVideos(data.videos);
        } else {
          setVideos(prev => [...prev, ...data.videos]);
        }
      }

      // Display any message from the API
      if (data.message) {
        setError(data.message);
      }

      setHasMore(!!data.next_page);
      setPage(pageNum);
    } catch (err) {
      console.error(`Error searching Pexels ${type}:`, err);
      setError(`Failed to load ${type}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [mediaType]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    // Enforce minimum length for videos to avoid empty/invalid API results
    if (mediaType === 'videos' && query.trim().length < 2) {
      setError('Please enter at least 2 characters to search videos');
      return;
    }
    setPhotos([]);
    setVideos([]);
    setPage(1);
    searchMedia(query, 1, mediaType);
  };

  // Search on input with debounce
  useEffect(() => {
    if (!query.trim()) return;
    // Skip short queries for videos
    if (mediaType === 'videos' && query.trim().length < 2) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      setPhotos([]);
      setVideos([]);
      setPage(1);
      searchMedia(query, 1, mediaType);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, searchMedia]);

  const handleLoadMore = () => {
    searchMedia(query, page + 1, mediaType);
  };

  const handleSelectPhoto = (photo: PexelsPhoto) => {
    const attribution: PexelsAttributionData | undefined = includeAttribution ? {
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      photo_url: photo.photo_url,
    } : undefined;
    
    onSelectImage(photo.url, attribution, false);
  };

  const handleSelectVideo = (video: PexelsVideo) => {
    // Get highest quality HD video
    const hdVideo = video.video_files
      .filter(file => file.quality === 'hd')
      .sort((a, b) => b.width - a.width)[0] || video.video_files[0];

    const attribution: PexelsAttributionData | undefined = includeAttribution ? {
      photographer: video.user.name,
      photographer_url: video.user.url,
      photo_url: video.url,
    } : undefined;

    // Pass video data
    onSelectImage(
      hdVideo.link,
      attribution,
      true,
      {
        thumbnail: video.thumbnail,
        duration: video.duration,
        width: video.width,
        height: video.height,
      }
    );
  };

  const handleMediaTypeChange = (type: 'photos' | 'videos') => {
    setMediaType(type);
    if (query) {
      setPhotos([]);
      setVideos([]);
      setPage(1);
      searchMedia(query, 1, type);
    }
  };

  // Load default media on mount
  useEffect(() => {
    searchMedia('nature', 1, 'photos');
  }, []);

  const currentMedia = mediaType === 'photos' ? photos : videos;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Media Type Toggle & Attribution Option */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleMediaTypeChange('photos')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mediaType === 'photos'
                ? 'text-white shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
            style={mediaType === 'photos' ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
          >
            <PhotoIcon className="w-4 h-4 inline-block mr-2" />
            Photos
          </button>
          <button
            onClick={() => handleMediaTypeChange('videos')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mediaType === 'videos'
                ? 'text-white shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
            style={mediaType === 'videos' ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
          >
            <VideoCameraIcon className="w-4 h-4 inline-block mr-2" />
            Videos
          </button>
        </div>

        {/* Attribution Toggle */}
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 3%, transparent)`, borderWidth: '1px', borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)` }}>
          <input
            type="checkbox"
            id="pexels-attribution"
            checked={includeAttribution}
            onChange={(e) => setIncludeAttribution(e.target.checked)}
            className="w-4 h-4 rounded focus:ring-2"
            style={{ color: themeColors.cssVars.primary.base, '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
          />
          <label htmlFor="pexels-attribution" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Include attribution (optional - Pexels license allows use without attribution)
          </label>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search free ${mediaType} on Pexels...`}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent transition-shadow"
            style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto -mx-6 px-6">
        {currentMedia.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            {query ? `No ${mediaType} found` : `Search for free ${mediaType} from Pexels`}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaType === 'photos' ? (
                photos.map((photo, index) => (
                  <div
                    key={`${photo.id}-${index}`}
                    className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-square"
                    onClick={() => handleSelectPhoto(photo)}
                  >
                    <img
                      src={photo.thumbnail}
                      alt={`Photo by ${photo.photographer}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-xs truncate">by {photo.photographer}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                videos.map((video, index) => {
                  // Get preview quality video for hover playback
                  const previewVideo = video.video_files
                    .filter(file => file.quality === 'sd' || file.quality === 'hd')
                    .sort((a, b) => a.width - b.width)[0] || video.video_files[0];
                  
                  const isHovered = hoveredVideoId === video.id;
                  
                  return (
                    <div
                      key={`${video.id}-${index}`}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square"
                      onClick={() => handleSelectVideo(video)}
                      onMouseEnter={() => setHoveredVideoId(video.id)}
                      onMouseLeave={() => setHoveredVideoId(null)}
                    >
                      {isHovered ? (
                        <video
                          src={previewVideo.link}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={video.thumbnail}
                          alt={`Video by ${video.user.name}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                          loading="lazy"
                        />
                      )}
                      {/* Play icon overlay - hide when hovering */}
                      {!isHovered && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {Math.floor(video.duration)}s
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-xs truncate font-medium">by {video.user.name}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Load More Button */}
            {hasMore && !isLoading && currentMedia.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  variant="secondary"
                >
                  Load More
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pexels Attribution */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Free {mediaType} provided by{' '}
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium"
            style={{ color: themeColors.cssVars.primary.base }}
          >
            Pexels
          </a>
          {' '}• No attribution required
        </p>
      </div>
    </div>
  );
}
