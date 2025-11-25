import { Editor } from '@tiptap/react';
import { CarouselMedia } from '../types';

export interface CarouselHandlers {
  addMediaCarousel: () => void;
  handleCarouselMediaSelect: (url: string, attribution?: any, isVideo?: boolean, videoData?: any) => void;
  finishCarouselCreation: () => void;
  removeCarouselMediaItem: (index: number) => void;
  setCarouselAlignment: (align: 'left' | 'center' | 'right') => void;
  setCarouselSize: (width: string) => void;
}

export function useCarouselHandlers(
  editor: Editor | null,
  editorMode: string,
  carouselMediaItems: CarouselMedia[],
  setCarouselMediaItems: (items: CarouselMedia[] | ((prev: CarouselMedia[]) => CarouselMedia[])) => void,
  setShowCarouselGallery: (show: boolean) => void,
  setShowCarouselImagePicker: (show: boolean) => void
): CarouselHandlers {
  const addMediaCarousel = () => {
    setCarouselMediaItems([]);
    setShowCarouselGallery(true);
  };

  const handleCarouselMediaSelect = (url: string, attribution?: any, isVideo?: boolean, videoData?: any) => {
    console.log('🖼️ handleCarouselMediaSelect called:', { url, isVideo, videoData });
    
    const newMediaItem: CarouselMedia = {
      id: Date.now(), // Generate unique ID
      type: isVideo ? 'video' : 'image',
      url: url,
    };

    if (isVideo && videoData) {
      newMediaItem.videoPlayer = videoData.video_player;
      if (videoData.thumbnail_url) {
        // Note: CarouselMedia type doesn't have thumbnailUrl, only videoPlayer
      }
      if (videoData.video_player === 'youtube' || videoData.video_player === 'vimeo') {
        newMediaItem.url = videoData.video_url; // This is just the ID
      } else {
        newMediaItem.url = videoData.video_url; // Full URL for R2
      }
    }

    console.log('🖼️ Adding media item:', newMediaItem);
    setCarouselMediaItems(prev => {
      const updated = [...prev, newMediaItem];
      console.log('🖼️ Updated carousel items:', updated);
      return updated;
    });
    setShowCarouselImagePicker(false); // Close the picker after adding
  };

  const finishCarouselCreation = () => {
    console.log('🎯 finishCarouselCreation called, items:', carouselMediaItems);
    
    if (carouselMediaItems.length === 0) {
      alert('Please add at least one media item to the carousel');
      return;
    }

    if (editorMode !== 'visual') {
      alert('Media carousel can only be inserted in Visual Editor mode. Please switch to Visual mode.');
      return;
    }

    if (!editor) {
      alert('Editor is not ready. Please try again.');
      return;
    }

    try {
      console.log('🎯 Inserting carousel with:', { mediaItems: carouselMediaItems, align: 'center', width: '600px' });
      editor.chain().focus().setMediaCarousel({
        mediaItems: carouselMediaItems,
        align: 'center',
        width: '600px',
      }).run();

      setShowCarouselGallery(false);
      setCarouselMediaItems([]);
    } catch (error) {
      console.error('❌ Error inserting carousel:', error);
      alert('Failed to insert carousel: ' + error);
    }
  };

  const removeCarouselMediaItem = (index: number) => {
    setCarouselMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const setCarouselAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    editor.chain().focus().updateMediaCarouselAlignment(align).run();
  };

  const setCarouselSize = (width: string) => {
    if (!editor) return;
    editor.chain().focus().updateMediaCarouselWidth(width).run();
  };

  return {
    addMediaCarousel,
    handleCarouselMediaSelect,
    finishCarouselCreation,
    removeCarouselMediaItem,
    setCarouselAlignment,
    setCarouselSize,
  };
}
