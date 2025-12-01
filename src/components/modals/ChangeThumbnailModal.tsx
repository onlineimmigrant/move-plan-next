'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import Button from '@/ui/Button';
import { generateVideoThumbnail } from '@/lib/videoThumbnail';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChangeThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  currentThumbnailUrl?: string;
  mediaId: number;
  onThumbnailChanged: (newThumbnailUrl: string) => void;
  entityType?: 'product' | 'post'; // Default to 'product' for backward compatibility
}

export default function ChangeThumbnailModal({
  isOpen,
  onClose,
  videoUrl,
  currentThumbnailUrl,
  mediaId,
  onThumbnailChanged,
  entityType = 'product',
}: ChangeThumbnailModalProps) {
  const themeColors = useThemeColors();
  const { primary } = themeColors;
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnailUrl || null);
  const [currentTime, setCurrentTime] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.85);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [isOpen, currentTime]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const duration = videoRef.current?.duration || 0;
      
      // Arrow keys for frame navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(prev => Math.max(0, prev - 0.1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(prev => Math.min(duration, prev + 0.1));
      } else if (e.key === ' ' && !isGenerating) {
        e.preventDefault();
        captureFrame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Jump to preset positions
  const jumpToPosition = (percentage: number) => {
    const duration = videoRef.current?.duration || 0;
    setCurrentTime(duration * percentage);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setError('Failed to get canvas context');
      return;
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create preview URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setError(null);
      }
    }, 'image/jpeg', quality);
  };

  const handleSave = async () => {
    if (!previewUrl) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in');
        return;
      }

      // Generate blob from current frame
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('No thumbnail captured');
        return;
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', quality);
      });

      // Upload to R2
      const formData = new FormData();
      formData.append('file', blob, `thumbnail-${mediaId}.jpg`);
      formData.append('folder', 'thumbnails');

      const uploadResponse = await fetch('/api/upload-image-r2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { imageUrl: newThumbnailUrl } = await uploadResponse.json();

      // Update media record (product_media or post_media)
      const apiEndpoint = entityType === 'post' 
        ? `/api/posts/media/${mediaId}` 
        : `/api/products/media/${mediaId}`;
      
      const updateResponse = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thumbnail_url: newThumbnailUrl }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('[ChangeThumbnail] Update failed:', updateResponse.status, errorText);
        throw new Error(`Failed to update media record: ${updateResponse.status} - ${errorText}`);
      }

      onThumbnailChanged(newThumbnailUrl);
      onClose();
    } catch (err) {
      console.error('Failed to save thumbnail:', err);
      setError(err instanceof Error ? err.message : 'Failed to save thumbnail');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[10003]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thumbnail-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal - Draggable & Resizable */}
      <Rnd
        default={{
          x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - 450,
          y: (typeof window !== 'undefined' ? window.innerHeight : 900) / 2 - 400,
          width: 900,
          height: 800,
        }}
        minWidth={700}
        minHeight={600}
        bounds="window"
        dragHandleClassName="modal-drag-handle"
        enableResizing={true}
        className="pointer-events-auto"
      >
        <div 
          className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl 
                   rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="modal-drag-handle flex-shrink-0 px-6 py-4 border-b border-white/20 dark:border-gray-700/20 
                        bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl cursor-move">
            <div className="flex items-center justify-between">
              <h2 id="thumbnail-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Change Video Thumbnail
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 
                          rounded-xl text-red-700 dark:text-red-400 text-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

        {/* Video Player with Scrubber */}
        <div className="space-y-4">
          <div className="relative aspect-video bg-gradient-to-br from-black/80 to-black/60 
                        rounded-xl overflow-hidden border border-white/10 dark:border-gray-700/20 
                        shadow-2xl backdrop-blur-sm">
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <ArrowPathIcon className="w-8 h-8 text-white/60 animate-spin" />
                  <p className="text-sm text-white/60">Loading video...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={videoUrl}
              crossOrigin="anonymous"
              className="w-full h-full object-contain"
              onLoadedMetadata={(e) => {
                setCurrentTime(Math.min(1, e.currentTarget.duration * 0.1));
                setIsVideoLoaded(true);
              }}
            />
          </div>

          {/* Preset Position Buttons */}
          {isVideoLoaded && (
            <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {[
                { label: 'Start', value: 0 },
                { label: '25%', value: 0.25 },
                { label: '50%', value: 0.50 },
                { label: '75%', value: 0.75 },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => jumpToPosition(value)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-white/30 dark:bg-gray-800/30 
                           backdrop-blur-sm border border-white/20 dark:border-gray-700/20 
                           hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200
                           hover:scale-105 active:scale-95 text-gray-900 dark:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Capture Button */}
          <Button
            variant="outline"
            onClick={captureFrame}
            className={`w-full backdrop-blur-sm 
                     border-white/30 dark:border-gray-700/30 shadow-lg transition-all duration-300
                     hover:shadow-xl hover:scale-[1.02] bg-${primary.bgLight} hover:bg-${primary.bg} 
                     text-${primary.text} border-${primary.border}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Current Frame
            <kbd className="ml-auto px-2 py-0.5 text-xs bg-white/20 dark:bg-gray-700/30 rounded border border-white/20">Space</kbd>
          </Button>

          {/* Time Scrubber */}
          <div className="space-y-3 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl 
                        rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Select Frame
              </label>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-2 py-0.5 bg-white/40 dark:bg-gray-700/40 rounded border border-white/30 dark:border-gray-600/30">←</kbd>
                <kbd className="px-2 py-0.5 bg-white/40 dark:bg-gray-700/40 rounded border border-white/30 dark:border-gray-600/30">→</kbd>
                <span>to navigate</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max={videoRef.current?.duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-gray-200/50 to-gray-300/50 
                       dark:from-gray-700/50 dark:to-gray-600/50 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500 
                       [&::-webkit-slider-thumb]:to-blue-600 [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50
                       hover:[&::-webkit-slider-thumb]:scale-110 transition-transform"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatTime(currentTime)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                / {formatTime(videoRef.current?.duration || 0)}
              </p>
            </div>
          </div>

          {/* Quality Selector */}
          <div className="space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                        rounded-xl p-3 border border-white/10 dark:border-gray-700/10">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Quality
            </label>
            <div className="flex gap-2">
              {[
                { label: 'Low', value: 0.7, desc: 'Smaller file' },
                { label: 'Medium', value: 0.85, desc: 'Balanced' },
                { label: 'High', value: 0.95, desc: 'Best quality' },
              ].map(({ label, value, desc }) => (
                <button
                  key={label}
                  onClick={() => setQuality(value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                           ${quality === value
                             ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                             : 'bg-white/30 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                           }`}
                >
                  <div>{label}</div>
                  <div className="text-[10px] opacity-70">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>        {/* Before/After Comparison */}
        {previewUrl && currentThumbnailUrl && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Before / After Comparison
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Current</p>
                <div className="relative aspect-video bg-gradient-to-br from-gray-100/60 to-gray-50/60 
                              dark:from-gray-800/60 dark:to-gray-900/60 rounded-lg overflow-hidden 
                              border border-gray-300/30 dark:border-gray-700/30 shadow-lg backdrop-blur-sm">
                  <img src={currentThumbnailUrl} alt="Current thumbnail" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">New Preview</p>
                <div className="relative aspect-video bg-gradient-to-br from-gray-100/80 to-gray-50/80 
                              dark:from-gray-800/80 dark:to-gray-900/80 rounded-lg overflow-hidden 
                              border-2 border-blue-500/40 dark:border-blue-400/40 shadow-2xl 
                              backdrop-blur-sm ring-4 ring-blue-500/20">
                  <img src={previewUrl} alt="New thumbnail" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Only (when no current thumbnail) */}
        {previewUrl && !currentThumbnailUrl && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </label>
            <div className="relative aspect-video bg-gradient-to-br from-gray-100/80 to-gray-50/80 
                          dark:from-gray-800/80 dark:to-gray-900/80 rounded-xl overflow-hidden 
                          border-2 border-blue-500/30 dark:border-blue-400/30 shadow-2xl 
                          backdrop-blur-sm ring-4 ring-blue-500/10">
              <img
                src={previewUrl}
                alt="Thumbnail preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/20 dark:border-gray-700/20 
                      bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-b-2xl">
          <div className="flex items-center justify-between">
          {/* Status indicator */}
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {previewUrl ? (
              <>
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Frame captured</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Select a frame to continue</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="px-6 py-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm 
                       hover:bg-white/60 dark:hover:bg-gray-800/60 border-white/30 
                       dark:border-gray-700/30 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!previewUrl || isGenerating}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 
                       hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-[1.02]"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Thumbnail
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
        </div>
      </Rnd>
    </div>
  );

  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
