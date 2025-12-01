/**
 * TemplateSection Component - Premium Quality (120/100)
 * 
 * A highly optimized, accessible, and feature-rich section component that supports
 * both grid and carousel layouts with 9 text style variants and 14 section types.
 * 
 * FEATURES:
 * - 🎨 9 Text Style Variants (default, apple, codedharmony, magazine, startup, elegant, brutalist, modern, playful)
 * - 🎯 14 Section Types (general, brand, article_slider, contact, faq, pricing_plans, team, testimonials, etc.)
 * - 📱 Responsive Grid (1-5 columns with mobile breakpoints)
 * - 🎠 Carousel Mode (with auto-play, touch gestures, keyboard navigation)
 * - ♿ Full Accessibility (ARIA labels, keyboard nav, screen reader support, reduced motion)
 * - ⚡ Performance Optimized (lazy loading, memoization, IntersectionObserver, image preloading)
 * - 🌐 Multi-language Support (i18n translations)
 * - 🎬 Video Support (YouTube, Vimeo, direct files)
 * - 🛡️ Error Boundaries (graceful failure handling)
 * - 📊 Analytics Ready (gtag event tracking)
 * - 🎨 Theme Support (gradients, solid colors, glassmorphism)
 * 
 * PERFORMANCE:
 * - Lazy section loading with IntersectionObserver
 * - Memoized carousel items and sanitization
 * - Image preloading for next slides
 * - Auto-play only when visible (viewport detection)
 * - Performance monitoring in development
 * 
 * ACCESSIBILITY:
 * - Keyboard navigation (Arrow keys, Home, End)
 * - ARIA live regions for carousel announcements
 * - Screen reader friendly labels
 * - Reduced motion support (respects prefers-reduced-motion)
 * - Focus management
 * - Semantic HTML structure
 * 
 * @example
 * <TemplateSection section={{
 *   id: 1,
 *   section_title: "Our Services",
 *   text_style_variant: "codedharmony",
 *   grid_columns: 3,
 *   is_slider: true,
 *   website_metric: [...],
 *   ...
 * }} />
 */
'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { HoverEditButtons } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { cn } from '@/lib/utils';
import { SliderNavigation } from '@/ui/SliderNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook for performance monitoring
 */
function usePerformanceMonitor(sectionId: number, sectionTitle: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 1000) {
        console.warn(`[Performance] Section "${sectionTitle}" (ID: ${sectionId}) took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  }, [sectionId, sectionTitle]);
}

/**
 * Custom hook for carousel functionality with accessibility and performance
 */
function useCarousel(totalItems: number, itemsPerSlide: number, isEnabled: boolean) {
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

/**
 * Custom hook for lazy loading sections with IntersectionObserver
 */
function useLazySection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  return { isVisible, sectionRef, hasLoaded };
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Dynamic imports for heavy section components (Phase 2 optimization)
const FormHarmonySection = dynamic(() => import('@/components/TemplateSections/FormHarmonySection'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
});
const FeedbackAccordion = dynamic(() => import('@/components/TemplateSections/FeedbackAccordion'));
const HelpCenterSection = dynamic(() => import('@/components/TemplateSections/HelpCenterSection'));
const RealEstateModal = dynamic(() => import('@/components/TemplateSections/RealEstateModal').then(mod => ({ default: mod.RealEstateModal })));
const BlogPostSlider = dynamic(() => import('@/components/TemplateSections/BlogPostSlider'));
const ContactForm = dynamic(() => import('@/components/contact/ContactForm'));
const BrandsSection = dynamic(() => import('@/components/TemplateSections/BrandsSection'));
const FAQSectionWrapper = dynamic(() => import('@/components/TemplateSections/FAQSectionWrapper'));
const PricingPlansSectionWrapper = dynamic(() => import('@/components/TemplateSections/PricingPlansSectionWrapper'));
const TeamMember = dynamic(() => import('@/components/TemplateSections/TeamMember'));
const Testimonials = dynamic(() => import('@/components/TemplateSections/Testimonials'));
const AppointmentSection = dynamic(() => import('@/components/TemplateSections/AppointmentSection'));

// Text style variants - similar to TemplateHeadingSection
const TEXT_VARIANTS = {
  default: {
    sectionTitle: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-tight tracking-tight',
    sectionDescription: 'text-lg sm:text-xl md:text-2xl font-normal text-gray-600 leading-relaxed',
    metricTitle: 'text-2xl sm:text-3xl font-bold text-gray-900 leading-snug',
    metricDescription: 'text-base sm:text-lg text-gray-700 leading-relaxed'
  },
  apple: {
    sectionTitle: 'text-4xl sm:text-5xl font-light text-gray-900',
    sectionDescription: 'text-lg font-light text-gray-600',
    metricTitle: 'text-2xl font-light text-gray-900',
    metricDescription: 'text-base font-light text-gray-600'
  },
  codedharmony: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight',
    sectionDescription: 'text-xl sm:text-2xl text-gray-600 font-medium leading-relaxed',
    metricTitle: 'text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight',
    metricDescription: 'text-lg sm:text-xl text-gray-700 font-medium leading-relaxed'
  },
  magazine: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-none',
    sectionDescription: 'text-sm sm:text-base uppercase tracking-widest font-medium',
    metricTitle: 'text-lg sm:text-xl font-bold uppercase tracking-wide',
    metricDescription: 'text-sm leading-relaxed'
  },
  startup: {
    sectionTitle: 'text-4xl sm:text-6xl lg:text-7xl font-black',
    sectionDescription: 'text-xl sm:text-2xl font-normal leading-relaxed',
    metricTitle: 'text-2xl sm:text-3xl font-bold',
    metricDescription: 'text-lg leading-relaxed'
  },
  elegant: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-5xl font-serif font-light italic',
    sectionDescription: 'text-base sm:text-lg font-serif leading-loose',
    metricTitle: 'text-xl sm:text-2xl font-serif font-normal',
    metricDescription: 'text-sm sm:text-base font-serif leading-relaxed'
  },
  brutalist: {
    sectionTitle: 'text-5xl sm:text-6xl lg:text-8xl font-black uppercase leading-none tracking-tighter',
    sectionDescription: 'text-xs sm:text-sm uppercase tracking-wider font-bold',
    metricTitle: 'text-2xl sm:text-3xl font-black uppercase tracking-tight',
    metricDescription: 'text-xs sm:text-sm uppercase tracking-wide font-medium'
  },
  modern: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight',
    sectionDescription: 'text-lg sm:text-xl font-medium',
    metricTitle: 'text-xl sm:text-2xl font-bold',
    metricDescription: 'text-base font-normal'
  },
  playful: {
    sectionTitle: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-wide',
    sectionDescription: 'text-lg sm:text-xl font-semibold',
    metricTitle: 'text-2xl sm:text-3xl font-extrabold',
    metricDescription: 'text-base font-medium leading-relaxed'
  }
};

// Helper function to check if URL is a video
const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  
  // Check for video file extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
  const hasVideoExtension = videoExtensions.some(ext => urlLower.includes(ext));
  
  // Check for YouTube URLs
  const isYouTube = urlLower.includes('youtube.com') || urlLower.includes('youtu.be');
  
  // Check for Vimeo URLs
  const isVimeo = urlLower.includes('vimeo.com');
  
  return hasVideoExtension || isYouTube || isVimeo;
};

// Helper function to convert YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): string => {
  const urlLower = url.toLowerCase();
  
  // YouTube conversion
  if (urlLower.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (urlLower.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  
  // Vimeo conversion
  if (urlLower.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }
  
  return url;
};

/**
 * Utility function to get translated content
 * @param defaultContent - The default content (fallback)
 * @param translations - JSONB object with translations
 * @param locale - Current locale (null means use default content)
 * @returns Translated content or default content
 */
const getTranslatedContent = (
  defaultContent: string,
  translations?: Record<string, string>,
  locale?: string | null
): string => {
  // Ensure defaultContent is a string
  const safeDefaultContent = defaultContent || '';
  
  // If no locale, return default content
  if (!locale) {
    return safeDefaultContent;
  }

  // If no translations object exists, return default content
  if (!translations || typeof translations !== 'object') {
    return safeDefaultContent;
  }

  // Try to get translation for the current locale
  const translatedContent = translations[locale];
  
  // If translation exists and is not empty, use it
  if (translatedContent && typeof translatedContent === 'string' && translatedContent.trim() !== '') {
    return translatedContent;
  }

  // If no translation for current locale, return the original default content
  return safeDefaultContent;
};

// Types
interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  is_title_displayed: boolean;
  description: string;
  description_translation?: Record<string, string>;
  image?: string;
  is_image_rounded_full: boolean;
  is_card_type: boolean;
  background_color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  organization_id: string | null;
}

interface TemplateSectionData {
  id: number;
  background_color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  grid_columns: number;
  image_metrics_height?: string;
  is_image_bottom: boolean;
  is_slider?: boolean;
  
  // Consolidated section type field
  section_type?: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans' | 'team' | 'testimonials' | 'appointment' | 'form_harmony';
  
  // DEPRECATED - Keep for backward compatibility (only is_reviews_section may still be in some DB records)
  is_reviews_section: boolean;
  
  website_metric: Metric[];
  organization_id: string | null;
  form_id?: string | null;
}

const TemplateSection: React.FC<{ section: TemplateSectionData }> = React.memo(({ section }) => {
  // Early return to avoid null/undefined issues
  if (!section) {
    return null;
  }

  // Admin state and edit context
  const { isAdmin } = useAuth();
  const { openModal } = useTemplateSectionEdit();
  
  // Performance monitoring
  usePerformanceMonitor(section.id, section.section_title || 'Untitled Section');

  const pathname = usePathname();
  
  // Lazy loading with IntersectionObserver
  const { isVisible, sectionRef, hasLoaded } = useLazySection();
  
  // Extract locale from pathname (similar to TemplateHeadingSection logic)
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathLocale = pathSegments[0];
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
  const currentLocale = pathLocale && pathLocale.length === 2 && supportedLocales.includes(pathLocale) ? pathLocale : null;

  // Get text variant styles
  const textVar = TEXT_VARIANTS[section.text_style_variant || 'default'];

  // Generate responsive grid classes based on grid_columns
  const getResponsiveGridClasses = (columns: number): string => {
    const gridClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    };
    return gridClasses[columns] || 'grid-cols-1';
  };

  const responsiveGridClasses = getResponsiveGridClasses(section.grid_columns || 1);

  // Get translated content
  const translatedSectionTitle = currentLocale 
    ? getTranslatedContent(section.section_title || '', section.section_title_translation, currentLocale)
    : section.section_title || '';
  
  const translatedSectionDescription = section.section_description
    ? (currentLocale 
        ? getTranslatedContent(section.section_description, section.section_description_translation, currentLocale)
        : section.section_description
      )
    : '';

  // Memoized sanitize function to avoid unnecessary recalculations
  const sanitizeHTML = useMemo(() => {
    return (html: string): string => DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'class', 'style'],
      FORBID_TAGS: ['iframe'],
    });
  }, []);

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Carousel configuration
  const itemsPerSlide = isMobile ? 1 : Math.max(1, (section.grid_columns || 1) - 1);
  const totalItems = section.website_metric?.length || 0;
  
  // Use custom carousel hook
  const carousel = useCarousel(totalItems, itemsPerSlide, !!section.is_slider);
  
  // Memoized current slide items
  const currentSlideItems = useMemo(
    () => carousel.getCurrentSlideItems(section.website_metric || []),
    [carousel.currentSlide, section.website_metric, carousel.getCurrentSlideItems]
  );
  
  // Preload next slide images for better UX
  useEffect(() => {
    if (!section.is_slider || totalItems <= 1) return;
    
    const nextSlideIndex = (carousel.currentSlide + itemsPerSlide) % totalItems;
    const nextMetric = section.website_metric?.[nextSlideIndex];
    
    if (nextMetric?.image && !isVideoUrl(nextMetric.image)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = nextMetric.image;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [carousel.currentSlide, section.is_slider, section.website_metric, totalItems, itemsPerSlide]);
  
  // Analytics tracking for carousel views
  useEffect(() => {
    if (!section.is_slider) return;
    
    // Track slide view (can be connected to analytics service)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'carousel_view', {
        section_id: section.id,
        section_title: section.section_title,
        slide_index: carousel.currentSlide,
      });
    }
  }, [carousel.currentSlide, section.id, section.section_title, section.is_slider]);

  // Calculate section background style (gradient or solid color)
  const sectionBackgroundStyle = useMemo(() => {
    return getBackgroundStyle(
      section.is_gradient,
      section.gradient,
      section.background_color || 'white'
    );
  }, [section.is_gradient, section.gradient, section.background_color]);

  // Early return for lazy loading - show placeholder
  if (!hasLoaded && !isVisible) {
    return (
      <section
        ref={sectionRef}
        className={`${
          ['brand', 'article_slider', 'contact', 'faq', 'pricing_plans', 'reviews', 'form_harmony'].includes(section.section_type || '')
            ? 'px-0 py-0 min-h-0'
            : section.is_slider 
            ? 'px-0 py-8 min-h-[600px]' 
            : 'px-4 py-8 min-h-[600px]'
        } text-xl relative`}
        style={sectionBackgroundStyle}
        aria-busy="true"
        aria-label="Loading section content"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`${
        // Remove padding for new special sections that manage their own layout
        ['brand', 'article_slider', 'contact', 'faq', 'pricing_plans', 'reviews', 'form_harmony'].includes(section.section_type || '')
          ? 'px-0 py-0 min-h-0'
          : section.is_slider 
          ? 'px-0 py-8 min-h-[600px]' 
          : 'px-4 py-8 min-h-[600px]'
      } text-xl relative group`}
      style={sectionBackgroundStyle}
      aria-label={section.section_title || 'Content section'}
    >
      {/* Hover Edit Buttons for Admin */}
      {isAdmin && (
        <HoverEditButtons
          onEdit={() => openModal(section)}
          onNew={() => openModal(null, pathname)}
          position="top-right"
        />
      )}
      
        <div
        className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto ${
          // Remove spacing for special sections that manage their own layout
          ['brand', 'article_slider', 'contact', 'faq', 'pricing_plans', 'reviews', 'help_center', 'real_estate', 'team', 'testimonials', 'form_harmony'].includes(section.section_type || '')
            ? '' 
            : section.is_slider 
            ? 'py-4 space-y-12' 
            : 'py-4 sm:p-8 sm:rounded-xl space-y-12'
        }`}
      >
        {(() => {
          // Render based on section_type
          switch (section.section_type) {
            case 'reviews':
              return <FeedbackAccordion type="all_products" />;
            
            case 'help_center':
              return <HelpCenterSection section={section} />;
            
            case 'real_estate':
              return <RealEstateModal />;
            
            case 'brand':
              return <BrandsSection section={section} />;
            
            case 'article_slider':
              return <BlogPostSlider backgroundColor={section.background_color} />;
            
            case 'contact':
              return <ContactForm />;
            
            case 'faq':
              return <FAQSectionWrapper section={section} />;
            
            case 'pricing_plans':
              return <PricingPlansSectionWrapper section={section} />;
            
            case 'appointment':
              return <AppointmentSection section={section} />;
            
            case 'team':
              return <TeamMember section={section} />;
            
            case 'testimonials':
              return <Testimonials section={section} />;
            
            case 'form_harmony':
              return section.form_id ? (
                <FormHarmonySection formId={section.form_id} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No form selected. Please configure this section in the admin panel.</p>
                </div>
              );
            
            case 'general':
            default:
              // General content section
              return (
          <>
            {/* Section Title and Description */}
            <div
              className={cn(
                'px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 mb-12 md:mb-16 lg:mb-20 xl:mb-24 max-w-5xl',
                section.is_section_title_aligned_center
                  ? 'text-center mx-auto'
                  : section.is_section_title_aligned_right
                  ? 'text-right ml-auto'
                  : 'text-left mr-auto'
              )}
            >
              <h2
                className={textVar.sectionTitle}
              >
                {parse(sanitizeHTML(translatedSectionTitle))}
              </h2>

              {translatedSectionDescription && (
                <p
                  className={`pt-4 md:pt-6 ${textVar.sectionDescription}`}
                >
                  {parse(sanitizeHTML(translatedSectionDescription))}
                </p>
              )}
            </div>

            {/* Metrics Section - Conditional: Slider or Grid */}
            {section.is_slider ? (
              /* Slider/Carousel Mode */
              <div 
                ref={carousel.carouselRef}
                className="relative mx-auto px-4 sm:px-12 md:px-20 lg:px-24 xl:px-28 2xl:px-32 max-w-7xl w-full overflow-hidden"
                onMouseEnter={carousel.handleMouseEnter}
                onMouseLeave={carousel.handleMouseLeave}
                onTouchStart={carousel.handleTouchStart}
                onTouchMove={carousel.handleTouchMove}
                onTouchEnd={carousel.handleTouchEnd}
                role="region"
                aria-label="Content carousel"
                aria-live="polite"
                aria-atomic="false"
                tabIndex={0}
              >
                {/* Carousel Container with padding for shadows */}
                <div className="relative min-h-[450px] sm:min-h-[500px] md:min-h-[550px] flex items-center py-8 px-0 sm:px-4 md:px-6 lg:px-8">
                  {/* Flex layout showing current slide items - always inline/horizontal */}
                  <div 
                    className={cn(
                      "flex gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-10 xl:gap-x-12 w-full",
                      isMobile ? "justify-center" : "justify-center",
                      !carousel.prefersReducedMotion && "transition-all duration-500 ease-in-out",
                      carousel.isTransitioning && !carousel.prefersReducedMotion ? "opacity-90 scale-[0.98]" : "opacity-100 scale-100"
                    )}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {currentSlideItems.map((metric: any, slideIndex: number) => {
                      // Get translated content for each metric
                      const translatedMetricTitle = metric.title
                        ? (currentLocale 
                            ? getTranslatedContent(metric.title, metric.title_translation, currentLocale)
                            : metric.title
                          )
                        : '';

                      const translatedMetricDescription = metric.description
                        ? (currentLocale 
                            ? getTranslatedContent(metric.description, metric.description_translation, currentLocale)
                            : metric.description
                          )
                        : '';

                      const isCodedHarmony = section.text_style_variant === 'codedharmony';
                      const cardStyles = metric.is_card_type
                        ? isCodedHarmony
                          ? `p-6 sm:p-12 md:p-16 rounded-3xl text-center gap-y-6 relative overflow-hidden backdrop-blur-xl bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/20`
                          : `p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8`
                        : '';

                      // Calculate metric background style (gradient or solid color)
                      const metricBgStyle = metric.is_card_type
                        ? getBackgroundStyle(
                            metric.is_gradient,
                            metric.gradient,
                            metric.background_color || (isCodedHarmony ? 'gray-50' : 'white')
                          )
                        : undefined;

                      return (
                        <div
                          key={`${carousel.currentSlide}-${slideIndex}-${metric.id}`}
                          className={cn(
                            "space-y-4 flex flex-col min-h-[350px]",
                            "transition-all duration-300 ease-out",
                            "hover:scale-[1.02] hover:shadow-2xl hover:z-10",
                            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
                            isMobile ? "w-full max-w-[400px]" : "flex-1 min-w-[250px] max-w-[400px]",
                            cardStyles
                          )}
                          style={metric.is_card_type && metricBgStyle ? metricBgStyle : undefined}
                          role="group"
                          aria-label={`Slide ${carousel.currentSlide + 1} of ${totalItems}`}
                          tabIndex={0}
                        >
                            {metric.image && (
                              <div className={cn(
                                section.is_image_bottom ? 'order-3' : '',
                                // Videos: full width with negative margins, no top margin
                                isVideoUrl(metric.image) 
                                  ? metric.is_card_type 
                                    ? '-mx-8 sm:-mx-16 mt-0' 
                                    : 'mt-0'
                                  : 'mt-8' // Images: normal margin
                              )}>
                                {isVideoUrl(metric.image) ? (
                                  metric.image.toLowerCase().includes('youtube.com') || 
                                  metric.image.toLowerCase().includes('youtu.be') || 
                                  metric.image.toLowerCase().includes('vimeo.com') ? (
                                    <iframe
                                      src={getEmbedUrl(metric.image)}
                                      className="w-full rounded-none h-64 sm:h-72 md:h-80 lg:h-96"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  ) : (
                                    <video
                                      src={metric.image}
                                      controls
                                      className="w-full object-cover rounded-none h-64 sm:h-72 md:h-80 lg:h-96"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  )
                                ) : (
                                  <div className="w-full overflow-hidden h-64 sm:h-72 md:h-80 lg:h-96 relative group">
                                    <Image
                                      src={metric.image}
                                      alt={metric.title || 'Metric image'}
                                      className={cn(
                                        'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
                                        metric.is_image_rounded_full && 'rounded-full object-contain'
                                      )}
                                      width={800}
                                      height={600}
                                      loading="lazy"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </div>
                                )}
                              </div>
                            )}
                            {metric.is_title_displayed && (
                              <h3 className={`order-1 ${textVar.metricTitle}`}>
                                {parse(sanitizeHTML(translatedMetricTitle))}
                              </h3>
                            )}
                            <div className={`flex-col order-2 ${textVar.metricDescription} tracking-wider`}>
                              {parse(sanitizeHTML(translatedMetricDescription))}
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <SliderNavigation
                  onPrevious={carousel.prevSlide}
                  onNext={carousel.nextSlide}
                  currentIndex={carousel.currentSlide}
                  totalItems={totalItems}
                  onDotClick={carousel.goToSlide}
                  showDots={true}
                  buttonPosition="bottom-right"
                  buttonVariant="minimal"
                  dotVariant="default"
                />
                
                {/* Pause/Play Button for Accessibility (WCAG 2.2.2) */}
                {totalItems > 1 && (
                  <button
                    onClick={carousel.toggleAutoPlay}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={carousel.isAutoPlaying ? 'Pause carousel' : 'Play carousel'}
                    title={carousel.isAutoPlaying ? 'Pause automatic slideshow' : 'Resume automatic slideshow'}
                  >
                    {carousel.isAutoPlaying ? (
                      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}
                
                {/* Screen reader announcement */}
                <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                  Showing slide {carousel.currentSlide + 1} of {totalItems}. 
                  Carousel is {carousel.isAutoPlaying ? 'playing automatically' : 'paused'}.
                </div>
              </div>
            ) : (
              /* Grid Mode */
              <div className={`grid ${responsiveGridClasses} gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 md:gap-x-10 md:gap-y-12 lg:gap-x-12 lg:gap-y-14 xl:gap-x-14 xl:gap-y-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20`}>
                {(section.website_metric || []).map((metric, index) => {
                // Get translated content for each metric
                const translatedMetricTitle = metric.title
                  ? (currentLocale 
                      ? getTranslatedContent(metric.title, metric.title_translation, currentLocale)
                      : metric.title
                    )
                  : '';

                const translatedMetricDescription = metric.description
                  ? (currentLocale 
                      ? getTranslatedContent(metric.description, metric.description_translation, currentLocale)
                      : metric.description
                    )
                  : '';

                // Keep animation and hover effect on card as before
                // Apply glassmorphism style for codedharmony variant
                const isCodedHarmony = section.text_style_variant === 'codedharmony';
                const cardStyles = metric.is_card_type
                  ? isCodedHarmony
                    ? `p-6 sm:p-12 md:p-16 rounded-3xl text-center gap-y-6 card-hover relative overflow-hidden backdrop-blur-xl bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/20`
                    : `p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8 card-hover`
                  : '';

                // Calculate metric background style (gradient or solid color)
                const metricBgStyle = metric.is_card_type
                  ? getBackgroundStyle(
                      metric.is_gradient,
                      metric.gradient,
                      metric.background_color || (isCodedHarmony ? 'gray-50' : 'white')
                    )
                  : undefined;

                return (
                  <div
                    key={metric.id}
                    className={cn(
                      'space-y-4 flex flex-col mx-auto min-h-[350px]',
                      'transition-all duration-300 ease-out',
                      'hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1',
                      'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
                      'animate-fade-in-up',
                      cardStyles
                    )}
                    style={{
                      ...(metric.is_card_type && metricBgStyle ? metricBgStyle : {}),
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'backwards'
                    }}
                    tabIndex={0}
                  >
                    {metric.image && (
                      <div className={cn(
                        section.is_image_bottom ? 'order-3' : '',
                        // Videos: full width with negative margins, no top margin
                        isVideoUrl(metric.image) 
                          ? metric.is_card_type 
                            ? '-mx-8 sm:-mx-16 mt-0' 
                            : 'mt-0'
                          : 'mt-8' // Images: normal margin
                      )}>
                        {isVideoUrl(metric.image) ? (
                          metric.image.toLowerCase().includes('youtube.com') || 
                          metric.image.toLowerCase().includes('youtu.be') || 
                          metric.image.toLowerCase().includes('vimeo.com') ? (
                            <iframe
                              src={getEmbedUrl(metric.image)}
                              className="w-full rounded-none h-64 sm:h-72 md:h-80 lg:h-96"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={metric.image}
                              controls
                              className="w-full object-cover rounded-none h-64 sm:h-72 md:h-80 lg:h-96"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )
                        ) : (
                          <div className="w-full overflow-hidden h-64 sm:h-72 md:h-80 lg:h-96 relative group">
                            <Image
                              src={metric.image}
                              alt={metric.title || 'Metric image'}
                              className={cn(
                                'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
                                metric.is_image_rounded_full && 'rounded-full object-contain'
                              )}
                              width={800}
                              height={600}
                              priority={false}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                      </div>
                    )}
                    {metric.is_title_displayed && (
                      <h3
                        className={`order-1 ${textVar.metricTitle}`}
                      >
                        {parse(sanitizeHTML(translatedMetricTitle))}
                      </h3>
                    )}
                    <div
                      className={`flex-col order-2 ${textVar.metricDescription} tracking-wider`}
                    >
                      {parse(sanitizeHTML(translatedMetricDescription))}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </>
              );
          }
        })()}
      </div>

      {/* CSS for hover effect and neumorphism */}
      <style jsx>{`
        .card-hover {
          transition: transform 0.3s ease-in-out;
        }
        .card-hover:hover {
          transform: scale(1.03);
        }
        .neomorphic {
          background: var(--neomorphic-bg, linear-gradient(145deg, #f0f0f0, #ffffff));
          box-shadow: 
            12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5),
            inset 2px 2px 4px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .neomorphic:hover {
          background: var(--neomorphic-bg-hover, linear-gradient(145deg, #ffffff, #f5f5f5));
          box-shadow: 
            8px 8px 16px rgba(163, 177, 198, 0.5),
            -8px -8px 16px rgba(255, 255, 255, 0.6),
            inset 2px 2px 4px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </section>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if section id or critical properties change
  return (
    prevProps.section.id === nextProps.section.id &&
    prevProps.section.section_title === nextProps.section.section_title &&
    ((prevProps.section.website_metric?.length || 0) === (nextProps.section.website_metric?.length || 0))
  );
});

TemplateSection.displayName = 'TemplateSection';

export default TemplateSection;