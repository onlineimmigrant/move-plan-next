// src/components/ProductDetailMediaDisplay.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Slider from 'react-slick';
import dynamic from 'next/dynamic';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

// Custom arrow components for React Slick
const CustomPrevArrow = ({ onClick }: any) => (
  <button 
    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-all duration-200"
    onClick={onClick}
    aria-label="Previous image"
    type="button"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);

const CustomNextArrow = ({ onClick }: any) => (
  <button 
    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-all duration-200"
    onClick={onClick}
    aria-label="Next image"
    type="button"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

interface MediaItem {
  id: number;
  product_id: number;
  order: number;
  is_video: boolean;
  video_url?: string;
  video_player?: 'youtube' | 'vimeo';
  image_url?: string;
  thumbnail_url?: string | null;
}

interface ProductDetailMediaDisplayProps {
  mediaItems: MediaItem[];
}

const ProductDetailMediaDisplay: React.FC<ProductDetailMediaDisplayProps> = ({ mediaItems }) => {
  const sortedMediaItems = useMemo(
    () => [...mediaItems].sort((a, b) => a.order - b.order),
    [mediaItems]
  );

  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(
    sortedMediaItems.length > 0 ? sortedMediaItems[0] : null
  );
  const [loadingMedia, setLoadingMedia] = useState<number | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<number>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (sortedMediaItems.length <= 1 || !activeMedia) return;
    
    const currentIndex = sortedMediaItems.findIndex(item => item.id === activeMedia.id);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : sortedMediaItems.length - 1;
        break;
      case 'ArrowRight':
        newIndex = currentIndex < sortedMediaItems.length - 1 ? currentIndex + 1 : 0;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    setActiveMedia(sortedMediaItems[newIndex]);
  }, [sortedMediaItems, activeMedia]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderMedia = (media: MediaItem, isMain: boolean = true) => {
    const isLoading = loadingMedia === media.id;
    const hasFailed = failedMedia.has(media.id);
    
    // Use consistent aspect ratio for all main media to prevent jumping
    const containerClass = isMain ? "w-full aspect-[4/5] rounded-lg overflow-hidden" : "w-full h-full";

    if (media.is_video && media.video_url && media.video_player && !hasFailed) {
      const videoUrl =
        media.video_player === 'youtube'
          ? `https://www.youtube.com/watch?v=${media.video_url}`
          : `https://vimeo.com/${media.video_url}`;
      
      if (isMain) {
        // Main video: centered within consistent aspect-[4/5] container
        return (
          <div className={containerClass}>
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {/* Center video within the 4:5 container */}
            <div className="w-full h-full bg-transparent flex items-center justify-center">
              <div className="w-full aspect-video max-h-full">
                <ReactPlayer
                  url={videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  onReady={() => setLoadingMedia(null)}
                  onError={() => {
                    setLoadingMedia(null);
                    setFailedMedia(prev => new Set(prev).add(media.id));
                  }}
                  config={{
                    youtube: { 
                      playerVars: { 
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0
                      } 
                    },
                    vimeo: { 
                      playerOptions: { 
                        background: false,
                        title: false,
                        byline: false,
                        portrait: false
                      } 
                    },
                  }}
                />
              </div>
            </div>
          </div>
        );
      } else {
        // Thumbnail video: full container
        return (
          <div className={containerClass}>
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <ReactPlayer
              url={videoUrl}
              width="100%"
              height="100%"
              controls
              playing={false}
              onReady={() => setLoadingMedia(null)}
              onError={() => {
                setLoadingMedia(null);
                setFailedMedia(prev => new Set(prev).add(media.id));
              }}
              config={{
                youtube: { 
                  playerVars: { 
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0
                  } 
                },
                vimeo: { 
                  playerOptions: { 
                    background: false,
                    title: false,
                    byline: false,
                    portrait: false
                  } 
                },
              }}
            />
          </div>
        );
      }
    } else if (media.image_url && !hasFailed) {
      return (
        <div className={`relative ${isMain ? containerClass : 'w-full h-full bg-gray-100 rounded-lg overflow-hidden'}`}>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={media.image_url}
            alt={`Product media ${sortedMediaItems.findIndex(item => item.id === media.id) + 1}`}
            className={isMain ? "w-full h-full object-contain transition-opacity duration-200" : "w-full h-full object-cover"}
            loading={isMain ? 'eager' : 'lazy'}
            onLoad={() => setLoadingMedia(null)}
            onLoadStart={() => setLoadingMedia(media.id)}
            onError={() => {
              setLoadingMedia(null);
              setFailedMedia(prev => new Set(prev).add(media.id));
            }}
          />
        </div>
      );
    }
    
    return (
      <div className={isMain ? "w-full aspect-[4/5] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center rounded-lg" : "w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center rounded-lg"}>  
        <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-gray-400 text-xs">{hasFailed ? 'Failed' : 'No media'}</span>
      </div>
    );
  };

  const mainSliderSettings = useMemo(
    () => ({
      dots: false,
      infinite: sortedMediaItems.length > 1,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: sortedMediaItems.length > 1,
      speed: 300,
      swipeToSlide: true,
      afterChange: (index: number) => setActiveMedia(sortedMediaItems[index]),
      prevArrow: <CustomPrevArrow />,
      nextArrow: <CustomNextArrow />,
    }),
    [sortedMediaItems]
  );

  if (!sortedMediaItems.length || !activeMedia) {
    return null;
  }

  return (
    <div className="relative z-10 w-full">
      {/* Mobile: Main media slider with elegant arrows */}
      <div className="md:hidden relative">
        {sortedMediaItems.length > 1 && (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {sortedMediaItems.findIndex(item => item.id === activeMedia?.id) + 1} / {sortedMediaItems.length}
          </div>
        )}
        <Slider {...mainSliderSettings} className="w-full">
          {sortedMediaItems.map((media) => (
            <div key={media.id} className="px-1">
              {renderMedia(media, true)}
            </div>
          ))}
        </Slider>
      </div>

      {/* Desktop: Main media with thumbnail carousel and navigation arrows */}
      <div className="hidden md:block">
        <div className="w-full mb-6">{renderMedia(activeMedia, true)}</div>
        {sortedMediaItems.length > 1 && (
          <div className="relative">
            <div className="text-center text-sm text-gray-500 mb-3">
              {sortedMediaItems.findIndex(item => item.id === activeMedia?.id) + 1} of {sortedMediaItems.length}
            </div>
            <div className="relative">
              {sortedMediaItems.length > 5 && (
                <>
                  <button
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md hover:shadow-lg rounded-full p-2 transition-all duration-200"
                    onClick={() => {
                      const container = document.querySelector('.thumbnail-container');
                      if (container) {
                        // Calculate scroll amount based on thumbnail width + gap (64px + 24px = 88px per thumbnail)
                        const scrollAmount = 88 * 3; // Scroll 3 thumbnails at a time
                        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    aria-label="Scroll thumbnails left"
                    type="button"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md hover:shadow-lg rounded-full p-2 transition-all duration-200"
                    onClick={() => {
                      const container = document.querySelector('.thumbnail-container');
                      if (container) {
                        // Calculate scroll amount based on thumbnail width + gap (64px + 24px = 88px per thumbnail)
                        const scrollAmount = 88 * 3; // Scroll 3 thumbnails at a time
                        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    aria-label="Scroll thumbnails right"
                    type="button"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              <div className="flex items-start justify-start space-x-6 overflow-x-auto pb-6 pt-2 thumbnail-container scroll-smooth">
                {sortedMediaItems.map((media, index) => {
                  const isActive = activeMedia?.id === media.id;
                  const isVideo = media.is_video && media.video_url && media.video_player;
                  
                  return (
                    <div
                      key={media.id}
                      onMouseEnter={() => setActiveMedia(media)}
                      onClick={() => setActiveMedia(media)}
                      className={`
                        relative cursor-pointer flex-shrink-0 w-16 aspect-[4/5] rounded-lg px-2 py-1 mx-1
                        transition-all duration-200 ease-out
                        ${
                          isActive
                            ? 'ring-2 ring-gray-200 ring-offset-1 scale-105'
                            : 'hover:ring-2 hover:ring-gray-200 hover:scale-102'
                        }
                      `}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${isVideo ? 'video' : 'image'} ${index + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveMedia(media);
                        }
                      }}
                    >
                      {isVideo ? (
                        <div className="relative w-full h-full rounded-md overflow-hidden">
                          {/* Video thumbnail background - use actual thumbnail if available */}
                          {media.thumbnail_url || media.image_url ? (
                            <img
                              src={media.thumbnail_url || media.image_url}
                              alt={`Video thumbnail ${index + 1}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to gradient background if thumbnail fails
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback transparent background for videos without thumbnails */}
                          <div className="absolute inset-0 bg-transparent flex items-center justify-center" 
                               style={{ 
                                 display: media.thumbnail_url || media.image_url ? 'none' : 'flex'
                               }}>
                          </div>
                          
                          {/* Play button overlay - always visible */}
                          <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                            <div className="w-5 h-5 bg-red-500/90 text-white rounded-full flex items-center justify-center text-xs shadow-lg">
                              ▶
                            </div>
                          </div>
                          
                          {/* Video platform indicator */}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {media.video_player === 'youtube' ? 'YT' : 'VM'}
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full rounded-md overflow-hidden">
                          {media.image_url ? (
                            <img
                              src={
                                media.thumbnail_url && media.thumbnail_url !== null
                                  ? media.thumbnail_url
                                  : media.image_url
                              }
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMCA2VjE0TTYgMTBIMTQiIHN0cm9rZT0iIzk3QTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-gray-200/20 border border-gray-200 rounded-lg"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailMediaDisplay;
