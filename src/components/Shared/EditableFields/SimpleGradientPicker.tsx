'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface GradientStyle {
  from: string;
  via?: string;
  to: string;
}

interface SimpleGradientPickerProps {
  label: string;
  isGradient: boolean;
  gradient: GradientStyle | null;
  solidColor: string;
  onGradientChange: (isGradient: boolean, gradient: GradientStyle | null) => void;
  onSolidColorChange: (color: string) => void;
}

export default function SimpleGradientPicker({
  label,
  isGradient,
  gradient,
  solidColor,
  onGradientChange,
  onSolidColorChange,
}: SimpleGradientPickerProps) {
  const [openColorPickers, setOpenColorPickers] = useState({
    solid: false,
    from: false,
    via: false,
    to: false,
  });

  const toggleColorPicker = (key: keyof typeof openColorPickers) => {
    setOpenColorPickers(prev => ({
      solid: false,
      from: false,
      via: false,
      to: false,
      [key]: !prev[key],
    }));
  };

  const handleToggleMode = () => {
    if (!isGradient) {
      const defaultGradient: GradientStyle = {
        from: 'blue-500',
        via: 'purple-500',
        to: 'pink-500',
      };
      onGradientChange(true, defaultGradient);
    } else {
      onGradientChange(false, null);
    }
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</h3>
      
      <div className="flex items-center gap-2">
        {/* Gradient Toggle Button */}
        <button
          onClick={handleToggleMode}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all hover:shadow-sm whitespace-nowrap",
            isGradient
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
          )}
          title={isGradient ? "Switch to solid color" : "Switch to gradient"}
        >
          {isGradient ? '⚡' : '●'}
        </button>

        {/* Color Pickers */}
        {!isGradient ? (
          /* Solid Color Picker */
          <div className="dropdown-container flex-1">
            <ColorPaletteDropdown
              value={solidColor || '#ffffff'}
              onChange={(colorValue: string) => {
                onSolidColorChange(colorValue);
                toggleColorPicker('solid');
              }}
              isOpen={openColorPickers.solid}
              onToggle={() => toggleColorPicker('solid')}
              onClose={() => toggleColorPicker('solid')}
              buttonClassName="w-full"
              useFixedPosition={true}
            />
          </div>
        ) : (
          /* Gradient Color Pickers */
          <>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={gradient?.from || 'blue-500'}
                onChange={(colorValue: string) => {
                  const newGradient: GradientStyle = {
                    from: colorValue,
                    via: gradient?.via || 'purple-500',
                    to: gradient?.to || 'pink-500',
                  };
                  onGradientChange(true, newGradient);
                  toggleColorPicker('from');
                }}
                isOpen={openColorPickers.from}
                onToggle={() => toggleColorPicker('from')}
                onClose={() => toggleColorPicker('from')}
                buttonClassName="w-full"
                title="From"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={gradient?.via || 'purple-500'}
                onChange={(colorValue: string) => {
                  const newGradient: GradientStyle = {
                    from: gradient?.from || 'blue-500',
                    via: colorValue,
                    to: gradient?.to || 'pink-500',
                  };
                  onGradientChange(true, newGradient);
                  toggleColorPicker('via');
                }}
                isOpen={openColorPickers.via}
                onToggle={() => toggleColorPicker('via')}
                onClose={() => toggleColorPicker('via')}
                buttonClassName="w-full"
                title="Via"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={gradient?.to || 'pink-500'}
                onChange={(colorValue: string) => {
                  const newGradient: GradientStyle = {
                    from: gradient?.from || 'blue-500',
                    via: gradient?.via || 'purple-500',
                    to: colorValue,
                  };
                  onGradientChange(true, newGradient);
                  toggleColorPicker('to');
                }}
                isOpen={openColorPickers.to}
                onToggle={() => toggleColorPicker('to')}
                onClose={() => toggleColorPicker('to')}
                buttonClassName="w-full"
                title="To"
                useFixedPosition={true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

