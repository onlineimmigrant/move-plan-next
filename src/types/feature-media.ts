// Feature Media Types
// Similar to product media for consistency

export type FeatureMediaType = 'image' | 'video';
export type StorageProvider = 'r2' | 'unsplash' | 'youtube' | 'vimeo' | 'pexels' | 'cloudflare' | 'external';

export interface FeatureMedia {
  id: string;
  created_at: string;
  feature_id: string;
  media_type: FeatureMediaType;
  media_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  storage_provider?: StorageProvider;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For videos in seconds
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      download_url: string;
    };
    pexels_attribution?: {
      photographer: string;
      photographer_url: string;
    };
    pexels_video?: {
      duration: number;
      width: number;
      height: number;
    };
    [key: string]: any;
  };
  organization_id?: string;
}

export interface FeatureWithMedia {
  id: string;
  name: string;
  slug: string;
  content?: string;
  description?: string;
  type?: string;
  package?: string;
  display_content: boolean;
  display_on_product_card: boolean;
  organization_id?: string;
  media: FeatureMedia[]; // Ordered media array
  primary_media?: FeatureMedia; // Quick access to primary media
}
