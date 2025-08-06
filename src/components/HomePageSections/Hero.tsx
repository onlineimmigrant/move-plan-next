'use client'; // Ensure client-side rendering for hooks

import React, { useEffect, useRef, useState, useMemo } from 'react';
import parse from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import DotGrid from '@/components/AnimateElements/DotGrid';
import LetterGlitch from '@/components/AnimateElements/LetterGlitch';
import MagicBento from '@/components/AnimateElements/MagicBento';

interface HeroProps {
  hero: {
    h1_title: string;
    h1_title_translation?: Record<string, string>; // JSONB field for translations
    h1_text_color: string;
    p_description: string;
    p_description_translation?: Record<string, string>; // JSONB field for translations
    p_description_color: string;
    background_color: string;
    h1_text_size: string;
    h1_text_size_mobile: string;
    p_description_size: string;
    p_description_size_mobile: string;
    title_alighnement: string;
    title_block_width: string;
    title_block_columns: number;
    p_description_weight: string;
    is_h1_gradient_text: boolean;
    is_bg_gradient: boolean;
    is_image_full_page: boolean;
    is_seo_title: boolean;
    image_first: boolean;
    organization_id: string;
    image?: string;
    seo_title?: string;
  };
}

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
  // If no locale, return default content
  if (!locale) {
    console.log('Translation: No locale provided, using default content');
    return defaultContent;
  }

  // If no translations object exists, return default content
  if (!translations) {
    console.log('Translation: No translations available, using default content');
    return defaultContent;
  }

  // Try to get translation for the current locale
  const translatedContent = translations[locale];
  
  // If translation exists and is not empty, use it
  if (translatedContent && translatedContent.trim() !== '') {
    console.log(`Translation: Found translation for locale '${locale}', using translated content`);
    return translatedContent;
  }

  // If no translation for current locale, return the original default content
  // (NOT English translation, but the actual default field value)
  console.log(`Translation: No translation found for locale '${locale}', using default content`);
  return defaultContent;
};

const Hero: React.FC<HeroProps> = ({ hero }) => {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  if (!hero) return null;

  // Extract locale from pathname (e.g., /en/page -> en)
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  const pathLocale = pathSegments[0];
  
  // List of supported locales
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
  
  // Determine the current locale
  // Only consider it a locale if it's exactly 2 characters AND in our supported list
  const currentLocale = (pathLocale && pathLocale.length === 2 && supportedLocales.includes(pathLocale)) 
    ? pathLocale 
    : null;

  // Get content - if no locale, use default fields directly
  const translatedH1Title = currentLocale 
    ? getTranslatedContent(hero.h1_title, hero.h1_title_translation, currentLocale)
    : hero.h1_title; // Direct default field

  const translatedPDescription = currentLocale
    ? getTranslatedContent(hero.p_description, hero.p_description_translation, currentLocale)
    : hero.p_description; // Direct default field

  console.log('=== HERO TRANSLATION DETAILED DEBUG ===');
  console.log('Raw pathname:', pathname);
  console.log('Path segments:', pathSegments);
  console.log('First segment (potential locale):', pathLocale);
  console.log('Supported locales:', ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh']);
  console.log('Is valid locale?', pathLocale && pathLocale.length === 2 && ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'].includes(pathLocale));
  console.log('Final currentLocale:', currentLocale);
  console.log('Using translation system:', !!currentLocale);
  console.log('---');
  console.log('H1 Title - Default field:', hero.h1_title);
  console.log('H1 Title - Translation object:', hero.h1_title_translation);
  console.log('H1 Title - Final result:', translatedH1Title);
  console.log('H1 Title - Are they equal?', hero.h1_title === translatedH1Title);
  console.log('---');
  console.log('P Description - Default field:', hero.p_description);
  console.log('P Description - Translation object:', hero.p_description_translation);
  console.log('P Description - Final result:', translatedPDescription);
  console.log('P Description - Are they equal?', hero.p_description === translatedPDescription);
  console.log('=== END DEBUG ===');

  useEffect(() => {
    const currentRef = heroRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        console.log('Hero visibility:', visible);
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const textColorClass = useMemo(() => (
    hero.is_h1_gradient_text
      ? `text-${hero.h1_text_color || 'gray-700'}` // Use solid color fallback since gradient fields don't exist
      : `text-${hero.h1_text_color || 'gray-700'}`
  ), [hero.is_h1_gradient_text, hero.h1_text_color]);

  const backgroundClass = useMemo(() => (
    hero.is_bg_gradient
      ? `bg-${hero.background_color || 'transparent'} hover:bg-sky-50` // Use solid color fallback since gradient fields don't exist
      : `bg-${hero.background_color || 'transparent'} hover:bg-sky-50`
  ), [hero.is_bg_gradient, hero.background_color]);

  const GetstartedBackgroundColorClass = useMemo(() => (
    hero.is_h1_gradient_text
      ? `bg-${hero.h1_text_color || 'gray-700'}` // Use solid color fallback since gradient fields don't exist
      : `bg-${hero.h1_text_color || 'gray-700'}`
  ), [hero.is_h1_gradient_text, hero.h1_text_color]);

  const h1TextSize = useMemo(() => (
    `sm:${hero.h1_text_size || 'text-7xl'} md:${hero.h1_text_size || 'text-7xl'} lg:${hero.h1_text_size || 'text-7xl'} ${hero.h1_text_size_mobile || 'text-5xl'}`
  ), [hero.h1_text_size, hero.h1_text_size_mobile]);

  return (
    <div
      ref={heroRef}
      className={`pt-16 min-h-screen relative isolate px-6 lg:px-8 ${backgroundClass} flex items-center justify-center`}
    >
            {/* Background animation - simplified since animation_element field doesn't exist */}
      <div className="absolute inset-0 -z-20">
        <DotGrid
          dotSize={40}
          gap={200}
          baseColor="#f8fafc"
          activeColor="#f1f5f9"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
        />
      </div>

      {hero.is_bg_gradient && (
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 text-sky-500"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>
      )}

      {hero.image && hero.is_image_full_page && (
        <Image
          src={hero.image}
          alt={`Image of ${translatedH1Title}`}
          className="absolute inset-0 -z-10 h-auto w-auto object-contain sm:h-auto sm:w-auto sm:object-contain"
          width={1280}
          height={720}
          priority={true}
        />
      )}

      <div
        className={`mx-auto max-w-${hero.title_block_width || '2xl'} text-${
          hero.title_alighnement || 'center'
        } items-center grid grid-cols-1 gap-x-12 gap-y-24 sm:grid-cols-${hero.title_block_columns || 1}`}
      >
        <div className={hero.image_first ? 'order-2' : ''}>
          {hero.is_seo_title && (
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 hover:text-gray-500 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                {hero.seo_title}
                <Link
                  href="/blog"
                  aria-label={`Explore ${hero.seo_title}`}
                  className="ml-2 flex items-center transition-all duration-300 group font-semibold text-gray-700 hover:text-gray-300"
                >
                  Explore
                  <RightArrowDynamic />
                </Link>
              </div>
            </div>
          )}

          <div className={`text-${hero.title_alighnement || 'center'}`}>
            <h1
              className={`${h1TextSize} font-bold tracking-tight inline hover:text-gray-700 ${textColorClass} animate-hero-title ${isVisible ? 'animate' : ''}`}
            >
              {parse(translatedH1Title)}
            </h1>

            <p
              className={`mt-6 tracking-wide ${hero.p_description_size_mobile || 'text-lg'} sm:${hero.p_description_size || 'text-2xl'} text-${
                hero.p_description_color || 'gray-600'
              } hover:text-gray-900 animate-hero-description ${isVisible ? 'animate' : ''}`}
              style={{ fontWeight: hero.p_description_weight || 'normal' }}
            >
              {parse(translatedPDescription)}
            </p>

            <div
              className={`mt-10 flex items-center justify-${hero.title_alighnement || 'center'} gap-x-6`}
            >
              <Link
                href='/products'
                className={`rounded-full ${GetstartedBackgroundColorClass} hover:bg-sky-500 py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80 animate-hero-button-get-started ${isVisible ? 'animate' : ''}`}
              >
                Get Started
              </Link>
    
            </div>
          </div>
        </div>
        <div className="order-1">
          {hero.image && !hero.is_image_full_page && (
            <div className={`text-${hero.title_alighnement || 'center'}`}>
              <Image
                src={hero.image}
                alt={`Image of ${translatedH1Title}`}
                className="h-full w-full object-cover sm:h-auto sm:w-full sm:max-w-[80%] sm:mx-auto sm:object-contain"
                width={1024}
                height={576}
                priority={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes hero-title {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-hero-title.animate {
          animation: hero-title 1.5s ease-in-out forwards;
        }

        @keyframes hero-description {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-hero-description.animate {
          animation: hero-description 1.5s ease-in-out 0.5s forwards;
        }

        @keyframes hero-button-get-started {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-hero-button-get-started.animate {
          animation: hero-button-get-started 1.2s ease-in-out 0.8s forwards;
        }

        @keyframes hero-button-explore {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-hero-button-explore.animate {
          animation: hero-button-explore 1.2s ease-in-out 1.0s forwards;
        }

        .animate-hero-title,
        .animate-hero-description,
        .animate-hero-button-get-started,
        .animate-hero-button-explore {
          opacity: 0;
          transform: translateY(20px);
        }
        .animate-hero-button-get-started {
          transform: scale(0.8);
        }
        .animate-hero-button-explore {
          transform: translateX(-10px);
        }

        /* Wave animation for LetterGlitch */
        @keyframes wave {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .letter-glitch-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Hero;