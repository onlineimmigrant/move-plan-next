'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  FolderIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
  PlusIcon,
  FolderPlusIcon,
  ArrowsRightLeftIcon,
  VideoCameraIcon,
  ScissorsIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import { generateAndUploadThumbnail } from '@/lib/videoThumbnail';
import MediaTabToolbar from './MediaTabToolbar';
import ScreenRecordingModal from '../ScreenRecordingModal';
import ChangeThumbnailModal from '../ChangeThumbnailModal';
import { useVideoStudio } from '../VideoStudioModal/context';

interface R2VideoUploadProps {
  onSelectVideo: (videoData: any) => void;
  productId?: number;
  onSelectionChange?: (hasSelection: boolean) => void;
  isWideLayout?: boolean;
}

interface VideoFile {
  url: string;
  fileName: string;
  fullKey: string;
  folder: string;
  size: number;
  uploaded: string;
  thumbnail?: string;
}

const PROTECTED_VIDEO_FOLDERS = new Set(['video', 'videos']);

const isProtectedVideoFolder = (folderName: string) =>
  PROTECTED_VIDEO_FOLDERS.has(String(folderName || '').trim().toLowerCase());

export interface R2VideoUploadHandle {
  confirmSelection: () => Promise<void>;
  hasSelection: () => boolean;
}

const R2VideoUpload = forwardRef<R2VideoUploadHandle, R2VideoUploadProps>(({ onSelectVideo, productId, onSelectionChange, isWideLayout }, ref) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState(20);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [renamingVideo, setRenamingVideo] = useState<VideoFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movingVideo, setMovingVideo] = useState<VideoFile | null>(null);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>('');
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [newFolderRenameName, setNewFolderRenameName] = useState('');
  const [screenRecordingOpen, setScreenRecordingOpen] = useState(false);
  const [hoveredVideoUrl, setHoveredVideoUrl] = useState<string | null>(null);
  const [changingThumbnailVideo, setChangingThumbnailVideo] = useState<VideoFile | null>(null);
  const hoverPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const folderRenameInputRef = useRef<HTMLInputElement>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const videoStudio = useVideoStudio();
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
    loadVideos();
    setDisplayLimit(20);
  }, [currentFolder, productId]);

  useEffect(() => {
    setDisplayLimit(20);
  }, [searchQuery]);

  useEffect(() => {
    onSelectionChange?.(selectedVideo !== null);
  }, [selectedVideo, onSelectionChange]);

  useEffect(() => {
    if (renamingFolder && folderRenameInputRef.current) {
      folderRenameInputRef.current.focus();
      folderRenameInputRef.current.select();
    }
  }, [renamingFolder]);

  useImperativeHandle(ref, () => ({
    confirmSelection: handleConfirmSelection,
    hasSelection: () => selectedVideo !== null
  }));

  useEffect(() => {
    if (renamingVideo && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingVideo]);

  const inferThumbnailUrl = (videoFileName: string, thumbnailFileNameToUrl: Map<string, string>) => {
    const base = videoFileName.replace(/\.[^/.]+$/, '');
    const candidates: string[] = [];

    const matchScreenRecording = base.match(/screen-recording-(\d{13})/);
    const matchAnyTimestamp = base.match(/(\d{13})/);
    const timestamp = matchScreenRecording?.[1] || matchAnyTimestamp?.[1];

    if (timestamp) {
      candidates.push(`thumbnail-${timestamp}.webp`);
      candidates.push(`thumbnail-${timestamp}.jpg`);
      candidates.push(`thumbnail-${timestamp}.jpeg`);
      candidates.push(`thumbnail-${timestamp}.png`);
    }

    for (const candidate of candidates) {
      const url = thumbnailFileNameToUrl.get(candidate.toLowerCase());
      if (url) return url;
    }

    return undefined;
  };

  const getThumbnailIdForVideo = (videoFileName: string) => {
    const base = videoFileName.replace(/\.[^/.]+$/, '');
    const matchAnyTimestamp = base.match(/(\d{13})/);
    if (matchAnyTimestamp?.[1]) return matchAnyTimestamp[1];
    const safe = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '')
      .slice(0, 60);
    return safe || String(Date.now());
  };

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

  const loadVideos = async () => {
    try {
      loadAbortRef.current?.abort();
      const controller = new AbortController();
      loadAbortRef.current = controller;

      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      const endpoint = productId ? `/api/products/${productId}/r2-videos` : `/api/r2-videos`;
      const url = currentFolder ? `${endpoint}?folder=${encodeURIComponent(currentFolder)}` : endpoint;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        let nextVideos: VideoFile[] = data.videos || [];

        // Enrich video list with existing thumbnails from the Images/Thumbnails folder
        try {
          const tryFetchThumbs = async (folderName: string) => {
            const resp = await fetch(`/api/r2-images?folder=${encodeURIComponent(folderName)}` , {
              headers: { 'Authorization': `Bearer ${session.access_token}` },
              signal: controller.signal,
            });
            if (!resp.ok) return null;
            return resp.json();
          };

          const thumbsData = (await tryFetchThumbs('Thumbnails')) || (await tryFetchThumbs('thumbnails'));

          if (thumbsData) {
            const map = new Map<string, string>();
            for (const img of (thumbsData.images || [])) {
              if (img?.fileName && img?.url) {
                map.set(String(img.fileName).toLowerCase(), String(img.url));
              }
            }
            nextVideos = nextVideos.map((v) => {
              if (v.thumbnail) return v;
              const inferred = inferThumbnailUrl(v.fileName, map);
              return inferred ? { ...v, thumbnail: inferred } : v;
            });
          }
        } catch (e) {
          if (isDev) console.warn('[R2VideoUpload] Thumbnail enrichment failed:', e);
        }

        if (isDev) {
          console.log('[R2VideoUpload] Total videos received from API:', data.videos?.length);
          console.log('[R2VideoUpload] Total folders received from API:', data.folders?.length);
        }
        if (!isMountedRef.current || controller.signal.aborted) return;
        setVideos(nextVideos);
        setFolders((data.folders || []).filter((f: string) => !isProtectedVideoFolder(f)));
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      console.error('[R2VideoUpload] Load failed:', err);
      if (isMountedRef.current) setError('Failed to load videos');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress('Uploading video...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) {
        formData.append('folder', currentFolder);
      }

      const response = await fetch('/api/upload-video', {
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
            video_url: result.videoUrl,
            video_player: 'r2',
            is_video: true,
            display_order: 0,
          }),
        });
      }

      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);
      await loadVideos();
      setSelectedVideo(result.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRename = async () => {
    if (!renamingVideo || !newFileName.trim()) {
      setRenamingVideo(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ext = renamingVideo.fileName.split('.').pop();
      const finalName = newFileName.endsWith(`.${ext}`) ? newFileName : `${newFileName}.${ext}`;

      const response = await fetch('/api/rename-r2-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          oldKey: renamingVideo.fullKey,
          newFileName: finalName,
        }),
      });

      if (response.ok) {
        await loadVideos();
        setRenamingVideo(null);
        setNewFileName('');
      }
    } catch (err) {
      console.error('[R2VideoUpload] Rename failed:', err);
    }
  };

  const handleDelete = async (video: VideoFile) => {
    if (!confirm(`Delete "${video.fileName}"? This will remove it permanently.`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/delete-r2-video', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ videoUrl: video.url }),
      });

      await loadVideos();
      if (selectedVideo === video.url) setSelectedVideo(null);
    } catch (err) {
      console.error('[R2VideoUpload] Delete failed:', err);
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
        body: JSON.stringify({ folderName, mediaType: 'videos' }),
      });

      if (response.ok) {
        await loadVideos();
        setCreatingFolder(false);
        setNewFolderName('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('[R2VideoUpload] Create folder failed:', err);
      setError('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (isProtectedVideoFolder(folderName)) return;
    if (!confirm(`Delete empty folder "${folderName}"?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/r2-folders?folder=${encodeURIComponent(folderName)}&mediaType=videos`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        await loadVideos();
        if (currentFolder === folderName) setCurrentFolder('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('[R2VideoUpload] Delete folder failed:', err);
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
          mediaType: 'videos',
        }),
      });

      if (response.ok) {
        await loadVideos();
        if (currentFolder === oldName) setCurrentFolder(trimmed);
        setRenamingFolder(null);
        setNewFolderRenameName('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to rename folder');
      }
    } catch (err) {
      console.error('[R2VideoUpload] Rename folder failed:', err);
      setError('Failed to rename folder');
    }
  };

  const handleMoveFile = async () => {
    if (!movingVideo) return;

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
          sourceKey: movingVideo.fullKey,
          destinationFolder: selectedMoveFolder,
          mediaType: 'videos',
        }),
      });

      if (response.ok) {
        await loadVideos();
        setMovingVideo(null);
        setSelectedMoveFolder('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to move file');
      }
    } catch (err) {
      console.error('[R2VideoUpload] Move file failed:', err);
      setError('Failed to move file');
    }
  };

  const handleConfirmSelection = async () => {
    const video = videos.find(v => v.url === selectedVideo);
    if (!video) return;

    setIsGeneratingThumbnail(true);
    setError(null);

    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in');
        setIsGeneratingThumbnail(false);
        return;
      }

      // Prefer existing thumbnail from API (fast path); otherwise generate.
      let thumbnailUrl = video.thumbnail || video.url;
      if (!video.thumbnail) {
        try {
          if (isDev) {
            console.log('🎬 Generating thumbnail for:', video.fileName);
            console.log('📹 Video URL:', video.url);
          }
          thumbnailUrl = await generateAndUploadThumbnail(
            video.url,
            video.fileName,
            session.access_token
          );
          if (isDev) console.log('✅ Thumbnail generated:', thumbnailUrl);
        } catch (thumbnailError) {
          console.error('❌ Thumbnail generation failed:', thumbnailError);
          if (isDev) {
            console.error('Stack trace:', thumbnailError instanceof Error ? thumbnailError.stack : 'N/A');
          }
          setError(`Thumbnail generation failed: ${thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error'}. Using video as fallback.`);
          // Continue with video URL as fallback
          thumbnailUrl = video.url;
        }
      }

      // Select video with thumbnail
      onSelectVideo({
        is_video: true,
        video_player: 'r2',
        video_url: video.url,
        thumbnail_url: thumbnailUrl,
      });
    } catch (err) {
      console.error('[R2VideoUpload] Selection failed:', err);
      setError('Failed to process video');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (durationSeconds?: number) => {
    if (durationSeconds === undefined || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return '';
    const totalSeconds = Math.floor(durationSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const captureDurationIfMissing = (url: string, durationSeconds: number) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return;
    setVideoDurations((prev) => {
      if (prev[url] === durationSeconds) return prev;
      if (prev[url] !== undefined) return prev;
      return { ...prev, [url]: durationSeconds };
    });
  };

  const lowerQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredFolders = useMemo(
    () => folders.filter((f) => !isProtectedVideoFolder(f) && f.toLowerCase().includes(lowerQuery)),
    [folders, lowerQuery]
  );

  const filteredVideos = useMemo(
    () => videos.filter((v) => v.fileName.toLowerCase().includes(lowerQuery)),
    [videos, lowerQuery]
  );

  const displayedVideos = useMemo(
    () => filteredVideos.slice(0, displayLimit),
    [filteredVideos, displayLimit]
  );

  const hasMoreVideos = filteredVideos.length > displayLimit;

  const countsText = (videos.length > 0 || folders.length > 0)
    ? `${filteredFolders.length} ${filteredFolders.length === 1 ? 'folder' : 'folders'}, ${filteredVideos.length} ${filteredVideos.length === 1 ? 'video' : 'videos'}`
    : undefined;

  return (
    <>
      <MediaTabToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search videos across folders..."
        searchHint={searchQuery ? 'Searching all folders' : undefined}
        onRefresh={loadVideos}
        isRefreshing={isLoading}
        fileInputRef={fileInputRef}
        fileAccept="video/*"
        onFilePicked={handleUpload}
        isUploading={isUploading}
        uploadLabel="Upload"
        uploadTitle="Upload videos (MP4, WebM, MOV - max 500MB)"
        uploadProgress={uploadProgress}
        countsText={countsText}
        uploadAdjacentControls={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScreenRecordingOpen(true)}
            className="flex items-center gap-2 whitespace-nowrap"
            title="Record your screen"
          >
            <VideoCameraIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Record Screen</span>
          </Button>
        }
      />

      <ScreenRecordingModal
        isOpen={screenRecordingOpen}
        onClose={() => setScreenRecordingOpen(false)}
        defaultFolder={currentFolder || 'Videos'}
        onRecordingComplete={(videoUrl, thumbnailUrl) => {
          setScreenRecordingOpen(false);
          loadVideos();
        }}
      />

      <ChangeThumbnailModal
        isOpen={!!changingThumbnailVideo}
        onClose={() => setChangingThumbnailVideo(null)}
        videoUrl={changingThumbnailVideo?.url || ''}
        currentThumbnailUrl={changingThumbnailVideo?.thumbnail}
        mediaId={changingThumbnailVideo ? getThumbnailIdForVideo(changingThumbnailVideo.fileName) : ''}
        skipEntityUpdate={true}
        uploadFolder="Thumbnails"
        onThumbnailChanged={(newThumbnailUrl) => {
          const target = changingThumbnailVideo;
          setChangingThumbnailVideo(null);
          if (!target) return;
          setVideos((prev) => prev.map((v) => (v.url === target.url ? { ...v, thumbnail: newThumbnailUrl } : v)));
        }}
      />

      {/* Breadcrumb Navigation */}
      {currentFolder && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentFolder('')}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              style={{ color: themeColors.cssVars.primary.base }}
            >
              <PlayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">All Videos</span>
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
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading videos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium text-sm sm:text-base">{error}</p>
              <Button onClick={loadVideos} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredFolders.length === 0 && filteredVideos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-4">
              <PlayIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 text-sm sm:text-base">
                {searchQuery ? 'No videos match your search' : currentFolder ? 'No videos in this folder' : 'No videos uploaded yet'}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">
                Upload videos to get started
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="primary"
              >
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Upload Video
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Folders Section */}
            {(!currentFolder && (filteredFolders.length > 0 || creatingFolder)) && (
              <div>
                <div
                  className={
                    isWideLayout
                      ? 'grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-3 sm:gap-4'
                      : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4'
                  }
                >
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
                              onMouseEnter={() => setHoveredControl(`folder:${folder}:rename`)}
                              onMouseLeave={() => setHoveredControl((prev) => (prev === `folder:${folder}:rename` ? null : prev))}
                              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-gray-200/90 dark:bg-gray-700/70"
                              style={hoveredControl === `folder:${folder}:rename` ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
                              title="Rename folder"
                            >
                              <PencilIcon className={`w-3 h-3 ${hoveredControl === `folder:${folder}:rename` ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder);
                              }}
                              className="w-6 h-6 rounded-full bg-gray-200/90 dark:bg-gray-700/70 hover:bg-red-600 flex items-center justify-center transition-colors"
                              title="Delete empty folder"
                            >
                              <TrashIcon className="w-3 h-3 text-gray-700 dark:text-gray-200 hover:text-white" />
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
            {!currentFolder && filteredFolders.length === 0 && filteredVideos.length > 0 && (
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

            {/* Videos Section */}
            {filteredVideos.length > 0 && (
              <div>
                {filteredFolders.length > 0 && !currentFolder && (
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 sm:mb-3 uppercase tracking-wider">Videos</h3>
                )}
                <div className={isWideLayout ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4' : 'grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4'}>
                  {displayedVideos.map((video) => (
                    <div
                      key={video.url}
                      onClick={() => !renamingVideo && setSelectedVideo(video.url)}
                      onMouseEnter={() => {
                        setHoveredVideoUrl(video.url);
                        // Try to start playback ASAP; some browsers won't autoplay reliably on mount.
                        queueMicrotask(() => {
                          const el = hoverPreviewVideoRef.current;
                          if (!el) return;
                          try {
                            el.currentTime = 0;
                          } catch {
                            // ignore
                          }
                          const p = el.play();
                          if (p && typeof (p as any).catch === 'function') {
                            (p as any).catch(() => undefined);
                          }
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredVideoUrl((prev) => (prev === video.url ? null : prev));
                        const el = hoverPreviewVideoRef.current;
                        if (!el) return;
                        try {
                          el.pause();
                        } catch {
                          // ignore
                        }
                        try {
                          el.currentTime = 0;
                        } catch {
                          // ignore
                        }
                      }}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg"
                      style={selectedVideo === video.url ? {
                        borderColor: themeColors.cssVars.primary.base,
                        boxShadow: `0 0 0 4px color-mix(in srgb, ${themeColors.cssVars.primary.base} 20%, transparent)`,
                        transform: 'scale(1.05)'
                      } : { borderColor: '#e5e7eb' }}
                      title=""
                    >
                      {/* Metadata-only loader (to get play time) */}
                      {videoDurations[video.url] === undefined && (
                        <video
                          src={video.url}
                          preload="metadata"
                          muted
                          playsInline
                          className="hidden"
                          onLoadedMetadata={(e) => captureDurationIfMissing(video.url, e.currentTarget.duration)}
                        />
                      )}

                      {/* Video Preview */}
                      {hoveredVideoUrl === video.url ? (
                        <video
                          ref={(el) => {
                            hoverPreviewVideoRef.current = el;
                          }}
                          src={video.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          autoPlay
                          preload="auto"
                          poster={video.thumbnail}
                          onLoadedMetadata={(e) => captureDurationIfMissing(video.url, e.currentTarget.duration)}
                          onCanPlay={(e) => {
                            const el = e.currentTarget;
                            const p = el.play();
                            if (p && typeof (p as any).catch === 'function') {
                              (p as any).catch(() => undefined);
                            }
                          }}
                        />
                      ) : video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => captureDurationIfMissing(video.url, e.currentTarget.duration)}
                          onLoadedData={(e) => {
                            const el = e.currentTarget;
                            try {
                              el.currentTime = 0;
                            } catch {
                              // ignore
                            }
                            try {
                              el.pause();
                            } catch {
                              // ignore
                            }
                          }}
                        />
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <PlayIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Overlay with Info */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent flex items-end p-2 opacity-100">
                        <div className="w-full">
                          <p className="text-white text-xs font-medium truncate mb-1">{video.fileName}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70 text-[10px]">
                              {formatSize(video.size)}
                              {videoDurations[video.url] ? ` • ${formatDuration(videoDurations[video.url])}` : ''}
                            </span>
                            {video.folder && video.folder !== 'uncategorized' && !isProtectedVideoFolder(video.folder) && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded text-white">
                                {video.folder}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!renamingVideo && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100">
                          <button
                            onClick={(e) => {
                              videoStudio.openModal({
                                url: video.url,
                                name: video.fileName,
                                folder: video.folder,
                              });
                            }}
                            onMouseEnter={() => setHoveredControl(`video:${video.url}:clip`)}
                            onMouseLeave={() => setHoveredControl((prev) => (prev === `video:${video.url}:clip` ? null : prev))}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-gray-200/90 dark:bg-gray-700/70"
                            style={hoveredControl === `video:${video.url}:clip` ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
                            title="Edit clip"
                          >
                            <ScissorsIcon className={`w-4 h-4 ${hoveredControl === `video:${video.url}:clip` ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.stopPropagation();
                              setChangingThumbnailVideo(video);
                            }}
                            onMouseEnter={() => setHoveredControl(`video:${video.url}:thumb`)}
                            onMouseLeave={() => setHoveredControl((prev) => (prev === `video:${video.url}:thumb` ? null : prev))}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-gray-200/90 dark:bg-gray-700/70"
                            style={hoveredControl === `video:${video.url}:thumb` ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
                            title="Change thumbnail"
                          >
                            <PhotoIcon className={`w-4 h-4 ${hoveredControl === `video:${video.url}:thumb` ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setMovingVideo(video);
                              setSelectedMoveFolder(currentFolder || '');
                            }}
                            onMouseEnter={() => setHoveredControl(`video:${video.url}:move`)}
                            onMouseLeave={() => setHoveredControl((prev) => (prev === `video:${video.url}:move` ? null : prev))}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-gray-200/90 dark:bg-gray-700/70"
                            style={hoveredControl === `video:${video.url}:move` ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
                            title="Move to folder"
                          >
                            <ArrowsRightLeftIcon className={`w-4 h-4 ${hoveredControl === `video:${video.url}:move` ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setRenamingVideo(video);
                              setNewFileName(video.fileName.replace(/\.[^/.]+$/, ''));
                            }}
                            onMouseEnter={() => setHoveredControl(`video:${video.url}:rename`)}
                            onMouseLeave={() => setHoveredControl((prev) => (prev === `video:${video.url}:rename` ? null : prev))}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-gray-200/90 dark:bg-gray-700/70"
                            style={hoveredControl === `video:${video.url}:rename` ? { backgroundColor: themeColors.cssVars.primary.base } : undefined}
                            title="Rename"
                          >
                            <PencilIcon className={`w-4 h-4 ${hoveredControl === `video:${video.url}:rename` ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(video); }}
                            className="w-7 h-7 rounded-full bg-gray-200/90 dark:bg-gray-700/70 hover:bg-red-600 flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4 text-gray-700 dark:text-gray-200 hover:text-white" />
                          </button>
                        </div>
                      )}

                      {/* Selected Indicator */}
                      {selectedVideo === video.url && !renamingVideo && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColors.cssVars.primary.base }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {hasMoreVideos && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayLimit(prev => prev + 20)}
                      className="px-6 py-2"
                    >
                      Load More ({filteredVideos.length - displayLimit} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Move File Modal */}
      {movingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setMovingVideo(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Move "{movingVideo.fileName}"
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
                {folders.filter(f => f !== movingVideo.folder).map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setMovingVideo(null)}
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

      {/* Rename Video Modal */}
      {renamingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRenamingVideo(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Rename "{renamingVideo.fileName}"
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRename();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setRenamingVideo(null);
                    setNewFileName('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                placeholder="Enter new name..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Keep the extension; it will be preserved automatically.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setRenamingVideo(null);
                  setNewFileName('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                variant="primary"
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

R2VideoUpload.displayName = 'R2VideoUpload';

export default R2VideoUpload;
