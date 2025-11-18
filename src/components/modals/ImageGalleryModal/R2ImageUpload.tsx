'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  FolderIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';

interface R2ImageUploadProps {
  onSelectImage: (imageData: any) => void;
  productId?: number;
}

interface ImageFile {
  url: string;
  fileName: string;
  fullKey: string;
  folder: string;
  size: number;
  uploaded: string;
}

export default function R2ImageUpload({ onSelectImage, productId }: R2ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [renamingImage, setRenamingImage] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const themeColors = useThemeColors();

  useEffect(() => {
    loadImages();
  }, [currentFolder, productId]);

  useEffect(() => {
    if (renamingImage && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingImage]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const endpoint = productId ? `/api/products/${productId}/r2-images` : '/api/r2-images';
      const url = currentFolder ? `${endpoint}?folder=${encodeURIComponent(currentFolder)}` : endpoint;
      
      console.log('[R2ImageUpload] Fetching from:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[R2ImageUpload] Loaded:', { images: data.images?.length, folders: data.folders?.length });
        setImages(data.images || []);
        setFolders(data.folders || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[R2ImageUpload] Load error:', errorData);
        setError(errorData.error || 'Failed to load images');
      }
    } catch (err) {
      console.error('[R2ImageUpload] Load failed:', err);
      setError('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress('Uploading image...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) {
        formData.append('folder', currentFolder);
      }

      const response = await fetch('/api/upload-image-r2', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Auto-attach to product if provided
      if (productId) {
        setUploadProgress('Attaching to product...');
        await fetch(`/api/products/${productId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            image_url: result.imageUrl,
            is_video: false,
            display_order: 0,
          }),
        });
      }

      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);
      await loadImages();
      setSelectedImage(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRename = async (image: ImageFile) => {
    if (!newFileName.trim()) {
      setRenamingImage(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ext = image.fileName.split('.').pop();
      const finalName = newFileName.endsWith(`.${ext}`) ? newFileName : `${newFileName}.${ext}`;

      const response = await fetch('/api/rename-r2-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          oldKey: image.fullKey,
          newFileName: finalName,
        }),
      });

      if (response.ok) {
        await loadImages();
        setRenamingImage(null);
        setNewFileName('');
      }
    } catch (err) {
      console.error('[R2ImageUpload] Rename failed:', err);
    }
  };

  const handleDelete = async (image: ImageFile) => {
    if (!confirm(`Delete "${image.fileName}"? This will remove it permanently.`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/delete-r2-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: image.url }),
      });

      await loadImages();
      if (selectedImage === image.url) setSelectedImage(null);
    } catch (err) {
      console.error('[R2ImageUpload] Delete failed:', err);
    }
  };

  const handleConfirmSelection = () => {
    const image = images.find(i => i.url === selectedImage);
    if (image) {
      onSelectImage({
        image_url: image.url,
        is_video: false,
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter images and folders based on search
  const filteredFolders = folders.filter(f => 
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredImages = images.filter(i => 
    i.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Search Bar & Upload */}
      <div className="sticky top-0 z-10 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={window.innerWidth < 768 ? "Search images" : "Search all images across folders..."}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
              />
              {searchQuery && (
                <div className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: themeColors.cssVars.primary.base }}>
                  Searching all folders
                </div>
              )}
            </div>
            <Button
              onClick={loadImages}
              disabled={isLoading}
              variant="outline"
              className="whitespace-nowrap px-2 sm:px-3"
              title="Refresh images"
            >
              <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="primary"
              className="whitespace-nowrap px-2 sm:px-3"
              title="Upload images (JPEG, PNG, WebP, GIF - max 10MB)"
            >
              <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 md:mr-2" />
              <span className="hidden md:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
            </Button>
          </div>
          
          {/* Upload Progress */}
          {uploadProgress && (
            <div className="text-sm flex items-center gap-2 animate-fade-in" style={{ color: themeColors.cssVars.primary.base }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColors.cssVars.primary.base }} />
              {uploadProgress}
            </div>
          )}

          {/* Folder/Image Count */}
          {(images.length > 0 || folders.length > 0) && (
            <div className="text-xs sm:text-sm text-gray-500">
              {filteredFolders.length} {filteredFolders.length === 1 ? 'folder' : 'folders'}, {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {currentFolder && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-gray-50/50 dark:bg-gray-900/20" style={{ borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)`, backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 3%, transparent)` }}>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentFolder('')}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              style={{ color: themeColors.cssVars.primary.base }}
            >
              <PhotoIcon className="w-4 h-4" />
              <span className="hidden sm:inline">All Images</span>
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 dark:text-gray-300">{currentFolder}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 mb-4" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading images...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium text-sm sm:text-base">{error}</p>
              <Button onClick={loadImages} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredFolders.length === 0 && filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-4">
              <PhotoIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 text-sm sm:text-base">
                {searchQuery ? 'No images match your search' : currentFolder ? 'No images in this folder' : 'No images uploaded yet'}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">
                Upload images to get started
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="primary"
              >
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Folders Section */}
            {filteredFolders.length > 0 && !currentFolder && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wider">Folders</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setCurrentFolder(folder)}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg"
                      style={{
                        borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 30%, transparent)`,
                        background: `linear-gradient(135deg, color-mix(in srgb, ${themeColors.cssVars.primary.base} 5%, transparent), color-mix(in srgb, ${themeColors.cssVars.primary.base} 10%, transparent))`
                      }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4">
                        <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-2" style={{ color: themeColors.cssVars.primary.base }} />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center line-clamp-2">
                          {folder}
                        </span>
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: themeColors.cssVars.primary.base }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Images Section */}
            {filteredImages.length > 0 && (
              <div>
                {filteredFolders.length > 0 && !currentFolder && (
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wider">Images</h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredImages.map((image) => (
                    <div
                      key={image.url}
                      onClick={() => !renamingImage && setSelectedImage(image.url)}
                      onDoubleClick={() => {
                        setRenamingImage(image.url);
                        setNewFileName(image.fileName.replace(/\.[^/.]+$/, ''));
                      }}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg"
                      style={selectedImage === image.url ? {
                        borderColor: themeColors.cssVars.primary.base,
                        boxShadow: `0 0 0 4px color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)`,
                        transform: 'scale(1.05)'
                      } : { borderColor: '#e5e7eb' }}
                      title={renamingImage !== image.url ? 'Double-click to rename' : ''}
                    >
                      {/* Image Preview */}
                      <img 
                        src={image.url} 
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay with Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renamingImage === image.url ? (
                          <div className="w-full space-y-1.5 bg-black/40 backdrop-blur-sm p-2 rounded opacity-100" onClick={e => e.stopPropagation()}>
                            <input
                              ref={renameInputRef}
                              type="text"
                              value={newFileName}
                              onChange={e => setNewFileName(e.target.value)}
                              onKeyDown={e => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleRename(image);
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setRenamingImage(null);
                                  setNewFileName('');
                                }
                              }}
                              onBlur={() => {
                                if (newFileName.trim()) {
                                  handleRename(image);
                                } else {
                                  setRenamingImage(null);
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
                              style={{ borderColor: themeColors.cssVars.primary.base, '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                              placeholder="Enter new name..."
                            />
                            <p className="text-[10px] text-white/80 italic">Press Enter to save, Esc to cancel</p>
                          </div>
                        ) : (
                          <div className="w-full">
                            <p className="text-white text-xs font-medium truncate mb-1">{image.fileName}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-white/70 text-[10px]">{formatSize(image.size)}</span>
                              {image.folder && image.folder !== 'uncategorized' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded text-white">
                                  {image.folder}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!renamingImage && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setRenamingImage(image.url);
                              setNewFileName(image.fileName.replace(/\.[^/.]+$/, ''));
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                            style={{ backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 90%, black)` }}
                            title="Rename"
                          >
                            <PencilIcon className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(image); }}
                            className="w-7 h-7 rounded-full bg-red-600/90 hover:bg-red-600 flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}

                      {/* Selected Indicator */}
                      {selectedImage === image.url && !renamingImage && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColors.cssVars.primary.base }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-gray-50/50 dark:bg-gray-900/20" style={{ borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)` }}>
        {selectedImage ? (
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:block">
              <span className="font-medium" style={{ color: themeColors.cssVars.primary.base }}>1 image selected</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => setSelectedImage(null)}
                className="flex-1 md:flex-initial text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSelection}
                className="flex-1 md:flex-initial text-sm sm:text-base"
              >
                Insert Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
            Click an image to select it
          </div>
        )}
      </div>
    </>
  );
}
