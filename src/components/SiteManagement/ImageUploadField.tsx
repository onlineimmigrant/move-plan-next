import React from 'react';

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
}) => (
  <div className="space-y-3">
    <label className="block text-xs font-semibold text-gray-700">{label}</label>
    
    {/* Upload Area */}
    <div className="relative">
      {value ? (
        <div className="relative group">
          <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:border-sky-300 group-hover:shadow-lg">
            <img 
              src={value} 
              alt={label} 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => onImageUpload(field)}
              disabled={uploadingImages.has(field)}
              className="px-3 py-1.5 bg-white/95 text-gray-800 rounded-lg text-xs font-semibold hover:bg-white transition-all duration-300 shadow-lg backdrop-blur-sm"
            >
              {uploadingImages.has(field) ? 'Uploading...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange(field, null)}
              className="px-3 py-1.5 bg-red-500/95 text-white rounded-lg text-xs font-semibold hover:bg-red-500 transition-all duration-300 shadow-lg backdrop-blur-sm"
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
          className="w-full h-28 bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-dashed border-sky-200 hover:border-sky-300 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all duration-300 group hover:shadow-lg"
        >
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center group-hover:bg-sky-200 transition-all duration-300 group-hover:scale-110">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-xs font-semibold text-sky-700 group-hover:text-sky-600 transition-colors duration-300">
              {uploadingImages.has(field) ? 'Uploading...' : `Upload ${label}`}
            </span>
            <span className="block text-xs text-sky-500 mt-0.5 group-hover:text-sky-400 transition-colors duration-300">
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
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-xs font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
        placeholder="Or paste image URL"
      />
    )}
  </div>
);
