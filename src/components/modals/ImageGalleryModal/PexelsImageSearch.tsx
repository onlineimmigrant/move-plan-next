'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import { useThemeColors } from '@/hooks/useThemeColors';
import MediaTabToolbar from './MediaTabToolbar';

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
  includeAttribution: boolean;
}

export default function PexelsImageSearch({ onSelectImage, includeAttribution }: PexelsImageSearchProps) {
  const [mediaType, setMediaType] = useState<'photos' | 'videos'>('photos');
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const themeColors = useThemeColors();
  const { primary } = themeColors;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const countsText = currentMedia.length > 0
    ? `${currentMedia.length} ${currentMedia.length === 1 ? mediaType.slice(0, -1) : mediaType}`
    : undefined;

  const radioButtons = (
    <div className="flex gap-3">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="radio"
          name="pexels-media-type"
          value="photos"
          checked={mediaType === 'photos'}
          onChange={() => handleMediaTypeChange('photos')}
          className="w-3.5 h-3.5 focus:ring-2"
          style={{ color: themeColors.cssVars.primary.base, '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
        />
        <PhotoIcon className="w-4 h-4" style={{ color: mediaType === 'photos' ? themeColors.cssVars.primary.base : undefined }} />
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Photos</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="radio"
          name="pexels-media-type"
          value="videos"
          checked={mediaType === 'videos'}
          onChange={() => handleMediaTypeChange('videos')}
          className="w-3.5 h-3.5 focus:ring-2"
          style={{ color: themeColors.cssVars.primary.base, '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
        />
        <VideoCameraIcon className="w-4 h-4" style={{ color: mediaType === 'videos' ? themeColors.cssVars.primary.base : undefined }} />
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Videos</span>
      </label>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <MediaTabToolbar
        searchValue={query}
        onSearchChange={(value) => {
          setQuery(value);
          if (!value.trim()) {
            setPhotos([]);
            setVideos([]);
            setError(null);
          }
        }}
        searchPlaceholder={`Search free ${mediaType} on Pexels...`}
        onRefresh={() => {
          if (query.trim()) {
            searchMedia(query, 1, mediaType);
          }
        }}
        isRefreshing={isLoading}
        countsText={countsText}
        onSearchKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim()) {
            handleSearch();
          }
        }}
        extraControls={!isMobile ? (
          <div className="flex gap-3 border-r border-gray-300 dark:border-gray-600 pr-3">
            {radioButtons}
          </div>
        ) : undefined}
      />

      {/* Mobile radio buttons below search */}
      {isMobile && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          {radioButtons}
        </div>
      )}

      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
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
    </div>
  );
}
