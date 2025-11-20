/**
 * StyleSection - Footer style settings
 * 2-column layout: Type | Background
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Shared/ToastContainer';
import { useThemeColors } from '@/hooks/useThemeColors';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface StyleSectionProps {
  selectedStyle: string;
  footerStyleFull: any;
  organizationId: string;
  onStyleChange: (style: string) => void;
  onStyleFullChange: (organizationId: string, style: any) => Promise<void>;
}

export function StyleSection({
  selectedStyle,
  footerStyleFull,
  organizationId,
  onStyleChange,
  onStyleFullChange
}: StyleSectionProps) {
  const toast = useToast();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Local state for colors
  const [textColor, setTextColor] = useState(footerStyleFull?.color || 'neutral-400');
  const [hoverColor, setHoverColor] = useState(footerStyleFull?.color_hover || 'white');
  const [bgColor, setBgColor] = useState(footerStyleFull?.background || 'neutral-900');
  const [isGradient, setIsGradient] = useState(footerStyleFull?.is_gradient || false);
  const [gradientFrom, setGradientFrom] = useState(footerStyleFull?.gradient?.from || 'neutral-900');
  const [gradientTo, setGradientTo] = useState(footerStyleFull?.gradient?.to || 'neutral-800');

  const handleColorUpdate = (field: string, value: string) => {
    const updatedStyle = { ...footerStyleFull };
    
    if (field === 'color') {
      setTextColor(value);
      updatedStyle.color = value;
    } else if (field === 'color_hover') {
      setHoverColor(value);
      updatedStyle.color_hover = value;
    } else if (field === 'background') {
      setBgColor(value);
      updatedStyle.background = value;
    } else if (field === 'gradient_from') {
      setGradientFrom(value);
      updatedStyle.gradient = { ...updatedStyle.gradient, from: value, to: gradientTo };
    } else if (field === 'gradient_to') {
      setGradientTo(value);
      updatedStyle.gradient = { ...updatedStyle.gradient, from: gradientFrom, to: value };
    }

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Color updated');
      })
      .catch((error) => {
        console.error('Failed to update color:', error);
        toast.error('Failed to update color');
      });
  };

  const handleGradientToggle = () => {
    const newIsGradient = !isGradient;
    setIsGradient(newIsGradient);
    
    const updatedStyle = {
      ...footerStyleFull,
      is_gradient: newIsGradient,
      gradient: newIsGradient ? { from: gradientFrom, to: gradientTo } : undefined
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Gradient ' + (newIsGradient ? 'enabled' : 'disabled'));
      })
      .catch((error) => {
        console.error('Failed to toggle gradient:', error);
        toast.error('Failed to toggle gradient');
      });
  };

  const handleTypeChange = (newType: string) => {
    // Update local state immediately
    onStyleChange(newType);
    
    // Also update footerStyleFull to reflect in preview
    const updatedStyle = {
      ...footerStyleFull,
      type: newType
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Footer type updated');
      })
      .catch((error) => {
        console.error('Failed to update footer type:', error);
        toast.error('Failed to update footer type');
      });
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Left Column: Type */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Type</h3>
        
        {/* Footer Type Selector - 2 per row */}
        <div className="grid grid-cols-2 gap-2">
          {['default', 'compact', 'grid'].map((style) => (
            <button
              key={style}
              onClick={() => handleTypeChange(style)}
              className={cn(
                'px-3 py-2 border-2 rounded-lg text-center transition-all font-medium text-sm',
                selectedStyle === style
                  ? 'shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              style={
                selectedStyle === style
                  ? {
                      borderColor: primary.base,
                      backgroundColor: `${primary.base}10`,
                      color: primary.base
                    }
                  : {}
              }
            >
              <div className="capitalize">{style}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Background */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Background</h3>
        
        <div className="space-y-3">
          {/* Row 1: Text Color + Hover Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Text Color
              </label>
              <div className="relative">
                <ColorPaletteDropdown
                  value={textColor}
                  onChange={(color) => handleColorUpdate('color', color)}
                  buttonClassName="w-full"
                  title="Text Color"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Hover Color
              </label>
              <div className="relative">
                <ColorPaletteDropdown
                  value={hoverColor}
                  onChange={(color) => handleColorUpdate('color_hover', color)}
                  buttonClassName="w-full"
                  title="Hover Color"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Background + Gradient */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Background
              </label>
              <div className="relative">
                <ColorPaletteDropdown
                  value={bgColor}
                  onChange={(color) => handleColorUpdate('background', color)}
                  buttonClassName="w-full"
                  title="Background Color"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Gradient
              </label>
              <button
                onClick={handleGradientToggle}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  isGradient ? 'bg-sky-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
                style={isGradient ? { backgroundColor: primary.base } : {}}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    isGradient ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Gradient Colors */}
          {isGradient && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  From
                </label>
                <div className="relative">
                  <ColorPaletteDropdown
                    value={gradientFrom}
                    onChange={(color) => handleColorUpdate('gradient_from', color)}
                    buttonClassName="w-full"
                    title="Gradient From"
                    previewSize="sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  To
                </label>
                <div className="relative">
                  <ColorPaletteDropdown
                    value={gradientTo}
                    onChange={(color) => handleColorUpdate('gradient_to', color)}
                    buttonClassName="w-full"
                    title="Gradient To"
                    previewSize="sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
