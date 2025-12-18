/**
 * SkeletonSection Component
 * 
 * Loading placeholder for TemplateSection with skeleton animation
 * Prevents Cumulative Layout Shift (CLS) while content loads
 */
'use client';

import React from 'react';
import { getResponsiveGridClasses } from '@/utils/gridHelpers';

interface SkeletonSectionProps {
  /**
   * Number of grid columns to display
   */
  gridColumns?: number;
  
  /**
   * Background style for the section
   */
  backgroundStyle?: React.CSSProperties;
  
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
  
  /**
   * Ref for IntersectionObserver
   */
  sectionRef?: React.RefObject<HTMLElement>;
  
  /**
   * Section type to match real content height
   */
  sectionType?: string;
  
  /**
   * Whether this is a slider section
   */
  isSlider?: boolean;
}

export const SkeletonSection: React.FC<SkeletonSectionProps> = ({
  gridColumns = 3,
  backgroundStyle,
  ariaLabel = 'Loading section...',
  sectionRef,
  sectionType,
  isSlider,
}) => {
  // Match the min-height of real sections to prevent layout shift
  const minHeightClass = 
    ['brand', 'article_slider', 'contact', 'faq', 'pricing_plans', 'reviews', 'form_harmony'].includes(sectionType || '')
      ? 'min-h-0'
      : isSlider
      ? 'min-h-[600px]'
      : 'min-h-[600px]';

  const paddingClass = 
    ['brand', 'article_slider', 'contact', 'faq', 'pricing_plans', 'reviews', 'form_harmony'].includes(sectionType || '')
      ? 'px-0 py-0'
      : isSlider
      ? 'px-0 py-8'
      : 'px-4 py-8';
  
  return (
    <section
      ref={sectionRef}
      className={`${paddingClass} ${minHeightClass} text-xl relative`}
      style={{
        ...backgroundStyle,
        contentVisibility: 'auto', // Browser optimization to prevent layout shifts
        containIntrinsicSize: '0 600px', // Estimate size when not visible
      }}
      aria-label={ariaLabel}
      aria-busy="true"
    >
      <div className="max-w-7xl mx-auto py-4 space-y-12">
        {/* Section Title Skeleton */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-12 max-w-5xl mx-auto">
          <div className="h-12 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
        
        {/* Metric Cards Skeleton */}
        <div className={`grid ${getResponsiveGridClasses(gridColumns)} gap-8 px-4`}>
          {Array.from({ length: gridColumns }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading section content...
      </div>
    </section>
  );
};

SkeletonSection.displayName = 'SkeletonSection';
