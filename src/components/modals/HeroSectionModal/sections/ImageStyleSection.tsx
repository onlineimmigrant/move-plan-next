/**
 * ImageStyleSection Component
 * 
 * Form section for image upload and styling
 */

import React from 'react';
import { HeroFormData } from '../types';
import { cn } from '@/lib/utils';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageStyleSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  openImageGallery: () => void;
}

export function ImageStyleSection({
  formData,
  setFormData,
  openImageGallery,
}: ImageStyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Image Settings</h3>
      
      {/* Image Upload */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Hero Image
        </label>
        <button
          onClick={openImageGallery}
          className={cn(
            'w-full px-4 py-3 rounded-md border-2 border-dashed transition-colors flex items-center justify-center gap-2',
            formData.image
              ? 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <PhotoIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            {formData.image ? 'Change Image' : 'Select Image'}
          </span>
        </button>
        {formData.image && (
          <div className="mt-2">
            <img
              src={formData.image}
              alt="Preview"
              className="w-full h-32 object-cover rounded-md border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Image Position */}
      {formData.image && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Image Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['left', 'right', 'background', 'inline'] as const).map((position) => (
              <button
                key={position}
                onClick={() => setFormData({
                  ...formData,
                  image_style: { ...formData.image_style, position }
                })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                  formData.image_style?.position === position
                    ? 'bg-sky-100 text-sky-700 border-sky-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                )}
              >
                {position}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Page Toggle */}
      {formData.image && (
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!formData.image_style?.fullPage}
              onChange={(e) => setFormData({
                ...formData,
                image_style: { ...formData.image_style, fullPage: e.target.checked }
              })}
              className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-xs font-medium text-gray-700">Full Page Image</span>
          </label>
        </div>
      )}

      {/* Image Dimensions */}
      {formData.image && !formData.image_style?.fullPage && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Width (px)
            </label>
            <input
              type="number"
              value={formData.image_style?.width || 400}
              onChange={(e) => setFormData({
                ...formData,
                image_style: { ...formData.image_style, width: parseInt(e.target.value) || 400 }
              })}
              min={50}
              max={2000}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Height (px)
            </label>
            <input
              type="number"
              value={formData.image_style?.height || 300}
              onChange={(e) => setFormData({
                ...formData,
                image_style: { ...formData.image_style, height: parseInt(e.target.value) || 300 }
              })}
              min={50}
              max={2000}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
