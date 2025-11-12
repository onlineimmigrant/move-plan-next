/**
 * HeroPreview Component
 * 
 * Main preview container that mirrors the live Hero component
 */

import React from 'react';
import { HeroFormData } from '../types';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import DotGrid from '@/components/AnimateElements/DotGrid';
import LetterGlitch from '@/components/AnimateElements/LetterGlitch';
import MagicBento from '@/components/AnimateElements/MagicBento';
import { cn } from '@/lib/utils';

interface HeroPreviewProps {
  formData: HeroFormData;
}

export function HeroPreview({ formData }: HeroPreviewProps) {
  // Compute background style
  const bgStyle = formData.background_style;
  const backgroundClass = bgStyle?.is_gradient && bgStyle?.gradient
    ? 'bg-transparent'
    : `bg-${bgStyle?.color || 'white'}`;
  
  const backgroundStyle = bgStyle?.is_gradient && bgStyle?.gradient
    ? {
        backgroundImage: `linear-gradient(135deg, ${
          getColorValue(bgStyle.gradient.from?.replace('from-', '') || 'sky-50')
        }, ${
          getColorValue(bgStyle.gradient.via?.replace('via-', '') || 'white')
        }, ${
          getColorValue(bgStyle.gradient.to?.replace('to-', '') || 'purple-50')
        })`
      }
    : {};

  // Image positioning logic
  const imagePosition = formData.image_style?.position || 'right';
  const showInlineImage = formData.image && ['left', 'right', 'inline'].includes(imagePosition);
  const showBackgroundImage = formData.image && imagePosition === 'background';

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg border-2 border-gray-200 shadow-sm">
      {/* Preview Label */}
      <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200">
        <span className="text-xs font-medium text-gray-600">Live Preview</span>
      </div>

      {/* Main Hero Container */}
      <div
        className={cn('relative w-full h-full min-h-[400px]', backgroundClass)}
        style={backgroundStyle}
      >
        {/* Background Image */}
        {showBackgroundImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={formData.image!}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        {/* Content Container */}
        <div className={cn(
          'relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16',
          showInlineImage && formData.title_style?.blockColumns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-8 items-center' : 'flex flex-col items-center'
        )}>
          {/* Title */}
          {formData.title && (
            <div className={cn(
              'mb-4',
              formData.title_style?.alignment === 'left' ? 'text-left' :
              formData.title_style?.alignment === 'right' ? 'text-right' :
              'text-center'
            )}>
              <h1
                className={cn(
                  'font-bold leading-tight',
                  formData.title_style?.size?.mobile || 'text-5xl',
                  `sm:${formData.title_style?.size?.desktop || 'text-7xl'}`,
                  formData.title_style?.is_gradient ? 'text-transparent bg-clip-text' : `text-${formData.title_style?.color || 'gray-800'}`
                )}
                style={formData.title_style?.is_gradient && formData.title_style?.gradient ? {
                  backgroundImage: `linear-gradient(90deg, ${
                    getColorValue(formData.title_style.gradient.from || 'blue-600')
                  }, ${
                    getColorValue(formData.title_style.gradient.via || 'purple-600')
                  }, ${
                    getColorValue(formData.title_style.gradient.to || 'pink-600')
                  })`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                } : {}}
              >
                {formData.title}
              </h1>
            </div>
          )}

          {/* Button Above Description */}
          {formData.button && formData.button_style?.aboveDescription && (
            <div className="mb-6">
              <button
                className={cn(
                  'px-6 py-3 rounded-lg text-white font-medium transition-all',
                  formData.button_style?.gradient
                    ? `bg-gradient-to-r from-${formData.button_style.gradient.from} via-${formData.button_style.gradient.via} to-${formData.button_style.gradient.to}`
                    : `bg-${formData.button_style?.color || 'gray-700'}`
                )}
              >
                {formData.button}
              </button>
            </div>
          )}

          {/* Description */}
          {formData.description && (
            <div className={cn(
              'mb-6',
              formData.title_style?.alignment === 'left' ? 'text-left' :
              formData.title_style?.alignment === 'right' ? 'text-right' :
              'text-center'
            )}>
              <p
                className={cn(
                  formData.description_style?.size?.mobile || 'text-lg',
                  `sm:${formData.description_style?.size?.desktop || 'text-2xl'}`,
                  `text-${formData.description_style?.color || 'gray-600'}`,
                  formData.description_style?.weight === 'bold' ? 'font-bold' :
                  formData.description_style?.weight === 'semibold' ? 'font-semibold' :
                  formData.description_style?.weight === 'medium' ? 'font-medium' :
                  'font-normal'
                )}
              >
                {formData.description}
              </p>
            </div>
          )}

          {/* Button Below Description */}
          {formData.button && !formData.button_style?.aboveDescription && (
            <div>
              <button
                className={cn(
                  'px-6 py-3 rounded-lg text-white font-medium transition-all flex items-center gap-2',
                  formData.button_style?.gradient
                    ? `bg-gradient-to-r from-${formData.button_style.gradient.from} via-${formData.button_style.gradient.via} to-${formData.button_style.gradient.to}`
                    : `bg-${formData.button_style?.color || 'gray-700'}`
                )}
              >
                {formData.button_style?.isVideo && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                )}
                {formData.button}
              </button>
            </div>
          )}

          {/* Inline Image */}
          {showInlineImage && (
            <div className={cn(
              'relative',
              imagePosition === 'left' && formData.title_style?.blockColumns === 2 ? 'order-first' : ''
            )}>
              <img
                src={formData.image!}
                alt="Hero"
                style={{
                  width: formData.image_style?.width || 400,
                  height: formData.image_style?.height || 300,
                }}
                className="rounded-lg object-cover shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Animation Elements */}
        {formData.animation_element === 'DotGrid' && (
          <div className="absolute inset-0 -z-1 pointer-events-none">
            <DotGrid
              dotSize={40}
              gap={200}
              baseColor="#3b82f6"
              activeColor="#1d4ed8"
              proximity={120}
              shockRadius={250}
              shockStrength={5}
              resistance={750}
              returnDuration={1.5}
            />
          </div>
        )}
        {formData.animation_element === 'LetterGlitch' && (
          <div className="absolute inset-0 -z-1 pointer-events-none">
            <LetterGlitch
              glitchSpeed={50}
              centerVignette={true}
              outerVignette={false}
              smooth={true}
              glitchColors={["#0284c7", "#0d9488"]}
            />
          </div>
        )}
        {formData.animation_element === 'MagicBento' && (
          <div className="absolute inset-0 -z-1 pointer-events-none">
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
        )}
      </div>
    </div>
  );
}
