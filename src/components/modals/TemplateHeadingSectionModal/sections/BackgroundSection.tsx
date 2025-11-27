/**
 * BackgroundSection Component
 * 
 * Form section for background color and gradient settings
 */

import React from 'react';
import { HeadingFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface BackgroundSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  openColorPickers: {
    backgroundColor: boolean;
    backgroundGradientFrom: boolean;
    backgroundGradientVia: boolean;
    backgroundGradientTo: boolean;
  };
  toggleColorPicker: (key: 'backgroundColor' | 'backgroundGradientFrom' | 'backgroundGradientVia' | 'backgroundGradientTo') => void;
  primaryColor: string;
}

export function BackgroundSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  primaryColor,
}: BackgroundSectionProps) {
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
            value={formData.background_color || 'white'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                background_color: colorClass
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
            checked={!!formData.gradient_enabled}
            onChange={(e) => setFormData({
              ...formData,
              gradient_enabled: e.target.checked,
              gradient_config: e.target.checked ? (formData.gradient_config || {
                from: 'sky-50',
                via: 'white',
                to: 'purple-50'
              }) : null
            })}
            className="rounded border-gray-300 focus:ring-2"
            style={{ color: primaryColor, "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
          <span className="text-xs font-medium text-gray-700">Enable Gradient</span>
        </label>
      </div>

      {/* Background Gradient Colors */}
      {formData.gradient_enabled && formData.gradient_config && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Gradient Colors
          </label>
          <div className="flex items-center gap-2">
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.gradient_config.from || 'sky-50'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    gradient_config: {
                      ...formData.gradient_config!,
                      from: colorClass,
                      via: formData.gradient_config?.via || 'white',
                      to: formData.gradient_config!.to
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
                value={formData.gradient_config.via || 'white'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    gradient_config: {
                      from: formData.gradient_config!.from,
                      via: colorClass,
                      to: formData.gradient_config!.to
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
                value={formData.gradient_config.to || 'purple-50'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    gradient_config: {
                      from: formData.gradient_config!.from,
                      via: formData.gradient_config?.via || 'white',
                      to: colorClass
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
    </div>
  );
}
