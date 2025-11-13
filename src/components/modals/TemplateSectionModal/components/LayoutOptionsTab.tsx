/**
 * LayoutOptionsTab - Grid columns, width, slider, image options
 */

'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowsRightLeftIcon,
  ViewColumnsIcon,
  RectangleStackIcon,
  ArrowsUpDownIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TemplateSectionFormData } from '../hooks';

interface LayoutOptionsTabProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
}

const HEIGHT_OPTIONS = [
  { value: 'h-32', label: '8rem (128px)' },
  { value: 'h-40', label: '10rem (160px)' },
  { value: 'h-48', label: '12rem (192px)' },
  { value: 'h-56', label: '14rem (224px)' },
  { value: 'h-64', label: '16rem (256px)' },
  { value: 'h-72', label: '18rem (288px)' },
  { value: 'h-80', label: '20rem (320px)' },
  { value: 'h-96', label: '24rem (384px)' },
];

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

export default function LayoutOptionsTab({ formData, setFormData }: LayoutOptionsTabProps) {
  const themeColors = useThemeColors();
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const columnButtonRef = useRef<HTMLButtonElement>(null);
  const heightButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="space-y-6">
      {/* Width and Slider Options */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Layout Options
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
              className={cn(
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                formData.is_full_width ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_full_width
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: formData.is_full_width
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>
            <Tooltip content="Make section full width without container constraints" position="bottom" />
          </div>

          {formData.section_type === 'general' && (
            <div className="relative group">
              <button
                onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
                className={cn(
                  'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                  'hover:shadow-sm border',
                  formData.is_slider ? 'border-2' : ''
                )}
                style={{
                  borderColor: formData.is_slider
                    ? themeColors.cssVars.primary.base
                    : '#e5e7eb',
                  color: formData.is_slider
                    ? themeColors.cssVars.primary.base
                    : '#6B7280',
                }}
              >
                <RectangleStackIcon className="w-5 h-5" />
              </button>
              <Tooltip content="Enable horizontal slider/carousel for metrics" position="bottom" />
            </div>
          )}

          <div className="relative group">
            <button
              onClick={() => setFormData({ ...formData, is_image_bottom: !formData.is_image_bottom })}
              className={cn(
                'p-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
                'hover:shadow-sm border',
                formData.is_image_bottom ? 'border-2' : ''
              )}
              style={{
                borderColor: formData.is_image_bottom
                  ? themeColors.cssVars.primary.base
                  : '#e5e7eb',
                color: formData.is_image_bottom
                  ? themeColors.cssVars.primary.base
                  : '#6B7280',
              }}
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
            <Tooltip content="Position image at bottom of card" position="bottom" />
          </div>
        </div>
      </div>

      {/* Grid Columns */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Grid Columns
        </label>
        <div className="relative inline-block">
          <button
            ref={columnButtonRef}
            onClick={() => {
              setShowColumnPicker(!showColumnPicker);
              setShowHeightPicker(false);
            }}
            className={cn(
              'px-4 py-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
              'hover:shadow-sm border flex items-center gap-2',
              showColumnPicker ? 'border-2' : ''
            )}
            style={{
              borderColor: showColumnPicker
                ? themeColors.cssVars.primary.base
                : '#e5e7eb',
              color: '#111827',
            }}
          >
            <ViewColumnsIcon className="w-5 h-5" />
            <span className="font-medium">{formData.grid_columns} {formData.grid_columns === 1 ? 'Column' : 'Columns'}</span>
          </button>

          {showColumnPicker && columnButtonRef.current && (() => {
            const rect = columnButtonRef.current.getBoundingClientRect();
            return (
              <div 
                className="fixed bg-white rounded-xl shadow-lg border-2 py-1 z-[100] w-32 backdrop-blur-sm"
                style={{
                  top: `${rect.bottom + 8}px`,
                  left: `${rect.left}px`,
                  borderColor: themeColors.primary.border,
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => {
                      setFormData({ ...formData, grid_columns: cols });
                      setShowColumnPicker(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-opacity-10 transition-colors',
                      formData.grid_columns === cols && 'font-semibold'
                    )}
                    style={{
                      backgroundColor: formData.grid_columns === cols ? `${themeColors.cssVars.primary.light}20` : 'transparent',
                      color: formData.grid_columns === cols ? themeColors.cssVars.primary.base : '#111827',
                    }}
                  >
                    {cols} {cols === 1 ? 'col' : 'cols'}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Image Height */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-gray-900">
          Image Height
        </label>
        <div className="relative inline-block">
          <button
            ref={heightButtonRef}
            onClick={() => {
              setShowHeightPicker(!showHeightPicker);
              setShowColumnPicker(false);
            }}
            className={cn(
              'px-4 py-2.5 rounded-lg transition-all bg-white/80 backdrop-blur-sm',
              'hover:shadow-sm border flex items-center gap-2',
              showHeightPicker ? 'border-2' : ''
            )}
            style={{
              borderColor: showHeightPicker
                ? themeColors.cssVars.primary.base
                : '#e5e7eb',
              color: '#111827',
            }}
          >
            <ArrowsUpDownIcon className="w-5 h-5" />
            <span className="font-medium">
              {HEIGHT_OPTIONS.find(h => h.value === formData.image_metrics_height)?.label || formData.image_metrics_height}
            </span>
          </button>

          {showHeightPicker && heightButtonRef.current && (() => {
            const rect = heightButtonRef.current.getBoundingClientRect();
            return (
              <div 
                className="fixed bg-white rounded-xl shadow-lg border-2 py-1 z-[100] w-48 backdrop-blur-sm max-h-64 overflow-y-auto"
                style={{
                  top: `${rect.bottom + 8}px`,
                  left: `${rect.left}px`,
                  borderColor: themeColors.primary.border,
                }}
              >
                {HEIGHT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFormData({ ...formData, image_metrics_height: option.value });
                      setShowHeightPicker(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-opacity-10 transition-colors',
                      formData.image_metrics_height === option.value && 'font-semibold'
                    )}
                    style={{
                      backgroundColor: formData.image_metrics_height === option.value ? `${themeColors.cssVars.primary.light}20` : 'transparent',
                      color: formData.image_metrics_height === option.value ? themeColors.cssVars.primary.base : '#111827',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
