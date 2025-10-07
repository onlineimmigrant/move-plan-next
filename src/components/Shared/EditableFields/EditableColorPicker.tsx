// components/Shared/EditableFields/EditableColorPicker.tsx
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface EditableColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
  error?: string;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

const DEFAULT_PRESET_COLORS = [
  '#FFFFFF', // White
  '#F3F4F6', // Gray 100
  '#E5E7EB', // Gray 200
  '#D1D5DB', // Gray 300
  '#0EA5E9', // Sky 500
  '#0284C7', // Sky 600
  '#3B82F6', // Blue 500
  '#2563EB', // Blue 600
  '#10B981', // Green 500
  '#059669', // Green 600
  '#F59E0B', // Amber 500
  '#D97706', // Amber 600
  '#EF4444', // Red 500
  '#DC2626', // Red 600
  '#8B5CF6', // Violet 500
  '#7C3AED', // Violet 600
];

export default function EditableColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
  error,
  disabled = false,
  helperText,
  className,
}: EditableColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="flex gap-3 items-center">
        {/* Color Preview & Input */}
        <div className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              'w-10 h-10 rounded-lg border-2 cursor-pointer transition-all',
              error ? 'border-red-300' : 'border-gray-300',
              !disabled && 'hover:scale-110'
            )}
            style={{ backgroundColor: value || '#FFFFFF' }}
            onClick={() => !disabled && setShowPicker(!showPicker)}
            title="Click to toggle color picker"
          />

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#FFFFFF"
            disabled={disabled}
            maxLength={7}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border text-sm font-mono transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-sky-500',
              disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
            )}
          />
        </div>

        {/* Native Color Picker */}
        {!disabled && (
          <input
            type="color"
            value={value || '#FFFFFF'}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
            title="Pick color"
          />
        )}
      </div>

      {/* Preset Colors */}
      {showPicker && !disabled && (
        <div className="grid grid-cols-8 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setShowPicker(false);
              }}
              className={cn(
                'w-8 h-8 rounded-md border-2 transition-all hover:scale-110',
                value === color
                  ? 'border-sky-500 ring-2 ring-sky-500 ring-offset-1'
                  : 'border-gray-300'
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500">{helperText}</span>
      ) : null}
    </div>
  );
}
