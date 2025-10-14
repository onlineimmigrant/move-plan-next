import React, { useState } from 'react';
import { ColorSelect } from './ColorSelect';
import { FooterStyle, FooterType } from '@/types/settings';

interface FooterStyleFieldProps {
  label: string;
  name: string;
  value: FooterStyle | string | null;
  onChange: (name: string, value: FooterStyle) => void;
}

const FOOTER_TYPES: { value: FooterType; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Multi-column grid layout with sections' },
  { value: 'compact', label: 'Compact', description: 'Horizontal navigation bar style' },
  { value: 'grid', label: 'Grid', description: 'Balanced 4-column grid layout' }
];

export const FooterStyleField: React.FC<FooterStyleFieldProps> = ({
  label,
  name,
  value,
  onChange
}) => {
  console.log('🎨 FooterStyleField render:', { name, value, valueType: typeof value });

  // Parse the current value
  const currentValue: FooterStyle = 
    typeof value === 'object' && value !== null
      ? value
      : {
          type: 'default',
          background: typeof value === 'string' ? value : 'neutral-900',
          color: 'neutral-400',
          color_hover: 'white'
        };

  console.log('🎨 FooterStyleField currentValue:', currentValue);

  const handleColorChange = (field: keyof FooterStyle, colorValue: string) => {
    console.log('🎨 FooterStyleField handleColorChange called:', { field, colorValue });
    const newValue: FooterStyle = {
      ...currentValue,
      [field]: colorValue
    };
    console.log('🎨 FooterStyleField newValue:', newValue);
    console.log('🎨 FooterStyleField calling onChange with:', { name, newValue });
    onChange(name, newValue);
    console.log('🎨 FooterStyleField onChange called');
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('🎨 FooterStyleField handleTypeChange called:', e.target.value);
    const newValue: FooterStyle = {
      ...currentValue,
      type: e.target.value as FooterType
    };
    onChange(name, newValue);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-4">{label}</label>
      
      {/* Footer Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Footer Layout Type
        </label>
        <select
          value={currentValue.type || 'default'}
          onChange={handleTypeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {FOOTER_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Choose the layout style for your footer
        </p>
      </div>

      {/* Color Pickers */}
      <div className="grid grid-cols-1 gap-4">
        <ColorSelect
          label="Background Color"
          name={`${name}_background`}
          value={currentValue.background || 'neutral-900'}
          onChange={(_, value) => handleColorChange('background', value)}
        />
        
        <ColorSelect
          label="Link Color"
          name={`${name}_color`}
          value={currentValue.color || 'neutral-400'}
          onChange={(_, value) => handleColorChange('color', value)}
        />
        
        <ColorSelect
          label="Link Hover Color"
          name={`${name}_color_hover`}
          value={currentValue.color_hover || 'white'}
          onChange={(_, value) => handleColorChange('color_hover', value)}
        />
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
        <div 
          className={`p-4 rounded-md ${!currentValue.background?.startsWith('#') ? `bg-${currentValue.background}` : ''}`}
          style={{
            backgroundColor: currentValue.background?.startsWith('#') 
              ? currentValue.background 
              : undefined
          }}
        >
          <p className="text-xs text-gray-500 mb-2">Type: {currentValue.type || 'default'}</p>
          <p 
            className={`text-sm ${!currentValue.color?.startsWith('#') ? `text-${currentValue.color}` : ''}`}
            style={{
              color: currentValue.color?.startsWith('#') 
                ? currentValue.color 
                : undefined
            }}
          >
            Sample link text
          </p>
          <p 
            className={`text-sm mt-1 ${!currentValue.color_hover?.startsWith('#') ? `text-${currentValue.color_hover}` : ''}`}
            style={{
              color: currentValue.color_hover?.startsWith('#') 
                ? currentValue.color_hover 
                : undefined
            }}
          >
            Sample link on hover
          </p>
        </div>
      </div>
    </div>
  );
};
