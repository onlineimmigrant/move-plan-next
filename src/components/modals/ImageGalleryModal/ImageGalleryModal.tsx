'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PhotoIcon, ArrowUpTrayIcon, ArrowPathIcon, FolderIcon, ChevronRightIcon, HomeIcon, PlayIcon, CheckCircleIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import Button from '@/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';

// Lazy load tab components (only those without refs)
const UnsplashImageSearch = lazy(() => import('./UnsplashImageSearch'));
const PexelsImageSearch = lazy(() => import('./PexelsImageSearch'));
const YouTubeVideoSearch = lazy(() => import('./YouTubeVideoSearch'));

// Import R2 components directly (they use refs, can't be lazy-loaded)
import R2VideoUpload from './R2VideoUploadNew';
import R2ImageUpload from './R2ImageUpload';

// Import types
import type { UnsplashAttribution } from './UnsplashImageSearch';
import type { R2VideoUploadHandle } from './R2VideoUploadNew';
import type { R2ImageUploadHandle } from './R2ImageUpload';

// Global cache for fetchAllImages to avoid refetching
type GlobalGalleryIndexCache = {
  revision: number;
  builtAt: number;
  images: StorageImage[];
};

let globalGalleryIndexCache: GlobalGalleryIndexCache | null = null;
let globalGalleryIndexPromise: Promise<StorageImage[]> | null = null;
let globalGalleryRevision = 0;

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string, attribution?: UnsplashAttribution | PexelsAttributionData, isVideo?: boolean, videoData?: any) => void;
  productId?: number; // Optional: for auto-attaching R2 videos on upload
  defaultTab?: 'r2images' | 'upload' | 'unsplash' | 'pexels' | 'youtube' | 'gallery' | 'videos';
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

type ViewMode = 'grid' | 'list';
type GridSize = 'compact' | 'comfortable' | 'large';

export default function ImageGalleryModal({ isOpen, onClose, onSelectImage, productId, defaultTab = 'r2images' }: ImageGalleryModalProps) {
  const isDev = process.env.NODE_ENV !== 'production';
  const { isSuperadmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'r2images' | 'upload' | 'unsplash' | 'pexels' | 'youtube' | 'gallery'>(defaultTab === 'videos' ? 'youtube' : defaultTab);
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [r2ImageHasSelection, setR2ImageHasSelection] = useState(false);
  const [r2VideoHasSelection, setR2VideoHasSelection] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridSize, setGridSize] = useState<GridSize>('comfortable');
  const [mounted, setMounted] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20); // Pagination for gallery tab
  const [hasOpenedR2Images, setHasOpenedR2Images] = useState(() => (defaultTab === 'r2images'));
  const [hasOpenedR2Video, setHasOpenedR2Video] = useState(() => (defaultTab === 'upload'));
  const [pexelsIncludeAttribution, setPexelsIncludeAttribution] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const r2ImageRef = useRef<R2ImageUploadHandle>(null);
  const r2VideoRef = useRef<R2VideoUploadHandle>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const globalIndexAbortRef = useRef<AbortController | null>(null);
  const isOpenRef = useRef<boolean>(false);
  const rndDefaultRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const navigateUpRef = useRef<(() => void) | null>(null);
  const handleInsertRef = useRef<(() => void) | null>(null);
  const handleCloseRef = useRef<(() => void) | null>(null);
  const fetchImagesRef = useRef<(() => void) | null>(null);
  
  const themeColors = useThemeColors();
  const { primary } = themeColors;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      globalIndexAbortRef.current?.abort();
      globalIndexAbortRef.current = null;
      rndDefaultRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'r2images') setHasOpenedR2Images(true);
    if (activeTab === 'upload') setHasOpenedR2Video(true);
  }, [activeTab]);

  // Restrict the "My Gallery" tab to superadmins only.
  useEffect(() => {
    if (authLoading) return;
    if (!isSuperadmin && activeTab === 'gallery') {
      setActiveTab('r2images');
    }
  }, [authLoading, isSuperadmin, activeTab]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Focus search with /
    if (e.key === '/' && activeTab === 'gallery') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    
    // Navigate up folder with Backspace
    if (e.key === 'Backspace' && activeTab === 'gallery' && currentPath && !searchQuery && document.activeElement !== searchInputRef.current) {
      e.preventDefault();
      navigateUpRef.current?.();
    }
    
    // Insert with Ctrl+Enter
    if (e.ctrlKey && e.key === 'Enter' && selectedImages.size > 0) {
      e.preventDefault();
      handleInsertRef.current?.();
    }
    
    // Close with Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseRef.current?.();
    }
  }, [activeTab, currentPath, searchQuery, selectedImages.size]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Fetch folder images for Supabase storage (fast).
  useEffect(() => {
    if (isOpen && activeTab === 'gallery') {
      fetchImagesRef.current?.();
    }
  }, [isOpen, currentPath, activeTab]);

  // Fetch all images recursively for global search
  const fetchAllImages = useCallback(async (
    path = '',
    accumulated: StorageImage[] = [],
    signal?: AbortSignal
  ): Promise<StorageImage[]> => {
    try {
      if (signal?.aborted) return accumulated;
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
        if (signal?.aborted) break;
        if (item.id === null) {
          // It's a folder - recurse into it
          const folderPath = path ? `${path}/${item.name}` : item.name;
          const subImages = await fetchAllImages(folderPath, accumulated, signal);
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
  }, []);

  // Build global search index only when user actually searches.
  useEffect(() => {
    if (!isOpen || activeTab !== 'gallery') return;

    const query = debouncedSearchQuery.trim();
    const shouldIndex = query.length > 0;

    if (!shouldIndex) {
      globalIndexAbortRef.current?.abort();
      globalIndexAbortRef.current = null;
      setIsSearching(false);
      return;
    }

    // Use cache if it matches current revision.
    if (globalGalleryIndexCache?.revision === globalGalleryRevision) {
      setAllImages(globalGalleryIndexCache.images);
      return;
    }

    const startOrJoin = () => {
      if (!isOpenRef.current) return;

      // Join in-flight build if present.
      if (globalGalleryIndexPromise) {
        setIsSearching(true);
        globalGalleryIndexPromise
          .then((images) => {
            if (!isOpenRef.current) return;
            setAllImages(images);
          })
          .finally(() => {
            if (isOpenRef.current) setIsSearching(false);
          });
        return;
      }

      globalIndexAbortRef.current?.abort();
      const controller = new AbortController();
      globalIndexAbortRef.current = controller;

      setIsSearching(true);
      const promise = fetchAllImages('', [], controller.signal);
      globalGalleryIndexPromise = promise;

      promise
        .then((images) => {
          if (controller.signal.aborted) return images;
          globalGalleryIndexCache = {
            revision: globalGalleryRevision,
            builtAt: Date.now(),
            images,
          };
          return images;
        })
        .then((images) => {
          if (!isOpenRef.current || controller.signal.aborted) return;
          setAllImages(images);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error('Error building global gallery index:', err);
        })
        .finally(() => {
          if (globalGalleryIndexPromise === promise) {
            globalGalleryIndexPromise = null;
          }
          if (isOpenRef.current) setIsSearching(false);
        });
    };

    // Yield until idle so opening/styling stays snappy.
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(startOrJoin, { timeout: 1000 });
    } else {
      setTimeout(startOrJoin, 0);
    }
  }, [isOpen, activeTab, debouncedSearchQuery, fetchAllImages]);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isDev) console.log('Fetching from path:', currentPath || '(root)');
      
      // List files from the gallery bucket at current path
      const { data, error: storageError } = await supabase.storage
        .from('gallery')
        .list(currentPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (isDev) {
        console.log('Storage response:', {
          path: currentPath,
          data,
          error: storageError,
          dataLength: data?.length,
          items: data?.map((f) => ({ name: f.name, id: f.id })),
        });
      }

      if (storageError) {
        console.error('Storage error:', storageError);
        throw storageError;
      }

      if (!data || data.length === 0) {
        if (isDev) console.warn('No files found in current path');
        setImages([]);
        setFolders([]);
        setIsLoading(false);
        return;
      }

      if (isDev) console.log('Items found:', data.length);

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

      if (isDev) console.log('Found:', folderList.length, 'folders,', imageList.length, 'images');
      setFolders(folderList);
      setImages(imageList);
    } catch (err) {
      console.error('Error fetching images:', err);
      setImages([]);
      setError('Failed to load images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, isDev]);

  // Memoize filtered images - use debounced query
  const filteredImages = useMemo(() => {
    const query = debouncedSearchQuery.trim();
    const lowerQuery = query.toLowerCase();
    if (query) {
      return allImages.filter(image =>
        image.name.toLowerCase().includes(lowerQuery) ||
        (image.path && image.path.toLowerCase().includes(lowerQuery))
      );
    }
    return images.filter(image =>
      image.name.toLowerCase().includes(lowerQuery)
    );
  }, [debouncedSearchQuery, allImages, images]);

  const filteredFolders = useMemo(() => {
    if (debouncedSearchQuery) return []; // Hide folders when searching globally
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [debouncedSearchQuery, folders]);

  // Paginated images for gallery tab
  const displayedImages = useMemo(() => {
    return filteredImages.slice(0, displayLimit);
  }, [filteredImages, displayLimit]);

  const hasMoreImages = filteredImages.length > displayLimit;

  const handleImageSelect = useCallback((image: StorageImage, isMultiSelect = false) => {
    if (isMultiSelect) {
      const newSelected = new Set(selectedImages);
      if (newSelected.has(image.url)) {
        newSelected.delete(image.url);
      } else {
        newSelected.add(image.url);
      }
      setSelectedImages(newSelected);
      setSelectedImage(Array.from(newSelected)[0] || null);
    } else {
      setSelectedImage(image.url);
      setSelectedImages(new Set([image.url]));
    }
  }, [selectedImages]);

  const navigateUp = useCallback(() => {
    if (currentPath) {
      const parts = currentPath.split('/');
      parts.pop();
      const newPath = parts.join('/');
      setCurrentPath(newPath);
      setPathHistory([...pathHistory, newPath]);
      setSearchQuery('');
      setDisplayLimit(20);
    }
  }, [currentPath, pathHistory]);

  const handleFolderClick = useCallback((folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setPathHistory([...pathHistory, newPath]);
    setSearchQuery(''); // Clear search when navigating
    setDisplayLimit(20); // Reset pagination when navigating
  }, [currentPath, pathHistory]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setDisplayLimit(20); // Reset pagination on search
  }, []);

  const handleNavigateUp = useCallback(() => {
    navigateUp();
  }, [navigateUp]);

  const handleNavigateToRoot = useCallback(() => {
    setCurrentPath('');
    setPathHistory(['']);
    setSearchQuery('');
  }, []);

  const handleNavigateToPath = useCallback((index: number) => {
    const pathParts = currentPath.split('/').filter(p => p);
    const newPath = pathParts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
    setPathHistory([...pathHistory, newPath]);
    setSearchQuery('');
  }, [currentPath, pathHistory]);

  const handleInsert = useCallback(async () => {
    // For R2 Images tab, call the R2ImageUpload's confirm handler
    if (activeTab === 'r2images' && r2ImageRef.current) {
      r2ImageRef.current.confirmSelection();
      onClose();
      return;
    }
    
    // For Video tab, call the R2VideoUpload's confirm handler
    if (activeTab === 'upload' && r2VideoRef.current) {
      await r2VideoRef.current.confirmSelection();
      onClose();
      return;
    }
    
    // For other tabs (gallery, unsplash, pexels, youtube), use the standard flow
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
      setSelectedImage(null);
      setSelectedImages(new Set());
    }
  }, [activeTab, selectedImage, onSelectImage, onClose]);

  const handleConfirmSelection = useCallback(() => {
    handleInsert();
  }, [handleInsert]);

  const handleClose = useCallback(() => {
    globalIndexAbortRef.current?.abort();
    globalIndexAbortRef.current = null;
    setSelectedImage(null);
    setSelectedImages(new Set());
    setSearchQuery('');
    setCurrentPath('');
    setPathHistory(['']);
    onClose();
  }, [onClose]);

  // Keep latest callbacks in refs for keyboard shortcuts/effects.
  useEffect(() => {
    navigateUpRef.current = navigateUp;
  }, [navigateUp]);

  useEffect(() => {
    handleInsertRef.current = handleInsert;
  }, [handleInsert]);

  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    fetchImagesRef.current = fetchImages;
  }, [fetchImages]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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

        if (isDev) console.log(`Uploading ${file.name} as ${fileName}...`);

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
          if (isDev) console.log(`✅ ${file.name} uploaded successfully`);
          successCount++;
        }
      }

      // Refresh the gallery
      await fetchImages();

      // Invalidate global search index so search stays correct after uploads.
      globalGalleryRevision += 1;
      globalGalleryIndexCache = null;
      globalGalleryIndexPromise = null;
      
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
  }, [currentPath, fetchImages, isDev]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUnsplashSelect = useCallback((url: string, attribution: UnsplashAttribution) => {
    onSelectImage(url, attribution);
    onClose();
  }, [onSelectImage, onClose]);

  const handlePexelsSelect = useCallback((url: string, attribution?: PexelsAttributionData, isVideo?: boolean, videoData?: any) => {
    onSelectImage(url, attribution, isVideo, videoData);
    onClose();
  }, [onSelectImage, onClose]);

  const handleYouTubeSelect = useCallback((videoId: string, videoData: any) => {
    if (isDev) console.log('🎥 handleYouTubeSelect called with:', { videoId, videoData });
    onSelectImage(
      `https://www.youtube.com/watch?v=${videoId}`,
      undefined,
      true,
      {
        video_player: 'youtube',
        video_url: videoId,
        thumbnail_url: videoData.thumbnail,
        image_url: videoData.thumbnail,
        title: videoData.title,
      }
    );
    onClose();
  }, [onSelectImage, onClose, isDev]);

  // Get grid columns class based on size
  const getGridCols = useCallback(() => {
    switch (gridSize) {
      case 'compact': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
      case 'comfortable': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
      case 'large': return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  }, [gridSize]);

  if (!isOpen) return null;

  // Detect mobile/tablet screens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  if (!rndDefaultRef.current) {
    if (isMobile) {
      // Full screen on mobile
      rndDefaultRef.current = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    } else if (isTablet) {
      // Larger on tablet
      rndDefaultRef.current = {
        x: 20,
        y: 20,
        width: window.innerWidth - 40,
        height: window.innerHeight - 40,
      };
    } else {
      // Default desktop size
      const desktopWidth = 822.25;
      const desktopHeight = Math.min(window.innerHeight - 40, 750 * 1.25);
      rndDefaultRef.current = {
        x: window.innerWidth / 2 - desktopWidth / 2,
        y: window.innerHeight / 2 - desktopHeight / 2,
        width: desktopWidth,
        height: desktopHeight,
      };
    }
  }

  const modalContent = (
    <>
      {/* Fixed viewport layer so the modal doesn't move when the page scrolls behind it */}
      <div className="fixed inset-0 z-[10004]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 dark:bg-black/40"
          onClick={handleClose}
        />

        <Rnd
          default={rndDefaultRef.current}
          minWidth={isMobile ? window.innerWidth : isTablet ? 600 : 500}
          minHeight={isMobile ? window.innerHeight : isTablet ? 500 : 600}
          bounds="window"
          dragHandleClassName="drag-handle"
          className="z-[10005]"
          disableDragging={isMobile}
          enableResizing={!isMobile}
        >
      <div className={`h-full flex flex-col ${isMobile ? 'bg-white dark:bg-gray-900' : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl'} ${isMobile ? '' : 'rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50'} overflow-hidden`}>
        {/* Fixed Header with Drag Handle */}
        <div className={`${isMobile ? '' : 'drag-handle cursor-move'} bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border-b border-gray-200/30 dark:border-gray-700/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Media Gallery</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all hover:ring-2 ring-gray-300 dark:ring-gray-600"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/50 bg-transparent">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {/* Images Tab (r2images) */}
          <button
            onClick={() => setActiveTab('r2images')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
            style={
              activeTab === 'r2images'
                ? {
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: themeColors.cssVars.primary.base,
                    border: '1px solid',
                    borderColor: `${themeColors.cssVars.primary.base}40`,
                  }
            }
          >
            <PhotoIcon className="w-4 h-4" />
            <span>Images</span>
          </button>
          
          {/* Video Tab (upload) */}
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
            style={
              activeTab === 'upload'
                ? {
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: themeColors.cssVars.primary.base,
                    border: '1px solid',
                    borderColor: `${themeColors.cssVars.primary.base}40`,
                  }
            }
          >
            <PlayIcon className="w-4 h-4" />
            <span>Video</span>
          </button>
          
          {/* Unsplash Tab */}
          <button
            onClick={() => setActiveTab('unsplash')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
            style={
              activeTab === 'unsplash'
                ? {
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: themeColors.cssVars.primary.base,
                    border: '1px solid',
                    borderColor: `${themeColors.cssVars.primary.base}40`,
                  }
            }
          >
            <svg className="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
              <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
            </svg>
            <span>Unsplash</span>
          </button>
          
          {/* Pexels Tab */}
          <button
            onClick={() => setActiveTab('pexels')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
            style={
              activeTab === 'pexels'
                ? {
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: themeColors.cssVars.primary.base,
                    border: '1px solid',
                    borderColor: `${themeColors.cssVars.primary.base}40`,
                  }
            }
          >
            <PhotoIcon className="w-4 h-4" />
            <span>Pexels</span>
          </button>
          
          {/* YouTube Tab */}
          <button
            onClick={() => setActiveTab('youtube')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
            style={
              activeTab === 'youtube'
                ? {
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: themeColors.cssVars.primary.base,
                    border: '1px solid',
                    borderColor: `${themeColors.cssVars.primary.base}40`,
                  }
            }
          >
            <PlayIcon className="w-4 h-4" />
            <span>YouTube</span>
          </button>
          
          {/* My Gallery Tab (superadmin only) */}
          {isSuperadmin && (
            <button
              onClick={() => setActiveTab('gallery')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap shadow-sm"
              style={
                activeTab === 'gallery'
                  ? {
                      background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}, ${themeColors.cssVars.primary.hover})`,
                      color: 'white',
                      boxShadow: `0 4px 12px ${themeColors.cssVars.primary.base}40`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: themeColors.cssVars.primary.base,
                      border: '1px solid',
                      borderColor: `${themeColors.cssVars.primary.base}40`,
                    }
              }
            >
              <FolderIcon className="w-4 h-4" />
              <span>My Gallery</span>
            </button>
          )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'gallery' ? (
            /* Gallery Tab */
            <>
              {/* Search Bar & Upload */}
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={isSearching ? "Indexing..." : "Search all images... (Press / to focus)"}
                        disabled={isSearching}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-wait transition-all"
                        style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                      />
                      {searchQuery && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: themeColors.cssVars.primary.base }}>
                            All folders
                          </span>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={fetchImages}
                      disabled={isLoading}
                      variant="outline"
                      className="whitespace-nowrap px-3"
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
                      className="whitespace-nowrap px-3"
                      title="Upload images (JPG, PNG, GIF, SVG, WebP - max 5MB each)"
                    >
                      <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                      <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    </Button>
                    
                    {/* View mode toggle */}
                    <div className="hidden lg:flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50">
                      <button
                        onClick={() => setGridSize('compact')}
                        className={`p-1.5 rounded transition-all ${gridSize === 'compact' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title="Compact view"
                      >
                        <Squares2X2Icon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGridSize('comfortable')}
                        className={`p-1.5 rounded transition-all ${gridSize === 'comfortable' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title="Comfortable view"
                      >
                        <Squares2X2Icon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setGridSize('large')}
                        className={`p-1.5 rounded transition-all ${gridSize === 'large' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title="Large view"
                      >
                        <Squares2X2Icon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Upload Progress */}
                  {uploadProgress && (
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 animate-fade-in">
                      <CheckCircleIcon className="w-4 h-4" />
                      {uploadProgress}
                    </div>
                  )}

                  {/* Folder/Image Count */}
                  {(images.length > 0 || folders.length > 0) && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredFolders.length} {filteredFolders.length === 1 ? 'folder' : 'folders'}, {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
                    </div>
                  )}
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              {currentPath && (
                <div className="px-6 py-3 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm overflow-x-auto">
                    <button
                      onClick={handleNavigateToRoot}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all shrink-0 ring-1 ring-gray-200/50 dark:ring-gray-700/50"
                      style={{ color: themeColors.cssVars.primary.base }}
                      title="Go to root (Backspace)"
                    >
                      <HomeIcon className="w-4 h-4" />
                      <span>Gallery</span>
                    </button>
                    {currentPath.split('/').map((segment, index) => (
                      <React.Fragment key={index}>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-600 shrink-0" />
                        <button
                          onClick={() => handleNavigateToPath(index)}
                          className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all shrink-0 truncate max-w-[150px] ring-1 ring-gray-200/50 dark:ring-gray-700/50"
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading images...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center px-4">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XMarkIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
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
                      <PhotoIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        {searchQuery ? 'No items match your search' : 'No items found in this folder'}
                      </p>
                      {currentPath !== '' && (
                        <Button
                          onClick={handleNavigateUp}
                          variant="outline"
                          className="mt-4"
                        >
                          <span className="flex items-center gap-2">
                            Go Back
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/60 dark:bg-gray-800/60 border border-gray-300/50 dark:border-gray-600/50 rounded">⌫</kbd>
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Folders Section */}
                    {filteredFolders.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">Folders</h3>
                        <div className={`grid ${getGridCols()} gap-4`}>
                          {filteredFolders.map((folder) => (
                            <button
                              key={folder.name}
                              onClick={() => handleFolderClick(folder.name)}
                              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-blue-200/50 dark:border-blue-700/50 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 backdrop-blur-sm hover:scale-105"
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                <FolderIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-2 transition-transform group-hover:scale-110" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center line-clamp-2">
                                  {folder.name}
                                </span>
                              </div>
                              <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images Section */}
                    {filteredImages.length > 0 && (
                      <div>
                        {filteredFolders.length > 0 && (
                          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">Images</h3>
                        )}
                        <div className={`grid ${getGridCols()} gap-4`}>
                          {displayedImages.map((image) => {
                            const isSelected = selectedImages.has(image.url);
                            return (
                              <div
                                key={image.url}
                                onClick={(e) => handleImageSelect(image, e.shiftKey)}
                                className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-xl ${
                                  isSelected ? 'scale-105 ring-4' : 'hover:scale-105'
                                }`}
                                style={isSelected ? {
                                  borderColor: themeColors.cssVars.primary.base,
                                  '--tw-ring-color': `${themeColors.cssVars.primary.base}33`
                                } as React.CSSProperties : {
                                  borderColor: 'rgb(229 231 235 / 0.5)'
                                } as React.CSSProperties}
                              >
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-full object-cover bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                  loading="lazy"
                                />
                                
                                {/* Overlay */}
                                <div className={`
                                  absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                                  transition-opacity duration-200
                                  ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}>
                                  <div className="absolute bottom-0 left-0 right-0 p-3">
                                    {searchQuery && image.path ? (
                                      <>
                                        <p className="text-white/70 text-[10px] truncate">
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
                                {isSelected && (
                                  <div 
                                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50"
                                    style={{ backgroundColor: themeColors.cssVars.primary.base }}
                                  >
                                    <CheckCircleIcon className="w-5 h-5 text-white" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
            </>
          ) : null}

          {/* Images Tab - mount once, then hide/show to avoid refetch on tab switch */}
          {hasOpenedR2Images ? (
            <div className={activeTab === 'r2images' ? 'h-full' : 'hidden'}>
              <R2ImageUpload 
                ref={r2ImageRef}
                onSelectImage={(imageData) => {
                  onSelectImage(imageData.image_url, undefined, false);
                  onClose();
                }}
                productId={productId}
                onSelectionChange={setR2ImageHasSelection}
              />
            </div>
          ) : null}

          {/* Video Tab - mount once, then hide/show to avoid refetch on tab switch */}
          {hasOpenedR2Video ? (
            <div className={activeTab === 'upload' ? 'h-full' : 'hidden'}>
              <R2VideoUpload 
                ref={r2VideoRef}
                onSelectVideo={(videoData) => {
                  onSelectImage('', undefined, true, videoData);
                  onClose();
                }}
                productId={productId}
                onSelectionChange={setR2VideoHasSelection}
              />
            </div>
          ) : null}

          {activeTab === 'unsplash' ? (
            /* Unsplash Tab */
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
              </div>
            }>
              <UnsplashImageSearch onSelectImage={handleUnsplashSelect} />
            </Suspense>
          ) : activeTab === 'pexels' ? (
            /* Pexels Tab */
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
              </div>
            }>
              <PexelsImageSearch onSelectImage={handlePexelsSelect} includeAttribution={pexelsIncludeAttribution} />
            </Suspense>
          ) : activeTab === 'youtube' ? (
            /* YouTube Tab */
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.cssVars.primary.base }}></div>
              </div>
            }>
              <YouTubeVideoSearch onSelectVideo={handleYouTubeSelect} />
            </Suspense>
          ) : null}
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedImages.size > 0 ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" style={{ color: themeColors.cssVars.primary.base }} />
                  <span className="font-medium" style={{ color: themeColors.cssVars.primary.base }}>
                    {selectedImages.size} {selectedImages.size === 1 ? 'image' : 'images'} selected
                  </span>
                </>
              ) : activeTab === 'unsplash' ? (
                <span className="text-xs">
                  Free photos provided by{' '}
                  <a
                    href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-medium"
                    style={{ color: themeColors.cssVars.primary.base }}
                  >
                    Unsplash
                  </a>
                </span>
              ) : activeTab === 'pexels' ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs">
                    Free photos & videos by{' '}
                    <a
                      href="https://www.pexels.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium"
                      style={{ color: themeColors.cssVars.primary.base }}
                    >
                      Pexels
                    </a>
                    <span className="hidden sm:inline">{' • No attribution required'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={pexelsIncludeAttribution}
                        onChange={(e) => setPexelsIncludeAttribution(e.target.checked)}
                        className="w-3.5 h-3.5 rounded focus:ring-2"
                        style={{ color: themeColors.cssVars.primary.base, '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                      />
                      <span className="text-gray-600 dark:text-gray-400">include optional</span>
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <PhotoIcon className="w-5 h-5" />
                  <span className="text-xs">Select an object to continue</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleInsert}
                disabled={
                  activeTab === 'r2images' ? !r2ImageHasSelection :
                  activeTab === 'upload' ? !r2VideoHasSelection :
                  selectedImages.size === 0
                }
                className="px-6 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: themeColors.cssVars.primary.base
                }}
              >
                <span className="flex items-center gap-2">
                  Insert
                  {selectedImages.size > 0 && (
                    <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/20 border border-white/30 rounded">
                      ^⏎
                    </kbd>
                  )}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
        </Rnd>
      </div>
    </>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}

