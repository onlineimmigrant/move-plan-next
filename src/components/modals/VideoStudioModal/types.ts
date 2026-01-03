/**
 * VideoStudioModal Types
 * Type definitions for the video clip maker module
 */

export interface VideoSource {
  url: string;
  name: string;
  folder?: string;
  duration?: number;
}

export type ExportFormat = 'mp4' | 'webm';

export interface TrimPoints {
  start: number; // seconds
  end: number;   // seconds
}

export interface TimelineSegment {
  id: string;
  start: number; // start time in source video (seconds)
  end: number;   // end time in source video (seconds)
  volume?: number; // 0-2, default 1 (200% max)
  fadeIn?: number; // fade duration in seconds
  fadeOut?: number; // fade duration in seconds
  speed?: number; // 0.5-2, default 1
}

export interface ProjectMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  thumbnailUrl?: string;
  thumbnailTime?: number; // timestamp to extract thumbnail from
}

export interface ExportPreset {
  id: string;
  name: string;
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook';
  resolution?: '4k' | '1080p' | '720p' | '480p';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5' | '3:4' | '4:3';
  format: ExportFormat;
  quality?: 'high' | 'medium' | 'low';
  maxDuration?: number; // seconds
}

export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
  language?: string;
}

export interface Project {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  source_video_url: string;
  source_video_name?: string;
  source_folder?: string;
  segments: TimelineSegment[];
  export_format: ExportFormat;
  metadata?: ProjectMetadata;
  captions?: Caption[];
  created_at: string;
  updated_at: string;
}

export interface ExportJob {
  id: string;
  project_id?: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  output_url?: string;
  output_format: ExportFormat;
  output_name?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ExportSettings {
  format: ExportFormat;
  quality?: 'high' | 'medium' | 'low';
}

export interface VideoStudioState {
  source: VideoSource | null;
  trimPoints: TrimPoints | null;
  isExporting: boolean;
  exportProgress: number;
}
