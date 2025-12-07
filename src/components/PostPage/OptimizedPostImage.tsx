'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useNetworkStatus, getImageQuality, getImageSizeMultiplier } from '@/hooks/useNetworkStatus';

interface OptimizedPostImageProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean; // Load immediately for LCP optimization
  loading?: 'lazy' | 'eager'; // HTML loading attribute
}

/**
 * Optimized Image Component for PostPage
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder for better UX
 * - Automatic width/height detection
 * - Network-aware image quality
 * - Responsive srcset generation
 * - WebP/AVIF format support
 * - Fallback to regular img for external images
 * 
 * @component
 * @param props - Image props
 * 
 * @performance
 * - Adapts quality based on network speed
 * - Reduces data usage on slow connections
 * - Preloads critical images
 */
export const OptimizedPostImage: React.FC<OptimizedPostImageProps> = ({
  src,
  alt = '',
  className = 'max-w-full h-auto',
  style = { maxWidth: '100%', height: 'auto' },
  priority = false,
  loading = 'lazy',
}) => {
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const network = useNetworkStatus();

  // Get adaptive quality and size based on network
  const imageQuality = getImageQuality(network.quality);
  const sizeMultiplier = getImageSizeMultiplier(network.quality);

  // IntersectionObserver for lazy loading (skip if priority or eager)
  useEffect(() => {
    if (priority || loading === 'eager' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  // Get image dimensions for better layout stability
  useEffect(() => {
    if (!src || !isInView) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
  }, [src, isInView]);

  // Generate responsive srcset based on network quality
  const generateSrcSet = (baseSrc: string): string => {
    if (!baseSrc || network.quality === 'offline') return '';

    // Define size breakpoints
    const sizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    
    // Filter sizes based on network quality
    const filteredSizes = sizes.filter(size => {
      if (network.quality === 'low') return size <= 828; // Max 828px on 2G
      if (network.quality === 'medium') return size <= 1920; // Max 1920px on 3G
      return true; // All sizes on 4G
    });

    // Apply size multiplier
    const adjustedSizes = filteredSizes.map(size => Math.round(size * sizeMultiplier));

    // Check if image is from Next.js Image Optimization API
    const isNextImage = baseSrc.startsWith('/') || baseSrc.startsWith('/_next/');
    
    if (isNextImage) {
      // Use Next.js image optimization with quality parameter
      return adjustedSizes
        .map(size => `${baseSrc}?w=${size}&q=${imageQuality} ${size}w`)
        .join(', ');
    }

    // For external images, return original with quality hint
    return '';
  };

  // Detect modern format support
  const supportsWebP = (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  const supportsAVIF = (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  };

  // Determine optimal format
  const getOptimalFormat = (): string => {
    if (supportsAVIF()) return 'avif';
    if (supportsWebP()) return 'webp';
    return 'original';
  };

  if (!src) {
    return null;
  }

  // Check if image is from an external domain
  const isExternal = src.startsWith('http://') || src.startsWith('https://');
  
  // Don't load images on offline
  if (network.quality === 'offline') {
    return (
      <div 
        ref={imgRef}
        className="bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
        style={{ minHeight: '200px', ...style }}
      >
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Image unavailable (offline)
        </p>
      </div>
    );
  }

  // Generate srcset for responsive images
  const srcSet = generateSrcSet(src);
  const optimalFormat = getOptimalFormat();
  
  // For external images or if dimensions aren't available, use regular img with network adaptation
  if (isExternal || !imageDimensions) {
    return (
      <div ref={imgRef}>
        {isInView ? (
          <img
            src={src}
            alt={alt}
            className={className}
            style={style}
            loading={priority ? 'eager' : loading}
            fetchPriority={priority ? 'high' : 'auto'}
            srcSet={srcSet || undefined}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
          />
        ) : (
          // Shimmer placeholder while not in view
          <div 
            className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded"
            style={{ minHeight: '200px', ...style }}
          />
        )}
      </div>
    );
  }

  // Use Next.js Image for local images with blur placeholder and network-aware quality
  return (
    <div ref={imgRef}>
      {isInView ? (
        <Image
          src={src}
          alt={alt}
          width={imageDimensions.width}
          height={imageDimensions.height}
          className={className}
          style={style}
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(imageDimensions.width, imageDimensions.height))}`}
          quality={imageQuality}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
          priority={false}
        />
      ) : (
        // Shimmer placeholder while not in view
        <div 
          className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded"
          style={{ 
            aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
            ...style 
          }}
        />
      )}
    </div>
  );
};

/**
 * Generate shimmer effect for blur placeholder
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="0%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

/**
 * Convert SVG to base64 for data URL
 */
const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
