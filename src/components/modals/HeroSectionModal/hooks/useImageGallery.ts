/**
 * useImageGallery Hook
 * 
 * Manages image gallery modal state
 */

import { useState } from 'react';

export function useImageGallery() {
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  const openImageGallery = () => setIsImageGalleryOpen(true);
  const closeImageGallery = () => setIsImageGalleryOpen(false);

  const handleImageSelect = (imageUrl: string, callback: (url: string) => void) => {
    callback(imageUrl);
    closeImageGallery();
  };

  return {
    isImageGalleryOpen,
    openImageGallery,
    closeImageGallery,
    handleImageSelect,
  };
}
