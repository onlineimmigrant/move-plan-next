'use client';

import React, { useMemo } from 'react';
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
  text_style_variant?: 'default' | 'apple';
  grid_columns: number;
  image_metrics_height?: string;
  is_image_bottom: boolean;
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

  const pathname = usePathname();
  
  // Extract locale from pathname (similar to TemplateHeadingSection logic)
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathLocale = pathSegments[0];
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
  const currentLocale = pathLocale && pathLocale.length === 2 && supportedLocales.includes(pathLocale) ? pathLocale : null;

  // Get text variant styles
  const textVar = TEXT_VARIANTS[section.text_style_variant || 'default'];

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

  return (
    <section
      className={`py-32 text-xl ${section.background_color ? `bg-${section.background_color}` : 'bg-white'} min-h-[600px]`}
    >
      <div
        className={`${section.is_full_width ? 'w-full' : 'max-w-7xl'} mx-auto space-y-12 py-4 sm:p-8 sm:rounded-xl`}
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

            {/* Metrics Section */}
            <div
              className={`grid grid-cols-1 lg:grid-cols-${section.grid_columns || 1} gap-x-12 gap-y-12`}
            >
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
                return (
                  <div
                    key={metric.id}
                    className={`space-y-4 flex flex-col mx-auto min-h-[350px] ${
                      metric.is_card_type
                        ? `bg-${metric.background_color || 'white'} p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8 max-w-xl card-hover`
                        : ''
                    }`}
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
          </>
        )}
      </div>

      {/* CSS for hover effect */}
      <style jsx>{`
        .card-hover {
          transition: transform 0.3s ease-in-out;
        }
        .card-hover:hover {
          transform: scale(1.03);
        }
      `}</style>
    </section>
  );
};

export default TemplateSection;