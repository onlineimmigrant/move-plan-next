'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MediaAttribution from '@/components/MediaAttribution';
import { SliderNavigation } from '@/ui/SliderNavigation';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface FeatureMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  display_order: number;
  storage_provider?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      download_url?: string;
    };
    pexels_attribution?: {
      photographer: string;
      photographer_url: string;
    };
    pexels_video?: {
      duration: number;
      width: number;
      height: number;
    };
  };
}

interface FeatureMediaCarouselProps {
  media: FeatureMedia[];
  featureName: string;
  compact?: boolean;
  enableKeyboardNavigation?: boolean;
  thumbnailSelectOnHover?: boolean;
  enableHoverVideoPreview?: boolean;
  enableVideoSnapshots?: boolean;
  preferLightEmbeds?: boolean;
  onDelete?: (mediaId: string) => void;
  canDelete?: boolean;
  onChangeThumbnail?: (mediaId: string) => void;
  canChangeThumbnail?: boolean;
}

export default function FeatureMediaCarousel({
  media,
  featureName,
  compact = false,
  enableKeyboardNavigation = true,
  thumbnailSelectOnHover = true,
  enableHoverVideoPreview = true,
  enableVideoSnapshots = true,
  preferLightEmbeds = false,
  onDelete,
  canDelete = false,
  onChangeThumbnail,
  canChangeThumbnail = false,
}: FeatureMediaCarouselProps) {
  const [activeMedia, setActiveMedia] = useState<FeatureMedia | null>(
    media.length > 0 ? media[0] : null
  );
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState<string | null>(null);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const videoProgressRef = useRef<Map<string, number>>(new Map());
  const videoSnapshotsRef = useRef<Map<string, string>>(new Map());
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Capture current video frame as snapshot
  const captureVideoSnapshot = useCallback((mediaId: string) => {
    if (!enableVideoSnapshots) return;
    const videoElement = videoElementsRef.current.get(`hover-${mediaId}`) || videoElementsRef.current.get(`player-${mediaId}`);
    
    if (!videoElement) {
      return;
    }

    try {
      if (!videoElement.videoWidth || !videoElement.videoHeight || videoElement.readyState < 2) {
        console.warn('Video not ready for snapshot capture');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        videoSnapshotsRef.current.set(mediaId, dataUrl);
        setSnapshotVersion(prev => prev + 1);
      } catch (canvasError) {
        console.warn('[Snapshot] Cannot capture due to CORS restrictions:', canvasError);
      }
    } catch (error) {
      console.error('Failed to capture video snapshot:', error);
    }
  }, [enableVideoSnapshots]);

  // Helper to compute a thumbnail when missing
  const getDerivedThumbnail = (mediaItem: FeatureMedia): string | null => {
    if (!mediaItem) return null;
    if (mediaItem.thumbnail_url && mediaItem.thumbnail_url.trim()) return mediaItem.thumbnail_url.trim();
    if (enableVideoSnapshots) {
      const snapshot = videoSnapshotsRef.current.get(mediaItem.id);
      if (snapshot) return snapshot;
    }
    if (mediaItem.storage_provider === 'youtube' && mediaItem.media_url) {
      return `https://img.youtube.com/vi/${mediaItem.media_url}/hqdefault.jpg`;
    }
    if (mediaItem.storage_provider === 'vimeo' && mediaItem.media_url) {
      return `https://vumbnail.com/${mediaItem.media_url}.jpg`;
    }
    if (mediaItem.storage_provider === 'r2' || mediaItem.storage_provider === 'pexels') {
      return null;
    }
    return mediaItem.media_url && mediaItem.media_url.trim() ? mediaItem.media_url.trim() : null;
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;
    if (media.length <= 1 || !activeMedia) return;
    
    const currentIndex = media.findIndex(item => item.id === activeMedia.id);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : media.length - 1;
        break;
      case 'ArrowRight':
        newIndex = currentIndex < media.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Escape':
        if (showFullPlayer !== null) {
          event.preventDefault();
          captureVideoSnapshot(showFullPlayer);
          setShowFullPlayer(null);
          if (doubleClickTimeoutRef.current) {
            clearTimeout(doubleClickTimeoutRef.current);
            doubleClickTimeoutRef.current = null;
          }
          return;
        }
        return;
      default:
        return;
    }
    
    event.preventDefault();
    setActiveMedia(media[newIndex]);
  }, [enableKeyboardNavigation, media, activeMedia, showFullPlayer, captureVideoSnapshot]);

  useEffect(() => {
    if (!enableKeyboardNavigation) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, handleKeyDown]);

  if (!media || media.length === 0) {
    return null;
  }

  const currentMedia = activeMedia || media[0];
  const isVideo = currentMedia.media_type === 'video';
  const videoPlayer = currentMedia.storage_provider;

  const outerMarginClass = compact ? 'mb-3' : 'mb-8';
  const thumbsTopMarginClass = compact ? 'mt-3' : 'mt-6';
  const thumbsBottomPaddingClass = compact ? 'pb-2' : 'pb-6';
  const thumbsTopPaddingClass = compact ? 'pt-1' : 'pt-2';
  const thumbsGapClass = compact ? 'space-x-3' : 'space-x-6';

  return (
    <div className={`w-full ${outerMarginClass}`}>
      {/* Main media display */}
      <div className="w-full">
        <div 
          className="w-full aspect-4/3 rounded-none md:rounded-lg overflow-hidden relative"
          onMouseEnter={() => {
            if (!enableHoverVideoPreview) return;
            if (!showFullPlayer && (videoPlayer === 'pexels' || videoPlayer === 'r2') && isVideo) {
              setHoveredVideoId(currentMedia.id);
            }
          }}
          onMouseLeave={() => {
            if (!enableHoverVideoPreview) return;
            if (!showFullPlayer) {
              if (enableVideoSnapshots && (videoPlayer === 'pexels' || videoPlayer === 'r2')) {
                captureVideoSnapshot(currentMedia.id);
              }
              setHoveredVideoId(null);
            }
          }}
          onDoubleClick={(e) => {
            if (doubleClickTimeoutRef.current) {
              console.log('[Double Click] Blocked - too soon after last double-click');
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            
            if ((videoPlayer === 'pexels' || videoPlayer === 'r2') && showFullPlayer !== currentMedia.id && isVideo) {
              e.preventDefault();
              e.stopPropagation();
              console.log('[Double Click] Opening full player for:', currentMedia.id);
              
              const hoverTime = videoProgressRef.current.get(`hover-${currentMedia.id}`);
              if (hoverTime !== undefined && hoverTime > 0) {
                console.log('[Double Click] Transferring position from hover:', hoverTime);
                videoProgressRef.current.set(`player-${currentMedia.id}`, hoverTime);
              }
              
              setShowFullPlayer(currentMedia.id);
              setHoveredVideoId(null);
              
              doubleClickTimeoutRef.current = setTimeout(() => {
                doubleClickTimeoutRef.current = null;
              }, 1000);
            }
          }}
        >
          {/* Media content */}
          <div className="w-full h-full flex items-center justify-center">
            {isVideo && currentMedia.media_url ? (
              videoPlayer === 'youtube' || videoPlayer === 'vimeo' ? (
                /* YouTube and Vimeo videos using ReactPlayer */
                <div className="w-full aspect-video max-h-full relative">
                  <ReactPlayer
                    url={
                      videoPlayer === 'youtube'
                        ? `https://www.youtube.com/watch?v=${currentMedia.media_url}`
                        : `https://vimeo.com/${currentMedia.media_url}`
                    }
                    width="100%"
                    height="100%"
                    controls
                    playing={false}
                    light={preferLightEmbeds}
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
                      }
                    }}
                  />
                </div>
              ) : (
                /* R2 and Pexels videos with hover preview */
                <>
                  {showFullPlayer === currentMedia.id ? (
                    /* Show full player with controls on double-click */
                    <div className="w-full aspect-video max-h-full relative">
                      <video
                        key={`player-${currentMedia.id}`}
                        ref={(el) => {
                          if (el) {
                            videoElementsRef.current.set(`player-${currentMedia.id}`, el);
                          } else {
                            videoElementsRef.current.delete(`player-${currentMedia.id}`);
                          }
                        }}
                        data-media-id={currentMedia.id}
                        src={currentMedia.media_url}
                        crossOrigin="anonymous"
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        onLoadedMetadata={(e) => {
                          const savedTime = videoProgressRef.current.get(`player-${currentMedia.id}`);
                          if (savedTime !== undefined && savedTime > 0) {
                            e.currentTarget.currentTime = savedTime;
                          }
                        }}
                        onTimeUpdate={(e) => {
                          const currentTime = e.currentTarget.currentTime;
                          const duration = e.currentTarget.duration;
                          if (duration - currentTime < 0.1) {
                            videoProgressRef.current.set(`player-${currentMedia.id}`, 0);
                          } else {
                            videoProgressRef.current.set(`player-${currentMedia.id}`, currentTime);
                          }
                        }}
                        onPause={(e) => {
                          videoProgressRef.current.set(`player-${currentMedia.id}`, e.currentTarget.currentTime);
                        }}
                      />
                      {/* Close button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullPlayer(null);
                        }}
                        className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : hoveredVideoId === currentMedia.id ? (
                    /* Show video on hover for R2/Pexels videos */
                    <div className="w-full h-full relative">
                      <video
                        key={`hover-${currentMedia.id}`}
                        ref={(el) => {
                          if (el) {
                            videoElementsRef.current.set(`hover-${currentMedia.id}`, el);
                          } else {
                            videoElementsRef.current.delete(`hover-${currentMedia.id}`);
                          }
                        }}
                        data-media-id={currentMedia.id}
                        src={currentMedia.media_url}
                        crossOrigin="anonymous"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                        onLoadedMetadata={(e) => {
                          const savedTime = videoProgressRef.current.get(`hover-${currentMedia.id}`);
                          if (savedTime !== undefined && savedTime > 0) {
                            e.currentTarget.currentTime = savedTime;
                          }
                        }}
                        onTimeUpdate={(e) => {
                          const currentTime = e.currentTarget.currentTime;
                          const duration = e.currentTarget.duration;
                          if (duration - currentTime < 0.1) {
                            videoProgressRef.current.set(`hover-${currentMedia.id}`, 0);
                          } else {
                            videoProgressRef.current.set(`hover-${currentMedia.id}`, currentTime);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    /* Show thumbnail when not hovering */
                    <>
                      {(enableVideoSnapshots && videoSnapshotsRef.current.get(currentMedia.id)) || getDerivedThumbnail(currentMedia) ? (
                        <img
                          decoding="async"
                          src={((enableVideoSnapshots && videoSnapshotsRef.current.get(currentMedia.id)) || getDerivedThumbnail(currentMedia))!}
                          alt={currentMedia.alt_text || `${featureName} video`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Media Attribution Badge (Pexels videos) */}
                  {currentMedia?.metadata?.pexels_attribution && showFullPlayer !== currentMedia.id && (
                    <MediaAttribution
                      platform="pexels"
                      attribution={currentMedia.metadata.pexels_attribution as any}
                      variant="overlay"
                      position="bottom-right"
                    />
                  )}
                </>
              )
            ) : currentMedia.media_url ? (
              /* Image display */
              <div className="relative w-full h-full group/img">
                <img
                  src={currentMedia.media_url}
                  alt={currentMedia.alt_text || `${featureName} - Image ${media.findIndex(item => item.id === currentMedia.id) + 1}`}
                  className="w-full h-full object-contain transition-opacity duration-200"
                  loading="eager"
                />
                
                {/* Media Attribution Badge (Unsplash or Pexels) */}
                {currentMedia?.metadata?.unsplash_attribution && (
                  <MediaAttribution
                    platform="unsplash"
                    attribution={currentMedia.metadata.unsplash_attribution as any}
                    variant="overlay"
                    position="bottom-right"
                  />
                )}
                {currentMedia?.metadata?.pexels_attribution && !currentMedia?.metadata?.unsplash_attribution && (
                  <MediaAttribution
                    platform="pexels"
                    attribution={currentMedia.metadata.pexels_attribution as any}
                    variant="overlay"
                    position="bottom-right"
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Thumbnail navigation */}
        {media.length > 1 && (
          <div className={`relative ${thumbsTopMarginClass}`}>
            <div 
              className={`flex items-start justify-start ${thumbsGapClass} overflow-x-auto ${thumbsBottomPaddingClass} ${thumbsTopPaddingClass} thumbnail-container scroll-smooth touch-pan-x`}
              style={{ 
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch' as any,
              }}
            >
              {media.map((mediaItem, index) => {
                const isActive = activeMedia?.id === mediaItem.id;
                const isVideoItem = mediaItem.media_type === 'video';
                const derivedThumbnail = getDerivedThumbnail(mediaItem);
                
                return (
                  <div
                    key={mediaItem.id}
                    onMouseEnter={thumbnailSelectOnHover ? () => setActiveMedia(mediaItem) : undefined}
                    onClick={() => setActiveMedia(mediaItem)}
                    className={`
                      relative cursor-pointer shrink-0 w-24 md:w-32 aspect-4/3 rounded-lg mx-1 group
                      transition-all duration-200 ease-out
                      ${
                        isActive
                          ? 'scale-105'
                          : 'opacity-80 hover:opacity-100 hover:scale-102'
                      }
                    `}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${isVideoItem ? 'video' : 'image'} ${index + 1}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveMedia(mediaItem);
                      }
                    }}
                  >
                    {isVideoItem ? (
                      <div className="relative w-full h-full rounded-md overflow-hidden">
                        {enableVideoSnapshots && videoSnapshotsRef.current.get(mediaItem.id) ? (
                          <img
                            key={`carousel-thumb-${mediaItem.id}-${snapshotVersion}`}
                            src={videoSnapshotsRef.current.get(mediaItem.id)}
                            alt={`Video thumbnail ${index + 1}`}
                            className="w-full h-full"
                            style={{ objectFit: 'cover' }}
                            loading="lazy"
                            decoding="async"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (img.naturalHeight > img.naturalWidth) {
                                img.style.objectFit = 'contain';
                              }
                            }}
                          />
                        ) : derivedThumbnail ? (
                          <img
                            src={derivedThumbnail}
                            alt={`Video thumbnail ${index + 1}`}
                            className="w-full h-full"
                            style={{ objectFit: 'cover' }}
                            loading="lazy"
                            decoding="async"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (img.naturalHeight > img.naturalWidth) {
                                img.style.objectFit = 'contain';
                              }
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full rounded-md overflow-hidden">
                        {mediaItem.media_url ? (
                          <img
                            src={mediaItem.thumbnail_url || mediaItem.media_url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full"
                            style={{ objectFit: 'cover' }}
                            loading="lazy"
                            decoding="async"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (img.naturalHeight > img.naturalWidth) {
                                img.style.objectFit = 'contain';
                              }
                            }}
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
                    
                    {/* Action buttons - only show if can perform actions */}
                    {(canChangeThumbnail || canDelete) && (
                      <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Change thumbnail button */}
                        {canChangeThumbnail && onChangeThumbnail && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangeThumbnail(mediaItem.id);
                            }}
                            className="bg-blue-600/90 hover:bg-blue-600 text-white rounded-full p-1 transition-colors"
                            aria-label="Change thumbnail"
                            title="Change thumbnail"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Delete button */}
                        {canDelete && onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(mediaItem.id);
                            }}
                            className="bg-red-600/90 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                            aria-label="Delete media"
                            title="Delete media"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              {media.findIndex(item => item.id === activeMedia?.id) + 1} of {media.length}
            </div>
          </div>
        )}

        {/* Slider Navigation */}
        <SliderNavigation
          onPrevious={() => {
            const currentIndex = media.findIndex(item => item.id === activeMedia?.id);
            const newIndex = currentIndex > 0 ? currentIndex - 1 : media.length - 1;
            setActiveMedia(media[newIndex]);
          }}
          onNext={() => {
            const currentIndex = media.findIndex(item => item.id === activeMedia?.id);
            const newIndex = currentIndex < media.length - 1 ? currentIndex + 1 : 0;
            setActiveMedia(media[newIndex]);
          }}
          currentIndex={media.findIndex(item => item.id === activeMedia?.id)}
          totalItems={media.length}
          onDotClick={(index) => setActiveMedia(media[index])}
          showDots={false}
          buttonPosition="bottom-right"
          buttonVariant="minimal"
        />
      </div>
    </div>
  );
}
