// /components/Shared/EditableFields/EditableGradientPicker.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import EditableToggle from './EditableToggle';
import { getBackgroundStyle } from '@/utils/gradientHelper';

interface GradientStyle {
  from: string;
  via?: string;
  to: string;
}

interface EditableGradientPickerProps {
  label: string;
  isGradient: boolean;
  gradient: GradientStyle | null;
  solidColor: string;
  onGradientChange: (isGradient: boolean, gradient: GradientStyle | null) => void;
  onSolidColorChange: (color: string) => void;
}

const GRADIENT_PRESETS = [
  { name: 'Ocean Breeze', from: 'blue-400', via: 'cyan-300', to: 'teal-400' },
  { name: 'Sunset Glow', from: 'orange-400', via: 'pink-400', to: 'purple-500' },
  { name: 'Fresh Growth', from: 'emerald-400', via: 'green-400', to: 'teal-500' },
  { name: 'Purple Dreams', from: 'purple-400', via: 'fuchsia-400', to: 'pink-500' },
  { name: 'Fire Blaze', from: 'red-500', via: 'orange-500', to: 'yellow-400' },
  { name: 'Deep Ocean', from: 'blue-600', via: 'indigo-500', to: 'purple-600' },
  { name: 'Forest Path', from: 'green-600', via: 'emerald-500', to: 'teal-600' },
  { name: 'Rose Garden', from: 'pink-400', via: 'rose-400', to: 'red-500' },
];

export default function EditableGradientPicker({
  label,
  isGradient,
  gradient,
  solidColor,
  onGradientChange,
  onSolidColorChange,
}: EditableGradientPickerProps) {
  const [showGradientPanel, setShowGradientPanel] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState<'from' | 'via' | 'to' | 'solid' | null>(null);

  const handleToggleGradient = (enabled: boolean) => {
    if (enabled) {
      // Enable gradient with a default preset
      const defaultGradient: GradientStyle = {
        from: 'blue-400',
        via: 'cyan-300',
        to: 'teal-400',
      };
      onGradientChange(true, defaultGradient);
    } else {
      // Disable gradient
      onGradientChange(false, null);
    }
  };

  const handlePresetSelect = (preset: typeof GRADIENT_PRESETS[0]) => {
    const newGradient: GradientStyle = {
      from: preset.from,
      via: preset.via,
      to: preset.to,
    };
    onGradientChange(true, newGradient);
  };

  const handleColorChange = (field: 'from' | 'via' | 'to', color: string) => {
    if (!gradient) return;
    
    const newGradient: GradientStyle = {
      ...gradient,
      [field]: color,
    };
    onGradientChange(true, newGradient);
    setOpenColorPicker(null);
  };

  const handleRemoveVia = () => {
    if (!gradient) return;
    const { via, ...rest } = gradient;
    onGradientChange(true, rest as GradientStyle);
  };

  const handleAddVia = () => {
    if (!gradient) return;
    const newGradient: GradientStyle = {
      ...gradient,
      via: 'purple-400',
    };
    onGradientChange(true, newGradient);
  };

  // Get preview gradient style
  const getPreviewStyle = () => {
    if (!isGradient || !gradient) {
      // For solid color, we need to use getBackgroundStyle too
      return getBackgroundStyle(false, null, solidColor);
    }

    // Use the same helper function that the actual components use
    return getBackgroundStyle(true, gradient, solidColor);
  };

  return (
    <div className="space-y-3">
      {/* Label and Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Use Gradient</span>
          <EditableToggle
            label=""
            value={isGradient}
            onChange={handleToggleGradient}
          />
        </div>
      </div>

      {/* Solid Color Picker (when gradient is off) */}
      {!isGradient && (
        <div className="relative">
          <ColorPaletteDropdown
            value={solidColor}
            onChange={onSolidColorChange}
            isOpen={openColorPicker === 'solid'}
            onToggle={() => setOpenColorPicker(openColorPicker === 'solid' ? null : 'solid')}
            onClose={() => setOpenColorPicker(null)}
            buttonClassName="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            previewSize="md"
            iconSize="md"
          />
        </div>
      )}

      {/* Gradient Controls (when gradient is on) */}
      {isGradient && gradient && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* Gradient Preview */}
          <div
            className="w-full h-16 rounded-lg border-2 border-white shadow-sm"
            style={getPreviewStyle()}
          />

          {/* Gradient Presets */}
          <div>
            <button
              type="button"
              onClick={() => setShowGradientPanel(!showGradientPanel)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>Gradient Presets</span>
              <ChevronDownIcon
                className={cn('w-4 h-4 transition-transform', showGradientPanel && 'rotate-180')}
              />
            </button>

            {showGradientPanel && (
              <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                {GRADIENT_PRESETS.map((preset) => {
                  const presetGradient = {
                    from: preset.from,
                    via: preset.via,
                    to: preset.to
                  };
                  const presetStyle = getBackgroundStyle(true, presetGradient, 'white');
                  
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
                      title={preset.name}
                    >
                      <div
                        className="w-full h-12"
                        style={presetStyle}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Gradient Colors */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Custom Colors
            </div>

            {/* From Color */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-12">From:</span>
              <ColorPaletteDropdown
                value={gradient.from}
                onChange={(color) => handleColorChange('from', color)}
                isOpen={openColorPicker === 'from'}
                onToggle={() => setOpenColorPicker(openColorPicker === 'from' ? null : 'from')}
                onClose={() => setOpenColorPicker(null)}
                buttonClassName="flex-1 px-3 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 transition-colors text-sm"
                previewSize="sm"
                iconSize="sm"
              />
            </div>

            {/* Via Color (optional) */}
            {gradient.via ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-12">Via:</span>
                <ColorPaletteDropdown
                  value={gradient.via}
                  onChange={(color) => handleColorChange('via', color)}
                  isOpen={openColorPicker === 'via'}
                  onToggle={() => setOpenColorPicker(openColorPicker === 'via' ? null : 'via')}
                  onClose={() => setOpenColorPicker(null)}
                  buttonClassName="flex-1 px-3 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 transition-colors text-sm"
                  previewSize="sm"
                  iconSize="sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveVia}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove via color"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddVia}
                className="w-full px-3 py-1.5 text-sm text-gray-600 bg-white border border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Add via color (3-color gradient)
              </button>
            )}

            {/* To Color */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-12">To:</span>
              <ColorPaletteDropdown
                value={gradient.to}
                onChange={(color) => handleColorChange('to', color)}
                isOpen={openColorPicker === 'to'}
                onToggle={() => setOpenColorPicker(openColorPicker === 'to' ? null : 'to')}
                onClose={() => setOpenColorPicker(null)}
                buttonClassName="flex-1 px-3 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 transition-colors text-sm"
                previewSize="sm"
                iconSize="sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
