/**
 * BackgroundStyleSection Component
 * 
 * Form section for background color, gradient, and SEO settings
 */

import React from 'react';
import { HeroFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface BackgroundStyleSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  openColorPickers: {
    backgroundColor: boolean;
    backgroundGradientFrom: boolean;
    backgroundGradientVia: boolean;
    backgroundGradientTo: boolean;
  };
  toggleColorPicker: (key: 'backgroundColor' | 'backgroundGradientFrom' | 'backgroundGradientVia' | 'backgroundGradientTo') => void;
  primaryColor: string;
}

export function BackgroundStyleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  primaryColor,
}: BackgroundStyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Background Settings</h3>
      
      {/* Background Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.background_style?.color || 'white'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                background_style: { ...formData.background_style, color: colorClass }
              });
              toggleColorPicker('backgroundColor');
            }}
            isOpen={openColorPickers.backgroundColor}
            onToggle={() => toggleColorPicker('backgroundColor')}
            onClose={() => toggleColorPicker('backgroundColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Background Gradient Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.background_style?.is_gradient}
            onChange={(e) => setFormData({
              ...formData,
              background_style: {
                ...formData.background_style,
                is_gradient: e.target.checked,
                gradient: e.target.checked ? (formData.background_style?.gradient || {
                  from: 'from-sky-50',
                  via: 'via-white',
                  to: 'to-purple-50'
                }) : undefined
              }
            })}
            className="rounded border-gray-300 focus:ring-2"
            style={{ color: primaryColor, "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
          <span className="text-xs font-medium text-gray-700">Enable Gradient</span>
        </label>
      </div>

      {/* Background Gradient Colors */}
      {formData.background_style?.is_gradient && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Gradient Colors
          </label>
          <div className="flex items-center gap-2">
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.background_style?.gradient?.from?.replace('from-', '') || 'sky-50'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        ...formData.background_style?.gradient,
                        from: `from-${colorClass}`,
                        via: formData.background_style?.gradient?.via || 'via-white',
                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.backgroundGradientFrom}
                onToggle={() => toggleColorPicker('backgroundGradientFrom')}
                onClose={() => toggleColorPicker('backgroundGradientFrom')}
                buttonClassName="w-full"
                title="From"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.background_style?.gradient?.via?.replace('via-', '') || 'white'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        from: formData.background_style?.gradient?.from || 'from-sky-50',
                        via: `via-${colorClass}`,
                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.backgroundGradientVia}
                onToggle={() => toggleColorPicker('backgroundGradientVia')}
                onClose={() => toggleColorPicker('backgroundGradientVia')}
                buttonClassName="w-full"
                title="Via"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.background_style?.gradient?.to?.replace('to-', '') || 'purple-50'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        from: formData.background_style?.gradient?.from || 'from-sky-50',
                        via: formData.background_style?.gradient?.via || 'via-white',
                        to: `to-${colorClass}`
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.backgroundGradientTo}
                onToggle={() => toggleColorPicker('backgroundGradientTo')}
                onClose={() => toggleColorPicker('backgroundGradientTo')}
                buttonClassName="w-full"
                title="To"
                useFixedPosition={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Title */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          SEO Title (Optional)
        </label>
        <input
          type="text"
          value={formData.background_style?.seo_title || ''}
          onChange={(e) => setFormData({
            ...formData,
            background_style: { ...formData.background_style, seo_title: e.target.value }
          })}
          placeholder="Enter SEO-friendly title..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Column Layout */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Background Columns
        </label>
        <select
          value={formData.background_style?.column || 1}
          onChange={(e) => setFormData({
            ...formData,
            background_style: { ...formData.background_style, column: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        >
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
        </select>
      </div>
    </div>
  );
}
