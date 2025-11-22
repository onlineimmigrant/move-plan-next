/**
 * useImageGallery Hook
 * 
 * Manages image gallery modal state and handles both images and videos
 */

import { useState } from 'react';

export function useImageGallery() {
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  const openImageGallery = () => setIsImageGalleryOpen(true);
  const closeImageGallery = () => setIsImageGalleryOpen(false);

  const handleImageSelect = (
    imageUrl: string, 
    callback: (url: string, videoData?: any) => void,
    attribution?: any,
    isVideo?: boolean,
    videoData?: any
  ) => {
    if (isVideo && videoData) {
      // Pass video data including player type
      callback(imageUrl, videoData);
    } else {
      // Regular image
      callback(imageUrl);
    }
    closeImageGallery();
  };

  return {
    isImageGalleryOpen,
    openImageGallery,
    closeImageGallery,
    handleImageSelect,
  };
}
