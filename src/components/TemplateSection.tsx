'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { HoverEditButtons } from '@/ui/Button';
import { isAdminClient } from '@/lib/auth';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { cn } from '@/lib/utils';
import { SliderNavigation } from '@/ui/SliderNavigation';

// Dynamic imports for heavy section components (Phase 2 optimization)
const FeedbackAccordion = dynamic(() => import('@/components/TemplateSections/FeedbackAccordion'));
const HelpCenterSection = dynamic(() => import('@/components/TemplateSections/HelpCenterSection'));
const RealEstateModal = dynamic(() => import('@/components/TemplateSections/RealEstateModal').then(mod => ({ default: mod.RealEstateModal })));
const BlogPostSlider = dynamic(() => import('@/components/TemplateSections/BlogPostSlider'));
const ContactForm = dynamic(() => import('@/components/contact/ContactForm'));
const BrandsSection = dynamic(() => import('@/components/TemplateSections/BrandsSection'));
const FAQSectionWrapper = dynamic(() => import('@/components/TemplateSections/FAQSectionWrapper'));
const PricingPlansSectionWrapper = dynamic(() => import('@/components/TemplateSections/PricingPlansSectionWrapper'));

// Text style variants - similar to TemplateHeadingSection
const TEXT_VARIANTS = {
  default: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-800',
    sectionDescription: 'text-lg font-light text-gray-700',
    metricTitle: 'text-xl font-semibold text-gray-900',
    metricDescription: 'text-base text-gray-600'
  },
  apple: {
    sectionTitle: 'text-4xl sm:text-5xl font-light text-gray-900',
    sectionDescription: 'text-lg font-light text-gray-600',
    metricTitle: 'text-2xl font-light text-gray-900',
    metricDescription: 'text-base font-light text-gray-600'
  },
  codedharmony: {
    sectionTitle: 'text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none',
    sectionDescription: 'text-lg sm:text-xl text-gray-500 font-light leading-relaxed',
    metricTitle: 'text-3xl sm:text-4xl font-thin text-gray-900 tracking-tight',
    metricDescription: 'text-base sm:text-lg text-gray-600 font-light leading-relaxed'
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
  
  // New consolidated field
  section_type?: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';
  
  // DEPRECATED - Keep for backward compatibility
  is_reviews_section: boolean;
  is_help_center_section?: boolean;
  is_real_estate_modal?: boolean;
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean;
  
  website_metric: Metric[];
  organization_id: string | null;
}

const TemplateSection: React.FC<{ section: TemplateSectionData }> = React.memo(({ section }) => {
  // Early return to avoid null/undefined issues
  if (!section) {
    return null;
  }
  // Debug: Log section data to see if metrics are present
  console.log('TemplateSection rendered:', {
    id: section.id,
    title: section.section_title,
    metricsCount: section.website_metric?.length || 0,
    hasMetrics: !!section.website_metric,
    metrics: section.website_metric
  });

  // Admin state and edit context
  const [isAdmin, setIsAdmin] = useState(false);
  const { openModal } = useTemplateSectionEdit();

  // Carousel state for slider mode
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  
  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await isAdminClient();
      setIsAdmin(adminStatus);
    };
    checkAdmin();
  }, []);
  
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

  // Slider/Carousel functions
  // On mobile, show 1 item; on desktop, show grid_columns - 1 to give room for navigation
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const itemsPerSlide = isMobile ? 1 : Math.max(1, (section.grid_columns || 1) - 1);
  const totalItems = section.website_metric?.length || 0;
  
  // Instead of pages, we scroll one item at a time
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Get items for current slide - showing itemsPerSlide items starting from currentSlide
  const getCurrentSlideItems = () => {
    const items = [];
    for (let i = 0; i < itemsPerSlide; i++) {
      const index = (currentSlide + i) % totalItems;
      items.push(section.website_metric[index]);
    }
    return items;
  };

  // Calculate total dots (number of unique starting positions)
  const totalDots = totalItems;

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) {
      nextSlide();
    }
    if (touchEndX.current - touchStartX.current > 75) {
      prevSlide();
    }
  };

  // Auto-play effect (disabled on mobile)
  useEffect(() => {
    if (section.is_slider && isAutoPlaying && totalDots > 1 && !isMobile) {
      autoPlayInterval.current = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds

      return () => {
        if (autoPlayInterval.current) {
          clearInterval(autoPlayInterval.current);
        }
      };
    }
  }, [section.is_slider, isAutoPlaying, totalDots, nextSlide, isMobile]); // Added isMobile dependency

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (section.is_slider) {
      setIsAutoPlaying(false);
    }
  };

  const handleMouseLeave = () => {
    if (section.is_slider) {
      setIsAutoPlaying(true);
    }
  };

  // Calculate section background style (gradient or solid color)
  const sectionBackgroundStyle = useMemo(() => {
    return getBackgroundStyle(
      section.is_gradient,
      section.gradient,
      section.background_color || 'white'
    );
  }, [section.is_gradient, section.gradient, section.background_color]);

  return (
    <section
      className={`${
        // Remove padding for new special sections that manage their own layout
        section.is_brand || section.is_article_slider || section.is_contact_section || section.is_faq_section || section.is_pricingplans_section
          ? 'px-0 py-0 min-h-0'
          : section.is_slider 
          ? 'px-0 py-32 min-h-[600px]' 
          : 'px-4 py-32 min-h-[600px]'
      } text-xl relative group`}
      style={sectionBackgroundStyle}
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
          ['brand', 'article_slider', 'contact', 'faq', 'pricing_plans', 'reviews', 'help_center', 'real_estate'].includes(section.section_type || '')
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
            
            case 'general':
            default:
              // General content section
              return (
          <>
            {/* Section Title and Description */}
            <div
              className={`${
                section.is_section_title_aligned_center
                  ? 'text-center'
                  : section.is_section_title_aligned_right
                  ? 'text-right'
                  : 'text-left'
              }`}
            >
              <h2
                className={textVar.sectionTitle}
              >
                {parse(sanitizeHTML(translatedSectionTitle))}
              </h2>

              {translatedSectionDescription && (
                <p
                  className={`pt-4 ${textVar.sectionDescription}`}
                >
                  {parse(sanitizeHTML(translatedSectionDescription))}
                </p>
              )}
            </div>

            {/* Metrics Section - Conditional: Slider or Grid */}
            {section.is_slider ? (
              /* Slider/Carousel Mode */
              <div 
                className="relative mx-auto px-4 sm:px-12 md:px-20 lg:px-24 xl:px-28 2xl:px-32 max-w-7xl w-full overflow-hidden"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Carousel Container with padding for shadows */}
                <div className="relative min-h-[450px] sm:min-h-[500px] md:min-h-[550px] flex items-center py-8 px-0 sm:px-4 md:px-6 lg:px-8">
                  {/* Flex layout showing current slide items - always inline/horizontal */}
                  <div className={cn(
                    "flex gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-10 xl:gap-x-12 transition-opacity duration-700 w-full",
                    isMobile ? "justify-center" : "justify-center"
                  )}>
                    {getCurrentSlideItems().map((metric, slideIndex) => {
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
                          ? `p-8 sm:p-16 rounded-3xl text-center gap-y-8 neomorphic`
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
                      
                      console.log(`Metric ${metric.id} rendering:`, {
                        background_color: metric.background_color,
                        is_gradient: metric.is_gradient,
                        gradient: metric.gradient,
                        is_card_type: metric.is_card_type,
                        isCodedHarmony,
                        metricBgStyle
                      });

                      return (
                        <div
                          key={`${currentSlide}-${slideIndex}-${metric.id}`}
                          className={cn(
                            "space-y-4 flex flex-col min-h-[350px]",
                            isMobile ? "w-full max-w-[400px]" : "flex-1 min-w-[250px] max-w-[400px]",
                            cardStyles
                          )}
                          style={metric.is_card_type && metricBgStyle ? metricBgStyle : undefined}
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
                                      className={`w-full rounded-none ${
                                        section.image_metrics_height || 'h-48'
                                      }`}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  ) : (
                                    <video
                                      src={metric.image}
                                      controls
                                      className={`w-full object-cover rounded-none ${
                                        section.image_metrics_height || 'h-48'
                                      }`}
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  )
                                ) : (
                                  <div className={cn(
                                    'w-full overflow-hidden flex items-center justify-center',
                                    section.image_metrics_height || 'h-48'
                                  )}>
                                    <Image
                                      src={metric.image}
                                      alt={metric.title || 'Metric image'}
                                      className={cn(
                                        'object-contain max-w-full max-h-full',
                                        metric.is_image_rounded_full && 'rounded-full'
                                      )}
                                      width={300}
                                      height={300}
                                      loading="lazy"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
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
                  onPrevious={prevSlide}
                  onNext={nextSlide}
                  currentIndex={currentSlide}
                  totalItems={totalDots}
                  onDotClick={goToSlide}
                  showDots={true}
                  buttonPosition="bottom-right"
                  buttonVariant="minimal"
                  dotVariant="default"
                />
              </div>
            ) : (
              /* Grid Mode */
              <div className={`grid ${responsiveGridClasses} gap-x-12 gap-y-12`}>
                {(section.website_metric || []).map((metric) => {
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
                // Apply neumorphic style for codedharmony variant
                const isCodedHarmony = section.text_style_variant === 'codedharmony';
                const cardStyles = metric.is_card_type
                  ? isCodedHarmony
                    ? `p-8 sm:p-16 rounded-3xl text-center gap-y-8 card-hover neomorphic`
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
                
                console.log(`Metric ${metric.id} rendering (grid):`, {
                  background_color: metric.background_color,
                  is_gradient: metric.is_gradient,
                  gradient: metric.gradient,
                  is_card_type: metric.is_card_type,
                  isCodedHarmony,
                  metricBgStyle
                });

                return (
                  <div
                    key={metric.id}
                    className={`space-y-4 flex flex-col mx-auto min-h-[350px] ${cardStyles}`}
                    style={metric.is_card_type && metricBgStyle ? metricBgStyle : undefined}
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
                              className={`w-full rounded-none ${
                                section.image_metrics_height || 'h-48'
                              }`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={metric.image}
                              controls
                              className={`w-full object-cover rounded-none ${
                                section.image_metrics_height || 'h-48'
                              }`}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )
                        ) : (
                          <div className={cn(
                            'w-full overflow-hidden flex items-center justify-center',
                            section.image_metrics_height || 'h-48'
                          )}>
                            <Image
                              src={metric.image}
                              alt={metric.title || 'Metric image'}
                              className={cn(
                                'object-contain max-w-full max-h-full',
                                metric.is_image_rounded_full && 'rounded-full'
                              )}
                              width={300}
                              height={300}
                              priority={false}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
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
    prevProps.section.website_metric.length === nextProps.section.website_metric.length
  );
});

TemplateSection.displayName = 'TemplateSection';

export default TemplateSection;