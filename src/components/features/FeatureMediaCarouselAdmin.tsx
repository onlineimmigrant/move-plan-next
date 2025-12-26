'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FeatureMedia } from '@/types/feature-media';
import Image from 'next/image';
import MediaAttribution, { UnsplashAttributionData, PexelsAttributionData } from '@/components/MediaAttribution';
import type { UnsplashAttribution as UnsplashAttr } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import ChangeThumbnailModal from '@/components/modals/ChangeThumbnailModal';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface FeatureMediaCarouselAdminProps {
  featureSlug: string;
  onAddMedia: () => void;
}

export interface FeatureMediaCarouselAdminHandle {
  addMediaItem: (imageUrl: string, attribution?: UnsplashAttr | PexelsAttributionData, isVideo?: boolean, videoData?: any) => Promise<void>;
}

const FeatureMediaCarouselAdmin = forwardRef<FeatureMediaCarouselAdminHandle, FeatureMediaCarouselAdminProps>(
  ({ featureSlug, onAddMedia }, ref) => {
    const [mediaItems, setMediaItems] = useState<FeatureMedia[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVideoHovered, setIsVideoHovered] = useState(false);
    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const [changeThumbnailModal, setChangeThumbnailModal] = useState<{
      isOpen: boolean;
      videoUrl: string;
      thumbnailUrl?: string;
      mediaId: string;
    } | null>(null);
    const videoProgressRef = useRef<Map<string, number>>(new Map());
    const videoSnapshotsRef = useRef<Map<string, string>>(new Map());

    // Capture current video frame as snapshot
    const captureVideoSnapshot = useCallback((videoElement: HTMLVideoElement, mediaId: string) => {
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
      if (onAddMedia) {
        onAddMedia();
      } else {
        console.error('❌ onAddMedia is not defined!');
      }
    };

    useEffect(() => {
      fetchMedia();
    }, [featureSlug]);

    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/features/${featureSlug}/media`);
        if (response.ok) {
          const data = await response.json();
          setMediaItems(data);
        }
      } catch (error) {
        console.error('Error fetching feature media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDelete = async (mediaId: string) => {
      if (!confirm('Are you sure you want to delete this media item?')) {
        return;
      }

      try {
        const response = await fetch(`/api/features/${featureSlug}/media/${mediaId}`, {
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

    const handleThumbnailChanged = (newThumbnailUrl: string) => {
      setMediaItems(prev => prev.map(item => 
        item.id === changeThumbnailModal?.mediaId
          ? { ...item, thumbnail_url: newThumbnailUrl }
          : item
      ));
      setChangeThumbnailModal(null);
    };



    const handlePrevious = () => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
    };

    const addMediaItem = async (imageUrl: string, attribution?: UnsplashAttr | PexelsAttributionData, isVideo?: boolean, videoData?: any) => {
      console.log('🎬 addMediaItem called with:', { imageUrl, attribution, isVideo, videoData });
      try {
        const attrs: any = {};
        if (attribution) {
          if ('download_location' in attribution) {
            attrs.unsplash_attribution = attribution;
          } else {
            attrs.pexels_attribution = attribution;
          }
        }

        const requestBody: any = {
          media_type: isVideo ? 'video' : 'image',
          metadata: attrs,
        };

        if (isVideo && videoData) {
          if (videoData.video_player === 'youtube') {
            requestBody.media_url = videoData.video_url;
            requestBody.storage_provider = 'youtube';
            requestBody.thumbnail_url = videoData.thumbnail_url;
          } else if (videoData.video_player === 'vimeo') {
            requestBody.media_url = videoData.video_url;
            requestBody.storage_provider = 'vimeo';
            requestBody.thumbnail_url = videoData.thumbnail_url;
          } else if (videoData.video_player === 'pexels') {
            requestBody.media_url = videoData.video_url;
            requestBody.storage_provider = 'pexels';
            requestBody.thumbnail_url = videoData.thumbnail_url;
            if (videoData.pexels_video) {
              requestBody.metadata.pexels_video = videoData.pexels_video;
            }
          } else {
            requestBody.media_url = videoData.video_url || imageUrl;
            requestBody.storage_provider = 'r2';
            requestBody.thumbnail_url = videoData.thumbnail_url;
          }
        } else {
          requestBody.media_url = imageUrl;
          requestBody.storage_provider = attribution && 'download_location' in attribution ? 'unsplash' : 
                                         attribution ? 'pexels' : 'r2';
        }

        const response = await fetch(`/api/features/${featureSlug}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to add media');
        }

        await fetchMedia();
      } catch (error) {
        console.error('Error adding media:', error);
        throw error;
      }
    };

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
              {currentMedia?.media_type === 'video' && currentMedia?.media_url ? (
                currentMedia.storage_provider === 'youtube' || currentMedia.storage_provider === 'vimeo' ? (
                  <div className="relative w-full h-full">
                    <ReactPlayer
                      url={
                        currentMedia.storage_provider === 'youtube'
                          ? `https://www.youtube.com/watch?v=${currentMedia.media_url}`
                          : `https://vimeo.com/${currentMedia.media_url}`
                      }
                      width="100%"
                      height="100%"
                      controls
                      playing={false}
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
                  <div 
                    className="relative w-full h-full"
                    onMouseEnter={() => !showFullPlayer && setIsVideoHovered(true)}
                    onMouseLeave={() => {
                      if (!showFullPlayer) {
                        const videoEl = document.querySelector(`video[data-media-id="${currentMedia.id}"]`) as HTMLVideoElement;
                        if (videoEl && !videoEl.paused) {
                          captureVideoSnapshot(videoEl, currentMedia.id);
                        }
                        setIsVideoHovered(false);
                      }
                    }}
                    onDoubleClick={() => {
                      setShowFullPlayer(true);
                      setIsVideoHovered(false);
                    }}
                  >
                    {showFullPlayer ? (
                      <>
                        <video
                          key={`player-${currentMedia.id}`}
                          src={currentMedia.media_url}
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
                    ) : isVideoHovered ? (
                      <video
                        key={`hover-${currentMedia.id}`}
                        data-media-id={currentMedia.id}
                        src={currentMedia.media_url}
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
                            if (duration - currentTime < 0.1) {
                              videoProgressRef.current.set(currentMedia.id, 0);
                            } else {
                              videoProgressRef.current.set(currentMedia.id, currentTime);
                            }
                          }
                        }}
                      />
                    ) : (
                      (videoSnapshotsRef.current.get(currentMedia.id) || currentMedia.thumbnail_url || currentMedia.media_url) ? (
                        <Image
                          src={(videoSnapshotsRef.current.get(currentMedia.id) || currentMedia.thumbnail_url || currentMedia.media_url)!}
                          alt={currentMedia.alt_text || `Feature video ${currentIndex + 1}`}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )
                    )}
                    {!isVideoHovered && !showFullPlayer && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                    {currentMedia?.metadata?.pexels_attribution && !showFullPlayer && (
                      <MediaAttribution
                        platform="pexels"
                        attribution={currentMedia.metadata.pexels_attribution as any}
                        variant="overlay"
                        position="bottom-left"
                      />
                    )}
                  </div>
                )
              ) : currentMedia?.media_url && currentMedia.media_url.trim() ? (
                <div className="relative w-full h-full">
                  <Image
                    src={currentMedia.media_url as string}
                    alt={currentMedia.alt_text || `Feature photo ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                  
                  {currentMedia?.metadata?.unsplash_attribution && (
                    <MediaAttribution
                      platform="unsplash"
                      attribution={currentMedia.metadata.unsplash_attribution as any}
                      variant="overlay"
                      position="bottom-left"
                    />
                  )}
                  {currentMedia?.metadata?.pexels_attribution && !currentMedia?.metadata?.unsplash_attribution && (
                    <MediaAttribution
                      platform="pexels"
                      attribution={currentMedia.metadata.pexels_attribution as any}
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

              {/* Change Thumbnail button for R2 videos */}
              {currentMedia?.media_type === 'video' && currentMedia.storage_provider === 'r2' && currentMedia.media_url && (
                <button
                  onClick={() => setChangeThumbnailModal({
                    isOpen: true,
                    videoUrl: currentMedia.media_url!,
                    thumbnailUrl: currentMedia.thumbnail_url || undefined,
                    mediaId: currentMedia.id,
                  })}
                  className="absolute top-2 right-14 bg-sky-500/80 hover:bg-sky-600 text-white rounded-full p-2 transition-colors"
                  title="Change thumbnail"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              )}


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
                    {item.media_type === 'video' && item.thumbnail_url ? (
                      <>
                        <Image
                          src={item.thumbnail_url}
                          alt={`Video thumbnail ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : item.media_url ? (
                      <Image
                        src={item.media_url}
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

        {/* Change Thumbnail Modal */}
        {changeThumbnailModal && (
          <ChangeThumbnailModal
            isOpen={changeThumbnailModal.isOpen}
            onClose={() => setChangeThumbnailModal(null)}
            videoUrl={changeThumbnailModal.videoUrl}
            currentThumbnailUrl={changeThumbnailModal.thumbnailUrl}
            mediaId={changeThumbnailModal.mediaId}
            onThumbnailChanged={handleThumbnailChanged}
            entityType="feature"
          />
        )}
      </div>
    );
  }
);

FeatureMediaCarouselAdmin.displayName = 'FeatureMediaCarouselAdmin';

export default FeatureMediaCarouselAdmin;
