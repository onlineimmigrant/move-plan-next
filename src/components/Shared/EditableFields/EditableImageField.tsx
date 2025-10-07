// components/Shared/EditableFields/EditableImageField.tsx
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface EditableImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBrowseGallery?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  aspectRatio?: string;
  className?: string;
}

export default function EditableImageField({
  label,
  value,
  onChange,
  onBrowseGallery,
  error,
  disabled = false,
  required = false,
  helperText,
  aspectRatio = '16/9',
  className,
}: EditableImageFieldProps) {
  const [imageError, setImageError] = useState(false);

  const handleRemove = () => {
    onChange('');
    setImageError(false);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {/* Image Preview */}
      {value && !imageError ? (
        <div className="relative group">
          <div
            className="relative w-full overflow-hidden rounded-lg border-2 border-gray-200"
            style={{ aspectRatio }}
          >
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>

          {/* Remove Button */}
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full 
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200
                       hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Remove image"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'relative w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
            error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50',
            !disabled && 'hover:border-gray-400 hover:bg-gray-100'
          )}
          style={{ aspectRatio }}
        >
          <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">No image selected</span>
        </div>
      )}

      {/* URL Input & Browse Button */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setImageError(false);
          }}
          placeholder="https://example.com/image.jpg or /uploads/image.jpg"
          disabled={disabled}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg border text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-sky-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
        />

        {onBrowseGallery && !disabled && (
          <button
            type="button"
            onClick={onBrowseGallery}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium
                     hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500
                     transition-colors duration-200"
          >
            Browse Gallery
          </button>
        )}
      </div>

      {/* Helper Text or Error */}
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500">{helperText}</span>
      ) : null}
    </div>
  );
}
