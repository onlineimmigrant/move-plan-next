/**
 * MetricCard Component
 * Reusable metric card with video/image support, lazy loading, and translations
 * Reduces code duplication between carousel and grid modes
 */

'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { isVideoUrl, getEmbedUrl } from '@/utils/videoHelpers';
import type { Metric } from '@/types/templateSection';
import LazyVideo from './LazyVideo';

interface MetricCardProps {
  metric: Metric;
  translatedTitle: string;
  translatedDescription: string;
  textVariant: {
    metricTitle: string;
    metricDescription: string;
  };
  textStyleVariant?: string;
  isPriority?: boolean;
  animationDelay?: number;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  translatedTitle,
  translatedDescription,
  textVariant,
  textStyleVariant,
  isPriority = false,
  animationDelay = 0,
  className,
}) => {
  const isCodedHarmony = textStyleVariant === 'codedharmony';
  
  // Memoized sanitize function
  const sanitizeHTML = useMemo(() => {
    return (html: string): string => DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'class', 'style'],
      FORBID_TAGS: ['iframe'],
    });
  }, []);
  
  const cardStyles = useMemo(() => {
    if (!metric.is_card_type) return '';
    
    return isCodedHarmony
      ? 'pt-4 sm:pt-8 md:pt-10 px-5 sm:px-10 md:px-12 pb-0 rounded-3xl text-center gap-y-5 relative overflow-hidden backdrop-blur-xl bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/20'
      : 'pt-6 sm:pt-10 md:pt-12 px-6 sm:px-12 md:px-14 pb-0 shadow-md rounded-3xl text-center gap-y-6 overflow-hidden';
  }, [metric.is_card_type, isCodedHarmony]);

  const metricBgStyle = useMemo(() => {
    if (!metric.is_card_type) return undefined;
    
    return getBackgroundStyle(
      metric.is_gradient,
      metric.gradient,
      metric.background_color || (isCodedHarmony ? 'gray-50' : 'white')
    );
  }, [metric.is_card_type, metric.is_gradient, metric.gradient, metric.background_color, isCodedHarmony]);

  const renderMedia = useMemo(() => {
    if (!metric.image) return null;

    const mediaClasses = cn(
      'order-3 mt-auto',
      metric.is_card_type ? (isCodedHarmony ? '-mx-5 sm:-mx-10 md:-mx-12' : '-mx-6 sm:-mx-12 md:-mx-14') : ''
    );

    if (isVideoUrl(metric.image)) {
      const isEmbedVideo = metric.image.toLowerCase().includes('youtube.com') || 
                          metric.image.toLowerCase().includes('youtu.be') || 
                          metric.image.toLowerCase().includes('vimeo.com');

      return (
        <div className={mediaClasses}>
          {isEmbedVideo ? (
            <LazyVideo
              src={getEmbedUrl(metric.image)}
              title={metric.title || 'Video'}
              className="w-full rounded-b-3xl h-64 sm:h-72 md:h-80 lg:h-96"
            />
          ) : (
            <video
              src={metric.image}
              controls
              className="w-full object-cover rounded-b-3xl h-64 sm:h-72 md:h-80 lg:h-96"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      );
    }

    return (
      <div className={mediaClasses}>
        <div 
          className="w-full overflow-hidden rounded-b-3xl h-64 sm:h-72 md:h-80 lg:h-96 relative group"
          style={{
            aspectRatio: '4/3',
          }}
        >
          <Image
            src={metric.image}
            alt={metric.title || 'Metric image'}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
              metric.is_image_rounded_full && 'rounded-full object-contain'
            )}
            fill
            loading={isPriority ? 'eager' : 'lazy'}
            priority={isPriority}
            fetchPriority={isPriority ? 'high' : 'low'}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    );
  }, [metric.image, metric.title, metric.is_image_rounded_full, metric.is_card_type, isCodedHarmony, isVideoUrl, getEmbedUrl, isPriority]);

  return (
    <div
      className={cn(
        'flex flex-col w-full min-w-0',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
        'animate-fade-in-up',
        cardStyles,
        className
      )}
      style={{
        ...(metric.is_card_type && metricBgStyle ? metricBgStyle : {}),
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'backwards',
      }}
      tabIndex={0}
    >
      {renderMedia}
      
      {metric.is_title_displayed && (
        <h3 className={`order-1 ${textVariant.metricTitle}`}>
          {parse(sanitizeHTML(translatedTitle))}
        </h3>
      )}
      
      <div className={`flex-col order-2 ${textVariant.metricDescription} tracking-wider`}>
        {parse(sanitizeHTML(translatedDescription))}
      </div>
    </div>
  );
};

export default MetricCard;
