/**
 * TitleSection Component
 * 
 * Form section for heading title text and styling
 */

import React from 'react';
import { HeadingFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface TitleSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  openColorPickers: {
    titleColor: boolean;
  };
  toggleColorPicker: (key: 'titleColor') => void;
  primaryColor: string;
}

export function TitleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  primaryColor,
}: TitleSectionProps) {
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
          placeholder="Enter heading title..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{
            '--tw-ring-color': primaryColor
          } as React.CSSProperties}
        />
      </div>

      {/* Title Font */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Family
        </label>
        <select
          value={formData.title_font}
          onChange={(e) => setFormData({ ...formData, title_font: e.target.value as any })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
        >
          <option value="sans">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
          <option value="display">Display</option>
        </select>
      </div>

      {/* Title Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Size
        </label>
        <select
          value={formData.title_size}
          onChange={(e) => setFormData({ ...formData, title_size: e.target.value as any })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
        >
          <option value="xs">Extra Small</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
          <option value="2xl">2X Large</option>
          <option value="3xl">3X Large (Default)</option>
          <option value="4xl">4X Large</option>
        </select>
      </div>

      {/* Title Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Weight
        </label>
        <select
          value={formData.title_weight}
          onChange={(e) => setFormData({ ...formData, title_weight: e.target.value as any })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
        >
          <option value="light">Light</option>
          <option value="normal">Normal</option>
          <option value="medium">Medium</option>
          <option value="semibold">Semibold</option>
          <option value="bold">Bold (Default)</option>
        </select>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Alignment
        </label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => setFormData({ ...formData, alignment: align })}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize ${
                formData.alignment === align
                  ? 'border-2'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              style={formData.alignment === align ? {
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: primaryColor
              } : {}}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      {/* Title Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Title Color (Optional)
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.title_color || 'gray-800'}
            onChange={(colorClass: string) => {
              setFormData({ ...formData, title_color: colorClass });
              toggleColorPicker('titleColor');
            }}
            isOpen={openColorPickers.titleColor}
            onToggle={() => toggleColorPicker('titleColor')}
            onClose={() => toggleColorPicker('titleColor')}
            useFixedPosition={true}
          />
        </div>
      </div>
    </div>
  );
}
