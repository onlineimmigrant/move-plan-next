/**
 * DescriptionSection Component
 * 
 * Form section for heading description text and styling
 */

import React from 'react';
import { HeadingFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';

interface DescriptionSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  openColorPickers: {
    descriptionColor: boolean;
  };
  toggleColorPicker: (key: 'descriptionColor') => void;
  primaryColor: string;
}

export function DescriptionSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  primaryColor,
}: DescriptionSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Description Settings</h3>
      
      {/* Description Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Description Text
        </label>
        <textarea
          value={formData.description_text || ''}
          onChange={(e) => setFormData({ ...formData, description_text: e.target.value })}
          placeholder="Enter heading description..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 resize-none"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Description Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Description Color
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.description_style?.color || 'gray-600'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                description_style: { ...formData.description_style, color: colorClass }
              });
              toggleColorPicker('descriptionColor');
            }}
            isOpen={openColorPickers.descriptionColor}
            onToggle={() => toggleColorPicker('descriptionColor')}
            onClose={() => toggleColorPicker('descriptionColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Description Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Desktop Size
          </label>
          <select
            value={formData.description_style?.size?.desktop || 'text-xl'}
            onChange={(e) => setFormData({
              ...formData,
              description_style: {
                ...formData.description_style,
                size: {
                  desktop: e.target.value,
                  mobile: formData.description_style?.size?.mobile || 'text-lg'
                }
              }
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
          >
            <option value="text-sm">Small</option>
            <option value="text-base">Base</option>
            <option value="text-lg">Large</option>
            <option value="text-xl">XL</option>
            <option value="text-2xl">2XL</option>
            <option value="text-3xl">3XL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Mobile Size
          </label>
          <select
            value={formData.description_style?.size?.mobile || 'text-lg'}
            onChange={(e) => setFormData({
              ...formData,
              description_style: {
                ...formData.description_style,
                size: {
                  desktop: formData.description_style?.size?.desktop || 'text-xl',
                  mobile: e.target.value
                }
              }
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
          >
            <option value="text-xs">XS</option>
            <option value="text-sm">Small</option>
            <option value="text-base">Base</option>
            <option value="text-lg">Large</option>
            <option value="text-xl">XL</option>
          </select>
        </div>
      </div>

      {/* Description Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Weight
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['font-light', 'font-normal', 'font-medium', 'font-semibold'] as const).map((weight) => (
            <button
              key={weight}
              onClick={() => setFormData({
                ...formData,
                description_style: { ...formData.description_style, weight }
              })}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                formData.description_style?.weight === weight
                  ? 'border-2'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
              style={formData.description_style?.weight === weight ? {
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: primaryColor
              } : {}}
            >
              {weight.replace('font-', '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
