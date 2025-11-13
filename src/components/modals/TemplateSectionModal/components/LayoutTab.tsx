/**
 * LayoutTab - Title alignment and Colors & Text
 */

'use client';

import React from 'react';
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  Square2StackIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import { TemplateSectionFormData } from '../hooks';

interface LayoutTabProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
}

// Tooltip Component
const Tooltip = ({ content, position = 'top' }: { content: string; position?: 'top' | 'bottom' }) => {
  if (position === 'bottom') {
    return (
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45" />
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
            <p className="text-xs text-gray-700 whitespace-nowrap">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="relative">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-700 whitespace-nowrap">{content}</p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45" />
        </div>
      </div>
    </div>
  );
};

export default function LayoutTab({ formData, setFormData }: LayoutTabProps) {
  const themeColors = useThemeColors();

  return (
    <div className="space-y-6">
      {/* Alignment Controls */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Title Alignment
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: false,
                is_section_title_aligned_right: false,
              })}
              className={cn(
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? 'border-2'
                  : ''
              )}
              style={{
                borderColor: !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
            >
              <Bars3BottomLeftIcon className="w-5 h-5" />
            </button>
            <Tooltip content="Align section title to the left" position="bottom" />
          </div>

          <div className="relative group">
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: true,
                is_section_title_aligned_right: false,
              })}
              className={cn(
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                formData.is_section_title_aligned_center ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_section_title_aligned_center
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: formData.is_section_title_aligned_center
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <Tooltip content="Align section title to the center" position="bottom" />
          </div>

          <div className="relative group">
            <button
              onClick={() => setFormData({
                ...formData,
                is_section_title_aligned_center: false,
                is_section_title_aligned_right: true,
              })}
              className={cn(
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                formData.is_section_title_aligned_right ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: formData.is_section_title_aligned_right
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
            >
              <Bars3BottomRightIcon className="w-5 h-5" />
            </button>
            <Tooltip content="Align section title to the right" position="bottom" />
          </div>
        </div>
      </div>

      {/* Colors & Text Section */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Background Color
        </label>
        <div className="space-y-4">
          {/* Gradient Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFormData({ ...formData, is_gradient: false })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                'hover:shadow-sm bg-white/80 backdrop-blur-sm',
                !formData.is_gradient ? 'border-2' : ''
              )}
              style={{
                borderColor: !formData.is_gradient ? themeColors.cssVars.primary.base : '#e5e7eb',
                color: !formData.is_gradient ? themeColors.cssVars.primary.base : '#6B7280',
              }}
            >
              <div className="flex items-center gap-2">
                <Square2StackIcon className="w-4 h-4" />
                Solid Color
              </div>
            </button>
            <button
              onClick={() => setFormData({ ...formData, is_gradient: true })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                'hover:shadow-sm bg-white/80 backdrop-blur-sm',
                formData.is_gradient ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_gradient ? themeColors.cssVars.primary.base : '#e5e7eb',
                color: formData.is_gradient ? themeColors.cssVars.primary.base : '#6B7280',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-purple-500" />
                Gradient
              </div>
            </button>
          </div>

          {/* Color Picker */}
          <div>
            <EditableGradientPicker
              label="Section Background"
              isGradient={formData.is_gradient}
              gradient={formData.gradient || { from: 'blue-400', to: 'purple-500' }}
              solidColor={formData.background_color}
              onGradientChange={(isGradient: boolean, gradient: any) => 
                setFormData({ ...formData, is_gradient: isGradient, gradient })
              }
              onSolidColorChange={(color: string) => 
                setFormData({ ...formData, background_color: color })
              }
            />
          </div>

          {/* Preview */}
          <div 
            className="h-24 rounded-lg border"
            style={{
              ...getBackgroundStyle(formData.is_gradient, formData.gradient, formData.background_color),
              borderColor: '#e5e7eb',
            }}
          />
        </div>
      </div>
    </div>
  );
}
