'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import FeatureMediaCarousel from './FeatureMediaCarousel';
import { FeatureMedia } from '@/types/feature-media';
import { StandardModalContainer } from '@/components/modals/_shared/containers/StandardModalContainer';

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

  // Desktop: use 75% of the current "large" preset width (1120px -> 840px)
  // Keep height the same as the "large" preset.
  const desktopDefaultSize = { width: 840, height: 900 };

  useEffect(() => {
    if (!isOpen || !featureId) return;

    let cancelled = false;

    const fetchMedia = async () => {
      try {
        setIsLoading(true);

        const byIdResponse = await fetch(`/api/features/by-id/${featureId}/media`);
        if (byIdResponse.ok) {
          const data = await byIdResponse.json();
          if (!cancelled) setMedia(data);
          return;
        }

        if (featureSlug) {
          const bySlugResponse = await fetch(`/api/features/${featureSlug}/media`);
          if (bySlugResponse.ok) {
            const data = await bySlugResponse.json();
            if (!cancelled) setMedia(data);
            return;
          }
        }

        if (!cancelled) setMedia([]);
      } catch (error) {
        console.error('Error fetching feature media:', error);
        if (!cancelled) setMedia([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchMedia();

    return () => {
      cancelled = true;
    };
  }, [isOpen, featureId, featureSlug]);

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      defaultSize={desktopDefaultSize}
      minSize={{ width: 320, height: 700 }}
      enableDrag={false}
      enableResize={false}
      ariaLabel={featureName ? `Feature media for ${featureName}` : 'Feature media'}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {featureName || 'Feature media'}
            </div>
          </div>
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

        <div className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : media.length > 0 ? (
            <FeatureMediaCarousel media={media} featureName={featureName || ''} compact />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-600 dark:text-gray-300">
              No media available
            </div>
          )}
        </div>
      </div>
    </StandardModalContainer>
  );
}
