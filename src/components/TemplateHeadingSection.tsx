// src/components/TemplateHeadingSection.tsx
'use client';

import React from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

// Types
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
  style_variant?: 'default' | 'minimal' | 'bold' | 'creative' | 'professional' | 'modern' | 'clean';
  text_style_variant?: 'default' | 'minimal' | 'bold' | 'creative' | 'professional' | 'modern' | 'elegant' | 'compact' | 'apple';
}

interface TemplateHeadingSectionProps {
  templateSectionHeadings: TemplateHeadingSectionData[];
}

// Utility function to get style classes based on variant
const getStyleVariant = (variant: string = 'default') => {
  const variants = {
    default: {
      section: 'py-24 sm:py-32',
      background: 'opacity-30',
      backgroundGradient: 'from-gray-100 to-gray-200',
      imageBackground: 'from-gray-50 to-gray-100',
      imageStyle: 'rounded-2xl transform rotate-2 scale-105 opacity-60',
      imageShadow: 'shadow-xl',
      textHighlight: 'bg-blue-50 transform rotate-1',
      textGradient: 'from-blue-600 to-purple-600'
    },
    minimal: {
      section: 'py-16 sm:py-24',
      background: 'opacity-10',
      backgroundGradient: 'from-gray-50 to-white',
      imageBackground: 'from-white to-gray-25',
      imageStyle: 'rounded-xl opacity-40',
      imageShadow: 'shadow-lg',
      textHighlight: 'bg-gray-100',
      textGradient: 'from-gray-700 to-gray-900'
    },
    bold: {
      section: 'py-32 sm:py-40',
      background: 'opacity-50',
      backgroundGradient: 'from-indigo-200 via-purple-200 to-pink-200',
      imageBackground: 'from-indigo-100 to-purple-100',
      imageStyle: 'rounded-3xl transform -rotate-3 scale-110 opacity-70',
      imageShadow: 'shadow-2xl',
      textHighlight: 'bg-gradient-to-r from-indigo-100 to-purple-100 transform -rotate-2',
      textGradient: 'from-indigo-600 via-purple-600 to-pink-600'
    },
    creative: {
      section: 'py-28 sm:py-36',
      background: 'opacity-40',
      backgroundGradient: 'from-cyan-200 via-blue-200 to-indigo-200',
      imageBackground: 'from-cyan-50 to-blue-100',
      imageStyle: 'rounded-[2rem] transform rotate-6 scale-108 opacity-80',
      imageShadow: 'shadow-2xl',
      textHighlight: 'bg-gradient-to-r from-cyan-100 to-blue-100 transform rotate-3',
      textGradient: 'from-cyan-600 via-blue-600 to-indigo-600'
    },
    professional: {
      section: 'py-20 sm:py-28',
      background: 'opacity-20',
      backgroundGradient: 'from-slate-100 to-gray-100',
      imageBackground: 'from-slate-50 to-gray-50',
      imageStyle: 'rounded-lg opacity-50',
      imageShadow: 'shadow-lg',
      textHighlight: 'bg-slate-100',
      textGradient: 'from-slate-700 to-gray-800'
    },
    modern: {
      section: 'py-24 sm:py-32',
      background: 'opacity-35',
      backgroundGradient: 'from-emerald-200 via-teal-200 to-cyan-200',
      imageBackground: 'from-emerald-100 to-teal-100',
      imageStyle: 'rounded-2xl transform rotate-1 scale-105 opacity-65',
      imageShadow: 'shadow-xl',
      textHighlight: 'bg-gradient-to-r from-emerald-100 to-teal-100 transform -rotate-1',
      textGradient: 'from-emerald-600 via-teal-600 to-cyan-600'
    },
    clean: {
      section: 'py-20 sm:py-24',
      background: 'opacity-0',
      backgroundGradient: 'from-transparent to-transparent',
      imageBackground: 'from-transparent to-transparent',
      imageStyle: 'opacity-0',
      imageShadow: 'shadow-none',
      textHighlight: 'bg-transparent',
      textGradient: 'from-gray-600 to-gray-800'
    }
  };
  
  return variants[variant as keyof typeof variants] || variants.default;
};

// Utility function to get text style classes based on text_style_variant
const getTextStyleVariant = (variant: string = 'default') => {
  const textVariants = {
    default: {
      background_color: 'white',
      font_family: 'font-sans',
      text_color: 'gray-600',
      button_color: 'blue-600',
      button_text_color: 'white',
      text_size_h1: 'text-6xl',
      text_size_h1_mobile: 'text-4xl',
      text_size: 'text-xl',
      font_weight_1: 'font-bold',
      font_weight: 'font-normal',
      h1_text_color: 'gray-900',
      is_text_link: false
    },
    minimal: {
      background_color: 'gray-50',
      font_family: 'font-mono',
      text_color: 'gray-500',
      button_color: 'gray-700',
      button_text_color: 'white',
      text_size_h1: 'text-5xl',
      text_size_h1_mobile: 'text-3xl',
      text_size: 'text-lg',
      font_weight_1: 'font-medium',
      font_weight: 'font-light',
      h1_text_color: 'gray-800',
      is_text_link: true
    },
    bold: {
      background_color: 'indigo-50',
      font_family: 'font-sans',
      text_color: 'indigo-700',
      button_color: 'indigo-600',
      button_text_color: 'white',
      text_size_h1: 'text-7xl',
      text_size_h1_mobile: 'text-5xl',
      text_size: 'text-2xl',
      font_weight_1: 'font-black',
      font_weight: 'font-semibold',
      h1_text_color: 'indigo-900',
      is_text_link: false
    },
    creative: {
      background_color: 'gradient-to-br from-cyan-50 to-blue-50',
      font_family: 'font-serif',
      text_color: 'cyan-700',
      button_color: 'cyan-600',
      button_text_color: 'white',
      text_size_h1: 'text-6xl',
      text_size_h1_mobile: 'text-4xl',
      text_size: 'text-xl',
      font_weight_1: 'font-extrabold',
      font_weight: 'font-medium',
      h1_text_color: 'cyan-900',
      is_text_link: false
    },
    professional: {
      background_color: 'slate-100',
      font_family: 'font-sans',
      text_color: 'slate-700',
      button_color: 'slate-800',
      button_text_color: 'white',
      text_size_h1: 'text-5xl',
      text_size_h1_mobile: 'text-3xl',
      text_size: 'text-lg',
      font_weight_1: 'font-semibold',
      font_weight: 'font-normal',
      h1_text_color: 'slate-900',
      is_text_link: true
    },
    modern: {
      background_color: 'emerald-50',
      font_family: 'font-sans',
      text_color: 'emerald-700',
      button_color: 'emerald-600',
      button_text_color: 'white',
      text_size_h1: 'text-6xl',
      text_size_h1_mobile: 'text-4xl',
      text_size: 'text-xl',
      font_weight_1: 'font-bold',
      font_weight: 'font-medium',
      h1_text_color: 'emerald-900',
      is_text_link: false
    },
    elegant: {
      background_color: 'rose-50',
      font_family: 'font-serif',
      text_color: 'rose-700',
      button_color: 'rose-600',
      button_text_color: 'white',
      text_size_h1: 'text-6xl',
      text_size_h1_mobile: 'text-4xl',
      text_size: 'text-lg',
      font_weight_1: 'font-light',
      font_weight: 'font-light',
      h1_text_color: 'rose-900',
      is_text_link: true
    },
    compact: {
      background_color: 'gray-100',
      font_family: 'font-mono',
      text_color: 'gray-700',
      button_color: 'gray-800',
      button_text_color: 'white',
      text_size_h1: 'text-4xl',
      text_size_h1_mobile: 'text-2xl',
      text_size: 'text-base',
      font_weight_1: 'font-medium',
      font_weight: 'font-normal',
      h1_text_color: 'gray-900',
      is_text_link: true
    },
    apple: {
      background_color: 'white/95',
      font_family: 'font-sans',
      text_color: 'gray-600',
      button_color: 'gradient-to-r from-sky-500 to-blue-500',
      button_text_color: 'white',
      text_size_h1: 'text-6xl',
      text_size_h1_mobile: 'text-4xl',
      text_size: 'text-lg',
      font_weight_1: 'font-light',
      font_weight: 'font-normal',
      h1_text_color: 'gray-900',
      is_text_link: false
    }
  };
  
  return textVariants[variant as keyof typeof textVariants] || textVariants.default;
};


const TemplateHeadingSection: React.FC<TemplateHeadingSectionProps> = ({ templateSectionHeadings }) => {
  if (!templateSectionHeadings || templateSectionHeadings.length === 0) {
    return null;
  }

  // Sanitize HTML content to remove problematic characters and tags
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'class', 'style'],
      FORBID_TAGS: ['iframe'],
    });
  };

  return (
    <>
      {templateSectionHeadings.map((sectionHeading) => {
        const styleVariant = getStyleVariant(sectionHeading.style_variant);
        const textStyleVariant = getTextStyleVariant(sectionHeading.text_style_variant);
        
        // Debug logging to check if style_variant is being passed correctly
        console.log('TemplateHeadingSection Debug:', {
          id: sectionHeading.id,
          style_variant: sectionHeading.style_variant,
          text_style_variant: sectionHeading.text_style_variant,
          calculatedVariant: styleVariant,
          textStyleVariant: textStyleVariant,
          section: styleVariant.section,
          backgroundGradient: styleVariant.backgroundGradient
        });
        
        return (
        <section
          key={sectionHeading.id}
          className={`relative isolate px-6 lg:px-8 ${styleVariant.section} ${textStyleVariant.font_family} ${
            textStyleVariant.background_color === 'white/95'
              ? 'bg-white/95 backdrop-blur-sm'
              : textStyleVariant.background_color.startsWith('gradient-')
                ? `bg-${textStyleVariant.background_color}`
                : `bg-${textStyleVariant.background_color}`
          } overflow-hidden`}
          style={{
            // Force inline styles for debugging
            paddingTop: sectionHeading.style_variant === 'bold' ? '8rem' : 
                       sectionHeading.style_variant === 'minimal' ? '4rem' : '6rem',
            paddingBottom: sectionHeading.style_variant === 'bold' ? '10rem' : 
                          sectionHeading.style_variant === 'minimal' ? '6rem' : '8rem'
          }}
        >
          {/* Dynamic background gradient effect */}
          <div
            className={`absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80`}
            style={{
              opacity: sectionHeading.style_variant === 'bold' ? 0.5 :
                      sectionHeading.style_variant === 'minimal' ? 0.1 :
                      sectionHeading.style_variant === 'creative' ? 0.4 :
                      sectionHeading.style_variant === 'professional' ? 0.2 :
                      sectionHeading.style_variant === 'modern' ? 0.35 : 0.3
            }}
            aria-hidden="true"
          >
            <div
              className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]`}
              style={{
                background: sectionHeading.style_variant === 'bold' 
                  ? 'linear-gradient(to top right, rgb(199 210 254), rgb(221 214 254), rgb(251 207 232))'
                  : sectionHeading.style_variant === 'creative'
                    ? 'linear-gradient(to top right, rgb(165 243 252), rgb(191 219 254), rgb(199 210 254))'
                    : sectionHeading.style_variant === 'modern'
                      ? 'linear-gradient(to top right, rgb(167 243 208), rgb(153 246 228), rgb(165 243 252))'
                      : sectionHeading.style_variant === 'professional'
                        ? 'linear-gradient(to top right, rgb(241 245 249), rgb(243 244 246))'
                        : sectionHeading.style_variant === 'minimal'
                          ? 'linear-gradient(to top right, rgb(249 250 251), rgb(255 255 255))'
                          : 'linear-gradient(to top right, rgb(243 244 246), rgb(229 231 235))'
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl">
            <div className={`grid grid-cols-1 gap-x-16 gap-y-16 items-center ${sectionHeading.image ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
              
              {/* Text Content */}
              <div className={`${sectionHeading.image_first ? 'lg:order-2' : 'lg:order-1'} ${!sectionHeading.image ? 'text-center max-w-4xl mx-auto' : ''}`}>
                <h1
                  className={`${textStyleVariant.font_weight_1} ${textStyleVariant.text_size_h1_mobile} sm:${textStyleVariant.text_size_h1} lg:text-7xl tracking-tight text-${textStyleVariant.h1_text_color} leading-tight`}
                >
                  {parse(sanitizeHTML(sectionHeading.name || ''))}{' '}
                  {sectionHeading.name_part_2 && (
                    <span className="relative inline-block">
                      <span 
                        className="relative z-10 bg-clip-text text-transparent"
                        style={{
                          background: sectionHeading.style_variant === 'bold'
                            ? 'linear-gradient(to right, rgb(79 70 229), rgb(139 92 246), rgb(219 39 119))'
                            : sectionHeading.style_variant === 'creative'
                              ? 'linear-gradient(to right, rgb(8 145 178), rgb(37 99 235), rgb(79 70 229))'
                              : sectionHeading.style_variant === 'modern'
                                ? 'linear-gradient(to right, rgb(5 150 105), rgb(20 184 166), rgb(8 145 178))'
                                : sectionHeading.style_variant === 'professional'
                                  ? 'linear-gradient(to right, rgb(51 65 85), rgb(75 85 99))'
                                  : sectionHeading.style_variant === 'minimal'
                                    ? 'linear-gradient(to right, rgb(55 65 81), rgb(17 24 39))'
                                    : 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text'
                        }}
                      >
                        {parse(sanitizeHTML(sectionHeading.name_part_2))}
                      </span>
                      <span 
                        className="absolute inset-0 -z-10 rounded-lg px-1 py-0.5"
                        style={{
                          background: sectionHeading.style_variant === 'bold'
                            ? 'rgb(238 242 255)'
                            : sectionHeading.style_variant === 'creative'
                              ? 'rgb(240 249 255)'
                              : sectionHeading.style_variant === 'modern'
                                ? 'rgb(236 253 245)'
                                : sectionHeading.style_variant === 'professional'
                                  ? 'rgb(248 250 252)'
                                  : sectionHeading.style_variant === 'minimal'
                                    ? 'rgb(243 244 246)'
                                    : 'rgb(239 246 255)',
                          transform: sectionHeading.style_variant === 'bold' ? 'rotate(-2deg)' :
                                   sectionHeading.style_variant === 'creative' ? 'rotate(3deg)' :
                                   sectionHeading.style_variant === 'modern' ? 'rotate(-1deg)' : 'rotate(1deg)'
                        }}
                      ></span>
                    </span>
                  )}{' '}
                  {sectionHeading.name_part_3 && parse(sanitizeHTML(sectionHeading.name_part_3))}
                </h1>

                {sectionHeading.description_text && (
                  <p
                    className={`mt-8 ${textStyleVariant.text_size} ${textStyleVariant.font_weight} text-${textStyleVariant.text_color} leading-8 max-w-2xl ${!sectionHeading.image ? 'mx-auto' : ''}`}
                  >
                    {parse(sanitizeHTML(sectionHeading.description_text))}
                  </p>
                )}

                {sectionHeading.button_text && sectionHeading.url && (
                  <div className="mt-10">
                    {textStyleVariant.is_text_link ? (
                      <a
                        href={sectionHeading.url}
                        className={`inline-flex items-center gap-x-2 ${styleVariant.textGradient.includes('gray') ? 'text-gray-700 hover:text-gray-600' : `text-${textStyleVariant.button_color} hover:text-${textStyleVariant.button_color}/80`} ${textStyleVariant.text_size} ${textStyleVariant.font_weight} transition-colors duration-200 group`}
                      >
                        {parse(sanitizeHTML(sectionHeading.button_text))}
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </a>
                    ) : (
                      <a
                        href={sectionHeading.url}
                        className={`inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold ${styleVariant.imageShadow} transition-all duration-200 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          textStyleVariant.button_color.startsWith('gradient-')
                            ? `bg-${textStyleVariant.button_color} text-${textStyleVariant.button_text_color} hover:shadow-2xl hover:shadow-sky-500/25 focus:ring-sky-500`
                            : `bg-${textStyleVariant.button_color} text-${textStyleVariant.button_text_color} hover:bg-${textStyleVariant.button_color}/90 focus:ring-${textStyleVariant.button_color}`
                        }`}
                      >
                        {parse(sanitizeHTML(sectionHeading.button_text))}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Image Content */}
              {sectionHeading.image && (
                <div className={`${sectionHeading.image_first ? 'lg:order-1' : 'lg:order-2'} relative`}>
                  <div className="relative mx-auto w-full max-w-lg">
                    {/* Dynamic background effect based on style variant - hidden for clean */}
                    {sectionHeading.style_variant !== 'clean' && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${styleVariant.imageBackground} ${styleVariant.imageStyle}`}></div>
                    )}
                    
                    {/* Main image container with variant-specific styling */}
                    <div className={`relative transform transition-all duration-300 ${
                      sectionHeading.style_variant === 'clean' ? '' :
                      sectionHeading.style_variant === 'bold' ? 'hover:scale-110 hover:-rotate-1' : 
                      sectionHeading.style_variant === 'creative' ? 'hover:scale-105 hover:rotate-3' : 'hover:scale-105'
                    }`}>
                      {/* Image wrapper */}
                      <div className={`relative overflow-hidden ${
                        sectionHeading.style_variant === 'clean' ? '' :
                        styleVariant.imageStyle.includes('rounded-3xl') ? 'rounded-3xl' : 
                        styleVariant.imageStyle.includes('rounded-xl') ? 'rounded-xl' : 
                        styleVariant.imageStyle.includes('rounded-lg') ? 'rounded-lg' : 'rounded-2xl'
                      } ${sectionHeading.style_variant === 'clean' ? '' : styleVariant.imageShadow} ${
                        sectionHeading.style_variant === 'clean' ? '' : 'ring-1 ring-gray-200/50'
                      }`}>
                        {/* Main image */}
                        <img
                          className={`w-full h-auto object-cover ${
                            sectionHeading.style_variant === 'clean' ? '' :
                            sectionHeading.style_variant === 'creative' ? 'transition-all duration-500 hover:scale-115' : 'transition-all duration-500 hover:scale-110'
                          }`}
                          src={sectionHeading.image}
                          alt={sectionHeading.name || 'Section image'}
                          loading="lazy"
                        />
                        
                        {/* Dynamic overlay based on variant - hidden for clean */}
                        {sectionHeading.style_variant !== 'clean' && (
                          <div className={`absolute inset-0 ${
                            sectionHeading.style_variant === 'bold' 
                              ? 'bg-gradient-to-tr from-indigo-600/10 via-purple-600/5 to-pink-600/10'
                              : sectionHeading.style_variant === 'creative'
                                ? 'bg-gradient-to-br from-cyan-600/10 via-blue-600/5 to-indigo-600/10'
                                : sectionHeading.style_variant === 'modern'
                                  ? 'bg-gradient-to-tl from-emerald-600/10 via-teal-600/5 to-cyan-600/10'
                                  : sectionHeading.style_variant === 'professional'
                                    ? 'bg-gradient-to-tr from-slate-600/5 via-gray-600/3 to-slate-600/8'
                                    : sectionHeading.style_variant === 'minimal'
                                      ? 'bg-gradient-to-tr from-gray-600/3 via-transparent to-gray-600/5'
                                      : 'bg-gradient-to-tr from-black/5 via-transparent to-white/10'
                          }`}></div>
                        )}
                        
                        {/* Optional decorative elements for creative/bold variants - hidden for clean */}
                        {(sectionHeading.style_variant === 'creative' || sectionHeading.style_variant === 'bold') && (
                          <>
                            <div className={`absolute -top-2 -right-2 w-4 h-4 ${sectionHeading.style_variant === 'bold' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-cyan-400 to-blue-500'} rounded-full opacity-60 animate-pulse`}></div>
                            <div className={`absolute -bottom-3 -left-3 w-3 h-3 ${sectionHeading.style_variant === 'bold' ? 'bg-gradient-to-br from-purple-400 to-pink-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} rounded-full opacity-50 animate-bounce`} style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic bottom gradient effect */}
          <div
            className={`absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] ${styleVariant.background}`}
            aria-hidden="true"
          >
            <div
              className={`relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr ${styleVariant.backgroundGradient} sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]`}
            />
          </div>
        </section>
        );
      })}
    </>
  );
};

export default TemplateHeadingSection;