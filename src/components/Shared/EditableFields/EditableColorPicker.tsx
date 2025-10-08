// components/Shared/EditableFields/EditableColorPicker.tsx
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getColorValue, getColorClass } from '@/components/Shared/ColorPaletteDropdown';

// Tailwind color palette
const COLOR_PALETTE = [
  { name: 'White', value: '#FFFFFF', class: 'white' },
  { name: 'Gray 50', value: '#F9FAFB', class: 'gray-50' },
  { name: 'Gray 100', value: '#F3F4F6', class: 'gray-100' },
  { name: 'Gray 200', value: '#E5E7EB', class: 'gray-200' },
  { name: 'Blue 50', value: '#EFF6FF', class: 'blue-50' },
  { name: 'Blue 100', value: '#DBEAFE', class: 'blue-100' },
  { name: 'Sky 50', value: '#F0F9FF', class: 'sky-50' },
  { name: 'Indigo 50', value: '#EEF2FF', class: 'indigo-50' },
  { name: 'Purple 50', value: '#FAF5FF', class: 'purple-50' },
  { name: 'Pink 50', value: '#FDF2F8', class: 'pink-50' },
  { name: 'Rose 50', value: '#FFF1F2', class: 'rose-50' },
  { name: 'Orange 50', value: '#FFF7ED', class: 'orange-50' },
  { name: 'Amber 50', value: '#FFFBEB', class: 'amber-50' },
  { name: 'Yellow 50', value: '#FEFCE8', class: 'yellow-50' },
  { name: 'Lime 50', value: '#F7FEE7', class: 'lime-50' },
  { name: 'Green 50', value: '#F0FDF4', class: 'green-50' },
  { name: 'Emerald 50', value: '#ECFDF5', class: 'emerald-50' },
  { name: 'Teal 50', value: '#F0FDFA', class: 'teal-50' },
  { name: 'Cyan 50', value: '#ECFEFF', class: 'cyan-50' },
];

interface EditableColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presetColors?: { name: string; value: string; class: string; }[];
  error?: string;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export default function EditableColorPicker({
  label,
  value,
  onChange,
  presetColors = COLOR_PALETTE,
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
            style={{ backgroundColor: getColorValue(value) }}
            onClick={() => !disabled && setShowPicker(!showPicker)}
            title="Click to toggle color picker"
          />

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="white"
            disabled={disabled}
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
      </div>

      {/* Preset Colors */}
      {showPicker && !disabled && (
        <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {presetColors.map((color) => (
            <button
              key={color.class}
              type="button"
              onClick={() => {
                onChange(color.class);
                setShowPicker(false);
              }}
              className={cn(
                'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110',
                getColorClass(value) === color.class
                  ? 'border-sky-500 ring-2 ring-sky-500 ring-offset-1'
                  : 'border-gray-300'
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
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
