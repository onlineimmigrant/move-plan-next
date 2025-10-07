'use client';

import React, { useState, useEffect } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { usePathname } from 'next/navigation';
import  Button from '@/ui/Button';
import { useTemplateHeadingSectionEdit } from '@/context/TemplateHeadingSectionEditContext';
import { HoverEditButtons } from '@/ui/Button';
import { isAdminClient } from '@/lib/auth';

interface TemplateHeadingSectionData {
  id: number;
  name: string;
  name_translation?: Record<string, string>;
  name_part_2?: string;
  name_part_3?: string;
  description_text?: string;
  description_text_translation?: Record<string, string>;
  button_text?: string;
  button_text_translation?: Record<string, string>;
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


const TemplateHeadingSection: React.FC<TemplateHeadingSectionProps> = ({ templateSectionHeadings }) => {
  if (!templateSectionHeadings?.length) return null;

  // Admin state and edit context
  const [isAdmin, setIsAdmin] = useState(false);
  const { openModal } = useTemplateHeadingSectionEdit();

  const pathname = usePathname();
  
  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await isAdminClient();
      setIsAdmin(adminStatus);
    };
    checkAdmin();
  }, []);
  
  // Extract locale from pathname (similar to Hero component logic)
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
          const isClean = section.style_variant === 'clean';
          const styleVar = STYLE_VARIANTS[section.style_variant || 'default'];
          const textVar = TEXT_VARIANTS[section.text_style_variant || 'default'];
          const hasImage = !!section.image;
          const isApple = section.text_style_variant === 'apple';
          
          // Get translated content
          const translatedName = currentLocale 
            ? getTranslatedContent(section.name || '', section.name_translation, currentLocale)
            : section.name || '';
          
          const translatedDescription = section.description_text
            ? (currentLocale 
                ? getTranslatedContent(section.description_text, section.description_text_translation, currentLocale)
                : section.description_text
              )
            : '';

          const translatedButtonText = section.button_text
            ? (currentLocale 
                ? getTranslatedContent(section.button_text, section.button_text_translation, currentLocale)
                : section.button_text
              )
            : '';
          
          return (
          <section
            key={section.id}
            className={`relative isolate group ${!isClean ? 'px-6 lg:px-8' : ''} ${styleVar.section} font-sans ${
              isApple ? 'bg-white/95 backdrop-blur-sm' : isClean ? 'bg-transparent' : `bg-${textVar.bg}`
            } overflow-hidden`}
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
                      {parse(sanitizeHTML(translatedName))}{' '}
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

                    {translatedDescription && (
                      <p className={`mt-8 text-lg font-light text-${textVar.text} leading-8 max-w-2xl ${!hasImage ? 'mx-auto' : ''}`}>
                        {parse(sanitizeHTML(translatedDescription))}
                      </p>
                    )}

                    {translatedButtonText && section.url && (
                      <div className="mt-10">
                        {/* Use text link when is_text_link is explicitly true, or when it's undefined (fallback) */}
                        {(section.is_text_link === true || section.is_text_link === undefined) ? (
                          <a
                            href={section.url}
                            className="inline-flex items-center gap-x-2 text-sky-600 hover:text-sky-500 text-lg font-light transition-colors duration-200 group"
                          >
                            {parse(sanitizeHTML(translatedButtonText))}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        ) : (
                          <Button 
                            variant='primary' 

                            onClick={() => window.location.href = section.url || ''}
                          >
                            {parse(sanitizeHTML(translatedButtonText))}
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
        } catch (error) {
          console.error('Error rendering TemplateHeadingSection:', error, section);
          return (
            <div key={section.id} className="p-4 bg-red-100 border border-red-400 text-red-700">
              Error rendering section: {section.name || 'Unknown'}
            </div>
          );
        }
      })}
    </>
  );
};

export default TemplateHeadingSection;