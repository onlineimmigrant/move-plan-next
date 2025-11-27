/**
 * HeadingPreview Component
 * 
 * Preview for the Template Heading Section (simplified version for modal)
 */

import React, { useMemo } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { HeadingFormData } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { getBackgroundStyle } from '@/utils/gradientHelper';

interface HeadingPreviewProps {
  formData: HeadingFormData;
  onDoubleClickTitle?: (e: React.MouseEvent) => void;
  onDoubleClickDescription?: (e: React.MouseEvent) => void;
}

// Font mappings
const FONT_FAMILIES = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  display: 'font-display',
};

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

const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const ALIGNMENTS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function HeadingPreview({ formData, onDoubleClickTitle, onDoubleClickDescription }: HeadingPreviewProps) {
  const hasImage = !!formData.image;

  const sanitizeHTML = (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style'], FORBID_TAGS: ['iframe']
  });

  // Background style
  const headingBackgroundStyle = useMemo(() => {
    if (formData.gradient_enabled) {
      return getBackgroundStyle(true, formData.gradient_config, formData.background_color);
    }
    return { backgroundColor: formData.background_color };
  }, [formData.gradient_enabled, formData.gradient_config, formData.background_color]);

  // Build classes
  const titleClasses = [
    TITLE_SIZES[formData.title_size],
    FONT_FAMILIES[formData.title_font],
    FONT_WEIGHTS[formData.title_weight],
    'tracking-tight leading-tight',
  ].join(' ');

  const descClasses = [
    DESC_SIZES[formData.description_size],
    FONT_FAMILIES[formData.description_font],
    FONT_WEIGHTS[formData.description_weight],
    'leading-8',
  ].join(' ');

  const alignmentClass = ALIGNMENTS[formData.alignment];
  const titleColor = formData.title_color ? getColorValue(formData.title_color) : 'rgb(31 41 55)';
  const descColor = formData.description_color ? getColorValue(formData.description_color) : 'rgb(55 65 81)';
  const buttonColor = formData.button_color ? getColorValue(formData.button_color) : 'rgb(16 185 129)';
  const buttonTextColor = formData.button_text_color ? getColorValue(formData.button_text_color) : 'white';

  return (
    <section
      className="relative isolate group px-6 lg:px-8 py-28 sm:py-36 font-sans overflow-hidden"
      style={headingBackgroundStyle}
    >
      {/* Background Effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 opacity-15">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] bg-gradient-to-tr from-gray-50 via-gray-100/30 to-gray-50" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className={`grid grid-cols-1 gap-x-16 gap-y-16 items-center ${hasImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          
          {/* Text Content */}
          <div className={`${formData.image_first ? 'lg:order-2' : 'lg:order-1'}`}>
            <div className={`${!hasImage ? `text-center max-w-4xl mx-auto ${ALIGNMENTS.center}` : alignmentClass}`}>
              <h1
                className={titleClasses}
                style={{ color: titleColor }}
                onDoubleClick={onDoubleClickTitle}
              >
                {parse(sanitizeHTML(formData.title))}
              </h1>

              {formData.description && (
                <p
                  className={`mt-8 ${descClasses} max-w-2xl ${!hasImage ? 'mx-auto' : ''}`}
                  style={{ color: descColor }}
                  onDoubleClick={onDoubleClickDescription}
                >
                  {parse(sanitizeHTML(formData.description))}
                </p>
              )}

              {formData.button_text && formData.button_url && (
                <div className={`mt-10 ${alignmentClass}`}>
                  {formData.button_is_text_link ? (
                    <a
                      href="#"
                      className="inline-flex items-center gap-x-2 text-lg font-medium transition-colors duration-200 group"
                      style={{ color: buttonColor }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {parse(sanitizeHTML(formData.button_text))}
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  ) : (
                    <a
                      href="#"
                      className="inline-flex items-center justify-center px-6 py-2 text-sm rounded-lg shadow-lg font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                      style={{
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {parse(sanitizeHTML(formData.button_text))}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Image Content */}
          {hasImage && (
            <div className={`${formData.image_first ? 'lg:order-1' : 'lg:order-2'} relative`}>
              {formData.image_style === 'default' ? (
                <div className="relative mx-auto w-full max-w-lg">
                  {/* Default: Static image without animation or effects */}
                  <img
                    className="w-full h-auto object-cover rounded-2xl"
                    src={formData.image}
                    alt="Section preview"
                    loading="lazy"
                  />
                </div>
              ) : formData.image_style === 'full_width' ? (
                <div className="relative w-full">
                  {/* Full Width: Cover full column */}
                  <img
                    className="w-full h-auto object-cover"
                    src={formData.image}
                    alt="Section preview"
                    loading="lazy"
                  />
                </div>
              ) : formData.image_style === 'circle' ? (
                <div className="relative mx-auto w-full max-w-lg">
                  {/* Circle: Circular with effects */}
                  <div className="relative transform transition-all duration-300 hover:scale-105">
                    <div className="relative overflow-hidden rounded-full aspect-square">
                      <img
                        className="w-full h-full object-cover transition-all duration-500 hover:scale-110"
                        src={formData.image}
                        alt="Section preview"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto w-full max-w-lg">
                  {/* Contained: Current animated style with effects */}
                  <div className="relative transform transition-all duration-300 hover:scale-105">
                    <div className="relative overflow-hidden rounded-3xl">
                      <img
                        className="w-full h-auto object-cover transition-all duration-500 hover:scale-110 max-h-96"
                        src={formData.image}
                        alt="Section preview"
                        loading="lazy"
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
}
