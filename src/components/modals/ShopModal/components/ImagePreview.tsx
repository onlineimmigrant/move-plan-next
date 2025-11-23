/**
 * ImagePreview Component
 * 
 * URL validation + preview image display + ImageGallery upload
 * Shows preview of product image from URL or uploaded image
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle, Upload, Trash2 } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  productName: string;
  onUrlChange: (url: string) => void;
  onOpenGallery: () => void;
  error?: string;
  attribution?: {
    photographer: string;
    photographer_url: string;
    photo_url: string;
  } | null;
}

export function ImagePreview({
  imageUrl,
  productName,
  onUrlChange,
  onOpenGallery,
  error,
  attribution,
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(imageUrl);
  const [isHovering, setIsHovering] = useState(false);

  // Update preview URL when imageUrl changes
  useEffect(() => {
    setPreviewUrl(imageUrl);
    setImageError(false);
  }, [imageUrl]);

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // Check if URL looks valid (basic check)
  const hasValidUrlFormat = previewUrl && /^https?:\/\/.+/i.test(previewUrl);

  // Handle remove image
  const handleRemoveImage = () => {
    onUrlChange('');
    setPreviewUrl('');
    setImageError(false);
  };

  return (
    <div className="space-y-3">
      {/* Image Preview Area with Hover Actions */}
      <div 
        className="relative w-full h-64 bg-slate-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-600 overflow-hidden group cursor-pointer transition-all hover:border-blue-500 dark:hover:border-blue-400"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {hasValidUrlFormat && !imageError ? (
          <>
            <img
              src={previewUrl}
              alt={productName || 'Product preview'}
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 dark:border-slate-600 border-t-blue-600"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Loading image...</span>
                </div>
              </div>
            )}
            
            {/* Hover Overlay with Actions */}
            {isHovering && !isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-4 transition-all">
                <button
                  onClick={onOpenGallery}
                  className="flex flex-col items-center gap-2 px-6 py-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 transition-all group/btn"
                  aria-label="Upload new image"
                >
                  <Upload className="w-8 h-8 text-white group-hover/btn:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">Upload</span>
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="flex flex-col items-center gap-2 px-6 py-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 transition-all group/btn"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-8 h-8 text-red-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-red-400">Remove</span>
                </button>
              </div>
            )}
            
            {/* Unsplash Attribution - Two-tier design */}
            {attribution && (
              <>
                {/* Always visible: Small Unsplash badge */}
                <a
                  href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-1.5 right-1.5 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded p-1 shadow-md hover:shadow-lg transition-all group-hover:opacity-0 z-10"
                  onClick={(e) => e.stopPropagation()}
                  title="Photo from Unsplash"
                >
                  <svg className="w-3 h-3 text-black/80" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                  </svg>
                </a>
                
                {/* On hover: Full attribution */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-xs px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                    </svg>
                    <span className="text-white/90">Photo by{' '}
                      <a
                        href={`${attribution.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-medium hover:text-blue-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {attribution.photographer}
                      </a>
                      {' '}on{' '}
                      <a
                        href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-medium hover:text-blue-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Unsplash
                      </a>
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        ) : imageError ? (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-red-500 dark:text-red-400 transition-all"
            onClick={onOpenGallery}
          >
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium">Failed to load image</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click to upload a new image
            </p>
            
            {/* Hover Overlay for Error State */}
            {isHovering && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all">
                <button
                  onClick={onOpenGallery}
                  className="flex flex-col items-center gap-2 px-6 py-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 transition-all group/btn"
                  aria-label="Upload image"
                >
                  <Upload className="w-8 h-8 text-white group-hover/btn:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">Upload</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-all"
            onClick={onOpenGallery}
          >
            <ImageIcon className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium">No image preview</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click to upload an image
            </p>
            
            {/* Hover Overlay for Empty State */}
            {isHovering && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all">
                <button
                  onClick={onOpenGallery}
                  className="flex flex-col items-center gap-2 px-6 py-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 transition-all group/btn"
                  aria-label="Upload image"
                >
                  <Upload className="w-8 h-8 text-white group-hover/btn:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">Upload</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* URL Input */}
      <div>
        <label 
          htmlFor="image_url_input" 
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Image URL (optional)
        </label>
        <input
          id="image_url_input"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            onUrlChange(e.target.value);
            setIsLoading(true);
          }}
          className={`
            w-full px-3 py-2 rounded-lg border
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-300 dark:border-gray-600 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-800 
            text-slate-900 dark:text-white
            text-sm
            focus:ring-2 focus:outline-none
            placeholder:text-slate-400 dark:placeholder:text-slate-500
          `}
          placeholder="https://example.com/image.jpg"
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Hover over the image preview to upload or remove images
        </p>
      </div>

      {/* Preview Status */}
      {hasValidUrlFormat && !error && (
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${imageError ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="text-slate-600 dark:text-slate-400">
            {imageError ? 'Image failed to load' : 'Image preview loaded successfully'}
          </span>
        </div>
      )}
    </div>
  );
}
