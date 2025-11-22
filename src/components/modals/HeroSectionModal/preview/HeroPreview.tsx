/**
 * HeroPreview Component
 * 
 * Exact mirror of the live Hero component for preview
 */

import React, { useMemo, useCallback } from 'react';
import parse from 'html-react-parser';
import dynamic from 'next/dynamic';
import { HeroFormData } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

// Lazy load heavy animation components
const DotGrid = dynamic(() => import('@/components/AnimateElements/DotGrid'), { ssr: false, loading: () => null });
const LetterGlitch = dynamic(() => import('@/components/AnimateElements/LetterGlitch'), { ssr: false, loading: () => null });
const MagicBento = dynamic(() => import('@/components/AnimateElements/MagicBento'), { ssr: false, loading: () => null });
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface HeroPreviewProps {
  formData: HeroFormData;
  onDoubleClickTitle?: (e: React.MouseEvent) => void;
  onDoubleClickDescription?: (e: React.MouseEvent) => void;
}

export function HeroPreview({ formData, onDoubleClickTitle, onDoubleClickDescription }: HeroPreviewProps) {
  // Helper to construct video URL based on player type
  const getVideoUrl = useCallback((video_url?: string, video_player?: string) => {
    if (!video_url || !video_player) return '';
    
    switch (video_player) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${video_url}`;
      case 'vimeo':
        return `https://vimeo.com/${video_url}`;
      case 'pexels':
      case 'r2':
        return video_url; // Direct URL
      default:
        return video_url;
    }
  }, []);

  // Determine image position
  const imagePosition = formData.image_style?.position || 'right';
  const isImageFullPage = formData.image_style?.fullPage || false;
  const shouldShowInlineImage = formData.image && !isImageFullPage;

  // Title color style - exactly like Hero.tsx
  const titleColorStyle = useMemo(() => {
    const titleStyle = formData.title_style || {};
    if (titleStyle.is_gradient && titleStyle.gradient) {
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
    const colorValue = getColorValue(titleStyle.color || 'gray-700');
    return { color: colorValue };
  }, [formData.title_style]);

  // Background class and style - exactly like Hero.tsx
  const backgroundClass = 'hover:bg-sky-50';
  
  const backgroundStyle = useMemo(() => {
    const bgStyle = formData.background_style || {};
    if (bgStyle.is_gradient && bgStyle.gradient) {
      const fromColor = getColorValue(bgStyle.gradient.from?.replace('from-', '') || 'sky-500');
      const viaColor = getColorValue(bgStyle.gradient.via?.replace('via-', '') || 'white');
      const toColor = getColorValue(bgStyle.gradient.to?.replace('to-', '') || 'purple-600');
      return {
        backgroundImage: `linear-gradient(135deg, ${fromColor}, ${viaColor}, ${toColor})`
      };
    }
    const colorValue = getColorValue(bgStyle.color || 'transparent');
    return colorValue === 'transparent' ? {} : { backgroundColor: colorValue };
  }, [formData.background_style]);

  // Button style - exactly like Hero.tsx
  const buttonStyle = useMemo(() => {
    const btnStyle = formData.button_style || {};
    if (btnStyle.gradient) {
      const fromColor = getColorValue(btnStyle.gradient.from?.replace('from-', '') || 'gray-700');
      const viaColor = getColorValue(btnStyle.gradient.via?.replace('via-', '') || 'gray-700');
      const toColor = getColorValue(btnStyle.gradient.to?.replace('to-', '') || 'gray-900');
      return {
        backgroundImage: `linear-gradient(90deg, ${fromColor}, ${viaColor}, ${toColor})`
      };
    }
    const colorValue = getColorValue(btnStyle.color || 'gray-700');
    return { backgroundColor: colorValue };
  }, [formData.button_style]);

  // Text size - exactly like Hero.tsx
  const h1TextSize = useMemo(() => {
    const titleStyle = formData.title_style || {};
    const size = titleStyle.size || { desktop: 'text-7xl', mobile: 'text-5xl' };
    return `sm:${size.mobile} md:${size.desktop} lg:${size.desktop} ${size.mobile}`;
  }, [formData.title_style]);

  return (
    <div
      className={`pt-48 sm:pt-16 min-h-screen relative isolate px-6 lg:px-8 ${backgroundClass} flex items-center justify-center`}
      style={backgroundStyle}
    >
      {/* Animation Elements - exactly like Hero.tsx */}
      {(() => {
        switch (formData.animation_element) {
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
                  glitchColors={["#0284c7", "#0d9488"]}
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

      {/* Gradient blur effect - exactly like Hero.tsx */}
      {formData.background_style?.is_gradient && formData.background_style?.gradient && (
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 text-sky-500"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${formData.background_style.gradient.from?.replace('from-', '') || 'rgb(14 165 233)'}, ${formData.background_style.gradient.via?.replace('via-', '') || 'rgb(255 255 255)'}, ${formData.background_style.gradient.to?.replace('to-', '') || 'rgb(147 51 234)'})`
            }}
          />
        </div>
      )}

      {/* Full-page background video or image - exactly like Hero.tsx */}
      {formData.is_video && formData.video_url && formData.video_player ? (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          
          {formData.video_player === 'pexels' || formData.video_player === 'r2' ? (
            // Native HTML5 video for Pexels and R2
            <video
              src={formData.video_url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              crossOrigin="anonymous"
            />
          ) : (
            // ReactPlayer for YouTube and Vimeo
            <div className="w-full h-full">
              <ReactPlayer
                url={getVideoUrl(formData.video_url, formData.video_player)}
                width="100%"
                height="100%"
                playing={true}
                loop={true}
                muted={true}
                playsinline={true}
                controls={false}
                config={{
                  youtube: {
                    playerVars: {
                      autoplay: 1,
                      controls: 0,
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                      loop: 1,
                      mute: 1,
                      playsinline: 1
                    }
                  },
                  vimeo: {
                    playerOptions: {
                      autoplay: true,
                      background: true,
                      loop: true,
                      muted: true,
                      title: false,
                      byline: false,
                      portrait: false
                    }
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  minWidth: '100%',
                  minHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            </div>
          )}
        </div>
      ) : formData.image && isImageFullPage ? (
        <img
          src={formData.image}
          alt={`Image of ${formData.title}`}
          className="absolute inset-0 -z-10 w-full h-full object-cover"
        />
      ) : null}

      {/* Main content container - exactly like Hero.tsx */}
      <div
        className={`mx-auto max-w-${formData.title_style?.blockWidth || '2xl'} text-${
          formData.title_style?.alignment || 'center'
        } items-center grid grid-cols-1 gap-x-12 gap-y-24 ${formData.background_style?.column ? `lg:grid-cols-${formData.background_style.column}` : ''} relative`}
      >
        <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-2' : ''}>
          {/* SEO title badge - exactly like Hero.tsx */}
          {formData.background_style?.seo_title && (
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="flex items-center relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 hover:text-gray-500 ring-2 ring-gray-900/10 hover:ring-sky-700/20">
                {formData.background_style.seo_title}
                <span className="ml-2 flex items-center transition-all duration-300 font-semibold text-gray-700 hover:text-gray-300">
                  Explore
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          <div className={`text-${formData.title_style?.alignment || 'center'}`}>
            {/* Title - exactly like Hero.tsx */}
            <h1
              className={`${h1TextSize} font-bold tracking-tight inline hover:text-gray-700 cursor-pointer transition-all hover:opacity-80`}
              style={titleColorStyle}
              onDoubleClick={onDoubleClickTitle}
              title="Double-click to edit"
            >
              {parse(formData.title)}
            </h1>

            {/* Button above description - exactly like Hero.tsx */}
            {formData.button_style?.aboveDescription && formData.button && (
              <div
                className={`mt-6 flex items-center justify-${formData.title_style?.alignment || 'center'} gap-x-6`}
              >
                {formData.button_style?.isVideo ? (
                  <div className="hover:opacity-80 transition-opacity">
                    <svg className="h-16 w-16 text-white hover:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                ) : (
                  <button
                    className="rounded-full py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80"
                    style={buttonStyle}
                  >
                    {formData.button}
                  </button>
                )}
              </div>
            )}

            {/* Description - exactly like Hero.tsx */}
            <p
              className={`mt-6 tracking-wide ${formData.description_style?.size?.mobile || 'text-lg'} sm:${formData.description_style?.size?.desktop || 'text-2xl'} hover:text-gray-900 cursor-pointer transition-all hover:opacity-80`}
              style={{ 
                fontWeight: formData.description_style?.weight || 'normal',
                color: getColorValue(formData.description_style?.color || 'gray-600')
              }}
              onDoubleClick={onDoubleClickDescription}
              title="Double-click to edit"
            >
              {parse(formData.description)}
            </p>

            {/* Button below description - exactly like Hero.tsx */}
            {!formData.button_style?.aboveDescription && formData.button && (
              <div
                className={`mt-10 flex items-center justify-${formData.title_style?.alignment || 'center'} gap-x-6`}
              >
                {formData.button_style?.isVideo ? (
                  <div className="hover:opacity-80 transition-opacity">
                    <svg className="h-16 w-16 text-white hover:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                ) : (
                  <button
                    className="rounded-full py-3 px-6 text-base font-medium text-white shadow-sm hover:opacity-80"
                    style={buttonStyle}
                  >
                    {formData.button}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Inline image - exactly like Hero.tsx */}
        <div className={imagePosition === 'left' && shouldShowInlineImage ? 'order-1' : 'order-1'}>
          {shouldShowInlineImage && formData.image && (
            <div className={`text-${formData.title_style?.alignment || 'center'}`}>
              <div 
                className="relative mx-auto"
                style={{
                  aspectRatio: `${formData.image_style?.width || 400} / ${formData.image_style?.height || 300}`,
                  maxWidth: '100%',
                  width: formData.image_style?.width || 400
                }}
              >
                <img
                  src={formData.image}
                  alt={`Image of ${formData.title}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

