/**
 * UnsplashAttribution Component
 * 
 * Two-tier Unsplash attribution badge that complies with Unsplash API guidelines.
 * Used across products, blog posts, and product media galleries.
 * 
 * Features:
 * - Always-visible small badge (bottom-right)
 * - Hover overlay with full photographer credit
 * - UTM tracking parameters
 * - Accessible links with stopPropagation
 */

'use client';

import React from 'react';

export interface UnsplashAttributionData {
  photographer: string;
  photographer_url: string;
  photo_url: string;
  download_location?: string;
}

interface UnsplashAttributionProps {
  attribution: UnsplashAttributionData;
  variant?: 'overlay' | 'inline'; // overlay: for images, inline: for standalone
  position?: 'bottom-left' | 'bottom-right'; // only for overlay variant
}

export default function UnsplashAttribution({
  attribution,
  variant = 'overlay',
  position = 'bottom-right',
}: UnsplashAttributionProps) {
  if (variant === 'inline') {
    // Inline variant for standalone use
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
          <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
        </svg>
        <span>Photo by{' '}
          <a
            href={`${attribution.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {attribution.photographer}
          </a>
          {' '}on{' '}
          <a
            href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Unsplash
          </a>
        </span>
      </div>
    );
  }

  // Overlay variant for images
  const positionClasses = position === 'bottom-left' 
    ? 'bottom-1.5 left-1.5' 
    : 'bottom-1.5 right-1.5';

  return (
    <>
      {/* Always visible: Small Unsplash badge */}
      <a
        href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className={`absolute ${positionClasses} bg-white/60 hover:bg-white/90 backdrop-blur-sm rounded-[2px] p-0.5 shadow-sm hover:shadow-md transition-all group-hover/img:opacity-0 z-10`}
        onClick={(e) => e.stopPropagation()}
        title="Photo from Unsplash"
      >
        <svg className="w-2.5 h-2.5 text-black/70" fill="currentColor" viewBox="0 0 32 32">
          <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
        </svg>
      </a>
      
      {/* On hover: Full attribution */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-xs px-3 py-2.5 opacity-0 group-hover/img:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
            <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
          </svg>
          <span className="text-white/90">Photo by{' '}
            <a
              href={`${attribution.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {attribution.photographer}
            </a>
            {' '}on{' '}
            <a
              href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Unsplash
            </a>
          </span>
        </div>
      </div>
    </>
  );
}
