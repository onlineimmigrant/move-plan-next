import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';

/**
 * Represents a media item in a carousel (image or video)
 */
export interface CarouselMediaItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  unsplashAttribution?: UnsplashAttribution;
}

/**
 * Alignment options for media elements
 */
export type MediaAlignment = 'left' | 'center' | 'right';

/**
 * Size presets for media elements
 * Carousel sizes: 33%, 50%, 75%, 100%, 600px
 * Video sizes: 400px, 560px, 800px, 100%
 */
export type MediaSize = '33%' | '50%' | '75%' | '100%' | '400px' | '560px' | '600px' | '800px';
