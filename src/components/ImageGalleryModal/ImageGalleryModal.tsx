'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PhotoIcon, ArrowUpTrayIcon, ArrowPathIcon, FolderIcon, ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <PhotoIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Image Gallery</h2>
              {(images.length > 0 || folders.length > 0) && (
                <span className="hidden sm:inline text-sm text-gray-500">
                  ({filteredFolders.length} {filteredFolders.length === 1 ? 'folder' : 'folders'}, {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'})
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb Navigation */}
          {currentPath && (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm overflow-x-auto">
                <button
                  onClick={handleNavigateToRoot}
                  className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors shrink-0"
                  title="Go to root"
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Gallery</span>
                </button>
                {currentPath.split('/').map((segment, index) => (
                  <React.Fragment key={index}>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <button
                      onClick={() => handleNavigateToPath(index)}
                      className="px-2 py-1 text-gray-700 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors shrink-0 truncate max-w-[120px]"
                      title={segment}
                    >
                      {segment}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar & Upload */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={isSearching ? "Indexing..." : window.innerWidth < 768 ? "Search images" : "Search all images across folders..."}
                    disabled={isSearching}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-wait"
                  />
                  {searchQuery && (
                    <div className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium">
                      Searching all folders
                    </div>
                  )}
                </div>
                <Button
                  onClick={fetchImages}
                  disabled={isLoading}
                  variant="outline"
                  className="whitespace-nowrap"
                  title="Refresh gallery"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
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
                  className="whitespace-nowrap"
                  title="Upload images (JPG, PNG, GIF, SVG, WebP - max 5MB each)"
                >
                  <ArrowUpTrayIcon className="w-5 h-5 md:mr-2" />
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
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading images...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XMarkIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
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
                <div className="text-center">
                  <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {searchQuery ? 'No items match your search' : 'No items found in this folder'}
                  </p>
                  {currentPath === '' && images.length === 0 && folders.length === 0 && (
                    <div className="text-sm text-gray-400 mt-4 space-y-2">
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
              <div className="space-y-6">
                {/* Folders Section */}
                {filteredFolders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Folders</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredFolders.map((folder) => (
                        <button
                          key={folder.name}
                          onClick={() => handleFolderClick(folder.name)}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <FolderIcon className="w-16 h-16 text-blue-500 mb-2" />
                            <span className="text-sm font-medium text-gray-700 text-center line-clamp-2">
                              {folder.name}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images Section */}
                {filteredImages.length > 0 && (
                  <div>
                    {filteredFolders.length > 0 && (
                      <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Images</h3>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredImages.map((image) => (
                        <div
                          key={image.url}
                          onClick={() => handleImageSelect(image)}
                          className={`
                            group relative aspect-square rounded-lg overflow-hidden cursor-pointer
                            border-2 transition-all duration-200
                            ${selectedImage === image.url 
                              ? 'border-blue-500 ring-4 ring-blue-100 scale-105' 
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                            }
                          `}
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
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 hidden md:block">
              {selectedImage ? (
                <span className="font-medium text-blue-600">1 image selected</span>
              ) : (
                <span>Click an image to select it</span>
              )}
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 md:flex-initial"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSelection}
                disabled={!selectedImage}
                className="flex-1 md:flex-initial"
              >
                Insert Image
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
