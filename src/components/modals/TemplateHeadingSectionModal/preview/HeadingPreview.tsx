/**
 * HeadingPreview Component
 * 
 * Preview for the Template Heading Section (simplified version for modal)
 */

import React, { useMemo } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { HeadingFormData, TEXT_VARIANTS } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { getBackgroundStyle } from '@/utils/gradientHelper';

interface HeadingPreviewProps {
  formData: HeadingFormData;
  onDoubleClickTitle?: (e: React.MouseEvent) => void;
  onDoubleClickDescription?: (e: React.MouseEvent) => void;
}

export function HeadingPreview({ formData, onDoubleClickTitle, onDoubleClickDescription }: HeadingPreviewProps) {
  const textVar = TEXT_VARIANTS[formData.text_style_variant || 'default'];
  const hasImage = !!formData.image;

  const sanitizeHTML = (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style'], FORBID_TAGS: ['iframe']
  });

  // Background style
  const headingBackgroundStyle = useMemo(() => {
    return getBackgroundStyle(
      formData.is_gradient,
      formData.gradient,
      formData.background_color || 'white'
    );
  }, [formData.is_gradient, formData.gradient, formData.background_color]);

  // Title alignment class
  const titleAlignmentClass = formData.title_alignment === 'center' 
    ? 'text-center mx-auto' 
    : formData.title_alignment === 'right'
    ? 'text-right ml-auto'
    : 'text-left';

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
            <div className={`${!hasImage ? 'text-center max-w-4xl mx-auto' : 'w-full'}`}>
              <h1
                className={`${textVar.h1} tracking-tight leading-tight ${titleAlignmentClass}`}
                onDoubleClick={onDoubleClickTitle}
                style={{ cursor: onDoubleClickTitle ? 'text' : 'default' }}
              >
                {parse(sanitizeHTML(formData.name))}{' '}
                {formData.name_part_2 && (
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-clip-text text-transparent" style={{
                      background: 'linear-gradient(to right, rgb(75 85 99), rgb(55 65 81), rgb(31 41 55))',
                      WebkitBackgroundClip: 'text', backgroundClip: 'text'
                    }}>
                      {parse(sanitizeHTML(formData.name_part_2))}
                    </span>
                    <span className="absolute inset-0 -z-10 rounded-lg px-1 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100 transform rotate-0.5" />
                  </span>
                )}{' '}
                {formData.name_part_3 && parse(sanitizeHTML(formData.name_part_3))}
              </h1>

              {formData.description_text && (
                <p
                  className={`mt-8 ${textVar.description} leading-8 max-w-2xl ${!hasImage ? 'mx-auto' : ''} ${titleAlignmentClass}`}
                  onDoubleClick={onDoubleClickDescription}
                  style={{ cursor: onDoubleClickDescription ? 'text' : 'default' }}
                >
                  {parse(sanitizeHTML(formData.description_text))}
                </p>
              )}

              {formData.button_text && (formData.url || formData.url_page) && (
                <div className={`mt-10 ${titleAlignmentClass}`}>
                  {formData.is_text_link ? (
                    <a
                      href="#"
                      className={`inline-flex items-center gap-x-2 text-lg font-light transition-colors duration-200 group ${textVar.linkColor}`}
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
                      className={`inline-flex items-center justify-center px-6 py-2 text-sm text-white rounded-lg shadow-lg font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${textVar.button}`}
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
            <div className={`${formData.image_first ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="relative mx-auto w-full max-w-lg">
                <div className="relative transform transition-all duration-300 hover:scale-105">
                  <div className="relative overflow-hidden rounded-3xl">
                    <img
                      className="w-full h-auto object-cover transition-all duration-500 hover:scale-110"
                      src={formData.image}
                      alt={formData.name || 'Section image'}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
