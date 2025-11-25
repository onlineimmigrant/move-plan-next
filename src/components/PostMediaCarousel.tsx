// src/components/PostMediaCarousel.tsx
'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import NextImage from 'next/image';
import MediaAttribution, { UnsplashAttributionData, PexelsAttributionData } from '@/components/MediaAttribution';
import type { UnsplashAttribution as UnsplashAttr } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import ChangeThumbnailModal from '@/components/modals/ChangeThumbnailModal';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface MediaItem {
  id: number;
  post_id: number;
  order: number;
  is_video: boolean;
  video_url?: string;
  video_player?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
  image_url?: string;
  thumbnail_url?: string | null;
  attrs?: {
    unsplash_attribution?: UnsplashAttributionData;
    pexels_attribution?: PexelsAttributionData;
    [key: string]: any;
  };
}

interface PostMediaCarouselProps {
  postSlug: string;
  onAddMedia: () => void;
}

export interface PostMediaCarouselHandle {
  addMediaItem: (imageUrl: string, attribution?: UnsplashAttr | PexelsAttributionData, isVideo?: boolean, videoData?: any) => Promise<void>;
}

const PostMediaCarousel = forwardRef<PostMediaCarouselHandle, PostMediaCarouselProps>(
  ({ postSlug, onAddMedia }, ref) => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [changeThumbnailModal, setChangeThumbnailModal] = useState<{
      isOpen: boolean;
      videoUrl: string;
      thumbnailUrl?: string;
      mediaId: number;
    } | null>(null);

    useEffect(() => {
      fetchMedia();
    }, [postSlug]);

    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/posts/${postSlug}/media`);
        if (response.ok) {
          const data = await response.json();
          setMediaItems(data.sort((a: MediaItem, b: MediaItem) => a.order - b.order));
        }
      } catch (error) {
        console.error('Error fetching post media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Expose addMediaItem method via ref
    useImperativeHandle(ref, () => ({
      addMediaItem: async (imageUrl: string, attribution?: UnsplashAttr | PexelsAttributionData, isVideo = false, videoData?: any) => {
        console.log('🎬 addMediaItem called with:', { imageUrl, attribution, isVideo, videoData });
        
        try {
          // Determine which platform by checking for download_location (Unsplash-specific)
          const attrs: any = {};
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
            // Check if it's a YouTube video (has video_player field)
            if (videoData.video_player === 'youtube') {
              requestBody.video_url = videoData.video_url; // Just the video ID
              requestBody.video_player = 'youtube';
              requestBody.thumbnail_url = videoData.thumbnail_url;
              requestBody.image_url = videoData.image_url;
              requestBody.name = videoData.title;
            } else if (videoData.video_player === 'vimeo') {
              requestBody.video_url = videoData.video_url; // Just the video ID
              requestBody.video_player = 'vimeo';
              requestBody.thumbnail_url = videoData.thumbnail_url;
              requestBody.image_url = videoData.image_url;
              requestBody.name = videoData.title;
            } else if (videoData.video_player === 'r2') {
              // It's an R2 uploaded video
              requestBody.video_url = videoData.video_url; // The R2 video URL
              requestBody.video_player = 'r2';
              requestBody.thumbnail_url = videoData.thumbnail_url || videoData.video_url;
              // Don't set image_url for videos - only thumbnail_url
            } else {
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
            }
          } else {
            // It's an image
            requestBody.image_url = imageUrl;
          }

          const response = await fetch(`/api/posts/${postSlug}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const newMedia = await response.json();
            setMediaItems(prev => [...prev, newMedia]);
            console.log('✅ Media item added successfully');
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Failed to add media item:', response.status, errorData);
          }
        } catch (error) {
          console.error('Error adding media:', error);
        }
      }
    }));

    const handleThumbnailChanged = (newThumbnailUrl: string) => {
      setMediaItems(prev => prev.map(item => 
        item.id === changeThumbnailModal?.mediaId
          ? { ...item, thumbnail_url: newThumbnailUrl }
          : item
      ));
      setChangeThumbnailModal(null);
    };

    const handleDelete = async (mediaId: number) => {
      if (!confirm('Are you sure you want to delete this media item?')) {
        return;
      }

      try {
        const response = await fetch(`/api/posts/${postSlug}/media/${mediaId}`, {
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
        alert('Error deleting media item');
      }
    };

    const handlePrevious = () => {
      setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
      setIsPlaying(false);
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
      setIsPlaying(false);
    };

    const getVideoUrl = (media: MediaItem): string => {
      if (!media.video_url) return '';
      
      switch (media.video_player) {
        case 'youtube':
          return `https://www.youtube.com/watch?v=${media.video_url}`;
        case 'vimeo':
          return `https://vimeo.com/${media.video_url}`;
        case 'pexels':
        case 'r2':
        default:
          return media.video_url;
      }
    };

    if (isLoading) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">Loading media...</div>
        </div>
      );
    }

    if (mediaItems.length === 0) {
      return (
        <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No media items yet</p>
          <button
            onClick={onAddMedia}
            className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            +Add Media
          </button>
        </div>
      );
    }

    const currentMedia = mediaItems[currentIndex];
    if (!currentMedia) return null;

    return (
      <div className="w-full">
        {/* Main Display */}
        <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
          {/* Delete Button */}
          <button
            onClick={() => handleDelete(currentMedia.id)}
            className="absolute top-2 right-2 z-20 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            title="Delete this media item"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Change Thumbnail button for R2 videos */}
          {currentMedia?.is_video && currentMedia.video_player === 'r2' && currentMedia.video_url && (
            <button
              onClick={() => setChangeThumbnailModal({
                isOpen: true,
                videoUrl: currentMedia.video_url!,
                thumbnailUrl: currentMedia.thumbnail_url || undefined,
                mediaId: currentMedia.id,
              })}
              className="absolute top-2 right-14 z-20 p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-colors"
              title="Change thumbnail"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {currentMedia.is_video ? (
            <div className="relative w-full h-full">
              <ReactPlayer
                url={getVideoUrl(currentMedia)}
                playing={isPlaying}
                controls
                width="100%"
                height="100%"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                config={{
                  youtube: { playerVars: { modestbranding: 1 } },
                  vimeo: { playerOptions: { byline: false, portrait: false } },
                }}
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <NextImage
                src={currentMedia.image_url || ''}
                alt={`Media ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={currentIndex === 0}
              />
            </div>
          )}

          {/* Navigation Arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Attribution */}
          {currentMedia.attrs?.unsplash_attribution && (
            <div className="absolute bottom-2 right-2 z-10">
              <MediaAttribution attribution={currentMedia.attrs.unsplash_attribution} platform="unsplash" />
            </div>
          )}
          {currentMedia.attrs?.pexels_attribution && (
            <div className="absolute bottom-2 right-2 z-10">
              <MediaAttribution attribution={currentMedia.attrs.pexels_attribution} platform="pexels" />
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {mediaItems.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {mediaItems.map((media, index) => (
              <button
                key={media.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPlaying(false);
                }}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-purple-500 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                }`}
              >
                {media.is_video ? (
                  <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                    {media.thumbnail_url ? (
                      <NextImage
                        src={media.thumbnail_url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <NextImage
                    src={media.image_url || ''}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Counter */}
        {mediaItems.length > 1 && (
          <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {mediaItems.length}
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
            entityType="post"
          />
        )}
      </div>
    );
  }
);

PostMediaCarousel.displayName = 'PostMediaCarousel';

export default PostMediaCarousel;
