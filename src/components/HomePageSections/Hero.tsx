'use client'; // Ensure client-side rendering for hooks

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import parse from 'html-react-parser';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { FaPlayCircle } from 'react-icons/fa';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { HoverEditButtons } from '@/ui/Button';

// Lazy load heavy animation components - only when actually used
const DotGrid = dynamic(() => import('@/components/AnimateElements/DotGrid'), { 
  ssr: false,
  loading: () => null 
});
const LetterGlitch = dynamic(() => import('@/components/AnimateElements/LetterGlitch'), { 
  ssr: false,
  loading: () => null 
});
const MagicBento = dynamic(() => import('@/components/AnimateElements/MagicBento'), { 
  ssr: false,
  loading: () => null 
});
import { useHeroSectionEdit } from '@/components/modals/HeroSectionModal/context';
import { useAuth } from '@/context/AuthContext';
import { getOrganizationId } from '@/lib/supabase';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';

interface HeroProps {
  hero: {
    id?: string;
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
      is_gradient?: boolean;
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
      height?: number;
      width?: number;
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
      is_gradient?: boolean;
      gradient?: { from: string; via?: string; to: string };
      seo_title?: string;
      column?: number;
    };
    column?: number;
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

const Hero: React.FC<HeroProps> = ({ hero: initialHero }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isAdmin, organizationId } = useAuth();
  const [hero, setHero] = useState(initialHero); // Local state for hero data
  const [shouldRenderAnimation, setShouldRenderAnimation] = useState(false); // Defer animation rendering
  const heroRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { openModal } = useHeroSectionEdit();
  const router = useRouter();
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setHero(initialHero);
  }, [initialHero]);

  // Immediate route prefetch + idle API summary prefetch to warm navigation
  useEffect(() => {
    const target = hero.button_style?.url || '/products';
    try {
      if (router && typeof router.prefetch === 'function') {
        router.prefetch(target);
      }
    } catch {}
    // Idle fetch products summary (non-blocking)
    const idleFetch = () => {
      try {
        fetch('/api/products-summary').catch(() => {});
      } catch {}
    };
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(idleFetch, { timeout: 2000 });
    } else {
      setTimeout(idleFetch, 500);
    }
  }, [router, hero.button_style?.url]);

  // Defer animation rendering until after route prefetch window (avoid competing with navigation resources)
  useEffect(() => {
    const idleDelay = 2200; // Slightly after potential prefetch
    const timeoutId = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(() => setShouldRenderAnimation(true), { timeout: idleDelay })
      : setTimeout(() => setShouldRenderAnimation(true), idleDelay);
    return () => {
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(timeoutId as number);
      } else {
        clearTimeout(timeoutId as number);
      }
    };
  }, [hero.button_style?.url]);

  // Listen for hero section updates from modal
  useEffect(() => {
    const handleHeroUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[Hero] Received hero-section-updated event:', customEvent.detail);
      
      // Fetch fresh data from API to ensure we have the latest
      if (hero.id) {
        try {
          const response = await fetch(`/api/hero-section/${hero.id}`);
          if (response.ok) {
            const updatedHero = await response.json();
            console.log('[Hero] Fetched updated hero data:', updatedHero);
            setHero(updatedHero);
          }
        } catch (error) {
          console.error('[Hero] Failed to fetch updated hero data:', error);
          // Fallback to event detail if fetch fails
          setHero(customEvent.detail);
        }
      }
    };

    window.addEventListener('hero-section-updated', handleHeroUpdate);
    return () => {
      window.removeEventListener('hero-section-updated', handleHeroUpdate);
    };
  }, [hero.id]);

  if (!hero) return null;

  // Determine image position from image_style
  const imagePosition = useMemo(() => {
    return hero.image_style?.position || 'right';
  }, [hero.image_style?.position]);

  const isImageFullPage = hero.image_style?.fullPage || false;
  const shouldShowInlineImage = hero.image && !isImageFullPage;
  // Note: Inline text editing removed - use modal editor instead

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

  useEffect(() => {
    const currentRef = heroRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
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

  const titleColorStyle = useMemo(() => {
    const titleStyle = hero.title_style || {};
    if (titleStyle.is_gradient && titleStyle.gradient) {
      // Use gradient with inline styles
      const fromColor = getColorValue(titleStyle.gradient.from?.replace('from-', '') || 'gray-700');
      const viaColor = getColorValue(titleStyle.gradient.via?.replace('via-', '') || 'gray-700');
      const toColor = getColorValue(titleStyle.gradient.to?.replace('to-', '') || 'indigo-500');
      return {
        backgroundImage: `linear-gradient(90deg, ${fromColor}, ${viaColor}, ${toColor})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      };
    }
    // Use single color with inline style
    const colorValue = getColorValue(titleStyle.color || 'gray-700');
    return { color: colorValue };
  }, [hero.title_style]);

  const backgroundClass = useMemo(() => {
    // Always return base class, color will be handled by inline style
    return 'hover:bg-sky-50';
  }, []);

  const backgroundStyle = useMemo(() => {
    const bgStyle = hero.background_style || {};
    if (bgStyle.is_gradient && bgStyle.gradient) {
      const fromColor = getColorValue(bgStyle.gradient.from?.replace('from-', '') || 'sky-500');
      const viaColor = getColorValue(bgStyle.gradient.via?.replace('via-', '') || 'white');
      const toColor = getColorValue(bgStyle.gradient.to?.replace('to-', '') || 'purple-600');
      return {
        backgroundImage: `linear-gradient(135deg, ${fromColor}, ${viaColor}, ${toColor})`
      };
    }
    // Use single color with inline style
    const colorValue = getColorValue(bgStyle.color || 'transparent');
    return colorValue === 'transparent' ? {} : { backgroundColor: colorValue };
  }, [hero.background_style]);

  const buttonStyle = useMemo(() => {
    const btnStyle = hero.button_style || {};
    if (btnStyle.gradient) {
      const fromColor = getColorValue(btnStyle.gradient.from?.replace('from-', '') || 'gray-700');
      const viaColor = getColorValue(btnStyle.gradient.via?.replace('via-', '') || 'gray-700');
      const toColor = getColorValue(btnStyle.gradient.to?.replace('to-', '') || 'gray-900');
      return {
        backgroundImage: `linear-gradient(90deg, ${fromColor}, ${viaColor}, ${toColor})`
      };
    }
    // Use single color with inline style
    const colorValue = getColorValue(btnStyle.color || 'gray-700');
    return { backgroundColor: colorValue };
  }, [hero.button_style]);

  const h1TextSize = useMemo(() => {
    const titleStyle = hero.title_style || {};
    const size = titleStyle.size || { desktop: 'text-7xl', mobile: 'text-5xl' };
    return `sm:${size.mobile} md:${size.desktop} lg:${size.desktop} ${size.mobile}`;
  }, [hero.title_style]);

  return (
    <div
      ref={heroRef}
      className={`pt-48 sm:pt-16 min-h-screen relative isolate group px-6 lg:px-8 ${backgroundClass} flex items-center justify-center`}
      style={backgroundStyle}
    >
      {/* Hover Edit Buttons for Admin */}
      {isAdmin && organizationId && (
        <HoverEditButtons
          onEdit={() => openModal(organizationId, hero as any)}
          onNew={() => openModal(organizationId)}
          position="top-right-below-menu"
        />
      )}
      
      {/* Defer animation rendering to improve LCP (animations load after content) */}
      {shouldRenderAnimation && (() => {
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

      {hero.background_style?.is_gradient && hero.background_style?.gradient && (
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 text-sky-500"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${hero.background_style.gradient.from?.replace('from-', '') || 'rgb(14 165 233)'}, ${hero.background_style.gradient.via?.replace('via-', '') || 'rgb(255 255 255)'}, ${hero.background_style.gradient.to?.replace('to-', '') || 'rgb(147 51 234)'})`
            }}
          />
        </div>
      )}

      {/* Full-page background image - CLS optimized with fill prop */}
      {hero.image && isImageFullPage && (
        <Image
          src={hero.image}
          alt={`Image of ${translatedH1Title}`}
          fill
          className="-z-10 object-cover"
          priority
          sizes="100vw"
          quality={90}
        />
      )}

      <div
        className={`mx-auto max-w-${hero.title_style?.blockWidth || '2xl'} text-${
          hero.title_style?.alignment || 'center'
        } items-center grid grid-cols-1 gap-x-12 gap-y-24 ${hero.background_style?.column ? `lg:grid-cols-${hero.background_style.column}` : ''} relative`}
      >
        <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-2' : ''}>
          {hero.background_style?.seo_title && (
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 hover:text-gray-500 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                {hero.background_style.seo_title}
                <Link
                  href="/blog"
                  prefetch
                  onClick={() => {
                    try {
                      performance.mark('PerfBlog-click');
                      const ts = performance.now().toFixed(0);
                      // eslint-disable-next-line no-console
                      console.log(`[PerfBlog] click at ${ts}ms from hero`);
                    } catch {}
                  }}
                  aria-label={`Explore ${hero.background_style.seo_title}`}
                  className="ml-2 flex items-center transition-all duration-300 group font-semibold text-gray-700 hover:text-gray-300"
                >
                  Explore
                  <RightArrowDynamic />
                </Link>
              </div>
            </div>
          )}

          <div className={`text-${hero.title_style?.alignment || 'center'}`}>
            {/* Title */}
            <h1
              ref={titleRef}
              className={`${h1TextSize} font-bold tracking-tight inline hover:text-gray-700 animate-hero-title ${isVisible ? 'animate' : ''}`}
              style={titleColorStyle}
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
                    prefetch
                    onClick={() => performance?.mark?.('hero-cta-click')}
                    className={`animate-hero-button-get-started ${isVisible ? 'animate' : ''} hover:opacity-80 transition-opacity`}
                  >
                    <FaPlayCircle className="h-16 w-16 text-white hover:text-gray-200" />
                  </Link>
                ) : (
                  <Link
                    href={hero.button_style?.url || '/products'}
                    prefetch
                    onClick={() => performance?.mark?.('hero-cta-click')}
                    className={`rounded-full py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80 animate-hero-button-get-started ${isVisible ? 'animate' : ''}`}
                    style={buttonStyle}
                  >
                    {translatedButton}
                  </Link>
                )}
              </div>
            )}

            {/* Description */}
            <p
              ref={descriptionRef}
              className={`mt-6 tracking-wide ${hero.description_style?.size?.mobile || 'text-lg'} sm:${hero.description_style?.size?.desktop || 'text-2xl'} hover:text-gray-900 animate-hero-description ${isVisible ? 'animate' : ''}`}
              style={{ 
                fontWeight: hero.description_style?.weight || 'normal',
                color: getColorValue(hero.description_style?.color || 'gray-600')
              }}
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
                    prefetch
                    onClick={() => performance?.mark?.('hero-cta-click')}
                    className={`animate-hero-button-get-started ${isVisible ? 'animate' : ''} hover:opacity-80 transition-opacity`}
                  >
                    <FaPlayCircle className="h-4 w-4 text-white hover:text-gray-200" />
                  </Link>
                ) : (
                  <Link
                    href={hero.button_style?.url || '/products'}
                    prefetch
                    onClick={() => performance?.mark?.('hero-cta-click')}
                    className={`rounded-full py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80 animate-hero-button-get-started ${isVisible ? 'animate' : ''}`}
                    style={buttonStyle}
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
              {/* CLS optimized: aspect-ratio container prevents layout shift */}
              <div 
                className="relative mx-auto"
                style={{
                  aspectRatio: `${hero.image_style?.width || 400} / ${hero.image_style?.height || 300}`,
                  maxWidth: '100%',
                  width: hero.image_style?.width || 400
                }}
              >
                <Image
                  src={hero.image}
                  alt={`Image of ${translatedH1Title}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 50vw"
                  priority={true}
                  quality={85}
                />
              </div>
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