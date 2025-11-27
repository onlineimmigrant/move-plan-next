/**
 * ButtonSection Component
 * 
 * Form section for button text, URL, and styling
 */

import React from 'react';
import { HeadingFormData } from '../types';
import { cn } from '@/lib/utils';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface ButtonSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  openColorPickers: {
    buttonColor: boolean;
    buttonTextColor: boolean;
  };
  toggleColorPicker: (key: 'buttonColor' | 'buttonTextColor') => void;
  primaryColor: string;
}

export function ButtonSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  primaryColor,
}: ButtonSectionProps) {
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
          value={formData.button_text || ''}
          onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
          placeholder="Learn More"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Text Link Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.button_is_text_link}
            onChange={(e) => setFormData({
              ...formData,
              button_is_text_link: e.target.checked
            })}
            className="rounded border-gray-300 focus:ring-2"
            style={{ color: primaryColor, "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
          <span className="text-xs font-medium text-gray-700">Show as Text Link (instead of button)</span>
        </label>
      </div>

      {/* Button Color */}
      {!formData.button_is_text_link && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Button Background Color
          </label>
          <div className="dropdown-container">
            <ColorPaletteDropdown
              value={formData.button_color || 'emerald-500'}
              onChange={(colorClass: string) => {
                setFormData({ ...formData, button_color: colorClass });
                toggleColorPicker('buttonColor');
              }}
              isOpen={openColorPickers.buttonColor}
              onToggle={() => toggleColorPicker('buttonColor')}
              onClose={() => toggleColorPicker('buttonColor')}
              useFixedPosition={true}
            />
          </div>
        </div>
      )}

      {/* Button Text Color */}
      {!formData.button_is_text_link && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Button Text Color
          </label>
          <div className="dropdown-container">
            <ColorPaletteDropdown
              value={formData.button_text_color || 'white'}
              onChange={(colorClass: string) => {
                setFormData({ ...formData, button_text_color: colorClass });
                toggleColorPicker('buttonTextColor');
              }}
              isOpen={openColorPickers.buttonTextColor}
              onToggle={() => toggleColorPicker('buttonTextColor')}
              onClose={() => toggleColorPicker('buttonTextColor')}
              useFixedPosition={true}
            />
          </div>
        </div>
      )}

      {/* URL Page */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Page URL (Internal)
        </label>
        <input
          type="text"
          value={formData.url_page || ''}
          onChange={(e) => setFormData({ ...formData, url_page: e.target.value })}
          placeholder="/about"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
        <p className="mt-1 text-xs text-gray-500">
          Internal page path (e.g., "/about", "/products")
        </p>
      </div>

      {/* External URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          External URL (Optional)
        </label>
        <input
          type="text"
          value={formData.button_url || ''}
          onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
        <p className="mt-1 text-xs text-gray-500">
          External link (overrides page URL if set)
        </p>
      </div>

      {/* Button Style Preview */}
      {!formData.button_is_text_link && formData.button_text && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Button Preview
          </label>
          <div className="p-4 bg-gray-50 rounded-md">
            <button
              className="px-6 py-3 rounded-full text-white font-medium"
              style={{
                backgroundColor: formData.button_color || primaryColor,
                color: formData.button_text_color || 'white',
              }}
            >
              {formData.button_text}
            </button>
          </div>
        </div>
      )}

      {/* Text Link Preview */}
      {formData.button_is_text_link && formData.button_text && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Link Preview
          </label>
          <div className="p-4 bg-gray-50 rounded-md">
            <a
              href="#"
              className="font-medium underline"
              style={{ color: primaryColor }}
              onClick={(e) => e.preventDefault()}
            >
              {formData.button_text} →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
