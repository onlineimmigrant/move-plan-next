'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { BaseModal } from '@/components/modals/_shared/BaseModal';
import Button from '@/ui/Button';
import { generateVideoThumbnail } from '@/lib/videoThumbnail';
import { supabase } from '@/lib/supabaseClient';

interface ChangeThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  currentThumbnailUrl?: string;
  mediaId: number;
  onThumbnailChanged: (newThumbnailUrl: string) => void;
}

export default function ChangeThumbnailModal({
  isOpen,
  onClose,
  videoUrl,
  currentThumbnailUrl,
  mediaId,
  onThumbnailChanged,
}: ChangeThumbnailModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnailUrl || null);
  const [currentTime, setCurrentTime] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [isOpen, currentTime]);

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
      }
    }, 'image/jpeg', 0.85);
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
        }, 'image/jpeg', 0.85);
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

      // Update product_media record
      const updateResponse = await fetch(`/api/products/media/${mediaId}`, {
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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Change Video Thumbnail" zIndex={10003}>
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Video Player with Scrubber */}
        <div className="space-y-3">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              crossOrigin="anonymous"
              className="w-full h-full object-contain"
              onLoadedMetadata={(e) => {
                setCurrentTime(Math.min(1, e.currentTarget.duration * 0.1));
              }}
            />
          </div>

          {/* Time Scrubber */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Frame
            </label>
            <input
              type="range"
              min="0"
              max={videoRef.current?.duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentTime.toFixed(1)}s / {(videoRef.current?.duration || 0).toFixed(1)}s
            </p>
          </div>

          {/* Capture Button */}
          <Button
            variant="outline"
            onClick={captureFrame}
            className="w-full"
          >
            Capture Current Frame
          </Button>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview
            </label>
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
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

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!previewUrl || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Thumbnail'
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
