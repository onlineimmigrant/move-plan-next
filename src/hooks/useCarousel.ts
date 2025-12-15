/**
 * Custom hook for carousel functionality with accessibility and performance
 * Extracted from TemplateSection for better code organization
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useCarousel(totalItems: number, itemsPerSlide: number, isEnabled: boolean) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Detect user's motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const nextSlide = useCallback(() => {
    if (isTransitioning && !prefersReducedMotion) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % totalItems);
    setTimeout(() => setIsTransitioning(false), prefersReducedMotion ? 0 : 300);
  }, [totalItems, isTransitioning, prefersReducedMotion]);

  const prevSlide = useCallback(() => {
    if (isTransitioning && !prefersReducedMotion) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + totalItems) % totalItems);
    setTimeout(() => setIsTransitioning(false), prefersReducedMotion ? 0 : 300);
  }, [totalItems, isTransitioning, prefersReducedMotion]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning && !prefersReducedMotion) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), prefersReducedMotion ? 0 : 300);
  }, [isTransitioning, prefersReducedMotion]);

  // Memoized current slide items to prevent recalculation
  const getCurrentSlideItems = useCallback((metrics: any[]) => {
    const items = [];
    for (let i = 0; i < itemsPerSlide; i++) {
      const index = (currentSlide + i) % totalItems;
      items.push(metrics[index]);
    }
    return items;
  }, [currentSlide, itemsPerSlide, totalItems]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) > 75) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, [nextSlide, prevSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if carousel is focused or no other element has focus
      const activeElement = document.activeElement;
      const isCarouselFocused = carouselRef.current?.contains(activeElement);
      
      if (!isCarouselFocused) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(totalItems - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, nextSlide, prevSlide, goToSlide, totalItems]);

  // Auto-play effect with IntersectionObserver
  useEffect(() => {
    if (!isEnabled || !isAutoPlaying || totalItems <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isAutoPlaying) {
            autoPlayInterval.current = setInterval(nextSlide, 5000);
          } else {
            if (autoPlayInterval.current) {
              clearInterval(autoPlayInterval.current);
              autoPlayInterval.current = null;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => {
      observer.disconnect();
      if (autoPlayInterval.current) {
        clearInterval(autoPlayInterval.current);
      }
    };
  }, [isEnabled, isAutoPlaying, totalItems, nextSlide]);

  // Pause/resume handlers
  const handleMouseEnter = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsAutoPlaying(true);
  }, []);
  
  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  return {
    currentSlide,
    isTransitioning,
    isAutoPlaying,
    prefersReducedMotion,
    nextSlide,
    prevSlide,
    goToSlide,
    getCurrentSlideItems,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseEnter,
    handleMouseLeave,
    toggleAutoPlay,
    carouselRef,
  };
}
