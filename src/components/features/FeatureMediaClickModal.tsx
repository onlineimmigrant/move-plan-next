'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import FeatureMediaCarousel from './FeatureMediaCarousel';
import ChangeThumbnailModal from '@/components/modals/ChangeThumbnailModal';
import { FeatureMedia } from '@/types/feature-media';
import { StandardModalContainer } from '@/components/modals/_shared/containers/StandardModalContainer';
import { useAuth } from '@/context/AuthContext';
import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import type { StorageProvider } from '@/types/feature-media';

// Lazy load ImageGalleryModal
const ImageGalleryModal = dynamic(
  () => import('@/components/modals/ImageGalleryModal/ImageGalleryModal'),
  { ssr: false }
);

interface FeatureMediaClickModalProps {
  isOpen: boolean;
  featureId: string | null;
  featureSlug?: string;
  featureName: string | null;
  onClose: () => void;
}

export default function FeatureMediaClickModal({
  isOpen,
  featureId,
  featureSlug,
  featureName,
  onClose,
}: FeatureMediaClickModalProps) {
  const [media, setMedia] = useState<FeatureMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [changeThumbnailModal, setChangeThumbnailModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    thumbnailUrl?: string;
    mediaId: string;
  } | null>(null);
  const mediaCacheRef = useRef<Map<string, FeatureMedia[]>>(new Map());
  const { isAdmin, isSuperadmin } = useAuth();
  const canManageMedia = isAdmin || isSuperadmin;

  // Desktop: use 75% of the current "large" preset width (1120px -> 840px)
  // Keep height the same as the "large" preset.
  const desktopDefaultSize = { width: 840, height: 900 };

  // Fetch media function (memoized for reuse)
  const fetchMedia = useCallback(async (signal?: AbortSignal) => {
    if (!featureId) return;

    const cached = mediaCacheRef.current.get(featureId);
    if (cached) {
      setMedia(cached);
      setIsLoading(false);
      return;
    }

    const fetchMediaInternal = async () => {
      try {
        setIsLoading(true);

        const byIdResponse = await fetch(`/api/features/by-id/${featureId}/media`, {
          signal,
        });
        if (byIdResponse.ok) {
          const data = await byIdResponse.json();
          if (!signal?.aborted) {
            mediaCacheRef.current.set(featureId, data);
            setMedia(data);
          }
          return;
        }

        if (featureSlug) {
          const bySlugResponse = await fetch(`/api/features/${featureSlug}/media`, {
            signal,
          });
          if (bySlugResponse.ok) {
            const data = await bySlugResponse.json();
            if (!signal?.aborted) {
              mediaCacheRef.current.set(featureId, data);
              setMedia(data);
            }
            return;
          }
        }

        if (!signal?.aborted) {
          mediaCacheRef.current.set(featureId, []);
          setMedia([]);
        }
      } catch (error) {
        // Ignore abort errors; they are expected on rapid open/close.
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error fetching feature media:', error);
        }
        if (!signal?.aborted) setMedia([]);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    };

    await fetchMediaInternal();
  }, [featureId, featureSlug]);

  // Effect to fetch media when modal opens
  useEffect(() => {
    if (!isOpen || !featureId) return;

    const abortController = new AbortController();
    fetchMedia(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [isOpen, featureId, fetchMedia]);

  // Handle media deletion
  const handleDeleteMedia = useCallback(async () => {
    if (!deletingMediaId || !featureId) return;

    try {
      const response = await fetch(`/api/features/by-id/${featureId}/media/${deletingMediaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear cache and refetch
        mediaCacheRef.current.delete(featureId);
        await fetchMedia();
        setDeletingMediaId(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete media:', errorData);
        alert(`Failed to delete media: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('An error occurred while deleting media.');
    }
  }, [deletingMediaId, featureId, fetchMedia]);

  // Handle thumbnail change
  const handleThumbnailChanged = useCallback((newThumbnailUrl: string) => {
    setMedia(prev => prev.map(item => 
      item.id === changeThumbnailModal?.mediaId
        ? { ...item, thumbnail_url: newThumbnailUrl }
        : item
    ));
    setChangeThumbnailModal(null);
    // Clear cache and refetch to ensure consistency
    if (featureId) {
      mediaCacheRef.current.delete(featureId);
      fetchMedia();
    }
  }, [changeThumbnailModal, featureId, fetchMedia]);

  // Handle media insertion from ImageGalleryModal
  const handleMediaInsert = useCallback(async (
    url: string,
    attribution?: UnsplashAttribution | PexelsAttributionData,
    isVideo?: boolean,
    videoData?: any
  ) => {
    if (!featureId) {
      console.error('Cannot add media: featureId is missing');
      return;
    }

    console.log('Adding media:', { url, attribution, isVideo, videoData, featureId });

    try {
      const attrs: any = {};
      if (attribution) {
        if ('download_location' in attribution || 'download_url' in attribution) {
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
          // R2 or other video
          requestBody.media_url = videoData.video_url || url;
          requestBody.storage_provider = 'r2';
          requestBody.thumbnail_url = videoData.thumbnail_url;
        }
      } else {
        requestBody.media_url = url;
        requestBody.storage_provider = attribution && 'download_location' in attribution ? 'unsplash' : 
                                       attribution ? 'pexels' : 'r2';
      }

      console.log('Sending POST request:', requestBody);

      const response = await fetch(`/api/features/by-id/${featureId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('API response:', { status: response.status, data: responseData });

      if (response.ok) {
        // Clear cache and refetch
        mediaCacheRef.current.delete(featureId);
        await fetchMedia();
        setShowImageGallery(false);
        console.log('Media added successfully');
      } else {
        console.error('Failed to add media:', responseData);
        alert(`Failed to add media: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding media:', error);
      alert('An error occurred while adding media.');
    }
  }, [featureId, fetchMedia]);

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      defaultSize={desktopDefaultSize}
      minSize={{ width: 320, height: 700 }}
      enableDrag={true}
      enableResize={true}
      ariaLabel={featureName ? `Feature media for ${featureName}` : 'Feature media'}
    >
      <div className="h-full flex flex-col">
        <div className="modal-drag-handle flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 cursor-move">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {featureName || 'Feature media'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManageMedia && (
              <button
                type="button"
                onClick={() => setShowImageGallery(true)}
                className="shrink-0 p-2 rounded-md transition-colors text-gray-700 dark:text-gray-200 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-gray-300 dark:border-gray-600"
                aria-label="Add media"
                title="Add media"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-md transition-colors text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              aria-label="Close"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : media.length > 0 ? (
            <FeatureMediaCarousel
              media={media}
              featureName={featureName || ''}
              compact
              enableHoverVideoPreview={true}
              enableVideoSnapshots={true}
              thumbnailSelectOnHover={false}
              preferLightEmbeds
              enableKeyboardNavigation
              onDelete={setDeletingMediaId}
              canDelete={canManageMedia}
              onChangeThumbnail={(mediaId) => {
                const mediaItem = media.find(m => m.id === mediaId);
                if (mediaItem?.media_type === 'video') {
                  setChangeThumbnailModal({
                    isOpen: true,
                    videoUrl: mediaItem.media_url,
                    thumbnailUrl: mediaItem.thumbnail_url,
                    mediaId: mediaItem.id,
                  });
                }
              }}
              canChangeThumbnail={canManageMedia}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-600 dark:text-gray-300">
              No media available
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery Modal for adding media (admins only) */}
      {canManageMedia && showImageGallery && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          onSelectImage={handleMediaInsert}
        />
      )}

      {/* Change Thumbnail Modal */}
      {changeThumbnailModal && (
        <ChangeThumbnailModal
          isOpen={changeThumbnailModal.isOpen}
          videoUrl={changeThumbnailModal.videoUrl}
          currentThumbnailUrl={changeThumbnailModal.thumbnailUrl}
          mediaId={changeThumbnailModal.mediaId}
          onClose={() => setChangeThumbnailModal(null)}
          onThumbnailChanged={handleThumbnailChanged}
          entityType="feature"
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingMediaId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10005 p-4" onClick={() => setDeletingMediaId(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Media?
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove this media from the feature? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingMediaId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedia}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </StandardModalContainer>
  );
}
