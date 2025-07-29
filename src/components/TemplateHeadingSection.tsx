'use client';

import React from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import  Button from '@/ui/Button';

interface TemplateHeadingSectionData {
  id: number;
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text?: string;
  button_text?: string;
  url_page?: string;
  url?: string;
  image?: string;
  image_first?: boolean;
  is_included_templatesection?: boolean;
  style_variant?: 'default' | 'clean';
  text_style_variant?: 'default' | 'apple';
  is_text_link?: boolean;
}

interface TemplateHeadingSectionProps {
  templateSectionHeadings: TemplateHeadingSectionData[];
}

const STYLE_VARIANTS = {
  default: { section: 'py-28 sm:py-36', bg: 'opacity-15', bgGrad: 'from-gray-50 via-gray-100/30 to-gray-50' },
  clean: { section: 'py-0', bg: 'opacity-0', bgGrad: 'from-transparent to-transparent' }
};

const TEXT_VARIANTS = {
  default: {
    bg: 'gradient-to-br from-white via-gray-50/30 to-white',
    text: 'gray-700', btn: 'gradient-to-r from-emerald-400 to-teal-500', h1: 'text-3xl sm:text-5xl lg:text-7xl font-normal', color: 'gray-800',
    is_text_link: false
  },
  apple: {
    bg: 'white/95',
    text: 'gray-600', btn: 'gradient-to-r from-sky-500 to-blue-500', h1: 'text-4xl sm:text-6xl lg:text-7xl font-light', color: 'gray-900',
    is_text_link: false
  }
};


const TemplateHeadingSection: React.FC<TemplateHeadingSectionProps> = ({ templateSectionHeadings }) => {
  if (!templateSectionHeadings?.length) return null;

  const sanitizeHTML = (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style'], FORBID_TAGS: ['iframe']
  });

  return (
    <>
      {templateSectionHeadings.map((section) => {
        const isClean = section.style_variant === 'clean';
        const styleVar = STYLE_VARIANTS[section.style_variant || 'default'];
        const textVar = TEXT_VARIANTS[section.text_style_variant || 'default'];
        const hasImage = !!section.image;
        const isApple = section.text_style_variant === 'apple';
        
        return (
          <section
            key={section.id}
            className={`relative isolate ${!isClean ? 'px-6 lg:px-8' : ''} ${styleVar.section} font-sans ${
              isApple ? 'bg-white/95 backdrop-blur-sm' : isClean ? 'bg-transparent' : `bg-${textVar.bg}`
            } overflow-hidden`}
          >
            {/* Background Effects */}
            {!isClean && (
              <>
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 opacity-15">
                  <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] bg-gradient-to-tr from-gray-50 via-gray-100/30 to-gray-50" />
                </div>
                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] opacity-15">
                  <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-gray-50 via-gray-100/30 to-gray-50 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
                </div>
              </>
            )}

            <div className={isClean ? 'w-full' : 'mx-auto max-w-7xl'}>
              <div className={`grid grid-cols-1 ${isClean ? 'min-h-screen' : 'gap-x-16 gap-y-16'} items-center ${hasImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
                
                {/* Text Content */}
                <div className={`${section.image_first ? 'lg:order-2' : 'lg:order-1'} ${isClean && hasImage ? 'flex items-center justify-center min-h-screen' : ''}`}>
                  <div className={`${
                    isClean && hasImage ? 'w-full max-w-2xl px-8 py-8 sm:py-16 lg:py-0' : 
                    !hasImage ? 'text-center max-w-4xl mx-auto' : 'w-full'
                  }`}>
                    <h1 className={`${textVar.h1} tracking-tight text-${textVar.color} leading-tight`}>
                      {parse(sanitizeHTML(section.name || ''))}{' '}
                      {section.name_part_2 && (
                        <span className="relative inline-block">
                          <span className="relative z-10 bg-clip-text text-transparent" style={{
                            background: isClean ? 'transparent' : 'linear-gradient(to right, rgb(75 85 99), rgb(55 65 81), rgb(31 41 55))',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text'
                          }}>
                            {parse(sanitizeHTML(section.name_part_2))}
                          </span>
                          {!isClean && (
                            <span className="absolute inset-0 -z-10 rounded-lg px-1 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100 transform rotate-0.5" />
                          )}
                        </span>
                      )}{' '}
                      {section.name_part_3 && parse(sanitizeHTML(section.name_part_3))}
                    </h1>

                    {section.description_text && (
                      <p className={`mt-8 text-lg font-light text-${textVar.text} leading-8 max-w-2xl ${!hasImage ? 'mx-auto' : ''}`}>
                        {parse(sanitizeHTML(section.description_text))}
                      </p>
                    )}

                    {section.button_text && section.url && (
                      <div className="mt-10">
                        {/* Use text link when is_text_link is explicitly true, or when it's undefined (fallback) */}
                        {(section.is_text_link === true || section.is_text_link === undefined) ? (
                          <a
                            href={section.url}
                            className="inline-flex items-center gap-x-2 text-sky-600 hover:text-sky-500 text-lg font-light transition-colors duration-200 group"
                          >
                            {parse(sanitizeHTML(section.button_text))}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        ) : (
                          <Button 
                            variant='primary' 

                            onClick={() => window.location.href = section.url || ''}
                          >
                            {parse(sanitizeHTML(section.button_text))}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Content */}
                {hasImage && (
                  <div className={`${section.image_first ? 'lg:order-1' : 'lg:order-2'} ${isClean ? 'relative h-screen' : 'relative'}`}>
                    <div className={isClean ? 'relative w-full h-full' : 'relative mx-auto w-full max-w-lg'}>
                      <div className={`relative transform transition-all duration-300 ${isClean ? 'h-full' : 'hover:scale-105'}`}>
                        <div className={`relative overflow-hidden ${isClean ? 'h-full' : 'rounded-3xl'}`}>
                          <img
                            className={`${isClean ? 'w-full h-full object-cover' : 'w-full h-auto object-cover transition-all duration-500 hover:scale-110'}`}
                            src={section.image} alt={section.name || 'Section image'} loading="lazy"
                          />
                          {!isClean && <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 via-gray-400/2 to-gray-600/5" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
};

export default TemplateHeadingSection;