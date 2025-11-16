/**
 * MediaAttribution Component
 * 
 * Universal attribution badge supporting multiple stock photo platforms.
 * Currently supports Unsplash and Pexels with proper API guideline compliance.
 * 
 * Features:
 * - Two-tier design: Small badge + hover overlay
 * - Platform-specific logos and styling
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

export interface PexelsAttributionData {
  photographer: string;
  photographer_url: string;
  photo_url: string;
}

export type MediaAttributionData = UnsplashAttributionData | PexelsAttributionData;

interface MediaAttributionProps {
  platform: 'unsplash' | 'pexels';
  attribution: MediaAttributionData;
  variant?: 'overlay' | 'inline'; // overlay: for images, inline: for standalone
  position?: 'bottom-left' | 'bottom-right'; // only for overlay variant
}

export default function MediaAttribution({
  platform,
  attribution,
  variant = 'overlay',
  position = 'bottom-right',
}: MediaAttributionProps) {
  const data = attribution;
  
  // Platform-specific configuration
  const platformConfig = {
    unsplash: {
      name: 'Unsplash',
      url: 'https://unsplash.com/?utm_source=codedharmony&utm_medium=referral',
      logo: (
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 32 32">
          <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
        </svg>
      ),
    },
    pexels: {
      name: 'Pexels',
      url: 'https://www.pexels.com',
      logo: (
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 32 32">
          <path d="M2 0h28v32H2V0zm10.4 8.1v15.8h5.2c2.1 0 3.8-.6 5.2-1.9 1.4-1.3 2.1-3 2.1-5.1 0-2.1-.7-3.8-2.1-5.1-1.4-1.3-3.1-1.9-5.2-1.9h-2.4V8.1h-2.8zm2.8 2.6h2.4c1.3 0 2.3.4 3.1 1.1.8.7 1.2 1.7 1.2 2.9 0 1.2-.4 2.2-1.2 2.9-.8.7-1.8 1.1-3.1 1.1h-2.4v-8z"/>
        </svg>
      ),
    },
  };

  const config = platformConfig[platform];

  // Safety check - return null if invalid platform
  if (!config) {
    console.error(`Invalid platform "${platform}" passed to MediaAttribution`);
    return null;
  }

  if (variant === 'inline') {
    // Inline variant for standalone use
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        {config.logo}
        <span>Photo by{' '}
          <a
            href={`${data.photographer_url}${platform === 'unsplash' ? '?utm_source=codedharmony&utm_medium=referral' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {data.photographer}
          </a>
          {' '}on{' '}
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {config.name}
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
      {/* Always visible: Small platform badge */}
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`absolute ${positionClasses} bg-white/60 hover:bg-white/90 backdrop-blur-sm rounded-[2px] p-0.5 shadow-sm hover:shadow-md transition-all group-hover/img:opacity-0 z-10`}
        onClick={(e) => e.stopPropagation()}
        title={`Photo from ${config.name}`}
      >
        <div className="w-2.5 h-2.5 text-black/70">
          {config.logo}
        </div>
      </a>
      
      {/* On hover: Full attribution */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-xs px-3 py-2.5 opacity-0 group-hover/img:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto">
          {config.logo}
          <span className="text-white/90">Photo by{' '}
            <a
              href={`${data.photographer_url}${platform === 'unsplash' ? '?utm_source=codedharmony&utm_medium=referral' : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {data.photographer}
            </a>
            {' '}on{' '}
            <a
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {config.name}
            </a>
          </span>
        </div>
      </div>
    </>
  );
}

// Export old name for backward compatibility
export { MediaAttribution as UnsplashAttribution };
