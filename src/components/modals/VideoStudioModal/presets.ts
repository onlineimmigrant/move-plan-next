import type { ExportPreset } from './types';

export const EXPORT_PRESETS: ExportPreset[] = [
  // YouTube presets
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    platform: 'youtube',
    resolution: '1080p',
    aspectRatio: '16:9',
    format: 'mp4',
    quality: 'high',
  },
  {
    id: 'youtube-720p',
    name: 'YouTube 720p',
    platform: 'youtube',
    resolution: '720p',
    aspectRatio: '16:9',
    format: 'mp4',
    quality: 'medium',
  },

  // Instagram presets
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    platform: 'instagram',
    resolution: '1080p',
    aspectRatio: '9:16',
    format: 'mp4',
    quality: 'high',
    maxDuration: 90,
  },
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'instagram',
    resolution: '1080p',
    aspectRatio: '1:1',
    format: 'mp4',
    quality: 'high',
    maxDuration: 60,
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'instagram',
    resolution: '1080p',
    aspectRatio: '9:16',
    format: 'mp4',
    quality: 'high',
    maxDuration: 15,
  },
  {
    id: 'instagram-portrait',
    name: 'Instagram Portrait',
    platform: 'instagram',
    resolution: '1080p',
    aspectRatio: '4:5',
    format: 'mp4',
    quality: 'high',
    maxDuration: 60,
  },

  // TikTok presets
  {
    id: 'tiktok',
    name: 'TikTok',
    platform: 'tiktok',
    resolution: '1080p',
    aspectRatio: '9:16',
    format: 'mp4',
    quality: 'high',
    maxDuration: 180,
  },

  // Twitter/X presets
  {
    id: 'twitter',
    name: 'Twitter/X',
    platform: 'twitter',
    resolution: '1080p',
    aspectRatio: '16:9',
    format: 'mp4',
    quality: 'high',
    maxDuration: 140,
  },

  // LinkedIn presets
  {
    id: 'linkedin',
    name: 'LinkedIn',
    platform: 'linkedin',
    resolution: '1080p',
    aspectRatio: '16:9',
    format: 'mp4',
    quality: 'high',
    maxDuration: 600,
  },

  // Facebook presets
  {
    id: 'facebook-landscape',
    name: 'Facebook Landscape',
    platform: 'facebook',
    resolution: '1080p',
    aspectRatio: '16:9',
    format: 'mp4',
    quality: 'high',
    maxDuration: 240,
  },
  {
    id: 'facebook-square',
    name: 'Facebook Square',
    platform: 'facebook',
    resolution: '1080p',
    aspectRatio: '1:1',
    format: 'mp4',
    quality: 'high',
    maxDuration: 240,
  },
  {
    id: 'facebook-portrait',
    name: 'Facebook Portrait',
    platform: 'facebook',
    resolution: '1080p',
    aspectRatio: '4:5',
    format: 'mp4',
    quality: 'high',
    maxDuration: 240,
  },

  // Classic aspect ratios
  {
    id: 'classic-4-3',
    name: 'Classic 4:3',
    resolution: '1080p',
    aspectRatio: '4:3',
    format: 'mp4',
    quality: 'high',
  },
  {
    id: 'portrait-3-4',
    name: 'Portrait 3:4',
    resolution: '1080p',
    aspectRatio: '3:4',
    format: 'mp4',
    quality: 'high',
  },

  // Generic presets
  {
    id: 'high-quality-mp4',
    name: 'High Quality MP4',
    resolution: '1080p',
    format: 'mp4',
    quality: 'high',
  },
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    resolution: '720p',
    format: 'mp4',
    quality: 'medium',
  },
  {
    id: 'small-file',
    name: 'Small File Size',
    resolution: '480p',
    format: 'mp4',
    quality: 'low',
  },
];
