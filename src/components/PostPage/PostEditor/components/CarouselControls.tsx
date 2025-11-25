'use client';

import React from 'react';
import Button from '@/ui/Button';
import type { MediaAlignment, MediaSize } from '../types';

interface CarouselControlsProps {
  setCarouselAlignment: (alignment: MediaAlignment) => void;
  setCarouselSize: (size: MediaSize) => void;
}

/**
 * Carousel alignment and size controls
 * @performance Memoized to prevent re-renders when props haven't changed
 */
const CarouselControlsComponent: React.FC<CarouselControlsProps> = ({
  setCarouselAlignment,
  setCarouselSize,
}) => {
  return (
    <div className="border-b border-gray-200 bg-blue-50 dark:bg-blue-900/20 p-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Carousel Controls:</span>
        
        {/* Alignment */}
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => setCarouselAlignment('left')}
            variant="outline"
            title="Align Left"
            aria-label="Align carousel to left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </Button>
          <Button
            size="sm"
            onClick={() => setCarouselAlignment('center')}
            variant="outline"
            title="Align Center"
            aria-label="Align carousel to center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </Button>
          <Button
            size="sm"
            onClick={() => setCarouselAlignment('right')}
            variant="outline"
            title="Align Right"
            aria-label="Align carousel to right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* Size */}
        <div className="flex gap-1">
          <Button size="sm" onClick={() => setCarouselSize('400px')} variant="outline" title="Small">
            S
          </Button>
          <Button size="sm" onClick={() => setCarouselSize('600px')} variant="outline" title="Medium">
            M
          </Button>
          <Button size="sm" onClick={() => setCarouselSize('800px')} variant="outline" title="Large">
            L
          </Button>
          <Button size="sm" onClick={() => setCarouselSize('100%')} variant="outline" title="Full Width">
            Full
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CarouselControls = React.memo(CarouselControlsComponent);
