/**
 * StyleTab - Text style variants with search
 */

'use client';

import React, { useState } from 'react';
import { SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TemplateSectionFormData } from '../hooks';

interface StyleTabProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
}

const TEXT_VARIANTS = {
  default: {
    title: 'text-3xl font-bold',
    description: 'text-base',
    name: 'Default',
    preview: 'Clean & balanced'
  },
  apple: {
    title: 'text-5xl font-semibold tracking-tight',
    description: 'text-xl',
    name: 'Apple',
    preview: 'Minimalist & refined'
  },
  codedharmony: {
    title: 'text-4xl font-extrabold',
    description: 'text-lg font-medium',
    name: 'Coded Harmony',
    preview: 'Bold & technical'
  },
  magazine: {
    title: 'text-4xl font-serif',
    description: 'text-base font-serif',
    name: 'Magazine',
    preview: 'Editorial & elegant'
  },
  startup: {
    title: 'text-3xl font-bold',
    description: 'text-base',
    name: 'Startup',
    preview: 'Modern & energetic'
  },
  elegant: {
    title: 'text-4xl font-light tracking-wide',
    description: 'text-lg font-light',
    name: 'Elegant',
    preview: 'Sophisticated & airy'
  },
  brutalist: {
    title: 'text-5xl font-black uppercase',
    description: 'text-sm uppercase tracking-wider',
    name: 'Brutalist',
    preview: 'Bold & impactful'
  },
  modern: {
    title: 'text-4xl font-bold tracking-tight',
    description: 'text-base',
    name: 'Modern',
    preview: 'Contemporary & clean'
  },
  playful: {
    title: 'text-4xl font-bold',
    description: 'text-lg',
    name: 'Playful',
    preview: 'Fun & friendly'
  },
};

export default function StyleTab({ formData, setFormData }: StyleTabProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [searchTerm, setSearchTerm] = useState('');

  // Filter text variants based on search
  const filteredVariants = Object.entries(TEXT_VARIANTS).filter(([key, variant]) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      variant.name.toLowerCase().includes(searchLower) ||
      variant.preview.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search text styles..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-1 transition-all"
          style={{
            '--tw-ring-color': primary.base,
          } as any}
        />
      </div>

      {/* Text Style Variants List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {filteredVariants.length > 0 ? (
          filteredVariants.map(([key, variant]) => (
            <button
              key={key}
              onClick={() => setFormData({ ...formData, text_style_variant: key as any })}
              className={cn(
                'relative w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm bg-white/80 backdrop-blur-sm',
                formData.text_style_variant === key ? 'border-2 shadow-sm' : ''
              )}
              style={{
                borderColor: formData.text_style_variant === key
                  ? primary.base
                  : '#e5e7eb',
              }}
            >
              <div className="flex w-full items-center gap-3">
                <SparklesIcon 
                  className="h-5 w-5 flex-shrink-0" 
                  style={{ color: formData.text_style_variant === key ? primary.base : '#9ca3af' }} 
                />
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium"
                    style={{ color: formData.text_style_variant === key ? primary.base : '#111827' }}
                  >
                    {variant.name}
                  </p>
                  <p className="text-xs mt-0.5 text-gray-500 line-clamp-1">
                    {variant.preview}
                  </p>
                </div>
                {formData.text_style_variant === key && (
                  <div className="rounded-full p-0.5 flex-shrink-0" style={{ backgroundColor: primary.base }}>
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            No text styles match your search
          </div>
        )}
      </div>
    </div>
  );
}
