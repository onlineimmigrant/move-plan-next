/**
 * TitleStyleSection Component
 * 
 * Form section for title text and styling
 */

import React from 'react';
import { HeroFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';

interface TitleStyleSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  openColorPickers: {
    titleColor: boolean;
    titleGradientFrom: boolean;
    titleGradientVia: boolean;
    titleGradientTo: boolean;
  };
  toggleColorPicker: (key: 'titleColor' | 'titleGradientFrom' | 'titleGradientVia' | 'titleGradientTo') => void;
}

export function TitleStyleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
}: TitleStyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Title Settings</h3>
      
      {/* Title Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Title Text
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter hero title..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Title Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Title Color
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.title_style?.color || 'gray-800'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                title_style: { ...formData.title_style, color: colorClass }
              });
              toggleColorPicker('titleColor');
            }}
            isOpen={openColorPickers.titleColor}
            onToggle={() => toggleColorPicker('titleColor')}
            onClose={() => toggleColorPicker('titleColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Title Gradient Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.title_style?.is_gradient}
            onChange={(e) => setFormData({
              ...formData,
              title_style: {
                ...formData.title_style,
                is_gradient: e.target.checked,
                gradient: e.target.checked ? (formData.title_style?.gradient || {
                  from: 'blue-600',
                  via: 'purple-600',
                  to: 'pink-600'
                }) : undefined
              }
            })}
            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-xs font-medium text-gray-700">Enable Gradient</span>
        </label>
      </div>

      {/* Gradient Colors */}
      {formData.title_style?.is_gradient && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Gradient Colors
          </label>
          <div className="flex items-center gap-2">
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.title_style?.gradient?.from || 'blue-600'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        ...formData.title_style?.gradient,
                        from: colorClass,
                        via: formData.title_style?.gradient?.via || 'purple-600',
                        to: formData.title_style?.gradient?.to || 'pink-600'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.titleGradientFrom}
                onToggle={() => toggleColorPicker('titleGradientFrom')}
                onClose={() => toggleColorPicker('titleGradientFrom')}
                buttonClassName="w-full"
                title="From"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.title_style?.gradient?.via || 'purple-600'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        from: formData.title_style?.gradient?.from || 'blue-600',
                        via: colorClass,
                        to: formData.title_style?.gradient?.to || 'pink-600'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.titleGradientVia}
                onToggle={() => toggleColorPicker('titleGradientVia')}
                onClose={() => toggleColorPicker('titleGradientVia')}
                buttonClassName="w-full"
                title="Via"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.title_style?.gradient?.to || 'pink-600'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        from: formData.title_style?.gradient?.from || 'blue-600',
                        via: formData.title_style?.gradient?.via || 'purple-600',
                        to: colorClass
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.titleGradientTo}
                onToggle={() => toggleColorPicker('titleGradientTo')}
                onClose={() => toggleColorPicker('titleGradientTo')}
                buttonClassName="w-full"
                title="To"
                useFixedPosition={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Title Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Desktop Size
          </label>
          <select
            value={formData.title_style?.size?.desktop || 'text-7xl'}
            onChange={(e) => setFormData({
              ...formData,
              title_style: {
                ...formData.title_style,
                size: {
                  desktop: e.target.value,
                  mobile: formData.title_style?.size?.mobile || 'text-5xl'
                }
              }
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="text-4xl">4xl</option>
            <option value="text-5xl">5xl</option>
            <option value="text-6xl">6xl</option>
            <option value="text-7xl">7xl</option>
            <option value="text-8xl">8xl</option>
            <option value="text-9xl">9xl</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Mobile Size
          </label>
          <select
            value={formData.title_style?.size?.mobile || 'text-5xl'}
            onChange={(e) => setFormData({
              ...formData,
              title_style: {
                ...formData.title_style,
                size: {
                  desktop: formData.title_style?.size?.desktop || 'text-7xl',
                  mobile: e.target.value
                }
              }
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="text-2xl">2xl</option>
            <option value="text-3xl">3xl</option>
            <option value="text-4xl">4xl</option>
            <option value="text-5xl">5xl</option>
            <option value="text-6xl">6xl</option>
          </select>
        </div>
      </div>

      {/* Title Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Alignment
        </label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => setFormData({
                ...formData,
                title_style: { ...formData.title_style, alignment: align }
              })}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                formData.title_style?.alignment === align
                  ? 'bg-sky-100 text-sky-700 border-sky-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      {/* Block Width */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Block Width
        </label>
        <select
          value={formData.title_style?.blockWidth || '2xl'}
          onChange={(e) => setFormData({
            ...formData,
            title_style: { ...formData.title_style, blockWidth: e.target.value }
          })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="2xl">2xl</option>
          <option value="3xl">3xl</option>
          <option value="4xl">4xl</option>
          <option value="5xl">5xl</option>
          <option value="6xl">6xl</option>
          <option value="7xl">7xl</option>
          <option value="full">Full Width</option>
        </select>
      </div>

      {/* Block Columns */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Block Columns
        </label>
        <div className="flex gap-2">
          {[1, 2].map((cols) => (
            <button
              key={cols}
              onClick={() => setFormData({
                ...formData,
                title_style: { ...formData.title_style, blockColumns: cols }
              })}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors',
                formData.title_style?.blockColumns === cols
                  ? 'bg-sky-100 text-sky-700 border-sky-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {cols} Column{cols > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
