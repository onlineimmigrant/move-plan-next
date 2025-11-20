/**
 * StyleSection - Header style settings
 * 2-column layout: Type | Background
 * Supports 5 header types: default, transparent, fixed, mini, ring_card_mini
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Shared/ToastContainer';
import { useThemeColors } from '@/hooks/useThemeColors';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface StyleSectionProps {
  selectedStyle: string;
  headerStyleFull: any;
  organizationId: string;
  onStyleChange: (style: string) => void;
  onStyleFullChange: (organizationId: string, style: any) => Promise<void>;
}

export function StyleSection({
  selectedStyle,
  headerStyleFull,
  organizationId,
  onStyleChange,
  onStyleFullChange
}: StyleSectionProps) {
  const toast = useToast();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // Local state for colors
  const [textColor, setTextColor] = useState(headerStyleFull?.color || 'neutral-800');
  const [hoverColor, setHoverColor] = useState(headerStyleFull?.color_hover || 'neutral-600');
  const [bgColor, setBgColor] = useState(headerStyleFull?.background || 'white');
  const [isGradient, setIsGradient] = useState(headerStyleFull?.is_gradient || false);
  const [gradientFrom, setGradientFrom] = useState(headerStyleFull?.gradient?.from || 'white');
  const [gradientTo, setGradientTo] = useState(headerStyleFull?.gradient?.to || 'neutral-50');
  const [menuWidth, setMenuWidth] = useState(headerStyleFull?.menu_width || '7xl');

  const handleColorUpdate = (field: string, value: string) => {
    const updatedStyle = { ...headerStyleFull };
    
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
      ...headerStyleFull,
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
    
    // Also update headerStyleFull to reflect in preview
    const updatedStyle = {
      ...headerStyleFull,
      type: newType
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Header type updated');
      })
      .catch((error) => {
        console.error('Failed to update header type:', error);
        toast.error('Failed to update header type');
      });
  };

  const handleMenuWidthChange = (newWidth: string) => {
    setMenuWidth(newWidth);
    
    const updatedStyle = {
      ...headerStyleFull,
      menu_width: newWidth
    };

    onStyleFullChange(organizationId, updatedStyle)
      .then(() => {
        toast.success('Menu width updated');
      })
      .catch((error) => {
        console.error('Failed to update menu width:', error);
        toast.error('Failed to update menu width');
      });
  };

  // Header type descriptions for tooltips
  const headerTypeInfo: Record<string, string> = {
    default: 'Standard header with full navigation',
    transparent: 'Transparent overlay header',
    fixed: 'Fixed position at top of page',
    mini: 'Compact minimalist header',
    ring_card_mini: 'Minimal header with ring card style'
  };

  return (
    <div className="space-y-8">
      {/* Header Type Selector - 2 per row on desktop, 1 per row on mobile */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Type</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['default', 'transparent', 'fixed', 'mini', 'ring_card_mini'].map((style) => (
            <button
              key={style}
              onClick={() => handleTypeChange(style)}
              className={cn(
                'px-4 py-3 border-2 rounded-lg text-left transition-all duration-200 font-medium text-sm flex items-center justify-between hover:shadow-sm',
                selectedStyle === style
                  ? 'shadow-md scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
              title={headerTypeInfo[style]}
              aria-label={`Select ${style} header type`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold capitalize truncate">
                  {style === 'ring_card_mini' ? 'Ring Card Mini' : style}
                </div>
                <div className="text-xs opacity-75 mt-0.5 line-clamp-1">{headerTypeInfo[style]}</div>
              </div>
              {selectedStyle === style && (
                <svg className="w-5 h-5 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Width Selector - Radio buttons */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Menu Width</h3>
        
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { value: '3xl', label: '3XL' },
            { value: '4xl', label: '4XL' },
            { value: '5xl', label: '5XL' },
            { value: '7xl', label: '7XL' },
            { value: 'full', label: 'Full' }
          ].map((width) => (
            <button
              key={width.value}
              onClick={() => handleMenuWidthChange(width.value)}
              className={cn(
                'px-3 py-2.5 border-2 rounded-lg text-center transition-all duration-200 font-medium text-sm',
                menuWidth === width.value
                  ? 'shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              )}
              style={
                menuWidth === width.value
                  ? {
                      borderColor: primary.base,
                      backgroundColor: `${primary.base}10`,
                      color: primary.base
                    }
                  : {}
              }
              title={`Max width: ${width.label === 'Full' ? '100%' : width.label}`}
              aria-label={`Select ${width.label} menu width`}
            >
              {width.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background & Colors Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Colors</h3>
        
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
                aria-label={isGradient ? 'Disable gradient' : 'Enable gradient'}
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
