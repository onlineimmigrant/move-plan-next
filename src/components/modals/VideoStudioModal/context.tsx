/**
 * VideoStudio Context
 * 
 * Provides global state management for the Video Studio modal,
 * allowing it to be opened from anywhere in the application (admin only).
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { VideoSource } from './types';

interface VideoStudioContextType {
  isOpen: boolean;
  sourceVideo: VideoSource | null;
  openModal: (source?: VideoSource) => void;
  closeModal: () => void;
}

const VideoStudioContext = createContext<VideoStudioContextType | undefined>(undefined);

interface VideoStudioProviderProps {
  children: ReactNode;
}

/**
 * Provider component for VideoStudio context
 * Wrap your app with this to enable modal state management
 * 
 * @example
 * ```tsx
 * <VideoStudioProvider>
 *   <App />
 * </VideoStudioProvider>
 * ```
 */
export function VideoStudioProvider({ children }: VideoStudioProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceVideo, setSourceVideo] = useState<VideoSource | null>(null);

  const openModal = useCallback((source?: VideoSource) => {
    console.log('[VideoStudio] Opening modal with source:', source);
    setSourceVideo(source || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Keep sourceVideo for potential re-open
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      sourceVideo,
      openModal,
      closeModal,
    }),
    [isOpen, sourceVideo, openModal, closeModal]
  );

  return (
    <VideoStudioContext.Provider value={value}>
      {children}
    </VideoStudioContext.Provider>
  );
}

/**
 * Hook to access VideoStudio context
 * Returns no-op context for non-admin users (provider not loaded)
 */
export function useVideoStudio() {
  const context = useContext(VideoStudioContext);
  if (!context) {
    console.warn('[VideoStudio] Context not found - provider not loaded (user may not be admin)');
    return {
      isOpen: false,
      sourceVideo: null,
      openModal: () => console.log('[VideoStudio] No-op openModal called (provider not loaded)'),
      closeModal: () => {},
    };
  }
  return context;
}
