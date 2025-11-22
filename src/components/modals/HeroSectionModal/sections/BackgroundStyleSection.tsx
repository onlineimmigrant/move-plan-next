/**
 * BackgroundStyleSection Component
 * 
 * Form section for background color, gradient, and SEO settings
 */

import React from 'react';
import { HeroFormData } from '../types';
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';

interface BackgroundStyleSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  openColorPickers: {
    backgroundColor: boolean;
    backgroundGradientFrom: boolean;
    backgroundGradientVia: boolean;
    backgroundGradientTo: boolean;
  };
  toggleColorPicker: (key: 'backgroundColor' | 'backgroundGradientFrom' | 'backgroundGradientVia' | 'backgroundGradientTo') => void;
  primaryColor: string;
  openImageGallery: () => void;
}

export function BackgroundStyleSection({
  formData,
  setFormData,
  openColorPickers,
  toggleColorPicker,
  primaryColor,
  openImageGallery,
}: BackgroundStyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Background Settings</h3>
      
      {/* Video/Image Background Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Hero Background Media
        </label>
        
        {/* Current Media Display */}
        {formData.is_video && formData.video_url ? (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-900 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Video Background
                </p>
                <p className="text-xs text-blue-700 truncate">
                  <span className="font-medium capitalize">{formData.video_player}:</span> {formData.video_url}
                </p>
              </div>
              <button
                onClick={() => setFormData({
                  ...formData,
                  is_video: false,
                  video_url: undefined,
                  video_player: undefined,
                  video_thumbnail: undefined,
                })}
                className="flex-shrink-0 text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : formData.image ? (
          <div className="mb-3 relative">
            <img
              src={formData.image}
              alt="Hero background"
              className="w-full h-24 object-cover rounded-md border border-gray-200"
            />
            <button
              onClick={() => setFormData({ ...formData, image: null })}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <p className="mb-3 text-xs text-gray-500 italic">No background media selected</p>
        )}

        {/* Select Media Button */}
        <button
          onClick={openImageGallery}
          className="w-full px-4 py-3 rounded-md border-2 border-dashed transition-colors flex items-center justify-center gap-2 border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">
            {formData.is_video || formData.image ? 'Change Media' : 'Select Image or Video'}
          </span>
        </button>

        <p className="mt-2 text-xs text-gray-500">
          Choose from gallery, Unsplash, YouTube, Pexels, or upload from R2
        </p>
      </div>
      
      {/* Background Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <div className="dropdown-container">
          <ColorPaletteDropdown
            value={formData.background_style?.color || 'white'}
            onChange={(colorClass: string) => {
              setFormData({
                ...formData,
                background_style: { ...formData.background_style, color: colorClass }
              });
              toggleColorPicker('backgroundColor');
            }}
            isOpen={openColorPickers.backgroundColor}
            onToggle={() => toggleColorPicker('backgroundColor')}
            onClose={() => toggleColorPicker('backgroundColor')}
            useFixedPosition={true}
          />
        </div>
      </div>

      {/* Background Gradient Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.background_style?.is_gradient}
            onChange={(e) => setFormData({
              ...formData,
              background_style: {
                ...formData.background_style,
                is_gradient: e.target.checked,
                gradient: e.target.checked ? (formData.background_style?.gradient || {
                  from: 'from-sky-50',
                  via: 'via-white',
                  to: 'to-purple-50'
                }) : undefined
              }
            })}
            className="rounded border-gray-300 focus:ring-2"
            style={{ color: primaryColor, "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
          <span className="text-xs font-medium text-gray-700">Enable Gradient</span>
        </label>
      </div>

      {/* Background Gradient Colors */}
      {formData.background_style?.is_gradient && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Gradient Colors
          </label>
          <div className="flex items-center gap-2">
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.background_style?.gradient?.from?.replace('from-', '') || 'sky-50'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        ...formData.background_style?.gradient,
                        from: `from-${colorClass}`,
                        via: formData.background_style?.gradient?.via || 'via-white',
                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.backgroundGradientFrom}
                onToggle={() => toggleColorPicker('backgroundGradientFrom')}
                onClose={() => toggleColorPicker('backgroundGradientFrom')}
                buttonClassName="w-full"
                title="From"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.background_style?.gradient?.via?.replace('via-', '') || 'white'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        from: formData.background_style?.gradient?.from || 'from-sky-50',
                        via: `via-${colorClass}`,
                        to: formData.background_style?.gradient?.to || 'to-purple-50'
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.backgroundGradientVia}
                onToggle={() => toggleColorPicker('backgroundGradientVia')}
                onClose={() => toggleColorPicker('backgroundGradientVia')}
                buttonClassName="w-full"
                title="Via"
                useFixedPosition={true}
              />
            </div>
            <div className="dropdown-container flex-1">
              <ColorPaletteDropdown
                value={formData.background_style?.gradient?.to?.replace('to-', '') || 'purple-50'}
                onChange={(colorClass: string) => {
                  setFormData({
                    ...formData,
                    background_style: {
                      ...formData.background_style,
                      gradient: {
                        from: formData.background_style?.gradient?.from || 'from-sky-50',
                        via: formData.background_style?.gradient?.via || 'via-white',
                        to: `to-${colorClass}`
                      }
                    }
                  });
                }}
                isOpen={openColorPickers.backgroundGradientTo}
                onToggle={() => toggleColorPicker('backgroundGradientTo')}
                onClose={() => toggleColorPicker('backgroundGradientTo')}
                buttonClassName="w-full"
                title="To"
                useFixedPosition={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Title */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          SEO Title (Optional)
        </label>
        <input
          type="text"
          value={formData.background_style?.seo_title || ''}
          onChange={(e) => setFormData({
            ...formData,
            background_style: { ...formData.background_style, seo_title: e.target.value }
          })}
          placeholder="Enter SEO-friendly title..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Column Layout */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Background Columns
        </label>
        <select
          value={formData.background_style?.column || 1}
          onChange={(e) => setFormData({
            ...formData,
            background_style: { ...formData.background_style, column: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        >
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
        </select>
      </div>
    </div>
  );
}
