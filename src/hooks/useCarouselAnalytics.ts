/**
 * useCarouselAnalytics Hook
 * 
 * Analytics tracking for carousel interactions
 * Integrates with Google Analytics (gtag) for event tracking
 */
'use client';

import { useEffect } from 'react';

interface UseCarouselAnalyticsProps {
  /**
   * Section ID for tracking
   */
  sectionId: number;
  
  /**
   * Section title for tracking
   */
  sectionTitle: string;
  
  /**
   * Current slide index
   */
  currentSlide: number;
  
  /**
   * Whether carousel is enabled
   */
  isSlider: boolean;
}

/**
 * Track carousel slide views with analytics
 */
export function useCarouselAnalytics({
  sectionId,
  sectionTitle,
  currentSlide,
  isSlider,
}: UseCarouselAnalyticsProps) {
  useEffect(() => {
    if (!isSlider) return;
    
    // Track slide view (can be connected to analytics service)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'carousel_view', {
        section_id: sectionId,
        section_title: sectionTitle,
        slide_index: currentSlide,
      });
    }
    
    // Can also integrate with other analytics services here
    // Example: Segment, Mixpanel, Amplitude, etc.
  }, [currentSlide, sectionId, sectionTitle, isSlider]);
}

/**
 * Track carousel interaction events
 */
export function trackCarouselInteraction(
  action: 'next' | 'previous' | 'dot' | 'pause' | 'play' | 'swipe',
  sectionId: number,
  slideIndex?: number
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'carousel_interaction', {
      action,
      section_id: sectionId,
      slide_index: slideIndex,
    });
  }
}
