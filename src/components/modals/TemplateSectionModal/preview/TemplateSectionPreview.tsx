/**
 * TemplateSectionPreview Component
 * 
 * Live preview of template section mirroring the actual TemplateSection component
 */

'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import Image from 'next/image';
import { TemplateSectionFormData } from '../hooks';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { cn } from '@/lib/utils';
import { SliderNavigation } from '@/ui/SliderNavigation';

interface TemplateSectionPreviewProps {
  formData: TemplateSectionFormData;
  onDoubleClickTitle?: (e: React.MouseEvent) => void;
  onDoubleClickDescription?: (e: React.MouseEvent) => void;
  onDoubleClickMetricTitle?: (e: React.MouseEvent, metricIndex: number) => void;
  onDoubleClickMetricDescription?: (e: React.MouseEvent, metricIndex: number) => void;
  onImageClick?: (metricIndex: number) => void;
  onImageRemove?: (metricIndex: number) => void;
  imageLoading?: number | null; // Index of metric with loading image
}

// Dynamic imports for heavier specialized sections (match main TemplateSection component approach)
const HelpCenterSection = dynamic(() => import('@/components/TemplateSections/HelpCenterSection'));
const FeedbackAccordion = dynamic(() => import('@/components/TemplateSections/FeedbackAccordion'));
const ContactForm = dynamic(() => import('@/components/contact/ContactForm'));
const RealEstateModal = dynamic(() => import('@/components/TemplateSections/RealEstateModal').then(mod => ({ default: mod.RealEstateModal })));
const BlogPostSlider = dynamic(() => import('@/components/TemplateSections/BlogPostSlider'));
const BrandsSection = dynamic(() => import('@/components/TemplateSections/BrandsSection'));
const FAQSectionWrapper = dynamic(() => import('@/components/TemplateSections/FAQSectionWrapper'));
const PricingPlansSectionWrapper = dynamic(() => import('@/components/TemplateSections/PricingPlansSectionWrapper'));
const TeamMember = dynamic(() => import('@/components/TemplateSections/TeamMember'));
const Testimonials = dynamic(() => import('@/components/TemplateSections/Testimonials'));
const AppointmentSection = dynamic(() => import('@/components/TemplateSections/AppointmentSection'));

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

// Text style variants - matching TemplateSection.tsx
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

export function TemplateSectionPreview({ 
  formData,
  onDoubleClickTitle,
  onDoubleClickDescription,
  onDoubleClickMetricTitle,
  onDoubleClickMetricDescription,
  onImageClick,
  onImageRemove,
  imageLoading,
}: TemplateSectionPreviewProps) {
  // Carousel state for slider mode
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get text style variant
  const textVariant = TEXT_VARIANTS[formData.text_style_variant || 'default'];

  // Background style
  const backgroundStyle = useMemo(() => {
    return getBackgroundStyle(
      formData.is_gradient || false,
      formData.gradient || null,
      formData.background_color || 'white'
    );
  }, [formData.is_gradient, formData.gradient, formData.background_color]);

  // Title alignment class
  const titleAlignClass = formData.is_section_title_aligned_center
    ? 'text-center'
    : formData.is_section_title_aligned_right
    ? 'text-right'
    : 'text-left';

  // Grid columns class
  const gridCols = formData.grid_columns || 3;
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  }[gridCols] || 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3';

  // Container class
  const containerClass = formData.is_full_width ? 'w-full' : 'max-w-7xl';

  // Sample metrics for preview
  const sampleMetrics = formData.website_metric && formData.website_metric.length > 0
    ? formData.website_metric
    : [
        { id: 1, title: 'Feature One', description: 'Showcase your amazing features with beautiful cards', image: null, is_title_displayed: true, is_card_type: true },
        { id: 2, title: 'Feature Two', description: 'Each card can have its own unique content and styling', image: null, is_title_displayed: true, is_card_type: true },
        { id: 3, title: 'Feature Three', description: 'Perfect for highlighting services or products', image: null, is_title_displayed: true, is_card_type: true },
      ];

  // Slider functions
  const itemsPerSlide = isMobile ? 1 : Math.max(1, (formData.grid_columns || 1) - 1);
  const totalItems = sampleMetrics.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const getCurrentSlideItems = () => {
    const items = [];
    for (let i = 0; i < itemsPerSlide; i++) {
      const index = (currentSlide + i) % totalItems;
      items.push(sampleMetrics[index]);
    }
    return items;
  };

  const totalDots = totalItems;

  // Touch handlers
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

  // Auto-play
  useEffect(() => {
    if (formData.is_slider && isAutoPlaying && totalDots > 1 && !isMobile) {
      autoPlayInterval.current = setInterval(() => {
        nextSlide();
      }, 5000);

      return () => {
        if (autoPlayInterval.current) {
          clearInterval(autoPlayInterval.current);
        }
      };
    }
  }, [formData.is_slider, isAutoPlaying, totalDots, nextSlide, isMobile]);

  const handleMouseEnter = () => {
    if (formData.is_slider) {
      setIsAutoPlaying(false);
    }
  };

  const handleMouseLeave = () => {
    if (formData.is_slider) {
      setIsAutoPlaying(true);
    }
  };

  // Render specialized sections to keep JSX simpler and avoid nesting pitfalls
  const renderSpecialized = () => {
    switch (formData.section_type) {
      case 'reviews':
        return <FeedbackAccordion type="all_products" />;
      case 'contact':
        return <ContactForm />;
      case 'real_estate':
        return <RealEstateModal />;
      case 'help_center':
        return (
          <HelpCenterSection
            section={{
              id: 0,
              section_title: formData.section_title || 'Help Center',
              section_description: formData.section_description || 'Organize articles, FAQs and AI support.',
              text_style_variant: formData.text_style_variant || 'default',
              background_color: formData.background_color || undefined,
              is_full_width: formData.is_full_width || false,
              is_section_title_aligned_center: formData.is_section_title_aligned_center || false,
              is_section_title_aligned_right: formData.is_section_title_aligned_right || false,
              section_type: 'help_center',
              organization_id: null,
            }}
            onDoubleClickTitle={onDoubleClickTitle}
            onDoubleClickDescription={onDoubleClickDescription}
          />
        );
      case 'article_slider':
        return <BlogPostSlider backgroundColor={formData.background_color} />;
      case 'brand':
        return (
          <BrandsSection
            section={{
              id: 0,
              section_title: formData.section_title || 'Our Partners',
              section_description: formData.section_description || '',
              text_style_variant: formData.text_style_variant || 'default',
              background_color: formData.background_color || undefined,
              is_full_width: formData.is_full_width || false,
              is_section_title_aligned_center: formData.is_section_title_aligned_center || false,
              is_section_title_aligned_right: formData.is_section_title_aligned_right || false,
              section_type: 'brand',
              website_metric: formData.website_metric || [],
              organization_id: null,
            }}
          />
        );
      case 'pricing_plans':
        return (
          <PricingPlansSectionWrapper
            section={{
              id: 0,
              section_title: formData.section_title || 'Pricing Plans',
              section_description: formData.section_description || '',
              organization_id: null,
            }}
          />
        );
      case 'faq':
        return (
          <FAQSectionWrapper
            section={{
              id: 0,
              section_title: formData.section_title || 'Frequently Asked Questions',
              section_description: formData.section_description || '',
              // extra props are not required by FAQSectionWrapper
            }}
          />
        );
      case 'team':
        return (
          <TeamMember
            section={{
              id: 0,
              section_title: formData.section_title || 'Our Team',
              section_description: formData.section_description || '',
              text_style_variant: formData.text_style_variant || 'default',
              background_color: formData.background_color || undefined,
              is_full_width: formData.is_full_width || false,
              grid_columns: formData.grid_columns || 3,
            }}
          />
        );
      case 'testimonials':
        return (
          <Testimonials
            section={{
              id: 0,
              section_title: formData.section_title || 'Testimonials',
              section_description: formData.section_description || '',
              text_style_variant: formData.text_style_variant || 'default',
              background_color: formData.background_color || undefined,
              is_full_width: formData.is_full_width || false,
              grid_columns: formData.grid_columns || 3,
            }}
          />
        );
      case 'appointment':
        return (
          <AppointmentSection
            section={{
              id: 0,
              section_title: formData.section_title || 'Book an Appointment',
              section_description: formData.section_description || '',
              text_style_variant: formData.text_style_variant || 'default',
              background_color: formData.background_color || undefined,
              is_full_width: formData.is_full_width || false,
              section_type: 'appointment',
              website_metric: formData.website_metric || [],
              organization_id: null,
            }}
          />
        );
      default:
        return (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {specialSectionMessage?.title || 'Special Section'}
            </h3>
            <p className="text-base text-gray-600 max-w-md mx-auto">
              {specialSectionMessage?.desc || 'This section type has its own specialized layout'}
            </p>
          </div>
        );
    }
  };

  // Special section type messages
  const getSectionTypeMessage = () => {
    switch (formData.section_type) {
      case 'testimonials':
        return { title: 'Testimonials Section', desc: 'Customer testimonials will be displayed here' };
      case 'reviews':
        return { title: 'Reviews Section', desc: 'Customer reviews and ratings will be displayed here' };
      case 'faq':
        return { title: 'FAQ Section', desc: 'Frequently asked questions will be displayed here' };
      case 'contact':
        return { title: 'Contact Section', desc: 'Contact form will be displayed here' };
      case 'pricing_plans':
        return { title: 'Pricing Plans', desc: 'Pricing plan cards will be displayed here' };
      case 'brand':
        return { title: 'Brand Section', desc: 'Brand logos will be displayed here' };
      case 'article_slider':
        return { title: 'Article Slider', desc: 'Article slider will be displayed here' };
      case 'help_center':
        return { title: 'Help Center', desc: 'Help articles will be displayed here' };
      case 'real_estate':
        return { title: 'Real Estate', desc: 'Property listings will be displayed here' };
      case 'appointment':
        return { title: 'Appointment Types', desc: 'Appointment type cards will be displayed here' };
      default:
        return null;
    }
  };

  const specialSectionMessage = getSectionTypeMessage();

  return (
    <section
      className={cn(
        'relative',
        formData.section_type === 'reviews' 
          ? 'px-0 py-0 min-h-0' 
          : formData.is_slider 
          ? 'px-0 py-8 min-h-[600px]' 
          : 'px-4 py-8 min-h-[600px]'
      )}
      style={backgroundStyle}
    >
      <div
        className={cn(
          containerClass,
          'mx-auto',
          (() => {
            const specialTypes = ['brand','article_slider','contact','faq','pricing_plans','reviews','help_center','real_estate','team','testimonials','appointment'];
            if (formData.is_slider) return 'py-4 space-y-12';
            return specialTypes.includes(formData.section_type || '') ? '' : 'py-4 sm:p-8 sm:rounded-xl space-y-12';
          })()
        )}
      >
        {formData.section_type === 'general' || !formData.section_type ? (
          <>
            {/* Section Title & Description */}
            {(formData.section_title || formData.section_description) && (
              <div className={titleAlignClass}>
                {formData.section_title && (
                  <div className="group relative">
                    <h2 
                      className={cn(
                        textVariant.sectionTitle, 
                        'cursor-pointer transition-all duration-200',
                        'group-hover:opacity-70 group-hover:px-2 group-hover:py-1 group-hover:bg-blue-50/50 group-hover:rounded inline-block'
                      )}
                      onDoubleClick={onDoubleClickTitle}
                      title="Double-click to edit"
                    >
                      {typeof DOMPurify !== 'undefined'
                        ? parse(DOMPurify.sanitize(formData.section_title))
                        : formData.section_title}
                    </h2>
                    <span className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">
                      ✏️
                    </span>
                  </div>
                )}
                {formData.section_description && (
                  <div className="group relative pt-4">
                    <p 
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        textVariant.sectionDescription,
                        'group-hover:opacity-70 group-hover:px-2 group-hover:py-1 group-hover:bg-blue-50/50 group-hover:rounded inline-block'
                      )}
                      onDoubleClick={onDoubleClickDescription}
                      title="Double-click to edit"
                    >
                      {typeof DOMPurify !== 'undefined'
                        ? parse(DOMPurify.sanitize(formData.section_description))
                        : formData.section_description}
                    </p>
                    <span className="absolute -right-6 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">
                      ✏️
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Metrics Section - Slider or Grid */}
            {formData.is_slider ? (
              /* Slider/Carousel Mode */
              <div
                className="relative mx-auto px-4 sm:px-12 md:px-20 lg:px-24 xl:px-28 2xl:px-32 max-w-7xl w-full overflow-hidden"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Carousel Container */}
                <div className="relative min-h-[450px] sm:min-h-[500px] md:min-h-[550px] flex items-center py-8 px-0 sm:px-4 md:px-6 lg:px-8">
                  <div
                    className={cn(
                      'flex gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-10 xl:gap-x-12 transition-opacity duration-700 w-full',
                      isMobile ? 'justify-center' : 'justify-center'
                    )}
                  >
                    {getCurrentSlideItems().map((metric: any, slideIndex: number) => {
                      const isCodedHarmony = formData.text_style_variant === 'codedharmony';
                      const cardStyles = metric.is_card_type
                        ? isCodedHarmony
                          ? 'p-6 sm:p-12 md:p-16 rounded-3xl text-center gap-y-6 relative overflow-hidden backdrop-blur-xl bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/20'
                          : 'p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8'
                        : '';

                      const metricBgStyle = metric.is_card_type
                        ? getBackgroundStyle(
                            metric.is_gradient,
                            metric.gradient,
                            metric.background_color || (isCodedHarmony ? 'gray-50' : 'white')
                          )
                        : undefined;

                      // Find the actual metric index in the full list
                      const metricIndex = sampleMetrics.findIndex(m => m.id === metric.id);

                      return (
                        <div
                          key={metric.id ? `${currentSlide}-${slideIndex}-${metric.id}` : `${currentSlide}-${slideIndex}-temp`}
                          className={cn(
                            'space-y-4 flex flex-col min-h-[350px]',
                            isMobile ? 'w-full max-w-[400px]' : 'flex-1 min-w-[250px] max-w-[400px]',
                            cardStyles
                          )}
                          style={metric.is_card_type && metricBgStyle ? metricBgStyle : undefined}
                        >
                          {/* Image with inline upload/change/remove */}
                          <div
                            className={cn(
                              formData.is_image_bottom ? 'order-3' : '',
                              'mt-8 relative group'
                            )}
                          >
                            {metric.image ? (
                              <>
                                <div
                                  className={cn(
                                    'w-full overflow-hidden flex items-center justify-center relative cursor-pointer',
                                    formData.image_metrics_height || 'h-48'
                                  )}
                                  onClick={() => onImageClick?.(metricIndex)}
                                  title="Click to change image"
                                >
                                  {/* Loading overlay */}
                                  {imageLoading === metricIndex && (
                                    <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-20 flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-semibold text-blue-600">Processing...</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {isVideoUrl(metric.image) ? (
                                    metric.image.toLowerCase().includes('youtube.com') || 
                                    metric.image.toLowerCase().includes('youtu.be') || 
                                    metric.image.toLowerCase().includes('vimeo.com') ? (
                                      <iframe
                                        src={getEmbedUrl(metric.image)}
                                        className={cn(
                                          'w-full rounded-none',
                                          formData.image_metrics_height || 'h-48'
                                        )}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <video
                                        src={metric.image}
                                        controls
                                        className={cn(
                                          'w-full object-cover rounded-none',
                                          formData.image_metrics_height || 'h-48'
                                        )}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                    )
                                  ) : (
                                    <Image
                                      src={metric.image}
                                      alt={metric.title || 'Metric image'}
                                      className={cn(
                                        'object-contain max-w-full max-h-full transition-opacity group-hover:opacity-75',
                                        metric.is_image_rounded_full && 'rounded-full'
                                      )}
                                      width={300}
                                      height={300}
                                    />
                                  )}
                                  {/* Change image overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <div className="text-white text-sm font-medium flex items-center gap-2">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Change {isVideoUrl(metric.image) ? 'Video' : 'Image'}
                                    </div>
                                  </div>
                                </div>
                                {/* Remove button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onImageRemove?.(metricIndex);
                                  }}
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
                                  title="Remove image"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : imageLoading === metricIndex ? (
                              /* Loading state for new image */
                              <div
                                className={cn(
                                  'w-full flex items-center justify-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50',
                                  formData.image_metrics_height || 'h-48'
                                )}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  <p className="text-sm font-semibold text-blue-600">Loading image...</p>
                                </div>
                              </div>
                            ) : (
                              /* Upload placeholder */
                              <div
                                className={cn(
                                  'w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors',
                                  formData.image_metrics_height || 'h-48'
                                )}
                                onClick={() => onImageClick?.(metricIndex)}
                                title="Click to add image"
                              >
                                <div className="text-center text-gray-400">
                                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm font-medium">Click to add image</p>
                                </div>
                              </div>
                            )}
                          </div>
                          {metric.is_title_displayed && metric.title && (
                            <div className="group relative order-1">
                              <h3 
                                className={cn(
                                  'cursor-pointer transition-all duration-200', 
                                  textVariant.metricTitle,
                                  'group-hover:opacity-70 group-hover:px-2 group-hover:py-1 group-hover:bg-blue-50/50 group-hover:rounded'
                                )}
                                onDoubleClick={(e) => onDoubleClickMetricTitle?.(e, metricIndex)}
                                title="Double-click to edit"
                              >
                                {typeof DOMPurify !== 'undefined'
                                  ? parse(DOMPurify.sanitize(metric.title))
                                  : metric.title}
                              </h3>
                              <span className="absolute -right-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">
                                ✏️
                              </span>
                            </div>
                          )}
                          {metric.description && (
                            <div className="group relative order-2">
                              <div 
                                className={cn(
                                  'flex-col tracking-wider cursor-pointer transition-all duration-200', 
                                  textVariant.metricDescription,
                                  'group-hover:opacity-70 group-hover:px-2 group-hover:py-1 group-hover:bg-blue-50/50 group-hover:rounded'
                                )}
                                onDoubleClick={(e) => onDoubleClickMetricDescription?.(e, metricIndex)}
                                title="Double-click to edit"
                              >
                                {typeof DOMPurify !== 'undefined'
                                  ? parse(DOMPurify.sanitize(metric.description))
                                  : metric.description}
                              </div>
                              <span className="absolute -right-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">
                                ✏️
                              </span>
                            </div>
                          )}
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
              <div className={cn('grid gap-x-12 gap-y-12', gridClass)}>
                {sampleMetrics.map((metric: any, metricIndex: number) => {
                  const isCodedHarmony = formData.text_style_variant === 'codedharmony';
                  const cardStyles = metric.is_card_type
                    ? isCodedHarmony
                      ? 'p-6 sm:p-12 md:p-16 rounded-3xl text-center gap-y-6 card-hover relative overflow-hidden backdrop-blur-xl bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/20'
                      : 'p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8 card-hover'
                    : '';

                  const metricBgStyle = metric.is_card_type
                    ? getBackgroundStyle(
                        metric.is_gradient,
                        metric.gradient,
                        metric.background_color || (isCodedHarmony ? 'gray-50' : 'white')
                      )
                    : undefined;

                  return (
                    <div
                      key={metric.id || `metric-${metricIndex}`}
                      className={cn('space-y-4 flex flex-col', cardStyles)}
                      style={metric.is_card_type && metricBgStyle ? metricBgStyle : undefined}
                    >
                      {/* Image with inline upload/change/remove */}
                      <div className={cn(formData.is_image_bottom ? 'order-3' : '', 'mt-8 relative group')}>
                        {metric.image ? (
                          <>
                            <div
                              className={cn(
                                'w-full overflow-hidden flex items-center justify-center relative cursor-pointer',
                                formData.image_metrics_height || 'h-48'
                              )}
                              onClick={() => onImageClick?.(metricIndex)}
                              title="Click to change image"
                            >
                              {/* Loading overlay */}
                              {imageLoading === metricIndex && (
                                <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-20 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-semibold text-blue-600">Processing...</span>
                                  </div>
                                </div>
                              )}
                              
                              {isVideoUrl(metric.image) ? (
                                metric.image.toLowerCase().includes('youtube.com') || 
                                metric.image.toLowerCase().includes('youtu.be') || 
                                metric.image.toLowerCase().includes('vimeo.com') ? (
                                  <iframe
                                    src={getEmbedUrl(metric.image)}
                                    className={cn(
                                      'w-full rounded-none',
                                      formData.image_metrics_height || 'h-48'
                                    )}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video
                                    src={metric.image}
                                    controls
                                    className={cn(
                                      'w-full object-cover rounded-none',
                                      formData.image_metrics_height || 'h-48'
                                    )}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                )
                              ) : (
                                <Image
                                  src={metric.image}
                                  alt={metric.title || 'Metric image'}
                                  className={cn(
                                    'object-contain max-w-full max-h-full transition-opacity group-hover:opacity-75',
                                    metric.is_image_rounded_full && 'rounded-full'
                                  )}
                                  width={300}
                                  height={300}
                                />
                              )}
                              {/* Change image overlay */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <div className="text-white text-sm font-medium flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Change {isVideoUrl(metric.image) ? 'Video' : 'Image'}
                                </div>
                              </div>
                            </div>
                            {/* Remove button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onImageRemove?.(metricIndex);
                              }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : imageLoading === metricIndex ? (
                          /* Loading state for new image */
                          <div
                            className={cn(
                              'w-full flex items-center justify-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50',
                              formData.image_metrics_height || 'h-48'
                            )}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-sm font-semibold text-blue-600">Loading image...</p>
                            </div>
                          </div>
                        ) : (
                          /* Upload placeholder */
                          <div
                            className={cn(
                              'w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors',
                              formData.image_metrics_height || 'h-48'
                            )}
                            onClick={() => onImageClick?.(metricIndex)}
                            title="Click to add image"
                          >
                            <div className="text-center text-gray-400">
                              <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm font-medium">Click to add image</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {metric.is_title_displayed && metric.title && (
                        <div className="group relative order-1">
                          <h3 
                            className={cn(
                              'cursor-pointer transition-all duration-200', 
                              textVariant.metricTitle,
                              'group-hover:opacity-70 group-hover:px-2 group-hover:py-1 group-hover:bg-blue-50/50 group-hover:rounded'
                            )}
                            onDoubleClick={(e) => onDoubleClickMetricTitle?.(e, metricIndex)}
                            title="Double-click to edit"
                          >
                            {typeof DOMPurify !== 'undefined'
                              ? parse(DOMPurify.sanitize(metric.title))
                              : metric.title}
                          </h3>
                          <span className="absolute -right-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">
                            ✏️
                          </span>
                        </div>
                      )}
                      {metric.description && (
                        <div className="group relative order-2">
                          <div 
                            className={cn(
                              'flex-col tracking-wider cursor-pointer transition-all duration-200', 
                              textVariant.metricDescription,
                              'group-hover:opacity-70 group-hover:px-2 group-hover:py-1 group-hover:bg-blue-50/50 group-hover:rounded'
                            )}
                            onDoubleClick={(e) => onDoubleClickMetricDescription?.(e, metricIndex)}
                            title="Double-click to edit"
                          >
                            {typeof DOMPurify !== 'undefined'
                              ? parse(DOMPurify.sanitize(metric.description))
                              : metric.description}
                          </div>
                          <span className="absolute -right-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">
                            ✏️
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State for General sections */}
            {sampleMetrics.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                <p className="text-sm text-gray-500">Add metrics or items to see them in the preview</p>
              </div>
            )}
          </>
        ) : (
          // Specialized Section Type Preview
          <>{renderSpecialized()}</>
        )}
      </div>
    </section>
  );
}
