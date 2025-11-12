/**
 * ImageSection Component
 * 
 * Form section for image upload and position
 */

import React from 'react';
import { HeadingFormData } from '../types';
import { cn } from '@/lib/utils';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  openImageGallery: () => void;
  primaryColor: string;
}

export function ImageSection({
  formData,
  setFormData,
  openImageGallery,
  primaryColor,
}: ImageSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Image Settings</h3>
      
      {/* Image Upload */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Heading Image
        </label>
        <button
          onClick={openImageGallery}
          className={cn(
            'w-full px-4 py-3 rounded-md border-2 border-dashed transition-colors flex items-center justify-center gap-2',
            formData.image
              ? 'border-2'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          )}
          style={formData.image ? {
            backgroundColor: `${primaryColor}10`,
            color: primaryColor,
            borderColor: primaryColor
          } : {}}
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

      {/* Image First Toggle */}
      {formData.image && (
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!formData.image_first}
              onChange={(e) => setFormData({
                ...formData,
                image_first: e.target.checked
              })}
              className="rounded border-gray-300 focus:ring-2"
              style={{ color: primaryColor, "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
            <span className="text-xs font-medium text-gray-700">Show Image First (left side)</span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-6">
            When checked, image appears on left. When unchecked, image appears on right.
          </p>
        </div>
      )}

      {/* Image Position Options */}
      {formData.image && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Image Position Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['default', 'contained', 'full-width', 'circle'] as const).map((position) => (
              <button
                key={position}
                onClick={() => setFormData({
                  ...formData,
                  image_style: { ...formData.image_style, position }
                })}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md border transition-colors capitalize',
                  formData.image_style?.position === position
                    ? 'border-2'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                )}
                style={formData.image_style?.position === position ? {
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: primaryColor
                } : {}}
              >
                {position.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
