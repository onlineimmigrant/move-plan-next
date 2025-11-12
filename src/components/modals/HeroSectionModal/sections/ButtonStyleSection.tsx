/**
 * ButtonStyleSection Component
 * 
 * Form section for button text, URL, and styling
 */

import React from 'react';
import { HeroFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';

interface ButtonStyleSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  openColorPickers: {
    buttonColor: boolean;
    buttonGradientFrom: boolean;
    buttonGradientVia: boolean;
    buttonGradientTo: boolean;
  };
  toggleColorPicker: (key: 'buttonColor' | 'buttonGradientFrom' | 'buttonGradientVia' | 'buttonGradientTo') => void;
}

export function ButtonStyleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
}: ButtonStyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Button Settings</h3>
      
      {/* Button Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Button Text
        </label>
        <input
          type="text"
          value={formData.button || ''}
          onChange={(e) => setFormData({ ...formData, button: e.target.value })}
          placeholder="Get Started"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Button URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Button URL
        </label>
        <input
          type="text"
          value={formData.button_style?.url || ''}
          onChange={(e) => setFormData({
            ...formData,
            button_style: { ...formData.button_style, url: e.target.value }
          })}
          placeholder="/products"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Button Position */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.button_style?.aboveDescription}
            onChange={(e) => setFormData({
              ...formData,
              button_style: { ...formData.button_style, aboveDescription: e.target.checked }
            })}
            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-xs font-medium text-gray-700">Show Button Above Description</span>
        </label>
      </div>

      {/* Video Button Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.button_style?.isVideo}
            onChange={(e) => setFormData({
              ...formData,
              button_style: { ...formData.button_style, isVideo: e.target.checked }
            })}
            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-xs font-medium text-gray-700">Video Button (Play Icon)</span>
        </label>
      </div>

      {/* Button Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Button Color
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.button_style?.color || 'gray-700'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                button_style: { ...formData.button_style, color: colorClass }
              });
              toggleColorPicker('buttonColor');
            }}
            isOpen={openColorPickers.buttonColor}
            onToggle={() => toggleColorPicker('buttonColor')}
            onClose={() => toggleColorPicker('buttonColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Button Gradient Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.button_style?.gradient}
            onChange={(e) => setFormData({
              ...formData,
              button_style: {
                ...formData.button_style,
                gradient: e.target.checked ? {
                  from: 'gray-700',
                  via: 'gray-700',
                  to: 'gray-900'
                } : undefined
              }
            })}
            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-xs font-medium text-gray-700">Enable Gradient</span>
        </label>
      </div>

      {/* Button Gradient Colors */}
      {formData.button_style?.gradient && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Gradient Colors
          </label>
          <div className="flex items-center gap-2">
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.button_style?.gradient?.from || 'gray-700'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    button_style: {
                      ...formData.button_style,
                      gradient: {
                        ...formData.button_style?.gradient,
                        from: colorClass,
                        via: formData.button_style?.gradient?.via || 'gray-700',
                        to: formData.button_style?.gradient?.to || 'gray-900'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.buttonGradientFrom}
                onToggle={() => toggleColorPicker('buttonGradientFrom')}
                onClose={() => toggleColorPicker('buttonGradientFrom')}
                buttonClassName="w-full"
                title="From"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.button_style?.gradient?.via || 'gray-700'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    button_style: {
                      ...formData.button_style,
                      gradient: {
                        from: formData.button_style?.gradient?.from || 'gray-700',
                        via: colorClass,
                        to: formData.button_style?.gradient?.to || 'gray-900'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.buttonGradientVia}
                onToggle={() => toggleColorPicker('buttonGradientVia')}
                onClose={() => toggleColorPicker('buttonGradientVia')}
                buttonClassName="w-full"
                title="Via"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.button_style?.gradient?.to || 'gray-900'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    button_style: {
                      ...formData.button_style,
                      gradient: {
                        from: formData.button_style?.gradient?.from || 'gray-700',
                        via: formData.button_style?.gradient?.via || 'gray-700',
                        to: colorClass
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.buttonGradientTo}
                onToggle={() => toggleColorPicker('buttonGradientTo')}
                onClose={() => toggleColorPicker('buttonGradientTo')}
                buttonClassName="w-full"
                title="To"
                useFixedPosition={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
