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
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter heading description..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 resize-none"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Description Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Description Color (Optional)
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.description_color || 'gray-600'}
            onChange={(colorClass: string) => {
              setFormData({ ...formData, description_color: colorClass });
              toggleColorPicker('descriptionColor');
            }}
            isOpen={openColorPickers.descriptionColor}
            onToggle={() => toggleColorPicker('descriptionColor')}
            onClose={() => toggleColorPicker('descriptionColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Description Font */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Family
        </label>
        <select
          value={formData.description_font}
          onChange={(e) => setFormData({ ...formData, description_font: e.target.value as any })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        >
          <option value="sans">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
          <option value="display">Display</option>
        </select>
      </div>

      {/* Description Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Size
        </label>
        <select
          value={formData.description_size}
          onChange={(e) => setFormData({ ...formData, description_size: e.target.value as any })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        >
          <option value="xs">Extra Small</option>
          <option value="sm">Small</option>
          <option value="md">Medium (Default)</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
          <option value="2xl">2X Large</option>
          <option value="3xl">3X Large</option>
          <option value="4xl">4X Large</option>
        </select>
      </div>

      {/* Description Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Weight
        </label>
        <select
          value={formData.description_weight}
          onChange={(e) => setFormData({ ...formData, description_weight: e.target.value as any })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        >
          <option value="light">Light</option>
          <option value="normal">Normal (Default)</option>
          <option value="medium">Medium</option>
          <option value="semibold">Semibold</option>
          <option value="bold">Bold</option>
        </select>
      </div>
    </div>
  );
}
