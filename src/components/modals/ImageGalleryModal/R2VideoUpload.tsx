'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  FolderIcon, 
  FolderPlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';

interface R2VideoUploadCompactProps {
  onSelectVideo: (videoData: any) => void;
  productId?: number;
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

export default function R2VideoUploadCompact({ onSelectVideo, productId }: R2VideoUploadCompactProps) {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingVideo, setRenamingVideo] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const themeColors = useThemeColors();

  // Focus rename input when activated
  useEffect(() => {
    if (renamingVideo && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingVideo]);

  useEffect(() => {
    loadVideos();
  }, [selectedFolder, productId]);

  const loadVideos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const endpoint = productId ? `/api/products/${productId}/r2-videos` : `/api/r2-videos`;
      const url = selectedFolder ? `${endpoint}?folder=${encodeURIComponent(selectedFolder)}` : endpoint;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('[R2VideoUpload] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      const formData = new FormData();
      formData.append('file', file);
      if (selectedFolder) {
        formData.append('folder', selectedFolder);
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

      await loadVideos();
      setSelectedVideo(result.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const sanitized = newFolderName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    setFolders(prev => [...prev, sanitized].sort());
    setSelectedFolder(sanitized);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleRename = async (video: VideoFile) => {
    if (!newFileName.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Extract extension from original filename
      const ext = video.fileName.split('.').pop();
      const finalName = newFileName.endsWith(`.${ext}`) ? newFileName : `${newFileName}.${ext}`;

      const response = await fetch('/api/rename-r2-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          oldKey: video.fullKey,
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
    if (!confirm(`Delete "${video.fileName}"?`)) return;

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

  const filteredVideos = selectedFolder 
    ? videos.filter(v => v.folder === selectedFolder)
    : videos;

  return (
    <div className="flex flex-col h-full relative">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 mx-4 mt-4">
          {error}
        </div>
      )}

      {/* Content Area with bottom padding for fixed footer */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            !selectedFolder ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Folders ({videos.length})
        </button>
        
        {folders.map(folder => (
          <button
            key={folder}
            onClick={() => setSelectedFolder(folder)}
            className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
              selectedFolder === folder ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FolderIcon className="w-3 h-3" />
            {folder} ({videos.filter(v => v.folder === folder).length})
          </button>
        ))}

        {showNewFolder ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Folder name"
              className="px-2 py-1 text-xs border rounded w-32"
              autoFocus
            />
            <button onClick={handleCreateFolder} className="p-1 hover:bg-gray-100 rounded">
              <CheckIcon className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => setShowNewFolder(false)} className="p-1 hover:bg-gray-100 rounded">
              <XMarkIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center gap-1"
          >
            <FolderPlusIcon className="w-3 h-3" />
            New Folder
          </button>
        )}
      </div>

      {/* Compact Video Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-gray-500">Loading videos...</div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          No videos {selectedFolder ? `in "${selectedFolder}"` : 'yet'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {filteredVideos.map((video) => (
            <div
              key={video.url}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                selectedVideo === video.url ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => !renamingVideo && setSelectedVideo(video.url)}
              onDoubleClick={() => {
                setRenamingVideo(video.url);
                setNewFileName(video.fileName.replace(/\.[^/.]+$/, ''));
              }}
              title={renamingVideo !== video.url ? 'Double-click to rename' : ''}
            >
              {/* Video Thumbnail */}
              <div className="aspect-video bg-gray-900 relative">
                <video 
                  src={video.url} 
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
              </div>

              {/* Video Info */}
              {renamingVideo === video.url ? (
                <div className="p-2 bg-white dark:bg-gray-800" onClick={e => e.stopPropagation()}>
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRename(video);
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setRenamingVideo(null);
                        setNewFileName('');
                      }
                    }}
                    onBlur={() => {
                      // Auto-save on blur if there's a value
                      if (newFileName.trim()) {
                        handleRename(video);
                      } else {
                        setRenamingVideo(null);
                      }
                    }}
                    placeholder="Enter new name..."
                    className="w-full px-2 py-1.5 text-xs border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">Press Enter to save, Esc to cancel</p>
                </div>
              ) : (
                <div className="p-2 bg-white dark:bg-gray-800">
                  <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100" title={video.fileName}>
                    {video.fileName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(video.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {video.folder && video.folder !== 'uncategorized' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {video.folder}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingVideo(video.url);
                    setNewFileName(video.fileName.replace(/\.[^/.]+$/, ''));
                  }}
                  className="p-1 bg-white rounded-full shadow hover:bg-gray-50"
                  title="Rename"
                >
                  <PencilIcon className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(video);
                  }}
                  className="p-1 bg-white rounded-full shadow hover:bg-red-50"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Fixed Upload Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('video/')) handleUpload(file);
          }}
          className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ borderColor: themeColors.cssVars.primary.base }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ArrowUpTrayIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: themeColors.cssVars.primary.base }}>
                {isUploading ? 'Uploading...' : 'Click to upload video'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">or drag and drop • MP4, WebM, MOV (max 500MB)</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>

      {/* Select Button (also fixed at bottom, above upload) */}
      {selectedVideo && (
        <div className="absolute bottom-24 left-0 right-0 px-4">
          <button
            onClick={() => {
              const video = videos.find(v => v.url === selectedVideo);
              if (video) {
                onSelectVideo({
                  is_video: true,
                  video_player: 'r2',
                  video_url: video.url,
                  // Don't set thumbnail_url or image_url - R2 videos will show placeholder
                });
              }
            }}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            Use Selected Video
          </button>
        </div>
      )}
    </div>
  );
}
