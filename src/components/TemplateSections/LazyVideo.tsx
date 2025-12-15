/**
 * LazyVideo Component
 * Lazy loads video iframes (YouTube, Vimeo) only when in viewport
 * Significantly improves initial page load performance
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyVideoProps {
  src: string;
  title?: string;
  className?: string;
}

export const LazyVideo: React.FC<LazyVideoProps> = ({ src, title = 'Video', className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01,
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [isLoaded]);

  return (
    <div ref={videoRef} className={cn('relative', className)}>
      {isLoaded ? (
        <iframe
          src={src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LazyVideo;
