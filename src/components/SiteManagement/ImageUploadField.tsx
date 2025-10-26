import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ImageUploadFieldProps {
  label: string;
  field: 'image' | 'favicon' | 'hero_image';
  value: string | null;
  onChange: (field: 'image' | 'favicon' | 'hero_image', value: string | null) => void;
  onImageUpload: (field: 'image' | 'favicon' | 'hero_image') => void;
  uploadingImages: Set<string>;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ 
  label, 
  field, 
  value,
  onChange,
  onImageUpload,
  uploadingImages
}) => {
  const themeColors = useThemeColors();

  return (
  <div className="space-y-1.5">
    <label className="block text-xs font-light text-gray-600 mb-1">{label}</label>
    
    {/* Upload Area */}
    <div className="relative">
      {value ? (
        <div className="relative group">
          <div className="w-full h-32 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/60 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:border-sky-300 group-hover:shadow-lg shadow-sm">
            <img 
              src={value} 
              alt={label} 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={() => onImageUpload(field)}
              disabled={uploadingImages.has(field)}
              className="px-4 py-2 bg-white/95 backdrop-blur-sm text-gray-800 rounded-xl text-sm font-light hover:bg-white transition-all duration-300 shadow-lg"
            >
              {uploadingImages.has(field) ? 'Uploading...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange(field, null)}
              className="px-4 py-2 bg-red-500/95 backdrop-blur-sm text-white rounded-xl text-sm font-light hover:bg-red-500 transition-all duration-300 shadow-lg"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onImageUpload(field)}
          disabled={uploadingImages.has(field)}
          className="w-full h-32 bg-white/40 backdrop-blur-sm hover:bg-white/60 border border-dashed rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-300 group hover:shadow-lg shadow-sm"
          style={{
            borderColor: themeColors.cssVars.primary.light,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = themeColors.cssVars.primary.base;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = themeColors.cssVars.primary.light;
          }}
        >
          <div 
            className="w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: themeColors.cssVars.primary.lighter,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.light;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.lighter;
            }}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: themeColors.cssVars.primary.base }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-center">
            <span 
              className="block text-sm font-light transition-colors duration-300"
              style={{ color: themeColors.cssVars.primary.hover }}
            >
              {uploadingImages.has(field) ? 'Uploading...' : `Upload ${label}`}
            </span>
            <span 
              className="block text-sm font-light mt-1 transition-colors duration-300"
              style={{ color: themeColors.cssVars.primary.base, opacity: 0.8 }}
            >
              Click to browse files
            </span>
          </div>
        </button>
      )}
    </div>
    
    {/* URL Input */}
    {value && (
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-xl text-gray-900 placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:border-sky-300 transition-all duration-300 text-sm font-light shadow-sm hover:border-gray-300 hover:shadow-md hover:bg-white/70"
        style={{
          ['--tw-ring-color' as any]: themeColors.cssVars.primary.lighter,
        }}
        placeholder="Or paste image URL"
      />
    )}
  </div>
  );
};
