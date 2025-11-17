'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PhotoIcon, ArrowUpTrayIcon, ArrowPathIcon, FolderIcon, ChevronRightIcon, HomeIcon, PlayIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import UnsplashImageSearch, { UnsplashAttribution } from './UnsplashImageSearch';
import PexelsImageSearch from './PexelsImageSearch';
import YouTubeVideoSearch from './YouTubeVideoSearch';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => void;
}

interface StorageImage {
  name: string;
  url: string;
  size?: number;
  created_at?: string;
  isFolder?: boolean;
  path?: string; // Full path for display in search results
}

interface StorageFolder {
  name: string;
  isFolder: true;
}

type StorageItem = StorageImage | StorageFolder;

export default function ImageGalleryModal({ isOpen, onClose, onSelectImage }: ImageGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'unsplash' | 'pexels' | 'youtube'>('gallery');
  const [images, setImages] = useState<StorageImage[]>([]);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [allImages, setAllImages] = useState<StorageImage[]>([]); // For global search
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const themeColors = useThemeColors();
  const { primary } = themeColors;

  // Fetch images from Supabase storage
  useEffect(() => {
    if (isOpen) {
      fetchImages();
      // Fetch all images for global search (only once when modal opens)
      if (allImages.length === 0) {
        setIsSearching(true);
        fetchAllImages().then(results => {
          setAllImages(results);
          setIsSearching(false);
          console.log('Global search index built:', results.length, 'images');
        });
      }
    }
  }, [isOpen, currentPath]);

  // Fetch all images recursively for global search
  const fetchAllImages = async (path = '', accumulated: StorageImage[] = []): Promise<StorageImage[]> => {
    try {
      const { data, error: storageError } = await supabase.storage
        .from('gallery')
        .list(path, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (storageError || !data) {
        console.error('Error fetching all images:', storageError);
        return accumulated;
      }

      for (const item of data) {
        if (item.id === null) {
          // It's a folder - recurse into it
          const folderPath = path ? `${path}/${item.name}` : item.name;
          const subImages = await fetchAllImages(folderPath, accumulated);
          accumulated = subImages;
        } else {
          // It's a file - check if it's an image
          const extension = item.name.split('.').pop()?.toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '');
          
          if (isImage) {
            const fullPath = path ? `${path}/${item.name}` : item.name;
            accumulated.push({
              name: item.name,
              url: `https://rgbmdfaoowqbgshjuwwm.supabase.co/storage/v1/object/public/gallery/${fullPath}`,
              size: item.metadata?.size,
              created_at: item.created_at,
              isFolder: false,
              path: fullPath // Store full path for display
            });
          }
        }
      }

      return accumulated;
    } catch (err) {
      console.error('Error in fetchAllImages:', err);
      return accumulated;
    }
  };

  const fetchImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching from path:', currentPath || '(root)');
      
      // List files from the gallery bucket at current path
      const { data, error: storageError } = await supabase.storage
        .from('gallery')
        .list(currentPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      console.log('Storage response:', { 
        path: currentPath,
        data, 
        error: storageError, 
        dataLength: data?.length,
        items: data?.map(f => ({ name: f.name, id: f.id }))
      });

      if (storageError) {
        console.error('Storage error:', storageError);
        throw storageError;
      }

      if (!data || data.length === 0) {
        console.warn('No files found in current path');
        setImages([]);
        setFolders([]);
        setIsLoading(false);
        return;
      }

      console.log('Items found:', data.length);

      // Separate folders and files
      const folderList: StorageFolder[] = [];
      const imageList: StorageImage[] = [];

      data.forEach(item => {
        // Check if it's a folder (id is null for folders)
        if (item.id === null) {
          folderList.push({
            name: item.name,
            isFolder: true
          });
        } else {
          // It's a file - check if it's an image
          const extension = item.name.split('.').pop()?.toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '');
          
          if (isImage) {
            const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            imageList.push({
              name: item.name,
              url: `https://rgbmdfaoowqbgshjuwwm.supabase.co/storage/v1/object/public/gallery/${fullPath}`,
              size: item.metadata?.size,
              created_at: item.created_at,
              isFolder: false
            });
          }
        }
      });

      console.log('Found:', folderList.length, 'folders,', imageList.length, 'images');
      setFolders(folderList);
      setImages(imageList);
    } catch (err) {
      console.error('Error fetching images:', err);
      setImages([]);
      setError('Failed to load images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use global search when query is present, otherwise show current folder
  const filteredImages = searchQuery
    ? allImages.filter(image =>
        image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (image.path && image.path.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : images.filter(image =>
        image.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const filteredFolders = searchQuery
    ? [] // Hide folders when searching globally
    : folders.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleImageSelect = (image: StorageImage) => {
    setSelectedImage(image.url);
  };

  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setPathHistory([...pathHistory, newPath]);
    setSearchQuery(''); // Clear search when navigating
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Search provides global results automatically via filteredImages
  };

  const handleNavigateUp = () => {
    if (currentPath) {
      const parts = currentPath.split('/');
      parts.pop(); // Remove last segment
      const newPath = parts.join('/');
      setCurrentPath(newPath);
      setPathHistory([...pathHistory, newPath]);
      setSearchQuery('');
    }
  };

  const handleNavigateToRoot = () => {
    setCurrentPath('');
    setPathHistory(['']);
    setSearchQuery('');
  };

  const handleNavigateToPath = (index: number) => {
    const pathParts = currentPath.split('/').filter(p => p);
    const newPath = pathParts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
    setPathHistory([...pathHistory, newPath]);
    setSearchQuery('');
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
      setSelectedImage(null);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSearchQuery('');
    setCurrentPath('');
    setPathHistory(['']);
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress('');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          console.warn(`Skipping ${file.name}: Invalid file type`);
          errorCount++;
          continue;
        }

        // Validate file size
        if (file.size > maxSize) {
          console.warn(`Skipping ${file.name}: File too large (max 5MB)`);
          errorCount++;
          continue;
        }

        // Generate unique filename to avoid conflicts
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7);
        const fileExt = file.name.split('.').pop();
        const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileName = `${baseName}-${timestamp}-${random}.${fileExt}`;

        console.log(`Uploading ${file.name} as ${fileName}...`);

        // Upload via API route (uses service role key on server side)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath); // Send current path to API

        const response = await fetch('/api/gallery/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          console.error(`Error uploading ${file.name}:`, {
            message: result.error || 'Upload failed',
            fileName: fileName,
            fileSize: file.size,
            fileType: file.type,
            status: response.status
          });
          errorCount++;
        } else {
          console.log(`✅ ${file.name} uploaded successfully`);
          successCount++;
        }
      }

      // Refresh the gallery
      await fetchImages();
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success message
      if (successCount > 0) {
        setUploadProgress(`✅ ${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully!`);
        setTimeout(() => setUploadProgress(''), 3000);
      }

      if (errorCount > 0) {
        setError(`Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}. Check file type and size (max 5MB).`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  const handleUnsplashSelect = (url: string, attribution: UnsplashAttribution) => {
    onSelectImage(url, attribution);
    onClose();
  };

  const handlePexelsSelect = (url: string, attribution?: PexelsAttributionData, isVideo?: boolean, videoData?: any) => {
    onSelectImage(url, attribution, isVideo, videoData);
    onClose();
  };

  const handleYouTubeSelect = (videoId: string, videoData: any) => {
    console.log('🎥 handleYouTubeSelect called with:', { videoId, videoData });
    // Pass YouTube video data to parent with both thumbnail_url and image_url set
    onSelectImage(
      `https://www.youtube.com/watch?v=${videoId}`,
      undefined,
      true,
      {
        video_player: 'youtube',
        video_url: videoId,
        thumbnail_url: videoData.thumbnail,
        image_url: videoData.thumbnail, // Set image_url as well for compatibility
        title: videoData.title,
      }
    );
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Image Gallery"
      size="xl"
      noPadding={true}
      draggable={true}
      resizable={true}
      zIndex={10005}
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`
            px-6 py-3 font-medium text-sm transition-all border-b-2
            ${activeTab === 'gallery'
              ? 'bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          style={activeTab === 'gallery' ? {
            borderColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : undefined}
        >
          <FolderIcon className="w-5 h-5 inline-block mr-2" />
          My Gallery
        </button>
        <button
          onClick={() => setActiveTab('unsplash')}
          className={`
            px-6 py-3 font-medium text-sm transition-all border-b-2
            ${activeTab === 'unsplash'
              ? 'bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          style={activeTab === 'unsplash' ? {
            borderColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : undefined}
        >
          <svg className="w-5 h-5 inline-block mr-2" viewBox="0 0 32 32" fill="currentColor">
            <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
          </svg>
          Unsplash
        </button>
        <button
          onClick={() => setActiveTab('pexels')}
          className={`
            px-6 py-3 font-medium text-sm transition-all border-b-2
            ${activeTab === 'pexels'
              ? 'bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          style={activeTab === 'pexels' ? {
            borderColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : undefined}
        >
          <PhotoIcon className="w-5 h-5 inline-block mr-2" />
          Pexels
        </button>
        <button
          onClick={() => setActiveTab('youtube')}
          className={`
            px-6 py-3 font-medium text-sm transition-all border-b-2
            ${activeTab === 'youtube'
              ? 'bg-white dark:bg-gray-900'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          style={activeTab === 'youtube' ? {
            borderColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : undefined}
        >
          <PlayIcon className="w-5 h-5 inline-block mr-2" />
          YouTube
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'gallery' ? (
        <>
      {/* Search Bar & Upload - Directly below header */}
      <div className="sticky top-0 z-10 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={isSearching ? "Indexing..." : window.innerWidth < 768 ? "Search images" : "Search all images across folders..."}
              disabled={isSearching}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-wait transition-shadow"
              style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
            />
              {searchQuery && (
                <div className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: themeColors.cssVars.primary.base }}>
                  Searching all folders
                </div>
              )}
            </div>
            <Button
              onClick={fetchImages}
              disabled={isLoading}
              variant="outline"
              className="whitespace-nowrap px-2 sm:px-3"
              title="Refresh gallery"
            >
              <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              variant="primary"
              className="whitespace-nowrap px-2 sm:px-3"
              title="Upload images (JPG, PNG, GIF, SVG, WebP - max 5MB each)"
            >
              <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 md:mr-2" />
              <span className="hidden md:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
            </Button>
          </div>
          
          {/* Upload Progress */}
          {uploadProgress && (
            <div className="text-sm text-green-600 flex items-center gap-2 animate-fade-in">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
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
      {currentPath && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-gray-50/50 dark:bg-gray-900/20" style={{ borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)`, backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 3%, transparent)` }}>
          <div className="flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto">
            <button
              onClick={handleNavigateToRoot}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors shrink-0"
              style={{ color: themeColors.cssVars.primary.base }}
              title="Go to root"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </button>
            {currentPath.split('/').map((segment, index) => (
              <React.Fragment key={index}>
                <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
                <button
                  onClick={() => handleNavigateToPath(index)}
                  className="px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors shrink-0 truncate max-w-[120px]"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  title={segment}
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Content - with top spacing */}
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
              <Button
                onClick={fetchImages}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredFolders.length === 0 && filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-4">
              <PhotoIcon className="w-12 h-12 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 text-sm sm:text-base">
                {searchQuery ? 'No items match your search' : 'No items found in this folder'}
              </p>
              {currentPath === '' && images.length === 0 && folders.length === 0 && (
                <div className="text-xs sm:text-sm text-gray-400 mt-4 space-y-2">
                  <p>Upload images to your Supabase storage:</p>
                  <ol className="text-left max-w-md mx-auto list-decimal list-inside space-y-1">
                    <li>Go to Supabase Dashboard → Storage</li>
                    <li>Select the "gallery" bucket</li>
                    <li>Upload image files (jpg, png, gif, svg, webp)</li>
                    <li>Refresh this gallery</li>
                  </ol>
                </div>
              )}
              {currentPath !== '' && (
                <Button
                  onClick={handleNavigateUp}
                  variant="outline"
                  className="mt-4"
                >
                  Go Back
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Folders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wider">Folders</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.name}
                      onClick={() => handleFolderClick(folder.name)}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-sky-200 hover:border-sky-400 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-sky-50 to-sky-100"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4">
                        <FolderIcon className="w-12 h-12 sm:w-12 sm:h-12 text-sky-500 mb-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2">
                          {folder.name}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-sky-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Images Section */}
            {filteredImages.length > 0 && (
              <div>
                {filteredFolders.length > 0 && (
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wider">Images</h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredImages.map((image) => (
                    <div
                      key={image.url}
                      onClick={() => handleImageSelect(image)}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg"
                      style={selectedImage === image.url ? {
                        borderColor: themeColors.cssVars.primary.base,
                        boxShadow: `0 0 0 4px color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)`,
                        transform: 'scale(1.05)'
                      } : {
                        borderColor: 'rgb(229 231 235)'
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-contain bg-gray-50 p-2"
                        loading="lazy"
                      />
                      
                      {/* Overlay */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                        transition-opacity duration-200
                        ${selectedImage === image.url ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      `}>
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          {searchQuery && image.path ? (
                            <>
                              <p className="text-white text-[10px] opacity-80 truncate">
                                {image.path.split('/').slice(0, -1).join('/') || 'root'}
                              </p>
                              <p className="text-white text-xs font-medium truncate">
                                {image.name}
                              </p>
                            </>
                          ) : (
                            <p className="text-white text-xs font-medium truncate">
                              {image.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Selection Checkmark */}
                      {selectedImage === image.url && (
                        <div className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 bg-sky-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="sticky bottom-0 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t bg-gray-50/50 dark:bg-gray-900/20" style={{ borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)` }}>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:block">
          {selectedImage ? (
            <span className="font-medium" style={{ color: themeColors.cssVars.primary.base }}>1 image selected</span>
          ) : (
            <span>Click an image to select it</span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 md:flex-initial text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmSelection}
            disabled={!selectedImage}
            className="flex-1 md:flex-initial text-sm sm:text-base"
          >
            Insert Image
          </Button>
        </div>
      </div>
        </>
      ) : activeTab === 'unsplash' ? (
        /* Unsplash Tab */
        <UnsplashImageSearch onSelectImage={handleUnsplashSelect} />
      ) : activeTab === 'pexels' ? (
        /* Pexels Tab */
        <PexelsImageSearch onSelectImage={handlePexelsSelect} />
      ) : (
        /* YouTube Tab */
        <YouTubeVideoSearch onSelectVideo={handleYouTubeSelect} />
      )}
    </BaseModal>
  );
}
