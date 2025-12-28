'use client';

import React, { useRef, useState, useCallback } from 'react';
import { X, Camera } from 'lucide-react';

interface VideoThumbnailModalProps {
  isOpen: boolean;
  videoUrl: string;
  currentThumbnail?: string;
  onClose: () => void;
  onCapture: (thumbnailDataUrl: string) => void;
}

export default function VideoThumbnailModal({
  isOpen,
  videoUrl,
  currentThumbnail,
  onClose,
  onCapture,
}: VideoThumbnailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setIsCapturing(true);

      // Create canvas to capture video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Failed to create canvas context');
        return;
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedFrame(dataUrl);
    } catch (error) {
      console.error('Error capturing frame:', error);
      alert('Failed to capture frame. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedFrame) {
      onCapture(capturedFrame);
    }
  }, [capturedFrame, onCapture]);

  const handleReset = useCallback(() => {
    setCapturedFrame(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10006] p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Capture Video Thumbnail
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {capturedFrame ? (
            /* Show captured frame */
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img 
                  src={capturedFrame} 
                  alt="Captured thumbnail" 
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Preview of captured thumbnail
              </p>
            </div>
          ) : (
            /* Show video player */
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  crossOrigin="anonymous"
                  controls
                  playsInline
                  className="w-full h-auto"
                  style={{ maxHeight: '60vh' }}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>1. Play the video and pause at the frame you want to use as thumbnail</p>
                <p>2. Click the "Capture Frame" button below</p>
                <p>3. Review and confirm the captured thumbnail</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          {capturedFrame ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
              >
                Capture Different Frame
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Use This Thumbnail
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentThumbnail && 'Current thumbnail will be replaced'}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCapture}
                  disabled={isCapturing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Capture Frame
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
