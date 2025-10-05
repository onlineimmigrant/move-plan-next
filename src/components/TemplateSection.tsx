'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import FeedbackAccordion from './FeedbackAccordion';
import HelpCenterSection from './HelpCenterSection';
import { RealEstateModal } from './realEstateModal';

// Text style variants - similar to TemplateHeadingSection
const TEXT_VARIANTS = {
  default: {
    sectionTitle: 'text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-800',
    sectionDescription: 'text-lg font-light text-gray-700',
    metricTitle: 'text-xl sm:text-2xl font-normal text-gray-800',
    metricDescription: 'text-base font-light text-gray-700'
  },
  apple: {
    sectionTitle: 'text-4xl font-light text-gray-900',
    sectionDescription: 'text-lg font-light text-gray-600',
    metricTitle: 'text-xl font-medium text-gray-900',
    metricDescription: 'text-base font-light text-gray-600'
  },
  codedharmony: {
    sectionTitle: 'text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none',
    sectionDescription: 'text-lg sm:text-xl text-gray-500 font-light leading-relaxed',
    metricTitle: 'text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em]',
    metricDescription: 'text-sm sm:text-base text-gray-600 font-normal leading-relaxed'
  }
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
  organization_id: string | null;
}

interface TemplateSectionData {
  id: number;
  background_color?: string;
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
  website_metric: Metric[];
  organization_id: string | null;
  is_reviews_section: boolean;
  is_help_center_section?: boolean;
  is_real_estate_modal?: boolean;
  max_faqs_display?: number;
}

const TemplateSection: React.FC<{ section: TemplateSectionData }> = ({ section }) => {
  // Early return to avoid null/undefined issues
  if (!section) {
    return null;
  }

  // Carousel state for slider mode
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  
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
  const itemsPerSlide = Math.max(1, (section.grid_columns || 1) - 1); // Show grid_columns - 1 to give room for navigation
  const totalItems = section.website_metric?.length || 0;
  
  // Instead of pages, we scroll one item at a time
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalItems);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

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

  // Auto-play effect
  useEffect(() => {
    if (section.is_slider && isAutoPlaying && totalDots > 1) {
      autoPlayInterval.current = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds

      return () => {
        if (autoPlayInterval.current) {
          clearInterval(autoPlayInterval.current);
        }
      };
    }
  }, [section.is_slider, isAutoPlaying, currentSlide, totalDots]);

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

  return (
    <section
      className={`${section.is_slider ? 'px-0' : 'px-4'} py-32 text-xl ${section.background_color ? `bg-${section.background_color}` : 'bg-white'} min-h-[600px]`}
    >
      <div
        className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto space-y-12 ${section.is_slider ? 'py-4' : 'py-4 sm:p-8 sm:rounded-xl'}`}
      >
        {section.is_reviews_section ? (
          <FeedbackAccordion type="all_products" />
        ) : section.is_help_center_section ? (
          <HelpCenterSection section={section} />
        ) : section.is_real_estate_modal ? (
          <RealEstateModal />
        ) : (
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
                className="relative mx-auto px-0 sm:px-12 md:px-20 lg:px-24 xl:px-28 2xl:px-32 max-w-7xl w-full overflow-hidden"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Carousel Container with padding for shadows */}
                <div className="relative min-h-[450px] sm:min-h-[500px] md:min-h-[550px] flex items-center py-8 px-12 sm:px-4 md:px-6 lg:px-8">
                  {/* Flex layout showing current slide items - always inline/horizontal */}
                  <div className="flex gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-10 xl:gap-x-12 transition-opacity duration-700 w-full justify-center">
                    {getCurrentSlideItems().map((metric) => {
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
                          ? `bg-${metric.background_color || 'gray-50'} p-8 sm:p-16 rounded-3xl text-center gap-y-8 neomorphic`
                          : `bg-${metric.background_color || 'white'} p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8`
                        : '';

                      return (
                        <div
                          key={metric.id}
                          className={`space-y-4 flex flex-col flex-1 min-w-[250px] max-w-[400px] min-h-[350px] ${cardStyles}`}
                        >
                            {metric.image && (
                              <div className={`${section.is_image_bottom ? 'order-3' : ''} mt-8`}>
                                <Image
                                  src={metric.image}
                                  alt={metric.title || 'Metric image'}
                                  className={`${metric.is_image_rounded_full ? 'rounded-full' : ''} mx-auto w-auto ${
                                    section.image_metrics_height || 'h-48'
                                  } object-cover`}
                                  width={300}
                                  height={300}
                                  priority={false}
                                />
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

                {/* Navigation Arrows */}
                {totalDots > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200/50 z-10"
                      aria-label="Previous slide"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200/50 z-10"
                      aria-label="Next slide"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Dot Indicators */}
                {totalDots > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalDots }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          index === currentSlide 
                            ? 'bg-gray-900 w-8' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
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
                    ? `bg-${metric.background_color || 'gray-50'} p-8 sm:p-16 rounded-3xl text-center gap-y-8 max-w-xl card-hover neomorphic`
                    : `bg-${metric.background_color || 'white'} p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8 max-w-xl card-hover`
                  : '';

                return (
                  <div
                    key={metric.id}
                    className={`space-y-4 flex flex-col mx-auto min-h-[350px] ${cardStyles}`}
                  >
                    {metric.image && (
                      <div className={`${section.is_image_bottom ? 'order-3' : ''} mt-8`}>
                        <Image
                          src={metric.image}
                          alt={metric.title || 'Metric image'}
                          className={`${metric.is_image_rounded_full ? 'rounded-full' : ''} mx-auto w-auto ${
                            section.image_metrics_height || 'h-48'
                          } object-cover`}
                          width={300}
                          height={300}
                          priority={false}
                        />
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
        )}
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
          background: linear-gradient(145deg, #f0f0f0, #ffffff);
          box-shadow: 
            12px 12px 24px rgba(163, 177, 198, 0.6),
            -12px -12px 24px rgba(255, 255, 255, 0.5),
            inset 2px 2px 4px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .neomorphic:hover {
          background: linear-gradient(145deg, #ffffff, #f5f5f5);
          box-shadow: 
            8px 8px 16px rgba(163, 177, 198, 0.5),
            -8px -8px 16px rgba(255, 255, 255, 0.6),
            inset 2px 2px 4px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </section>
  );
};

export default TemplateSection;