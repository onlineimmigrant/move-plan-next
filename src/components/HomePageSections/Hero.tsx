'use client'; // Ensure client-side rendering for hooks

import React, { useEffect, useRef, useState, useMemo } from 'react';
import parse from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaPlayCircle } from 'react-icons/fa';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import DotGrid from '@/components/AnimateElements/DotGrid';
import LetterGlitch from '@/components/AnimateElements/LetterGlitch';
import MagicBento from '@/components/AnimateElements/MagicBento';
import { HoverEditButtons } from '@/ui/Button';
import { useHeroSectionEdit } from '@/components/modals/HeroSectionModal/context';
import { isAdminClient } from '@/lib/auth';
import { getOrganizationId } from '@/lib/supabase';

interface HeroProps {
  hero: {
    title: string;
    title_translation?: Record<string, string>;
    description: string;
    description_translation?: Record<string, string>;
    button?: string;
    button_translation?: Record<string, string>;
    image?: string | null;
    animation_element?: string;
    title_style: {
      font?: string;
      color?: string;
      gradient?: { from: string; via?: string; to: string };
      size?: { desktop: string; mobile: string };
      alignment?: string;
      blockWidth?: string;
      blockColumns?: number;
    };
    description_style: {
      font?: string;
      color?: string;
      size?: { desktop: string; mobile: string };
      weight?: string;
    };
    image_style: {
      position?: string;
      fullPage?: boolean;
    };
    button_style: {
      aboveDescription?: boolean;
      isVideo?: boolean;
      url?: string;
      color?: string;
      gradient?: { from: string; via?: string; to: string };
    };
    background_style: {
      color?: string;
      gradient?: { from: string; via?: string; to: string };
    };
    is_seo_title?: boolean;
    seo_title?: string;
    organization_id?: string | null;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { openModal } = useHeroSectionEdit();

  if (!hero) return null;

  // Determine image position from image_style
  const imagePosition = useMemo(() => {
    return hero.image_style?.position || 'right';
  }, [hero.image_style?.position]);

  const isImageFullPage = hero.image_style?.fullPage || false;
  const shouldShowInlineImage = hero.image && !isImageFullPage;

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await isAdminClient();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        // Get organization ID for editing
        const orgId = await getOrganizationId();
        setOrganizationId(orgId);
      }
    };
    checkAdmin();
  }, []);

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
    ? getTranslatedContent(hero.title, hero.title_translation, currentLocale)
    : hero.title; // Direct default field

  const translatedPDescription = currentLocale
    ? getTranslatedContent(hero.description, hero.description_translation, currentLocale)
    : hero.description; // Direct default field

  const translatedButton = currentLocale
    ? getTranslatedContent(hero.button || '', hero.button_translation || {}, currentLocale)
    : hero.button || ''; // Direct default field

  console.log('=== HERO TRANSLATION DETAILED DEBUG ===');
  console.log('Raw pathname:', pathname);
  console.log('Path segments:', pathSegments);
  console.log('First segment (potential locale):', pathLocale);
  console.log('Supported locales:', ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh']);
  console.log('Is valid locale?', pathLocale && pathLocale.length === 2 && ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'].includes(pathLocale));
  console.log('Final currentLocale:', currentLocale);
  console.log('Using translation system:', !!currentLocale);
  console.log('---');
  console.log('Title - Default field:', hero.title);
  console.log('Title - Translation object:', hero.title_translation);
  console.log('Title - Final result:', translatedH1Title);
  console.log('Title - Are they equal?', hero.title === translatedH1Title);
  console.log('---');
  console.log('Description - Default field:', hero.description);
  console.log('Description - Translation object:', hero.description_translation);
  console.log('Description - Final result:', translatedPDescription);
  console.log('Description - Are they equal?', hero.description === translatedPDescription);
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

  const textColorClass = useMemo(() => {
    const titleStyle = hero.title_style || {};
    if (titleStyle.gradient) {
      return `bg-gradient-to-r from-${titleStyle.gradient.from || 'gray-700'} via-${titleStyle.gradient.via || 'gray-700'} to-${titleStyle.gradient.to || 'indigo-200'} bg-clip-text text-transparent`;
    }
    return `text-${titleStyle.color || 'gray-700'}`;
  }, [hero.title_style]);

  const backgroundClass = useMemo(() => {
    const backgroundStyle = hero.background_style || {};
    if (backgroundStyle.gradient) {
      return `bg-gradient-to-tr from-${backgroundStyle.gradient.from || 'sky-50'} via-${backgroundStyle.gradient.via || 'transparent'} to-${backgroundStyle.gradient.to || ''} hover:bg-sky-50`;
    }
    return `bg-${backgroundStyle.color || 'transparent'} hover:bg-sky-50`;
  }, [hero.background_style]);

  const GetstartedBackgroundColorClass = useMemo(() => {
    const buttonStyle = hero.button_style || {};
    if (buttonStyle.gradient) {
      return `bg-gradient-to-r from-${buttonStyle.gradient.from || 'gray-700'} via-${buttonStyle.gradient.via || 'gray-700'} to-${buttonStyle.gradient.to || 'gray-900'}`;
    }
    return `bg-${buttonStyle.color || 'gray-700'}`;
  }, [hero.button_style]);

  const h1TextSize = useMemo(() => {
    const titleStyle = hero.title_style || {};
    const size = titleStyle.size || { desktop: 'text-7xl', mobile: 'text-5xl' };
    return `sm:${size.mobile} md:${size.desktop} lg:${size.desktop} ${size.mobile}`;
  }, [hero.title_style]);

  return (
    <div
      ref={heroRef}
      className={`pt-16 min-h-screen relative isolate group px-6 lg:px-8 ${backgroundClass} flex items-center justify-center`}
    >
      {/* Hover Edit Buttons for Admin */}
      {isAdmin && organizationId && (
        <HoverEditButtons
          onEdit={() => openModal(organizationId, hero as any)}
          onNew={() => openModal(organizationId)}
          position="top-right-below-menu"
        />
      )}
      
      {(() => {
        switch (hero.animation_element) {
          case 'DotGrid':
            return (
              <div className="absolute inset-0 -z-20">
                <DotGrid
                  dotSize={40}
                  gap={200}
                  baseColor="#f8fafc"
                  activeColor="#f1f5f9"
                  proximity={120}
                  shockRadius={250}
                  shockStrength={5}
                  resistance={750}
                  returnDuration={1.5}
                />
              </div>
            );
          case 'LetterGlitch':
            return (
              <div className="absolute inset-0 -z-20 letter-glitch-wave">
                <LetterGlitch
                  glitchSpeed={50}
                  centerVignette={true}
                  outerVignette={false}
                  smooth={true}
                  glitchColors={["#0284c7", "#0d9488"]} // Only sky-600 and teal-600 for better styling
                />
              </div>
            );
          case 'MagicBento':
            return (
              <div className="absolute inset-0 -z-20">
                <MagicBento
                  textAutoHide={true}
                  enableStars={true}
                  enableSpotlight={true}
                  enableBorderGlow={true}
                  enableTilt={true}
                  enableMagnetism={true}
                  clickEffect={true}
                  spotlightRadius={300}
                  particleCount={12}
                  glowColor="132, 0, 255"
                />
              </div>
            );
          default:
            return null;
        }
      })()}

      {hero.background_style?.gradient && (
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 text-sky-500"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>
      )}

      {/* Full-page background image */}
      {hero.image && isImageFullPage && (
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
        className={`mx-auto max-w-${hero.title_style?.blockWidth || '2xl'} text-${
          hero.title_style?.alignment || 'center'
        } items-center grid grid-cols-1 gap-x-12 gap-y-24 sm:grid-cols-${hero.title_style?.blockColumns || 1} relative`}
      >
        <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-2' : ''}>
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

          <div className={`text-${hero.title_style?.alignment || 'center'}`}>
            <h1
              className={`${h1TextSize} font-bold tracking-tight inline hover:text-gray-700 ${textColorClass} animate-hero-title ${isVisible ? 'animate' : ''}`}
            >
              {parse(translatedH1Title)}
            </h1>

            {/* Button above description if button_main_above_description is true */}
            {hero.button_style?.aboveDescription && hero.button && (
              <div
                className={`mt-6 flex items-center justify-${hero.title_style?.alignment || 'center'} gap-x-6`}
              >
                {hero.button_style?.isVideo ? (
                  <Link
                    href={hero.button_style?.url || '/products'}
                    className={`animate-hero-button-get-started ${isVisible ? 'animate' : ''} hover:opacity-80 transition-opacity`}
                  >
                    <FaPlayCircle className="h-16 w-16 text-white hover:text-gray-200" />
                  </Link>
                ) : (
                  <Link
                    href={hero.button_style?.url || '/products'}
                    className={`rounded-full ${GetstartedBackgroundColorClass} hover:bg-sky-500 py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80 animate-hero-button-get-started ${isVisible ? 'animate' : ''}`}
                  >
                    {translatedButton}
                  </Link>
                )}
              </div>
            )}

            <p
              className={`mt-6 tracking-wide ${hero.description_style?.size?.mobile || 'text-lg'} sm:${hero.description_style?.size?.desktop || 'text-2xl'} text-${
                hero.description_style?.color || 'gray-600'
              } hover:text-gray-900 animate-hero-description ${isVisible ? 'animate' : ''}`}
              style={{ fontWeight: hero.description_style?.weight || 'normal' }}
            >
              {parse(translatedPDescription)}
            </p>

            {/* Button below description if button_main_above_description is false or unset */}
            {!hero.button_style?.aboveDescription && hero.button && (
              <div
                className={`mt-10 flex items-center justify-${hero.title_style?.alignment || 'center'} gap-x-6`}
              >
                {hero.button_style?.isVideo ? (
                  <Link
                    href={hero.button_style?.url || '/products'}
                    className={`animate-hero-button-get-started ${isVisible ? 'animate' : ''} hover:opacity-80 transition-opacity`}
                  >
                    <FaPlayCircle className="h-4 w-4 text-white hover:text-gray-200" />
                  </Link>
                ) : (
                  <Link
                    href={hero.button_style?.url || '/products'}
                    className={`rounded-full ${GetstartedBackgroundColorClass} hover:bg-sky-500 py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80 animate-hero-button-get-started ${isVisible ? 'animate' : ''}`}
                  >
                    {translatedButton}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-1' : 'order-1'}>
          {shouldShowInlineImage && hero.image && (
            <div className={`text-${hero.title_style?.alignment || 'center'}`}>
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