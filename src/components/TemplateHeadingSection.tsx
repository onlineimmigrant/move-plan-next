'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { usePathname } from 'next/navigation';
import  Button from '@/ui/Button';
import { useTemplateHeadingSectionEdit } from '@/components/modals/TemplateHeadingSectionModal/context';
import { HoverEditButtons } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { TemplateHeadingSection as TemplateHeadingSectionType } from '@/types/template_heading_section';

interface TemplateHeadingSectionProps {
  templateSectionHeadings: TemplateHeadingSectionType[];
  isPriority?: boolean; // For LCP optimization - prioritize first section
}

// Font family mappings
const FONT_FAMILIES = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  display: 'font-display',
};

// Font size mappings
const TITLE_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
  '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
};

const DESC_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

// Font weight mappings
const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

// Alignment mappings
const ALIGNMENTS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
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


const TemplateHeadingSection: React.FC<TemplateHeadingSectionProps> = ({ templateSectionHeadings, isPriority = false }) => {
  if (!templateSectionHeadings?.length) return null;

  // Admin state and edit context
  const { isAdmin } = useAuth();
  const { openModal } = useTemplateHeadingSectionEdit();

  const pathname = usePathname();
  
  // Extract locale from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathLocale = pathSegments[0];
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
  const currentLocale = pathLocale && pathLocale.length === 2 && supportedLocales.includes(pathLocale) ? pathLocale : null;

  const sanitizeHTML = (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style'], FORBID_TAGS: ['iframe']
  });

  return (
    <>
      {templateSectionHeadings.map((section) => {
        try {
          const { content, translations, style } = section;
          
          // Get translated content
          const translatedTitle = currentLocale && translations?.name?.[currentLocale]
            ? translations.name[currentLocale]
            : content.title || '';
          
          const translatedDescription = currentLocale && translations?.description?.[currentLocale]
            ? translations.description[currentLocale]
            : content.description || '';

          const translatedButtonText = currentLocale && translations?.button_text?.[currentLocale]
            ? translations.button_text[currentLocale]
            : content.button?.text || '';
          
          const hasImage = !!content.image;
          
          // Calculate heading section background style
          const headingBackgroundStyle = style.gradient?.enabled
            ? getBackgroundStyle(true, style.gradient.config, style.background_color)
            : { backgroundColor: style.background_color };
          
          // Build title classes
          const titleClasses = [
            TITLE_SIZES[style.title.size],
            FONT_FAMILIES[style.title.font],
            FONT_WEIGHTS[style.title.weight],
            'tracking-tight leading-tight',
          ].join(' ');

          // Build description classes
          const descClasses = [
            DESC_SIZES[style.description.size],
            FONT_FAMILIES[style.description.font],
            FONT_WEIGHTS[style.description.weight],
            'leading-8',
          ].join(' ');

          const titleColor = style.title.color ? getColorValue(style.title.color) : 'rgb(31 41 55)'; // gray-800 default
          const descColor = style.description.color ? getColorValue(style.description.color) : 'rgb(55 65 81)'; // gray-700 default
          const buttonColor = style.button.color ? getColorValue(style.button.color) : 'rgb(16 185 129)'; // emerald-500 default
          const buttonTextColor = style.button.text_color ? getColorValue(style.button.text_color) : 'white';
          
          return (
          <section
            key={section.id}
            className={`relative isolate group px-6 lg:px-8 py-28 sm:py-36 overflow-hidden`}
            style={headingBackgroundStyle}
          >
            {/* Hover Edit Buttons for Admin */}
            {isAdmin && (
              <HoverEditButtons
                onEdit={() => openModal(section)}
                onNew={() => openModal(undefined, section.url_page || pathname)}
                position="top-right"
              />
            )}
            
            {/* Background Effects */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 opacity-15">
              <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] bg-gradient-to-tr from-gray-50 via-gray-100/30 to-gray-50" />
            </div>
            <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] opacity-15">
              <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-gray-50 via-gray-100/30 to-gray-50 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
            </div>

            <div className="mx-auto max-w-7xl">
              <div className={`grid grid-cols-1 gap-x-16 gap-y-16 items-center ${hasImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
                
                {/* Text Content */}
                <div className={`${style.image_first ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className={`${!hasImage ? `text-center max-w-4xl mx-auto ${ALIGNMENTS.center}` : ALIGNMENTS[style.alignment]}`}>
                    <h1 
                      className={titleClasses}
                      style={{ color: titleColor }}
                    >
                      {parse(sanitizeHTML(translatedTitle))}
                    </h1>

                    {translatedDescription && (
                      <p 
                        className={`mt-8 ${descClasses} max-w-2xl ${!hasImage ? 'mx-auto' : ''}`}
                        style={{ color: descColor }}
                      >
                        {parse(sanitizeHTML(translatedDescription))}
                      </p>
                    )}

                    {translatedButtonText && content.button?.url && (
                      <div className="mt-10">
                        {content.button.is_text_link ? (
                          <a
                            href={content.button.url}
                            className="inline-flex items-center gap-x-2 text-lg font-medium transition-colors duration-200 group"
                            style={{ color: buttonColor }}
                          >
                            {parse(sanitizeHTML(translatedButtonText))}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        ) : (
                          <a
                            href={content.button.url}
                            className="inline-flex items-center justify-center px-6 py-2 text-sm rounded-lg shadow-lg font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            style={{ 
                              backgroundColor: buttonColor,
                              color: buttonTextColor,
                            }}
                          >
                            {parse(sanitizeHTML(translatedButtonText))}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Content */}
                {hasImage && content.image && (
                  <div className={`${style.image_first ? 'lg:order-1' : 'lg:order-2'} relative`}>
                    {style.image_style === 'default' ? (
                      <div className="relative mx-auto w-full max-w-lg">
                        {/* Default: Static image without animation or effects */}
                        <Image
                          src={content.image}
                          alt={translatedTitle || 'Section image'}
                          width={512}
                          height={512}
                          className="w-full h-auto object-cover rounded-2xl"
                          priority={isPriority}
                          loading={isPriority ? 'eager' : 'lazy'}
                          fetchPriority={isPriority ? 'high' : 'auto'}
                          quality={isPriority ? 85 : 75}
                          sizes="(max-width: 768px) 100vw, 512px"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                        />
                      </div>
                    ) : style.image_style === 'full_width' ? (
                      <div className="relative w-full">
                        {/* Full Width: Cover full column */}
                        <Image
                          src={content.image}
                          alt={translatedTitle || 'Section image'}
                          width={800}
                          height={600}
                          className="w-full h-auto object-cover"
                          priority={isPriority}
                          loading={isPriority ? 'eager' : 'lazy'}
                          fetchPriority={isPriority ? 'high' : 'auto'}
                          quality={isPriority ? 85 : 75}
                          sizes="100vw"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                        />
                      </div>
                    ) : style.image_style === 'circle' ? (
                      <div className="relative mx-auto w-full max-w-lg">
                        {/* Circle: Circular with effects */}
                        <div className={`relative transform ${isPriority ? '' : 'transition-all duration-300 hover:scale-105'}`}>
                          <div className="relative overflow-hidden rounded-full aspect-square">
                            <Image
                              src={content.image}
                              alt={translatedTitle || 'Section image'}
                              fill
                              className={`object-cover ${isPriority ? '' : 'transition-all duration-500 hover:scale-110'}`}
                              priority={isPriority}
                              loading={isPriority ? 'eager' : 'lazy'}
                              fetchPriority={isPriority ? 'high' : 'auto'}
                              quality={isPriority ? 85 : 75}
                              sizes="(max-width: 768px) 100vw, 512px"
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative mx-auto w-full max-w-lg">
                        {/* Contained: Current animated style with effects */}
                        <div className={`relative transform ${isPriority ? '' : 'transition-all duration-300 hover:scale-105'}`}>
                          <div className="relative overflow-hidden rounded-3xl max-h-96">
                            <Image
                              src={content.image}
                              alt={translatedTitle || 'Section image'}
                              width={512}
                              height={384}
                              className={`w-full h-auto object-cover ${isPriority ? '' : 'transition-all duration-500 hover:scale-110'}`}
                              priority={isPriority}
                              loading={isPriority ? 'eager' : 'lazy'}
                              fetchPriority={isPriority ? 'high' : 'auto'}
                              quality={isPriority ? 85 : 75}
                              sizes="(max-width: 768px) 100vw, 512px"
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
        } catch (error) {
          console.error('Error rendering TemplateHeadingSection:', error, section);
          return (
            <div key={section.id} className="p-4 bg-red-100 border border-red-400 text-red-700">
              Error rendering section
            </div>
          );
        }
      })}
    </>
  );
};

export default TemplateHeadingSection;