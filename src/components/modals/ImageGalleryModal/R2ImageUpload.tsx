'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  FolderIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FolderPlusIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import MediaTabToolbar from './MediaTabToolbar';
import { convertAndUploadImage, formatFileSize, estimateCompression } from '@/lib/utils/imageConversion';
import { CONVERSION_PRESETS } from '@/types/image-conversion';
import type { ImageConversionOptions } from '@/types/image-conversion';

interface R2ImageUploadProps {
  onSelectImage: (imageData: any) => void;
  productId?: number;
  onSelectionChange?: (hasSelection: boolean) => void;
}

interface ImageFile {
  url: string;
  fileName: string;
  fullKey: string;
  folder: string;
  size: number;
  uploaded: string;
}

export interface R2ImageUploadHandle {
  confirmSelection: () => void;
  hasSelection: () => boolean;
}

const R2ImageUpload = forwardRef<R2ImageUploadHandle, R2ImageUploadProps>(({ onSelectImage, productId, onSelectionChange }, ref) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const { isSuperadmin } = useAuth();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState(20);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [renamingImage, setRenamingImage] = useState<ImageFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movingImage, setMovingImage] = useState<ImageFile | null>(null);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>('');
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [newFolderRenameName, setNewFolderRenameName] = useState('');
  const [convertBeforeUpload, setConvertBeforeUpload] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('web-optimized');
  const [showConversionOptions, setShowConversionOptions] = useState(false);
  const [convertingImage, setConvertingImage] = useState<ImageFile | null>(null);
  const [conversionPreset, setConversionPreset] = useState('web-optimized');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const folderRenameInputRef = useRef<HTMLInputElement>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const themeColors = useThemeColors();

  useEffect(() => {
    // React StrictMode runs effects' cleanup+setup on initial mount in dev.
    // Ensure we reset the mounted flag on setup so async state updates work.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      loadAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    loadImages();
    setDisplayLimit(20);
  }, [currentFolder, productId]);

  useEffect(() => {
    setDisplayLimit(20);
  }, [searchQuery]);

  useEffect(() => {
    onSelectionChange?.(selectedImage !== null);
  }, [selectedImage, onSelectionChange]);

  useEffect(() => {
    if (renamingFolder && folderRenameInputRef.current) {
      folderRenameInputRef.current.focus();
      folderRenameInputRef.current.select();
    }
  }, [renamingFolder]);

  useImperativeHandle(ref, () => ({
    confirmSelection: handleConfirmSelection,
    hasSelection: () => selectedImage !== null
  }));

  useEffect(() => {
    if (renamingImage && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingImage]);

  useEffect(() => {
    if (renamingFolder && folderRenameInputRef.current) {
      folderRenameInputRef.current.focus();
      folderRenameInputRef.current.select();
    }
  }, [renamingFolder]);

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

  const loadImages = async () => {
    try {
      loadAbortRef.current?.abort();
      const controller = new AbortController();
      loadAbortRef.current = controller;

      setIsLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      const endpoint = productId ? `/api/products/${productId}/r2-images` : '/api/r2-images';
      const url = currentFolder ? `${endpoint}?folder=${encodeURIComponent(currentFolder)}` : endpoint;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (isDev) {
          console.log('[R2ImageUpload] Total images received from API:', data.images?.length);
          console.log('[R2ImageUpload] Total folders received from API:', data.folders?.length);
        }
        if (!isMountedRef.current || controller.signal.aborted) return;
        setImages(data.images || []);
        setFolders(data.folders || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[R2ImageUpload] Load error:', errorData);
        if (!isMountedRef.current || controller.signal.aborted) return;
        setError(errorData.error || 'Failed to load images');
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      console.error('[R2ImageUpload] Load failed:', err);
      if (isMountedRef.current) setError('Failed to load images');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (file.type === 'image/svg+xml' && !isSuperadmin) {
      setError('SVG upload is available for superadmins only');
      return;
    }
    setError(null);
    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Check if should convert (SVG excluded for superadmins only)
      const shouldConvert = convertBeforeUpload && !file.type.includes('svg');

      if (shouldConvert) {
        setUploadProgress('Converting to WebP...');
        
        const result = await convertAndUploadImage(
          file,
          selectedPreset,
          profile.organization_id,
          currentFolder,
          session.access_token
        );

        setUploadProgress(`Uploaded! Saved ${result.compressionRatio.toFixed(1)}%`);
        
        if (productId) {
          await fetch(`/api/products/${productId}/r2-images`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({ imageUrl: result.imageUrl }),
          });
        }

        await loadImages();
      } else {
        setUploadProgress('Uploading image...');
        
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConvertImage = async (image: ImageFile, preset: string) => {
    try {
      setError(null);
      setUploadProgress(`Converting ${image.fileName}...`);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Fetch the image
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const file = new File([blob], image.fileName, { type: blob.type });

      // Convert and upload
      const result = await convertAndUploadImage(
        file,
        preset,
        profile.organization_id,
        image.folder === 'uncategorized' ? undefined : image.folder,
        session.access_token
      );

      // Delete the old image
      await fetch('/api/delete-r2-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: image.url }),
      });

      setUploadProgress(`Converted! Saved ${result.compressionRatio.toFixed(1)}%`);
      setTimeout(() => setUploadProgress(''), 2000);
      
      await loadImages();
      setSelectedImage(result.imageUrl);
      setConvertingImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setUploadProgress('');
    }
  };

  const handleRename = async () => {
    if (!renamingImage || !newFileName.trim()) {
      setRenamingImage(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ext = renamingImage.fileName.split('.').pop();
      const finalName = newFileName.endsWith(`.${ext}`) ? newFileName : `${newFileName}.${ext}`;

      const response = await fetch('/api/rename-r2-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          oldKey: renamingImage.fullKey,
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

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim();
    if (!folderName) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/r2-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ folderName, mediaType: 'images' }),
      });

      if (response.ok) {
        await loadImages();
        setCreatingFolder(false);
        setNewFolderName('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('[R2ImageUpload] Create folder failed:', err);
      setError('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Delete empty folder "${folderName}"?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/r2-folders?folder=${encodeURIComponent(folderName)}&mediaType=images`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        await loadImages();
        if (currentFolder === folderName) setCurrentFolder('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('[R2ImageUpload] Delete folder failed:', err);
      setError('Failed to delete folder');
    }
  };

  const handleRenameFolder = async (oldName: string) => {
    const trimmed = newFolderRenameName.trim();
    if (!trimmed || trimmed === oldName) {
      setRenamingFolder(null);
      setNewFolderRenameName('');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/r2-folders/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          oldFolder: oldName,
          newFolder: trimmed,
          mediaType: 'images',
        }),
      });

      if (response.ok) {
        await loadImages();
        if (currentFolder === oldName) setCurrentFolder(trimmed);
        setRenamingFolder(null);
        setNewFolderRenameName('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to rename folder');
      }
    } catch (err) {
      console.error('[R2ImageUpload] Rename folder failed:', err);
      setError('Failed to rename folder');
    }
  };

  const handleMoveFile = async () => {
    if (!movingImage) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/r2-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourceKey: movingImage.fullKey,
          destinationFolder: selectedMoveFolder,
          mediaType: 'images',
        }),
      });

      if (response.ok) {
        await loadImages();
        setMovingImage(null);
        setSelectedMoveFolder('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to move file');
      }
    } catch (err) {
      console.error('[R2ImageUpload] Move file failed:', err);
      setError('Failed to move file');
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

  const lowerQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredFolders = useMemo(
    () => folders.filter((f) => f.toLowerCase().includes(lowerQuery)),
    [folders, lowerQuery]
  );

  const filteredImages = useMemo(
    () => images.filter((i) => {
      const matchesSearch = i.fileName.toLowerCase().includes(lowerQuery);
      // Hide Thumbnails folder images on root view, but show them when inside the folder
      const isNotThumbnail = currentFolder || i.folder.toLowerCase() !== 'thumbnails';
      return matchesSearch && isNotThumbnail;
    }),
    [images, lowerQuery, currentFolder]
  );

  const displayedImages = useMemo(
    () => filteredImages.slice(0, displayLimit),
    [filteredImages, displayLimit]
  );

  const hasMoreImages = filteredImages.length > displayLimit;

  const fileAccept = isSuperadmin
    ? 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
    : 'image/jpeg,image/jpg,image/png,image/webp,image/gif';

  const countsText = (images.length > 0 || folders.length > 0)
    ? `${filteredFolders.length} ${filteredFolders.length === 1 ? 'folder' : 'folders'}, ${filteredImages.length} ${filteredImages.length === 1 ? 'image' : 'images'}`
    : undefined;

  return (
    <>
      <MediaTabToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search images across folders..."
        searchHint={searchQuery ? 'Searching all folders' : undefined}
        onRefresh={loadImages}
        isRefreshing={isLoading}
        fileInputRef={fileInputRef}
        fileAccept={fileAccept}
        onFilePicked={handleUpload}
        isUploading={isUploading}
        uploadLabel="Upload"
        uploadTitle={isSuperadmin
          ? 'Upload images (JPEG, PNG, WebP, GIF, SVG - max 10MB)'
          : 'Upload images (JPEG, PNG, WebP, GIF - max 10MB)'
        }
        uploadProgress={uploadProgress}
        countsText={countsText}
      />

      {/* Conversion Options */}
      <div className="px-3 sm:px-6 py-3 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={convertBeforeUpload}
                onChange={(e) => setConvertBeforeUpload(e.target.checked)}
                className="w-4 h-4 rounded focus:ring-2"
                style={{ 
                  color: themeColors.cssVars.primary.base,
                  '--tw-ring-color': themeColors.cssVars.primary.base 
                } as React.CSSProperties}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Convert to WebP
              </span>
            </label>
            {convertBeforeUpload && (
              <button
                onClick={() => setShowConversionOptions(!showConversionOptions)}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {showConversionOptions ? 'Hide options' : 'Show options'}
              </button>
            )}
          </div>
          {convertBeforeUpload && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {CONVERSION_PRESETS[selectedPreset]?.label || 'Custom'}
            </div>
          )}
        </div>

        {/* Expanded conversion options */}
        {convertBeforeUpload && showConversionOptions && (
          <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(CONVERSION_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedPreset === key
                      ? 'shadow-md'
                      : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
                  }`}
                  style={selectedPreset === key ? {
                    backgroundColor: themeColors.cssVars.primary.base,
                    color: 'white'
                  } : {}}
                >
                  <div className="font-semibold">{preset.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
              Conversion reduces file size by ~{CONVERSION_PRESETS[selectedPreset]?.options.quality === 95 ? '50' : '65'}% while maintaining quality
            </p>
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      {currentFolder && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
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
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-24">
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                  {/* Create new folder button */}
                  {!creatingFolder ? (
                    <button
                      onClick={() => setCreatingFolder(true)}
                      className="relative aspect-square rounded-lg overflow-hidden p-3 sm:p-4 flex flex-col items-center justify-center transition-colors cursor-pointer"
                      style={{ 
                        background: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 5%, transparent)`
                      }}
                      title="Create new folder"
                    >
                      <FolderPlusIcon className="w-6 h-6 mb-1" style={{ color: themeColors.cssVars.primary.base }} />
                      <span className="text-[10px] font-medium" style={{ color: themeColors.cssVars.primary.base }}>New Folder</span>
                    </button>
                  ) : (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 p-3 sm:p-4 flex flex-col items-center justify-center"
                      style={{
                        borderColor: themeColors.cssVars.primary.base,
                        background: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 5%, transparent)`
                      }}
                    >
                      <FolderPlusIcon className="w-6 h-6 mb-1" style={{ color: themeColors.cssVars.primary.base }} />
                      <input
                        ref={newFolderInputRef}
                        type="text"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateFolder();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setCreatingFolder(false);
                            setNewFolderName('');
                          }
                        }}
                        onBlur={() => {
                          if (newFolderName.trim()) {
                            handleCreateFolder();
                          } else {
                            setCreatingFolder(false);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs text-center rounded border-2 bg-white dark:bg-gray-800 focus:outline-none"
                        style={{ borderColor: themeColors.cssVars.primary.base }}
                        placeholder="Folder name..."
                      />
                    </div>
                  )}
                  
                  {/* Existing folders */}
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder}
                      onDoubleClick={() => {
                        if (renamingFolder !== folder) {
                          setRenamingFolder(folder);
                          setNewFolderRenameName(folder);
                        }
                      }}
                      className="group relative aspect-square rounded-lg overflow-hidden p-3 sm:p-4 flex items-center justify-center cursor-pointer transition-all duration-200"
                      style={{
                        background: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 5%, transparent)`
                      }}
                      title={renamingFolder !== folder ? 'Double-click to rename' : ''}
                    >
                      {renamingFolder === folder ? (
                        <div className="absolute inset-0 flex items-center justify-center p-3" onClick={e => e.stopPropagation()}>
                          <div className="w-full space-y-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded">
                            <input
                              ref={folderRenameInputRef}
                              type="text"
                              value={newFolderRenameName}
                              onChange={e => setNewFolderRenameName(e.target.value)}
                              onKeyDown={e => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleRenameFolder(folder);
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setRenamingFolder(null);
                                  setNewFolderRenameName('');
                                }
                              }}
                              onBlur={() => {
                                if (newFolderRenameName.trim()) {
                                  handleRenameFolder(folder);
                                } else {
                                  setRenamingFolder(null);
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
                              style={{ borderColor: themeColors.cssVars.primary.base, '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                              placeholder="Folder name..."
                            />
                            <p className="text-[10px] text-gray-600 dark:text-gray-400 italic">Enter to save, Esc to cancel</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            onClick={() => setCurrentFolder(folder)}
                            className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4"
                          >
                            <FolderIcon className="w-6 h-6 mb-1" style={{ color: themeColors.cssVars.primary.base }} />
                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center line-clamp-2">
                              {folder}
                            </span>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingFolder(folder);
                                setNewFolderRenameName(folder);
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                              style={{ backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 90%, black)` }}
                              title="Rename folder"
                            >
                              <PencilIcon className="w-3 h-3 text-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder);
                              }}
                              className="w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 flex items-center justify-center transition-colors"
                              title="Delete empty folder"
                            >
                              <TrashIcon className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No folders yet - show create button */}
            {!currentFolder && filteredFolders.length === 0 && filteredImages.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors"
                  style={{ 
                    color: themeColors.cssVars.primary.base,
                    backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 10%, transparent)`
                  }}
                >
                  <FolderPlusIcon className="w-5 h-5" />
                  Create Folder
                </button>
              </div>
            )}

            {/* Images Section */}
            {filteredImages.length > 0 && (
              <div>
                {filteredFolders.length > 0 && !currentFolder && (
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wider">Images</h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {displayedImages.map((image) => (
                    <div
                      key={image.url}
                      onClick={() => setSelectedImage(image.url)}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg"
                      style={selectedImage === image.url ? {
                        borderColor: themeColors.cssVars.primary.base,
                        boxShadow: `0 0 0 4px color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)`,
                        transform: 'scale(1.05)'
                      } : { borderColor: '#e5e7eb' }}
                    >
                      {/* Image Preview */}
                      <img 
                        src={image.url} 
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Overlay with Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setConvertingImage(image);
                            setConversionPreset('web-optimized');
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 90%, black)` }}
                          title="Convert to WebP"
                        >
                          <ArrowPathIcon className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setMovingImage(image);
                            setSelectedMoveFolder(currentFolder || '');
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 90%, black)` }}
                          title="Move to folder"
                        >
                          <ArrowsRightLeftIcon className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setRenamingImage(image);
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

                      {/* Selected Indicator */}
                      {selectedImage === image.url && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColors.cssVars.primary.base }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {hasMoreImages && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayLimit(prev => prev + 20)}
                      className="px-6 py-2"
                    >
                      Load More ({filteredImages.length - displayLimit} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Move File Modal */}
      {movingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setMovingImage(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Move "{movingImage.fileName}"
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select destination folder:
              </label>
              <select
                value={selectedMoveFolder}
                onChange={e => setSelectedMoveFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
              >
                <option value="">Root (uncategorized)</option>
                {folders.filter(f => f !== movingImage.folder).map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setMovingImage(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMoveFile}
                variant="primary"
              >
                Move File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Image Modal */}
      {convertingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConvertingImage(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Convert "{convertingImage.fileName}"
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a conversion preset to optimize this image:
            </p>

            <div className="mb-4 space-y-2">
              {Object.entries(CONVERSION_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setConversionPreset(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    conversionPreset === key
                      ? 'border-current shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={conversionPreset === key ? { 
                    borderColor: themeColors.cssVars.primary.base,
                    backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 5%, transparent)`
                  } : {}}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{preset.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{preset.description}</div>
                  <div className="text-xs mt-1 opacity-70">
                    ~{estimateCompression(1000000, preset.name).estimatedSavings}% savings
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setConvertingImage(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleConvertImage(convertingImage, conversionPreset)}
                variant="primary"
              >
                Convert Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Image Modal */}
      {renamingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRenamingImage(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Rename "{renamingImage.fileName}"
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New file name:
              </label>
              <input
                ref={renameInputRef}
                type="text"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRename();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setRenamingImage(null);
                    setNewFileName('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                placeholder="Enter new name..."
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Extension will be added automatically
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setRenamingImage(null);
                  setNewFileName('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                variant="primary"
                disabled={!newFileName.trim()}
              >
                Rename
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  );
});

R2ImageUpload.displayName = 'R2ImageUpload';

export default R2ImageUpload;
