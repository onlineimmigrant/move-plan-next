'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  videoPlayer?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
}

interface MediaCarouselRendererProps {
  mediaItems: MediaItem[];
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export const MediaCarouselRenderer: React.FC<MediaCarouselRendererProps> = ({
  mediaItems,
  align = 'center',
  width = '600px',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  console.log('🎠 MediaCarouselRenderer rendering:', { mediaItems, align, width });

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!mediaItems || mediaItems.length === 0) {
    console.log('⚠️ MediaCarouselRenderer: No media items');
    return null;
  }

  const currentMedia = mediaItems[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const alignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }[align];

  console.log('🎠 About to render carousel, currentMedia:', currentMedia);

  return (
    <div
      className={`relative group my-8 ${alignmentClass}`}
      style={{ width, maxWidth: '100%', border: '5px solid red', padding: '10px', backgroundColor: '#ffeb3b' }}
    >
      <div style={{ padding: '10px', background: 'blue', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
        🎠 CAROUSEL RENDERED: {mediaItems.length} items
      </div>
      {/* Main Media Display */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
        {isClient && currentMedia.type === 'video' ? (
          currentMedia.videoPlayer === 'youtube' || currentMedia.videoPlayer === 'vimeo' ? (
            <ReactPlayer
              url={
                currentMedia.videoPlayer === 'youtube'
                  ? `https://www.youtube.com/watch?v=${currentMedia.url}`
                  : `https://vimeo.com/${currentMedia.url}`
              }
              width="100%"
              height="100%"
              controls
              playing={false}
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              poster={currentMedia.thumbnailUrl}
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <img
            src={currentMedia.url}
            alt={`Media ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
        )}

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
              type="button"
              aria-label="Previous media"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
              type="button"
              aria-label="Next media"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {mediaItems.length}
          </div>
        )}
      </div>

      {/* Dots Navigation */}
      {mediaItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 w-4'
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
              type="button"
              aria-label={`Go to media ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Hook to convert carousel HTML to React components
export const useCarouselRenderer = (htmlContent: string) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const carouselElements = containerRef.current.querySelectorAll(
      '[data-type="media-carousel"]'
    );

    carouselElements.forEach((element) => {
      const mediaItemsData = element.getAttribute('data-media-items');
      const align = element.getAttribute('data-align') as 'left' | 'center' | 'right' || 'center';
      const width = element.getAttribute('data-width') || '600px';

      if (mediaItemsData) {
        try {
          const mediaItems = JSON.parse(mediaItemsData);
          
          // Create a placeholder div for React to mount into
          const placeholder = document.createElement('div');
          element.parentNode?.replaceChild(placeholder, element);
          
          // We'll use a custom event to signal React to render here
          placeholder.setAttribute('data-carousel-placeholder', 'true');
          placeholder.setAttribute('data-media-items', mediaItemsData);
          placeholder.setAttribute('data-align', align);
          placeholder.setAttribute('data-width', width);
        } catch (error) {
          console.error('Failed to parse carousel data:', error);
        }
      }
    });
  }, [htmlContent]);

  return containerRef;
};
