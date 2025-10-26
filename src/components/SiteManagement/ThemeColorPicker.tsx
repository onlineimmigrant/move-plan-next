'use client';

import React, { useState } from 'react';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

interface ThemeColorPickerProps {
  label: string;
  colorValue: string;  // e.g., 'sky'
  shadeValue: number;  // e.g., 600
  onColorChange: (color: string) => void;
  onShadeChange: (shade: number) => void;
  disabled?: boolean;
}

const shadeOptions = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  label,
  colorValue,
  shadeValue,
  onColorChange,
  onShadeChange,
  disabled = false,
}) => {
  const currentColorClass = `${colorValue}-${shadeValue}`;
  const currentHexValue = getColorValue(currentColorClass);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Current Color Preview */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div 
          className="w-16 h-16 rounded-lg border-2 border-white shadow-sm"
          style={{ backgroundColor: currentHexValue }}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {colorValue.charAt(0).toUpperCase() + colorValue.slice(1)} {shadeValue}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {currentHexValue}
          </div>
        </div>
      </div>

      {/* Color Family Selector */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Color Family
        </label>
        <div className="relative z-0">
          <ColorPaletteDropdown
            value={currentColorClass}
            onChange={(colorClass: string) => {
              // Extract color family from colorClass (e.g., 'sky-600' → 'sky')
              const [color] = colorClass.split('-');
              onColorChange(color);
            }}
            useFixedPosition={true}
            title="Select color family"
          />
        </div>
      </div>

      {/* Shade Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Shade
        </label>
        <div className="grid grid-cols-5 gap-2">
          {shadeOptions.map((shade) => {
            const isSelected = shade === shadeValue;
            const previewColorClass = `${colorValue}-${shade}`;
            const previewHex = getColorValue(previewColorClass);
            
            return (
              <button
                key={shade}
                type="button"
                onClick={() => !disabled && onShadeChange(shade)}
                disabled={disabled}
                className={`
                  relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isSelected 
                    ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md' 
                    : 'hover:ring-2 hover:ring-gray-300 hover:shadow-sm'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ 
                  backgroundColor: previewHex,
                  color: shade >= 500 ? '#ffffff' : '#000000'
                }}
              >
                {shade}
              </button>
            );
          })}
        </div>
      </div>

      {/* Usage Hint */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-2">
        💡 This color will be used for buttons, links, and accent elements throughout your site
      </div>
    </div>
  );
};
