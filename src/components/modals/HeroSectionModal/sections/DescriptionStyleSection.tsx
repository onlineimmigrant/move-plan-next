/**
 * DescriptionStyleSection Component
 * 
 * Form section for description text and styling
 */

import React from 'react';
import { HeroFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';

interface DescriptionStyleSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  openColorPickers: {
    descriptionColor: boolean;
  };
  toggleColorPicker: (key: 'descriptionColor') => void;
}

export function DescriptionStyleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
}: DescriptionStyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Description Settings</h3>
      
      {/* Description Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Description Text
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter hero description..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
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
            value={formData.description_style?.size?.desktop || 'text-2xl'}
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  desktop: formData.description_style?.size?.desktop || 'text-2xl',
                  mobile: e.target.value
                }
              }
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
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
          {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
            <button
              key={weight}
              onClick={() => setFormData({
                ...formData,
                description_style: { ...formData.description_style, weight }
              })}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                formData.description_style?.weight === weight
                  ? 'bg-sky-100 text-sky-700 border-sky-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {weight === 'normal' ? 'Normal' : weight}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
