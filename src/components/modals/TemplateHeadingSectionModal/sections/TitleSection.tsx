/**
 * TitleSection Component
 * 
 * Form section for heading title text (3 parts) and styling
 */

import React from 'react';
import { HeadingFormData, TEXT_VARIANTS } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import { cn } from '@/lib/utils';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TitleSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  openColorPickers: {
    titleColor: boolean;
    titleGradientFrom: boolean;
    titleGradientVia: boolean;
    titleGradientTo: boolean;
  };
  toggleColorPicker: (key: 'titleColor' | 'titleGradientFrom' | 'titleGradientVia' | 'titleGradientTo') => void;
  showPart2: boolean;
  showPart3: boolean;
  setShowPart2: (show: boolean) => void;
  setShowPart3: (show: boolean) => void;
  primaryColor: string;
}

export function TitleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  showPart2,
  showPart3,
  setShowPart2,
  setShowPart3,
  primaryColor,
}: TitleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Title Settings</h3>
      
      {/* Title Text - Part 1 */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Title Text (Part 1)
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter main heading..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{
            '--tw-ring-color': primaryColor
          } as React.CSSProperties}
        />
      </div>

      {/* Title Part 2 */}
      {showPart2 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700">
              Title Text (Part 2)
            </label>
            <button
              onClick={() => {
                setShowPart2(false);
                setFormData({ ...formData, name_part_2: '' });
              }}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
            >
              <XMarkIcon className="w-3 h-3" />
              Remove
            </button>
          </div>
          <input
            type="text"
            value={formData.name_part_2 || ''}
            onChange={(e) => setFormData({ ...formData, name_part_2: e.target.value })}
            placeholder="Enter second part..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{
              '--tw-ring-color': primaryColor
            } as React.CSSProperties}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowPart2(true)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
        >
          <PlusIcon className="w-4 h-4" />
          Add Title Part 2
        </button>
      )}

      {/* Title Part 3 */}
      {showPart3 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700">
              Title Text (Part 3)
            </label>
            <button
              onClick={() => {
                setShowPart3(false);
                setFormData({ ...formData, name_part_3: '' });
              }}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
            >
              <XMarkIcon className="w-3 h-3" />
              Remove
            </button>
          </div>
          <input
            type="text"
            value={formData.name_part_3 || ''}
            onChange={(e) => setFormData({ ...formData, name_part_3: e.target.value })}
            placeholder="Enter third part..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{
              '--tw-ring-color': primaryColor
            } as React.CSSProperties}
          />
        </div>
      ) : showPart2 && (
        <button
          onClick={() => setShowPart3(true)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600"
        >
          <PlusIcon className="w-4 h-4" />
          Add Title Part 3
        </button>
      )}

      {/* Text Style Variant */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Text Style Variant
        </label>
        <div className="flex gap-2">
          {(['default', 'apple', 'codedharmony'] as const).map((variant) => (
            <button
              key={variant}
              onClick={() => setFormData({
                ...formData,
                text_style_variant: variant
              })}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                formData.text_style_variant === variant
                  ? 'border-2'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
              style={formData.text_style_variant === variant ? {
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: primaryColor
              } : {}}
            >
              {variant === 'codedharmony' ? 'Coded Harmony' : variant}
            </button>
          ))}
        </div>
      </div>

      {/* Title Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Alignment
        </label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => setFormData({
                ...formData,
                title_alignment: align
              })}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                formData.title_alignment === align
                  ? 'border-2'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
              style={formData.title_alignment === align ? {
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
          Title Color
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.title_style?.color || 'gray-800'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                title_style: { ...formData.title_style, color: colorClass }
              });
              toggleColorPicker('titleColor');
            }}
            isOpen={openColorPickers.titleColor}
            onToggle={() => toggleColorPicker('titleColor')}
            onClose={() => toggleColorPicker('titleColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Title Gradient Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.title_style?.is_gradient}
            onChange={(e) => setFormData({
              ...formData,
              title_style: {
                ...formData.title_style,
                is_gradient: e.target.checked,
                gradient: e.target.checked ? (formData.title_style?.gradient || {
                  from: 'blue-600',
                  via: 'purple-600',
                  to: 'pink-600'
                }) : undefined
              }
            })}
            className="rounded border-gray-300 focus:ring-2"
            style={{
              color: primaryColor,
              '--tw-ring-color': primaryColor
            } as React.CSSProperties}
          />
          <span className="text-xs font-medium text-gray-700">Enable Gradient</span>
        </label>
      </div>

      {/* Gradient Colors */}
      {formData.title_style?.is_gradient && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Gradient Colors
          </label>
          <div className="flex items-center gap-2">
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.title_style?.gradient?.from || 'blue-600'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        ...formData.title_style?.gradient,
                        from: colorClass,
                        via: formData.title_style?.gradient?.via || 'purple-600',
                        to: formData.title_style?.gradient?.to || 'pink-600'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.titleGradientFrom}
                onToggle={() => toggleColorPicker('titleGradientFrom')}
                onClose={() => toggleColorPicker('titleGradientFrom')}
                buttonClassName="w-full"
                title="From"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.title_style?.gradient?.via || 'purple-600'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        from: formData.title_style?.gradient?.from || 'blue-600',
                        via: colorClass,
                        to: formData.title_style?.gradient?.to || 'pink-600'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.titleGradientVia}
                onToggle={() => toggleColorPicker('titleGradientVia')}
                onClose={() => toggleColorPicker('titleGradientVia')}
                buttonClassName="w-full"
                title="Via"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.title_style?.gradient?.to || 'pink-600'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    title_style: {
                      ...formData.title_style,
                      gradient: {
                        from: formData.title_style?.gradient?.from || 'blue-600',
                        via: formData.title_style?.gradient?.via || 'purple-600',
                        to: colorClass
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.titleGradientTo}
                onToggle={() => toggleColorPicker('titleGradientTo')}
                onClose={() => toggleColorPicker('titleGradientTo')}
                buttonClassName="w-full"
                title="To"
                useFixedPosition={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Font Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Font Weight
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'font-thin', label: 'Thin' },
            { value: 'font-light', label: 'Light' },
            { value: 'font-normal', label: 'Normal' },
            { value: 'font-bold', label: 'Bold' }
          ].map((weight) => (
            <button
              key={weight.value}
              onClick={() => setFormData({
                ...formData,
                title_style: { ...formData.title_style, weight: weight.value }
              })}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md border transition-colors',
                formData.title_style?.weight === weight.value
                  ? 'border-2'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
              style={formData.title_style?.weight === weight.value ? {
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                borderColor: primaryColor
              } : {}}
            >
              {weight.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
