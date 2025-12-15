/**
 * ImageRenderer Component
 * Handles different image styles for TemplateHeadingSection
 * Supports: default, full_width, circle, contained
 */

'use client';

import React from 'react';
import Image from 'next/image';

interface ImageOptimization {
  loading: 'eager' | 'lazy';
  fetchPriority: 'high' | 'low' | 'auto';
  quality: number;
  sizes: string;
}

interface ImageRendererProps {
  imageUrl: string;
  imageStyle: string;
  title: string;
  isPriority: boolean;
  imageOptimization: ImageOptimization;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({
  imageUrl,
  imageStyle,
  title,
  isPriority,
  imageOptimization,
}) => {
  const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=";

  if (imageStyle === 'default') {
    return (
      <div className="relative mx-auto w-full max-w-lg">
        <Image
          src={imageUrl}
          alt={title || 'Section image'}
          width={512}
          height={512}
          className="w-full h-auto object-cover rounded-2xl"
          priority={isPriority}
          loading={imageOptimization.loading}
          fetchPriority={isPriority ? 'high' : 'low'}
          quality={imageOptimization.quality}
          sizes={imageOptimization.sizes}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      </div>
    );
  }

  if (imageStyle === 'full_width') {
    return (
      <div className="relative w-full">
        <Image
          src={imageUrl}
          alt={title || 'Section image'}
          width={800}
          height={600}
          className="w-full h-auto object-cover"
          priority={isPriority}
          loading={imageOptimization.loading}
          fetchPriority={isPriority ? 'high' : 'low'}
          quality={imageOptimization.quality}
          sizes={imageOptimization.sizes}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      </div>
    );
  }

  if (imageStyle === 'circle') {
    return (
      <div className="relative mx-auto w-full max-w-lg" style={{ height: '512px' }}>
        <div className="relative transform">
          <div className="relative overflow-hidden rounded-full" style={{ width: '512px', height: '512px', maxWidth: '100%' }}>
            <Image
              src={imageUrl}
              alt={title || 'Section image'}
              fill
              className="object-cover"
              priority={isPriority}
              loading={imageOptimization.loading}
              fetchPriority={isPriority ? 'high' : 'low'}
              quality={imageOptimization.quality}
              sizes={imageOptimization.sizes}
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />
          </div>
        </div>
      </div>
    );
  }

  // Default to 'contained' style
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="relative transform" style={{ minHeight: '384px' }}>
        <div className="relative overflow-hidden rounded-3xl" style={{ height: '384px' }}>
          <Image
            src={imageUrl}
            alt={title || 'Section image'}
            width={512}
            height={384}
            className="w-full h-full object-cover"
            priority={isPriority}
            loading={imageOptimization.loading}
            fetchPriority={isPriority ? 'high' : 'low'}
            quality={imageOptimization.quality}
            sizes={imageOptimization.sizes}
            placeholder="blur"
            blurDataURL={blurDataURL}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />
        </div>
      </div>
    </div>
  );
};

export default ImageRenderer;
