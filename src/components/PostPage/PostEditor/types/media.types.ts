import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import type { PexelsAttributionData } from '@/components/MediaAttribution';

export interface MediaConfig {
  main_photo?: string;
  unsplash_attribution?: UnsplashAttribution;
}

export interface MediaItem {
  url: string;
  attribution?: UnsplashAttribution | PexelsAttributionData;
  isVideo?: boolean;
  videoData?: VideoData;
}

export interface VideoData {
  video_player?: 'youtube' | 'vimeo' | 'r2' | 'pexels';
  video_url?: string;
  thumbnail_url?: string;
}

export interface CarouselMedia {
  id: number;
  url: string;
  type: 'image' | 'video';
  videoPlayer?: 'youtube' | 'vimeo' | 'r2' | 'pexels';
}
