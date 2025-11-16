'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ProductMedia } from '@/types/product';
import Image from 'next/image';
import MediaAttribution, { UnsplashAttributionData, PexelsAttributionData } from '@/components/MediaAttribution';
import type { UnsplashAttribution as UnsplashAttr } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';

interface ProductMediaCarouselProps {
  productId: number;
  onAddMedia: () => void;
}

export interface ProductMediaCarouselHandle {
  addMediaItem: (imageUrl: string, attribution?: UnsplashAttr | PexelsAttributionData, isVideo?: boolean, videoData?: any) => Promise<void>;
}

const ProductMediaCarousel = forwardRef<ProductMediaCarouselHandle, ProductMediaCarouselProps>(
  ({ productId, onAddMedia }, ref) => {
    const [mediaItems, setMediaItems] = useState<ProductMedia[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVideoHovered, setIsVideoHovered] = useState(false);
    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const videoProgressRef = React.useRef<Map<number, number>>(new Map());
    const videoSnapshotsRef = React.useRef<Map<number, string>>(new Map());

    // Capture current video frame as snapshot
    const captureVideoSnapshot = React.useCallback((videoElement: HTMLVideoElement, mediaId: number) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        videoSnapshotsRef.current.set(mediaId, dataUrl);
      } catch (error) {
        console.error('Failed to capture video snapshot:', error);
      }
    }, []);

    const handleAddClick = () => {
      console.log('🎯 Add Media button clicked in carousel');
      console.log('📞 onAddMedia function:', onAddMedia);
      if (onAddMedia) {
        onAddMedia();
      } else {
        console.error('❌ onAddMedia is not defined!');
      }
    };

    useEffect(() => {
      fetchMedia();
    }, [productId]);

    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${productId}/media`);
        if (response.ok) {
          const data = await response.json();
          setMediaItems(data);
        }
      } catch (error) {
        console.error('Error fetching product media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDelete = async (mediaId: number) => {
      if (!confirm('Are you sure you want to delete this media item?')) {
        return;
      }

      try {
        const response = await fetch(`/api/products/${productId}/media/${mediaId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMediaItems(prev => prev.filter(item => item.id !== mediaId));
          if (currentIndex >= mediaItems.length - 1 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          }
        } else {
          alert('Failed to delete media item');
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        alert('Failed to delete media item');
      }
    };

    const handlePrevious = () => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
    };

    const addMediaItem = async (imageUrl: string, attribution?: UnsplashAttr | PexelsAttributionData, isVideo?: boolean, videoData?: any) => {
      try {
        // Determine which platform by checking for download_location (Unsplash-specific)
        let attrs: any = {};
        if (attribution) {
          if ('download_location' in attribution) {
            // It's Unsplash attribution
            attrs.unsplash_attribution = attribution;
          } else {
            // It's Pexels attribution
            attrs.pexels_attribution = attribution;
          }
        }

        const requestBody: any = {
          is_video: isVideo || false,
          attrs,
        };

        if (isVideo && videoData) {
          // It's a Pexels video
          requestBody.video_url = imageUrl; // The actual video URL
          requestBody.video_player = 'pexels'; // Custom player type for Pexels
          requestBody.thumbnail_url = videoData.thumbnail;
          // Store video metadata in attrs
          attrs.pexels_video = {
            duration: videoData.duration,
            width: videoData.width,
            height: videoData.height,
          };
        } else {
          // It's an image
          requestBody.image_url = imageUrl;
        }

        const response = await fetch(`/api/products/${productId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const newMedia = await response.json();
          setMediaItems(prev => [...prev, newMedia]);
        } else {
          alert('Failed to add media item');
        }
      } catch (error) {
        console.error('Error adding media:', error);
        alert('Failed to add media item');
      }
    };

    // Expose addMediaItem method to parent
    useImperativeHandle(ref, () => ({
      addMediaItem,
    }));

    if (isLoading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Additional Media
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      );
    }

    const currentMedia = mediaItems[currentIndex];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Additional Media
        </h3>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add Media
        </button>
      </div>

      {mediaItems.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No additional media yet
          </p>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Media
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Carousel */}
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group/img">
            {currentMedia?.is_video && currentMedia?.video_url ? (
              <div 
                className="relative w-full h-full"
                onMouseEnter={() => !showFullPlayer && setIsVideoHovered(true)}
                onMouseLeave={() => {
                  if (!showFullPlayer) {
                    // Capture current frame before leaving
                    const videoEl = document.querySelector(`video[data-media-id="${currentMedia.id}"]`) as HTMLVideoElement;
                    if (videoEl && !videoEl.paused) {
                      captureVideoSnapshot(videoEl, currentMedia.id);
                    }
                    setIsVideoHovered(false);
                  }
                }}
                onDoubleClick={() => {
                  if (currentMedia.video_player === 'pexels') {
                    setShowFullPlayer(true);
                    setIsVideoHovered(false);
                  }
                }}
              >
                {showFullPlayer ? (
                  /* Show full player with controls on double-click */
                  <>
                    <video
                      key={`player-${currentMedia.id}`}
                      src={currentMedia.video_url}
                      crossOrigin="anonymous"
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      onLoadedMetadata={(e) => {
                        if (currentMedia) {
                          const savedTime = videoProgressRef.current.get(currentMedia.id);
                          if (savedTime !== undefined && savedTime > 0) {
                            e.currentTarget.currentTime = savedTime;
                          }
                        }
                      }}
                      onTimeUpdate={(e) => {
                        if (currentMedia) {
                          const currentTime = e.currentTarget.currentTime;
                          const duration = e.currentTarget.duration;
                          // Reset position if video is near the end (looping soon)
                          if (duration - currentTime < 0.1) {
                            videoProgressRef.current.set(currentMedia.id, 0);
                          } else {
                            videoProgressRef.current.set(currentMedia.id, currentTime);
                          }
                        }
                      }}
                      onPause={(e) => {
                        if (currentMedia) {
                          videoProgressRef.current.set(currentMedia.id, e.currentTarget.currentTime);
                        }
                      }}
                    />
                    {/* Close button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullPlayer(false);
                      }}
                      className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : isVideoHovered && currentMedia.video_player === 'pexels' ? (
                  /* Show video on hover for Pexels videos */
                  <video
                    key={`hover-${currentMedia.id}`}
                    data-media-id={currentMedia.id}
                    src={currentMedia.video_url}
                    crossOrigin="anonymous"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                    onLoadedMetadata={(e) => {
                      if (currentMedia) {
                        const savedTime = videoProgressRef.current.get(currentMedia.id);
                        if (savedTime !== undefined && savedTime > 0) {
                          e.currentTarget.currentTime = savedTime;
                        }
                      }
                    }}
                    onTimeUpdate={(e) => {
                      if (currentMedia) {
                        const currentTime = e.currentTarget.currentTime;
                        const duration = e.currentTarget.duration;
                        // Reset position if video is near the end (looping soon)
                        if (duration - currentTime < 0.1) {
                          videoProgressRef.current.set(currentMedia.id, 0);
                        } else {
                          videoProgressRef.current.set(currentMedia.id, currentTime);
                        }
                      }
                    }}
                  />
                ) : (
                  /* Show thumbnail when not hovering - use snapshot if available */
                  <Image
                    src={videoSnapshotsRef.current.get(currentMedia.id) || currentMedia.thumbnail_url || currentMedia.image_url || ''}
                    alt={currentMedia.name || `Product video ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                )}
                {/* Play icon overlay for videos (hide when playing or in full player) */}
                {!isVideoHovered && !showFullPlayer && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
                {/* Media Attribution Badge (Pexels videos) */}
                {currentMedia?.attrs?.pexels_attribution && !showFullPlayer && (
                  <MediaAttribution
                    platform="pexels"
                    attribution={currentMedia.attrs.pexels_attribution as any}
                    variant="overlay"
                    position="bottom-left"
                  />
                )}
              </div>
            ) : currentMedia?.image_url ? (
              <div className="relative w-full h-full">
                <Image
                  src={currentMedia.image_url}
                  alt={currentMedia.name || `Product photo ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                />
                
                {/* Media Attribution Badge (Unsplash or Pexels) */}
                {currentMedia?.attrs?.unsplash_attribution && (
                  <MediaAttribution
                    platform="unsplash"
                    attribution={currentMedia.attrs.unsplash_attribution as any}
                    variant="overlay"
                    position="bottom-left"
                  />
                )}
                {currentMedia?.attrs?.pexels_attribution && !currentMedia?.attrs?.unsplash_attribution && (
                  <MediaAttribution
                    platform="pexels"
                    attribution={currentMedia.attrs.pexels_attribution as any}
                    variant="overlay"
                    position="bottom-left"
                  />
                )}
              </div>
            ) : null}

            {/* Navigation arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Delete button */}
            <button
              onClick={() => currentMedia && handleDelete(currentMedia.id)}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              title="Delete this photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Thumbnail navigation */}
          {mediaItems.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentIndex
                      ? 'border-sky-600'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {item.is_video && item.thumbnail_url ? (
                    <>
                      <Image
                        src={item.thumbnail_url}
                        alt={`Video thumbnail ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                      {/* Small play icon for video thumbnails */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          {mediaItems.length > 0 && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {currentIndex + 1} / {mediaItems.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

ProductMediaCarousel.displayName = 'ProductMediaCarousel';

export default ProductMediaCarousel;
