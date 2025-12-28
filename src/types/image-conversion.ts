/**
 * Image Conversion & Optimization Types
 */

export type ImageFormat = 'webp' | 'jpeg' | 'png' | 'avif';
export type ResizeMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface ImageConversionOptions {
  /** Target format (default: webp) */
  format?: ImageFormat;
  
  /** Quality 1-100 (default: 85) */
  quality?: number;
  
  /** Maximum width in pixels */
  maxWidth?: number;
  
  /** Maximum height in pixels */
  maxHeight?: number;
  
  /** Resize mode (default: inside) */
  resizeMode?: ResizeMode;
  
  /** Whether to preserve metadata (default: false for privacy) */
  preserveMetadata?: boolean;
  
  /** Whether to generate thumbnail (default: true) */
  generateThumbnail?: boolean;
  
  /** Thumbnail max dimension (default: 300) */
  thumbnailSize?: number;
}

export interface ConversionResult {
  /** Converted image as Buffer */
  buffer: Buffer;
  
  /** File size in bytes */
  size: number;
  
  /** Image width */
  width: number;
  
  /** Image height */
  height: number;
  
  /** Output format */
  format: string;
  
  /** Thumbnail buffer (if generated) */
  thumbnail?: Buffer;
  
  /** Thumbnail size in bytes */
  thumbnailSize?: number;
  
  /** Size reduction percentage */
  compressionRatio?: number;
}

export interface ConversionPreset {
  name: string;
  label: string;
  description: string;
  options: ImageConversionOptions;
}

/**
 * Predefined conversion presets for common use cases
 */
export const CONVERSION_PRESETS: Record<string, ConversionPreset> = {
  'web-optimized': {
    name: 'web-optimized',
    label: 'Web Optimized',
    description: 'Balanced quality and file size for web',
    options: {
      format: 'webp',
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1920,
      resizeMode: 'inside',
      generateThumbnail: false,
      thumbnailSize: 300,
    },
  },
  'high-quality': {
    name: 'high-quality',
    label: 'High Quality',
    description: 'Maximum quality, larger file size',
    options: {
      format: 'webp',
      quality: 95,
      maxWidth: 3840,
      maxHeight: 3840,
      resizeMode: 'inside',
      generateThumbnail: false,
      thumbnailSize: 400,
    },
  },
  'thumbnail': {
    name: 'thumbnail',
    label: 'Thumbnail',
    description: 'Small preview image',
    options: {
      format: 'webp',
      quality: 80,
      maxWidth: 400,
      maxHeight: 400,
      resizeMode: 'cover',
      generateThumbnail: false,
    },
  },
  'mobile': {
    name: 'mobile',
    label: 'Mobile Optimized',
    description: 'Optimized for mobile devices',
    options: {
      format: 'webp',
      quality: 80,
      maxWidth: 1080,
      maxHeight: 1920,
      resizeMode: 'inside',
      generateThumbnail: false,
      thumbnailSize: 200,
    },
  },
  'social-media': {
    name: 'social-media',
    label: 'Social Media',
    description: 'Optimized for social sharing',
    options: {
      format: 'webp',
      quality: 85,
      maxWidth: 1200,
      maxHeight: 630,
      resizeMode: 'cover',
      generateThumbnail: false,
      thumbnailSize: 300,
    },
  },
};
