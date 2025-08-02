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
    <label className="block text-sm font-light text-gray-700">{label}</label>
    
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
          className="w-full h-32 bg-white/40 backdrop-blur-sm hover:bg-white/60 border border-dashed border-sky-200/60 hover:border-sky-300 rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-300 group hover:shadow-lg shadow-sm"
        >
          <div className="w-10 h-10 bg-sky-100/60 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-sky-200/60 transition-all duration-300 group-hover:scale-110">
            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-sm font-light text-sky-700 group-hover:text-sky-600 transition-colors duration-300">
              {uploadingImages.has(field) ? 'Uploading...' : `Upload ${label}`}
            </span>
            <span className="block text-sm font-light text-sky-500/80 mt-1 group-hover:text-sky-400 transition-colors duration-300">
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
        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-xl text-gray-900 placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-light shadow-sm hover:border-gray-300 hover:shadow-md hover:bg-white/70"
        placeholder="Or paste image URL"
      />
    )}
  </div>
);
