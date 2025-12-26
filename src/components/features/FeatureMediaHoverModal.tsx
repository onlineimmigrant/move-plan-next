'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FeatureMediaCarousel from './FeatureMediaCarousel';
import { FeatureMedia } from '@/types/feature-media';

interface FeatureMediaHoverModalProps {
  featureId: string;
  featureSlug?: string;
  featureName: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function FeatureMediaHoverModal({
  featureId,
  featureSlug,
  featureName,
  isVisible,
  position,
  onClose,
}: FeatureMediaHoverModalProps) {
  const [media, setMedia] = useState<FeatureMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVisible || !featureId) {
      setMedia([]);
      setIsLoading(true);
      return;
    }

    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        // Prefer fetching by featureId since the comparison table always has it.
        // Fallback to slug route if needed.
        const byIdResponse = await fetch(`/api/features/by-id/${featureId}/media`);
        if (byIdResponse.ok) {
          const data = await byIdResponse.json();
          setMedia(data);
          return;
        }

        if (featureSlug) {
          const bySlugResponse = await fetch(`/api/features/${featureSlug}/media`);
          if (bySlugResponse.ok) {
            const data = await bySlugResponse.json();
            setMedia(data);
            return;
          }
        }

        setMedia([]);
      } catch (error) {
        console.error('Error fetching feature media:', error);
        setMedia([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [featureId, featureSlug, isVisible]);

  if (!mounted || !isVisible) return null;

  // Always render when visible so we can confirm it triggers.
  // (If no media exists, we show the empty state.)

  // Calculate optimal position
  const modalWidth = 600;
  const modalHeight = 450;
  const padding = 20;

  let x = position.x; // Start right at the circle position
  let y = position.y - modalHeight / 2; // Center vertically on cursor
  let showOnLeft = false;

  // Adjust if modal goes off right edge
  if (x + modalWidth > window.innerWidth - padding) {
    x = position.x - modalWidth; // Show on left side
    showOnLeft = true;
  }

  // Adjust if modal goes off bottom edge
  if (y + modalHeight > window.innerHeight - padding) {
    y = window.innerHeight - modalHeight - padding;
  }

  // Adjust if modal goes off top edge
  if (y < padding) {
    y = padding;
  }

  const modalContent = (
    <>
      {/* Modal */}
      <div
        data-feature-media-hover-modal="true"
        className="fixed z-9999 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {featureName}
          </h3>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : media.length > 0 ? (
            <FeatureMediaCarousel media={media} featureName={featureName} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No media available
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
