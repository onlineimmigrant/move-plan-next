/**
 * AnimationSection Component
 * 
 * Form section for animation element selection
 */

import React from 'react';
import { HeroFormData } from '../types';
import { cn } from '@/lib/utils';

interface AnimationSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
}

export function AnimationSection({
  formData,
  setFormData,
}: AnimationSectionProps) {
  const animations = [
    { value: '', label: 'No Animation', description: 'Plain hero section' },
    { value: 'DotGrid', label: 'Dot Grid', description: 'Interactive dot pattern' },
    { value: 'LetterGlitch', label: 'Letter Glitch', description: 'Glitchy text effect' },
    { value: 'MagicBento', label: 'Magic Bento', description: 'Floating cards with effects' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Animation Settings</h3>
      
      {/* Animation Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Background Animation
        </label>
        <div className="space-y-2">
          {animations.map((animation) => (
            <button
              key={animation.value}
              onClick={() => setFormData({
                ...formData,
                animation_element: animation.value as any
              })}
              className={cn(
                'w-full px-4 py-3 text-left rounded-md border-2 transition-colors',
                formData.animation_element === animation.value
                  ? 'border-sky-300 bg-sky-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={cn(
                    'text-sm font-medium',
                    formData.animation_element === animation.value
                      ? 'text-sky-700'
                      : 'text-gray-900'
                  )}>
                    {animation.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {animation.description}
                  </div>
                </div>
                {formData.animation_element === animation.value && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-sky-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Animation Info */}
      {formData.animation_element && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Note:</span> Animation will render behind the hero content for visual effect.
          </p>
        </div>
      )}
    </div>
  );
}
