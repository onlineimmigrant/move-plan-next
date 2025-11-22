// src/components/ProductDetailMediaDisplay.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Slider from 'react-slick';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import MediaAttribution from '@/components/MediaAttribution';
import { useThemeColors } from '@/hooks/useThemeColors';
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
  video_player?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
  image_url?: string;
  thumbnail_url?: string | null;
  attrs?: {
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
    pexels_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
    };
    pexels_video?: {
      duration: number;
      width: number;
      height: number;
    };
    [key: string]: any;
  };
}

interface ProductDetailMediaDisplayProps {
  mediaItems: MediaItem[];
}

const ProductDetailMediaDisplay: React.FC<ProductDetailMediaDisplayProps> = ({ mediaItems }) => {
  const themeColors = useThemeColors();
  
  // Debug: Log all media items
  useEffect(() => {
    // console.log('[ProductDetailMediaDisplay] All media items:', mediaItems);
    const r2Videos = mediaItems.filter(m => m.is_video && m.video_player === 'r2');
    // console.log('[ProductDetailMediaDisplay] R2 videos:', r2Videos);
  }, [mediaItems]);
  
  const sortedMediaItems = useMemo(
    () => [...mediaItems].sort((a, b) => a.order - b.order),
    [mediaItems]
  );

  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(
    sortedMediaItems.length > 0 ? sortedMediaItems[0] : null
  );
  const [isFirstImage, setIsFirstImage] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState<number | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<number>>(new Set());
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState<number | null>(null);
  const [snapshotVersion, setSnapshotVersion] = useState(0); // Track snapshot updates to trigger re-renders
  const videoProgressRef = useRef<Map<string | number, number>>(new Map());
  const videoSnapshotsRef = useRef<Map<number, string>>(new Map()); // Store video frame snapshots
  const videoElementsRef = useRef<Map<string | number, HTMLVideoElement>>(new Map()); // Store video element references
  const reactPlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to compute a thumbnail when missing
  const getDerivedThumbnail = (media: MediaItem): string | null => {
    if (!media) return null;
    // Priority: explicit thumbnail → snapshot → derived URL patterns
    if (media.thumbnail_url && media.thumbnail_url.trim()) return media.thumbnail_url.trim();
    const snapshot = videoSnapshotsRef.current.get(media.id);
    if (snapshot) return snapshot;
    if (media.video_player === 'youtube' && media.video_url) {
      const youtubeThumb = `https://img.youtube.com/vi/${media.video_url}/hqdefault.jpg`;
      console.log('[getDerivedThumbnail] YouTube thumbnail:', youtubeThumb);
      return youtubeThumb;
    }
    if (media.video_player === 'vimeo' && media.video_url) {
      const vimeoThumb = `https://vumbnail.com/${media.video_url}.jpg`;
      console.log('[getDerivedThumbnail] Vimeo thumbnail:', vimeoThumb);
      return vimeoThumb;
    }
    // For R2 and Pexels videos, don't use image_url as fallback (it's often the video URL itself)
    // Return null to trigger placeholder display
    if (media.video_player === 'r2' || media.video_player === 'pexels') {
      console.log('[getDerivedThumbnail] R2/Pexels video without thumbnail:', media.id);
      return null;
    }
    const fallback = media.image_url && media.image_url.trim() ? media.image_url.trim() : null;
    // console.log('[getDerivedThumbnail] Fallback for', media.video_player, ':', fallback);
    return fallback;
  };
  
  // Touch swipe handling for mobile
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      const currentIndex = sortedMediaItems.findIndex(item => item.id === activeMedia?.id);
      
      if (swipeDistance > 0) {
        // Swiped left - next item
        const newIndex = currentIndex < sortedMediaItems.length - 1 ? currentIndex + 1 : 0;
        setActiveMedia(sortedMediaItems[newIndex]);
      } else {
        // Swiped right - previous item
        const newIndex = currentIndex > 0 ? currentIndex - 1 : sortedMediaItems.length - 1;
        setActiveMedia(sortedMediaItems[newIndex]);
      }
    }
    
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Capture current video frame as snapshot
  const captureVideoSnapshot = useCallback((mediaId: number) => {
    // Try to get video from hover element first, then player
    const videoElement = videoElementsRef.current.get(`hover-${mediaId}`) || videoElementsRef.current.get(`player-${mediaId}`);
    
    if (!videoElement) {
      console.log('[Snapshot] No video element found for media:', mediaId);
      return;
    }

    try {
      // Check if video has valid dimensions and is ready
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
        setSnapshotVersion(prev => prev + 1); // Trigger re-render to show new snapshot
      } catch (canvasError) {
        // Canvas is tainted due to CORS - this is expected for R2 videos with crossOrigin
        console.warn('[Snapshot] Cannot capture due to CORS restrictions:', canvasError);
        // Don't update snapshot - keep using the original thumbnail
      }
    } catch (error) {
      console.error('Failed to capture video snapshot:', error);
    }
  }, []);

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
      case 'Escape':
        if (showFullPlayer !== null) {
          event.preventDefault();
          // Capture current frame before closing
          captureVideoSnapshot(showFullPlayer);
          setIsPlaying(false);
          setShowFullPlayer(null);
          // Clear debounce when closing
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
    setActiveMedia(sortedMediaItems[newIndex]);
  }, [sortedMediaItems, activeMedia, showFullPlayer, captureVideoSnapshot]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderMedia = (media: MediaItem, isMain: boolean = true) => {
    const isLoading = loadingMedia === media.id;
    const hasFailed = failedMedia.has(media.id);
    
    // Use 4:3 aspect ratio container - works well for both portrait and landscape
    const containerClass = isMain ? "w-full aspect-[4/3] rounded-none md:rounded-lg overflow-hidden relative bg-gray-50" : "w-full h-full";

    if (media.is_video && media.video_url && media.video_url.trim() && media.video_player && !hasFailed) {
      const safeVideoUrl = media.video_url || '';
      const videoUrl: string =
        media.video_player === 'youtube'
          ? `https://www.youtube.com/watch?v=${safeVideoUrl}`
          : media.video_player === 'vimeo'
          ? `https://vimeo.com/${safeVideoUrl}`
          : safeVideoUrl; // For Pexels/R2, use direct URL
      
      if (isMain) {
        const isHovered = hoveredVideoId === media.id;
        const showHoverVideo = isHovered && (media.video_player === 'pexels' || media.video_player === 'r2') && media.video_url && showFullPlayer !== media.id;
        const showPlayer = showFullPlayer === media.id;
        const derivedThumb = getDerivedThumbnail(media);
        
        console.log('[renderMedia]', {
          id: media.id,
          video_player: media.video_player,
          isHovered,
          showHoverVideo,
          showPlayer,
          derivedThumb,
          willRender: showPlayer ? 'FULLSCREEN' : showHoverVideo ? 'HOVER' : derivedThumb ? 'THUMBNAIL' : 'UNAVAILABLE'
        });
        
        // Main video: centered within consistent aspect-[4/5] container
        return (
          <div 
            className={containerClass}
            onMouseEnter={() => {
              if (!showPlayer && (media.video_player === 'pexels' || media.video_player === 'r2')) {
                setHoveredVideoId(media.id);
              }
            }}
            onMouseLeave={() => {
              if (!showPlayer) {
                // Capture current frame before leaving for Pexels/R2
                if (media.video_player === 'pexels' || media.video_player === 'r2') {
                  captureVideoSnapshot(media.id);
                }
                setHoveredVideoId(null);
              }
            }}
            onDoubleClick={(e) => {
              // Debounce double-clicks to prevent multiple instances
              if (doubleClickTimeoutRef.current) {
                console.log('[Double Click] Blocked - too soon after last double-click');
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              
              // Only open full player if one isn't already open
              if ((media.video_player === 'pexels' || media.video_player === 'r2') && showFullPlayer !== media.id) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Double Click] Opening full player for:', media.id);
                
                // Transfer hover video position to player position
                const hoverTime = videoProgressRef.current.get(`hover-${media.id}`);
                if (hoverTime !== undefined && hoverTime > 0) {
                  console.log('[Double Click] Transferring position from hover:', hoverTime);
                  videoProgressRef.current.set(`player-${media.id}`, hoverTime);
                }
                
                setShowFullPlayer(media.id);
                setHoveredVideoId(null);
                
                // Set debounce timeout
                doubleClickTimeoutRef.current = setTimeout(() => {
                  doubleClickTimeoutRef.current = null;
                }, 1000);
              } else {
                console.log('[Double Click] Blocked - full player already showing for this media');
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10" role="status" aria-live="polite">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${themeColors.cssVars.primary.base} transparent transparent transparent` }}
                  aria-label="Loading media"
                ></div>
              </div>
            )}
            <div className="w-full h-full flex items-center justify-center">
              {showPlayer ? (
                <div className="w-full aspect-video max-h-full relative" role="dialog" aria-label="Video player">
                  {media.video_player === 'pexels' || media.video_player === 'r2' ? (
                    <video
                      key={`player-${media.id}`}
                      ref={(el) => {
                        if (el) {
                          videoElementsRef.current.set(`player-${media.id}`, el);
                          console.log(`[Video Player] Mounted for ${media.video_player} video:`, media.video_url);
                        } else {
                          // Cleanup when unmounting
                          videoElementsRef.current.delete(`player-${media.id}`);
                        }
                      }}
                      data-media-id={media.id}
                      src={media.video_url}
                      crossOrigin="anonymous"
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      aria-label="Product video player"
                      onLoadStart={() => {
                        console.log('[Video Player] Load started:', media.video_url);
                      }}
                      onLoadedMetadata={(e) => {
                        console.log('[Video Player] Metadata loaded, duration:', e.currentTarget.duration);
                        const savedTime = videoProgressRef.current.get(`player-${media.id}`);
                        if (savedTime !== undefined && savedTime > 0) {
                          e.currentTarget.currentTime = savedTime;
                        }
                      }}
                      onCanPlay={() => {
                        console.log('[Video Player] Can play:', media.video_url);
                      }}
                      onPlay={() => {
                        console.log('[Video Player] Playing:', media.video_url);
                      }}
                      onError={(e) => {
                        console.error('[Video Player] Error loading video:', media.video_url, e);
                        console.error('[Video Player] Error details:', e.currentTarget.error);
                      }}
                      onTimeUpdate={(e) => {
                        const currentTime = e.currentTarget.currentTime;
                        const duration = e.currentTarget.duration;
                        if (duration - currentTime < 0.1) {
                          videoProgressRef.current.set(`player-${media.id}`, 0);
                        } else {
                          videoProgressRef.current.set(`player-${media.id}`, currentTime);
                        }
                      }}
                      onPause={(e) => {
                        videoProgressRef.current.set(`player-${media.id}`, e.currentTarget.currentTime);
                      }}
                    />
                  ) : (
                    <ReactPlayer
                      ref={reactPlayerRef}
                      url={videoUrl}
                      width="100%"
                      height="100%"
                      controls
                      playing={isPlaying}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onReady={() => {
                        setLoadingMedia(null);
                        setIsPlaying(true);
                      }}
                      onError={() => {
                        setLoadingMedia(null);
                        setFailedMedia(prev => new Set(prev).add(media.id));
                      }}
                      config={{
                        youtube: { playerVars: { modestbranding: 1, rel: 0, showinfo: 0 } },
                        vimeo: { playerOptions: { background: false, title: false, byline: false, portrait: false } },
                        file: { attributes: { controlsList: 'nodownload', playsInline: true } }
                      }}
                    />
                  )}
                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      captureVideoSnapshot(media.id);
                      setIsPlaying(false);
                      setShowFullPlayer(null);
                      // Clear debounce when closing
                      if (doubleClickTimeoutRef.current) {
                        clearTimeout(doubleClickTimeoutRef.current);
                        doubleClickTimeoutRef.current = null;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        captureVideoSnapshot(media.id);
                        setIsPlaying(false);
                        setShowFullPlayer(null);
                        // Clear debounce when closing
                        if (doubleClickTimeoutRef.current) {
                          clearTimeout(doubleClickTimeoutRef.current);
                          doubleClickTimeoutRef.current = null;
                        }
                      }
                    }}
                    className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Close video player"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : showHoverVideo ? (
                <div className="w-full aspect-video max-h-full animate-fade-in">
                  <video
                    key={`hover-${media.id}`}
                    ref={(el) => {
                      if (el) {
                        videoElementsRef.current.set(`hover-${media.id}`, el);
                        console.log(`[Hover Video] Mounted`);
                        el.muted = true;
                      } else {
                        videoElementsRef.current.delete(`hover-${media.id}`);
                      }
                    }}
                    data-media-id={media.id}
                    src={media.video_url}
                    crossOrigin="anonymous"
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain transition-opacity duration-300"
                    onLoadedData={(e) => {
                      // Restore saved position when video data is loaded and ready
                      const savedTime = videoProgressRef.current.get(`hover-${media.id}`);
                      console.log('[Hover Video] Data loaded, restoring position:', savedTime || 0);
                      if (savedTime !== undefined && savedTime > 0) {
                        e.currentTarget.currentTime = savedTime;
                      }
                      // Start playing
                      e.currentTarget.play().catch(err => {
                        console.warn('[Hover Video] Play failed:', err);
                      });
                    }}
                    onError={(e) => {
                      console.error('[Hover Video] Error loading:', media.video_url);
                      setHoveredVideoId(null);
                    }}
                    onTimeUpdate={(e) => {
                      const currentTime = e.currentTarget.currentTime;
                      const duration = e.currentTarget.duration;
                      if (duration - currentTime < 0.1) {
                        videoProgressRef.current.set(`hover-${media.id}`, 0);
                      } else {
                        videoProgressRef.current.set(`hover-${media.id}`, currentTime);
                      }
                    }}
                  />
                </div>
              ) : (getDerivedThumbnail(media) || media.video_player === 'r2' || media.video_player === 'pexels') ? (
                <div
                  className="w-full aspect-video max-h-full relative transition-opacity duration-300 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[Video Thumbnail Click]', media.video_player, 'media ID:', media.id);
                    setShowFullPlayer(media.id);
                    setHoveredVideoId(null);
                  }}
                  role="button"
                  aria-label="Play video"
                >
                  {videoSnapshotsRef.current.get(media.id) ? (
                    <img
                      key={`thumb-${media.id}-${snapshotVersion}`}
                      src={videoSnapshotsRef.current.get(media.id)}
                      alt="Product video"
                      className="w-full h-full object-contain transition-opacity duration-300"
                    />
                  ) : media.video_player === 'r2' && !media.thumbnail_url ? (
                    /* R2 placeholder when no thumbnail exists */
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-20 h-20 mx-auto mb-2 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-white/60">Hover to preview</p>
                      </div>
                    </div>
                  ) : getDerivedThumbnail(media) ? (
                    <img
                      src={getDerivedThumbnail(media) || ''}
                      alt="Product video"
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        console.warn('[ProductDetailMediaDisplay] Derived thumbnail failed to load');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {/* Play icon overlay - hide during hover preview */}
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
                    showHoverVideo ? 'opacity-0' : 'opacity-100'
                  }`}>
                    <div className="w-16 h-16 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : videoUrl && videoUrl.trim() ? (
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
                      file: {
                        attributes: {
                          controlsList: 'nodownload',
                          playsInline: true
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video max-h-full bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Video unavailable</p>
                </div>
              )}
            </div>
            {/* Attribution for videos - only show on main media */}
            {isMain && media.attrs?.unsplash_attribution && (
              <MediaAttribution
                platform="unsplash"
                attribution={media.attrs.unsplash_attribution as any}
                variant="overlay"
                position="bottom-right"
              />
            )}
            {isMain && media.attrs?.pexels_attribution && (
              <MediaAttribution
                platform="pexels"
                attribution={media.attrs.pexels_attribution as any}
                variant="overlay"
                position="bottom-right"
              />
            )}
          </div>
        );
      } else {
        // Thumbnail video: full container
        if (!videoUrl || !videoUrl.trim()) {
          return (
            <div className={containerClass}>
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500 text-xs">Video unavailable</p>
              </div>
            </div>
          );
        }
        
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
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    playsInline: true
                  }
                }
              }}
            />
            {/* Attribution for thumbnail videos */}
            {media.attrs?.unsplash_attribution && (
              <MediaAttribution
                platform="unsplash"
                attribution={media.attrs.unsplash_attribution as any}
                variant="overlay"
                position="bottom-right"
              />
            )}
            {media.attrs?.pexels_attribution && (
              <MediaAttribution
                platform="pexels"
                attribution={media.attrs.pexels_attribution as any}
                variant="overlay"
                position="bottom-right"
              />
            )}
          </div>
        );
      }
    } else if (media.image_url && media.image_url.trim() && !hasFailed) {
      // Regular image
      return (
        <div className={`relative group/img ${isMain ? containerClass : 'w-full h-full bg-gray-100 rounded-lg overflow-hidden'}`}>
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
            onLoad={(e) => {
              setLoadingMedia(null);
              if (!isMain) {
                const img = e.currentTarget;
                if (img.naturalHeight > img.naturalWidth) {
                  img.classList.remove('object-cover');
                  img.classList.add('object-contain');
                }
              }
            }}
            onLoadStart={() => setLoadingMedia(media.id)}
            onError={() => {
              setLoadingMedia(null);
              setFailedMedia(prev => new Set(prev).add(media.id));
            }}
          />
          {/* Attribution - only show on main media */}
          {isMain && media.attrs?.unsplash_attribution && (
            <MediaAttribution
              platform="unsplash"
              attribution={media.attrs.unsplash_attribution as any}
              variant="overlay"
              position="bottom-right"
            />
          )}
          {isMain && media.attrs?.pexels_attribution && (
            <MediaAttribution
              platform="pexels"
              attribution={media.attrs.pexels_attribution as any}
              variant="overlay"
              position="bottom-right"
            />
          )}
        </div>
      );
    }
    
    return (
      <div className={isMain ? "w-full aspect-[4/5] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center rounded-lg" : "w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center rounded-lg"}>  
        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-gray-400 text-xs mb-2">{hasFailed ? 'Failed to load' : 'No media'}</span>
        {hasFailed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFailedMedia(prev => {
                const next = new Set(prev);
                next.delete(media.id);
                return next;
              });
              setLoadingMedia(media.id);
            }}
            className="px-3 py-1 text-xs rounded-md transition-colors"
            style={{ 
              backgroundColor: themeColors.cssVars.primary.base,
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Retry
          </button>
        )}
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
      {/* Mobile: Main media slider with touch swipe */}
      <div className="block md:hidden">
        <div 
          className="relative w-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full mb-3">{renderMedia(activeMedia, true)}</div>
          {sortedMediaItems.length > 1 && (
            <div className="px-4">
              <div 
                className="flex gap-3 overflow-x-auto py-2 mb-2 snap-x snap-mandatory pl-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {sortedMediaItems.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => setActiveMedia(media)}
                    className={`flex-shrink-0 aspect-[4/3] rounded-md overflow-hidden transition-all snap-start bg-gray-100 ${
                      activeMedia?.id === media.id 
                        ? 'scale-105' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      width: 'calc((100vw - 2rem - 3rem) / 2)', // 2rem padding, 3rem gap space
                    }}
                    aria-label={`View media ${index + 1}`}
                  >
                    {media.is_video ? (
                      <div className="relative w-full h-full bg-gray-100">
                        {(media.thumbnail_url && media.thumbnail_url.trim()) || (media.image_url && media.image_url.trim()) ? (
                          <img
                            src={(media.thumbnail_url && media.thumbnail_url.trim()) || (media.image_url && media.image_url.trim()) || ''}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full"
                            style={{ objectFit: 'cover' }}
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (img.naturalHeight > img.naturalWidth) {
                                img.style.objectFit = 'contain';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-black/30 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full bg-gray-100">
                        {(media.thumbnail_url && media.thumbnail_url.trim()) || (media.image_url && media.image_url.trim()) ? (
                          <img
                            src={(media.thumbnail_url && media.thumbnail_url.trim()) || (media.image_url && media.image_url.trim()) || ''}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full"
                            style={{ objectFit: 'cover' }}
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (img.naturalHeight > img.naturalWidth) {
                                img.style.objectFit = 'contain';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-gray-500 mt-2">
                {sortedMediaItems.findIndex(item => item.id === activeMedia?.id) + 1} of {sortedMediaItems.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Main media with thumbnail carousel and navigation arrows */}
      <div className="hidden md:block">
        <div className="w-full mb-3">{renderMedia(activeMedia, true)}</div>
        {sortedMediaItems.length > 1 && (
          <div className="relative">
            <div className="relative">
              {sortedMediaItems.length > 5 && (
                <>
                  <button
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md hover:shadow-lg rounded-full p-2 transition-all duration-200"
                    onClick={() => {
                      const container = document.querySelector('.thumbnail-container');
                      if (container) {
                        // Calculate scroll amount based on thumbnail width + gap (128px + 24px = 152px per thumbnail on desktop)
                        const scrollAmount = 152 * 3; // Scroll 3 thumbnails at a time
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
                        // Calculate scroll amount based on thumbnail width + gap (128px + 24px = 152px per thumbnail on desktop)
                        const scrollAmount = 152 * 3; // Scroll 3 thumbnails at a time
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
              <div 
                className="flex items-start justify-start space-x-6 overflow-x-auto pb-6 pt-2 thumbnail-container scroll-smooth touch-pan-x"
                style={{ 
                  scrollbarWidth: 'thin',
                  WebkitOverflowScrolling: 'touch' as any,
                }}
              >
                {sortedMediaItems.map((media, index) => {
                  const isActive = activeMedia?.id === media.id;
                  const isVideo = media.is_video && media.video_url && media.video_player;
                  const derivedThumbnail = getDerivedThumbnail(media);
                  
                  return (
                    <div
                      key={media.id}
                      onMouseEnter={() => setActiveMedia(media)}
                      onClick={() => setActiveMedia(media)}
                      className={`
                        relative cursor-pointer flex-shrink-0 w-24 md:w-32 aspect-[4/3] rounded-lg mx-1
                        transition-all duration-200 ease-out
                        ${
                          isActive
                            ? 'scale-105'
                            : 'opacity-80 hover:opacity-100 hover:scale-102'
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
                        <div className="relative w-full h-full rounded-md overflow-hidden bg-gray-100">
                          {/* Video thumbnail background - use snapshot if available, otherwise use actual thumbnail */}
                          {videoSnapshotsRef.current.get(media.id) ? (
                            <img
                              key={`carousel-thumb-${media.id}-${snapshotVersion}`}
                              src={videoSnapshotsRef.current.get(media.id)}
                              alt={`Video thumbnail ${index + 1}`}
                              className="w-full h-full"
                              style={{ objectFit: 'cover' }}
                              loading="lazy"
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
                            /* R2 placeholder for carousel */
                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                              <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Play button overlay - same style as main video */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center transition-colors">
                              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full rounded-md overflow-hidden bg-gray-100">
                          {media.image_url ? (
                            <img
                              src={
                                media.thumbnail_url && media.thumbnail_url !== null
                                  ? media.thumbnail_url
                                  : media.image_url
                              }
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full"
                              style={{ objectFit: 'cover' }}
                              loading="lazy"
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
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              {sortedMediaItems.findIndex(item => item.id === activeMedia?.id) + 1} of {sortedMediaItems.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailMediaDisplay;
