/**
 * VideoStudioModal Component
 * 
 * Main modal for video clip-making functionality.
 * Provides trim/cut capabilities with ffmpeg.wasm processing.
 * Can be opened standalone (with video library picker) or contextually (with pre-selected video).
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, ScissorsIcon, PlayIcon, PauseIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ArrowPathIcon, DocumentTextIcon, FilmIcon, TagIcon, LanguageIcon, ShareIcon, QueueListIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import Button from '@/ui/Button';
import { useVideoStudio } from './context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabaseClient';
import R2VideoUpload from '../ImageGalleryModal/R2VideoUploadNew';
import type { VideoSource, TrimPoints, ExportFormat, TimelineSegment, Project, ProjectMetadata, Caption } from './types';
import { FolderIcon } from '@heroicons/react/24/outline';
import TimelineEditor from './TimelineEditor';
import SegmentControls from './SegmentControls';
import MetadataEditor from './MetadataEditor';
import CaptionEditor from './CaptionEditor';
import ShareModal from './ShareModal';
import ExportQueue, { type QueuedExport } from './ExportQueue';
import { EXPORT_PRESETS } from './presets';

export default function VideoStudioModal() {
  const { isOpen, sourceVideo, closeModal } = useVideoStudio();
  console.log('[VideoStudioModal] Render - isOpen:', isOpen, 'sourceVideo:', sourceVideo);
  const [source, setSource] = useState<VideoSource | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [segments, setSegments] = useState<TimelineSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [trimPoints, setTrimPoints] = useState<TrimPoints | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('mp4');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Phase 2+3 state
  const [activeTab, setActiveTab] = useState<'trim' | 'timeline' | 'metadata' | 'captions' | 'export'>('trim');
  const [metadata, setMetadata] = useState<ProjectMetadata>({});
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [exportQueue, setExportQueue] = useState<QueuedExport[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rndRef = useRef<Rnd | null>(null);
  const rndDefaultRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const preMaximizeRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const currentRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const openedStandaloneRef = useRef(false);
  const wasOpenRef = useRef(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const themeColors = useThemeColors();

  // Handle source video changes from context
  useEffect(() => {
    if (isOpen) {
      // Only decide "opened standalone" on the opening edge.
      // (sourceVideo can change while open, e.g. clicking the scissors in the picker.)
      if (!wasOpenRef.current) {
        openedStandaloneRef.current = !sourceVideo;
        wasOpenRef.current = true;
      }
      if (sourceVideo) {
        setSource(sourceVideo);
        setProjectId(null);
        const detectedFormat = sourceVideo.url?.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4';
        setExportFormat(detectedFormat);
        setShowSourcePicker(false);
        setIsMaximized(false);
      } else {
        // Opened standalone without source - show picker
        setShowSourcePicker(true);
        setIsMaximized(false);
      }
    } else {
      // Reset on close
      wasOpenRef.current = false;
      setSource(null);
      setProjectId(null);
      setIsSavingProject(false);
      setTrimPoints(null);
      setCurrentTime(0);
      setIsPlaying(false);
      setIsExporting(false);
      setExportProgress(0);
      setShowSourcePicker(false);
      setIsMaximized(false);
    }
  }, [isOpen, sourceVideo]);

  const returnToPicker = useCallback(() => {
    setSource(null);
    setProjectId(null);
    setIsSavingProject(false);
    setTrimPoints(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsExporting(false);
    setExportProgress(0);
    setShowSourcePicker(true);
  }, []);

  const ensureProject = useCallback(
    async (nextSource: VideoSource) => {
      if (!isOpen) return;
      if (projectId) return;

      setIsSavingProject(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/video-studio/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nextSource.name ? nextSource.name.replace(/\.[^/.]+$/, '') : 'Untitled Project',
            sourceUrl: nextSource.url,
            sourceName: nextSource.name,
            sourceFolder: nextSource.folder,
            timeline: [],
            settings: {
              exportFormat,
            },
          }),
        });

        if (!res.ok) return;
        const json = await res.json();
        if (json?.projectId) setProjectId(json.projectId);
      } finally {
        setIsSavingProject(false);
      }
    },
    [exportFormat, isOpen, projectId]
  );

  // Autosave project state including metadata and captions
  useEffect(() => {
    if (!isOpen) return;
    if (!projectId) return;
    if (!source) return;
    if (showSourcePicker) return;
    if (isExporting) return;

    const t = setTimeout(async () => {
      setIsSavingProject(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;

        // Use segments if available, otherwise create from trim points
        const timeline = segments.length > 0 ? segments : (trimPoints ? [{
          id: `segment-${Date.now()}`,
          start: trimPoints.start,
          end: trimPoints.end,
        }] : []);

        await fetch(`/api/video-studio/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeline,
            settings: {
              exportFormat,
            },
            metadata,
            captions,
          }),
        });
      } finally {
        setIsSavingProject(false);
      }
    }, 700);

    return () => clearTimeout(t);
  }, [exportFormat, isExporting, isOpen, projectId, showSourcePicker, source, trimPoints, segments, metadata, captions]);

  const updateCurrentRectFromElement = useCallback(() => {
    const el = (rndRef.current as any)?.resizableElement?.current as HTMLElement | undefined;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    currentRectRef.current = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const toggleMaximize = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!rndRef.current) return;

    // Capture current rect as restore target.
    updateCurrentRectFromElement();
    const current = currentRectRef.current;

    if (!isMaximized) {
      preMaximizeRectRef.current = current || rndDefaultRef.current;
      (rndRef.current as any).updatePosition({ x: 0, y: 0 });
      (rndRef.current as any).updateSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
      return;
    }

    const restore = preMaximizeRectRef.current || rndDefaultRef.current;
    if (restore) {
      (rndRef.current as any).updatePosition({ x: restore.x, y: restore.y });
      (rndRef.current as any).updateSize({ width: restore.width, height: restore.height });
    }
    setIsMaximized(false);
  }, [isMaximized, updateCurrentRectFromElement]);

  // Initialize trim points when video loads
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      if (!trimPoints) {
        setTrimPoints({ start: 0, end: videoDuration });
      }
      // Set initial volume
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [trimPoints, volume, isMuted]);

  // Sync volume and mute state with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle video load errors
  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.currentTarget;
    console.log('[VideoStudioModal] Video load error details:');
    console.log('  Error code:', videoElement.error?.code);
    console.log('  Error message:', videoElement.error?.message);
    console.log('  Source URL:', videoElement.src);
    console.log('  Current src:', videoElement.currentSrc);
    console.log('  Network state:', videoElement.networkState);
    console.log('  Ready state:', videoElement.readyState);
    console.log('  Source object:', source);
    
    const errorMessages: Record<number, string> = {
      1: 'MEDIA_ERR_ABORTED - Video loading was aborted',
      2: 'MEDIA_ERR_NETWORK - Network error while loading video',
      3: 'MEDIA_ERR_DECODE - Video decoding failed',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported or source not found'
    };
    
    const errorMsg = videoElement.error 
      ? errorMessages[videoElement.error.code] || `Unknown error (code: ${videoElement.error.code})`
      : 'Unknown error - no error object available';
    
    alert(`Failed to load video: ${errorMsg}\n\nURL: ${videoElement.src}\n\nPlease ensure the video is accessible and in a supported format (MP4, WebM).`);
  }, [source]);

  // Video playback controls
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // Auto-pause at trim end point
      if (trimPoints && time >= trimPoints.end) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = trimPoints.start;
      }
    }
  }, [trimPoints]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Handle video selection from library
  const handleVideoSelected = useCallback((videoData: any) => {
    console.log('[VideoStudioModal] Video selected from library:', videoData);
    const url = videoData.video_url || videoData.url;
    const detectedFormat = url?.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4';
    const videoSource = {
      url: url,
      name: videoData.fileName || videoData.name || 'video',
      folder: videoData.folder || 'Videos',
    };
    console.log('[VideoStudioModal] Setting source:', videoSource);
    setSource(videoSource);
    setProjectId(null);
    setExportFormat(detectedFormat);
    setShowSourcePicker(false);
    void ensureProject(videoSource);
  }, []);

  // Ensure project for contextual open
  useEffect(() => {
    if (!isOpen) return;
    if (!source) return;
    if (showSourcePicker) return;
    void ensureProject(source);
  }, [ensureProject, isOpen, showSourcePicker, source]);

  // Export handler
  const handleExport = useCallback(async () => {
    if (!source) return;

    // Use segments if available, otherwise fall back to single trim
    const exportTimeline = segments.length > 0 ? segments : (trimPoints ? [{
      id: `segment-${Date.now()}`,
      start: trimPoints.start,
      end: trimPoints.end,
    }] : []);

    if (exportTimeline.length === 0) {
      alert('No clips to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(10);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      setExportProgress(20);
      
      // Use multi-segment export endpoint
      const uploadResponse = await fetch('/api/video-studio/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId || undefined,
          sourceUrl: source.url,
          sourceName: source.name,
          timeline: exportTimeline,
          format: exportFormat,
          folder: source.folder || 'Videos',
        }),
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Export failed:', uploadResponse.status, errorText);
        throw new Error(`Export failed: ${uploadResponse.status} ${errorText}`);
      }
      
      const result = await uploadResponse.json();
      console.log('Export successful:', result);
      
      setExportProgress(100);
      setLastExportUrl(result.outputUrl);
      alert(`Video exported successfully! ${result.segmentCount} clip(s) combined.`);
      
      // Show share modal
      setShowShareModal(true);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. See console for details.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [source, segments, trimPoints, exportFormat, projectId, closeModal]);

  const handleClose = useCallback(() => {
    if (isExporting) {
      if (!confirm('Export in progress. Are you sure you want to cancel?')) {
        return;
      }
    }

    // If opened standalone, treat closing the trim view as "back to library".
    if (openedStandaloneRef.current && !showSourcePicker) {
      returnToPicker();
      return;
    }

    closeModal();
  }, [isExporting, closeModal, returnToPicker, showSourcePicker]);

  // Project management handlers
  const handleSaveProject = useCallback(async (silent = false) => {
    if (!source || !trimPoints) return;

    setIsSavingProject(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Use existing segments or create one from current trim
      const currentSegments: TimelineSegment[] = segments.length > 0 
        ? segments 
        : [{
            id: `segment-${Date.now()}`,
            start: trimPoints.start,
            end: trimPoints.end,
          }];

      const body = {
        name: projectName || `Clip - ${source.name}`,
        sourceUrl: source.url,
        sourceName: source.name,
        sourceFolder: source.folder || 'Videos',
        timeline: currentSegments,
        settings: {
          exportFormat: exportFormat,
        },
        metadata,
        captions,
      };

      const url = projectId 
        ? `/api/video-studio/projects/${projectId}`
        : '/api/video-studio/projects';

      const method = projectId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorText = await response.text();
        console.error('[VideoStudio] Save project failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          requestBody: body,
        });
        
        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.error || errorText;
        } catch {
          // Keep as text
        }
        
        throw new Error(`Failed to save project: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      setProjectId(result.projectId || result.project?.id);
      setSegments(currentSegments);
      if (!silent) alert('Project saved successfully!');
    } catch (error) {
      console.error('Save project failed:', error);
      if (!silent) alert('Failed to save project. See console for details.');
    } finally {
      setIsSavingProject(false);
    }
  }, [source, trimPoints, projectId, projectName, exportFormat]);

  const handleLoadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/video-studio/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const result = await response.json();
      setProjects(result.projects || []);
      setShowProjectPicker(true);
    } catch (error) {
      console.error('Load projects failed:', error);
      alert('Failed to load projects. See console for details.');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const handleLoadProject = useCallback(async (project: Project) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/video-studio/projects/${project.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const result = await response.json();
      const loadedProject = result.project;

      // Set source from project
      if (loadedProject.source_url) {
        const videoSource: VideoSource = {
          url: loadedProject.source_url,
          name: loadedProject.source_name || 'video',
          folder: loadedProject.source_folder || 'Videos',
        };
        setSource(videoSource);
        setShowSourcePicker(false);
      }

      // Load timeline segments and set first segment as trim points
      const timeline = Array.isArray(loadedProject.timeline) ? loadedProject.timeline : [];
      setSegments(timeline);
      if (timeline.length > 0) {
        setTrimPoints({ start: timeline[0].start, end: timeline[0].end });
        setSelectedSegmentId(timeline[0].id);
      }

      // Load settings
      const settings = loadedProject.settings || {};
      if (settings.exportFormat) {
        setExportFormat(settings.exportFormat);
      }

      // Load metadata and captions
      setMetadata(loadedProject.metadata || {});
      setCaptions(loadedProject.captions || []);

      setProjectId(loadedProject.id);
      setProjectName(loadedProject.name);
      setShowProjectPicker(false);
    } catch (error) {
      console.error('Load project failed:', error);
      alert('Failed to load project. See console for details.');
    }
  }, []);

  // Segment management handlers
  const addSegment = useCallback(() => {
    if (!trimPoints || !duration) return;

    const newSegment: TimelineSegment = {
      id: `segment-${Date.now()}`,
      start: trimPoints.start,
      end: trimPoints.end,
    };

    setSegments(prev => [...prev, newSegment]);
    setSelectedSegmentId(newSegment.id);
  }, [trimPoints, duration]);

  const updateSegment = useCallback((id: string, updates: Partial<TimelineSegment>) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, ...updates } : seg));
  }, []);

  const deleteSegment = useCallback((id: string) => {
    setSegments(prev => {
      const newSegments = prev.filter(seg => seg.id !== id);
      if (selectedSegmentId === id) {
        if (newSegments.length > 0) {
          setSelectedSegmentId(newSegments[0].id);
          setTrimPoints({ start: newSegments[0].start, end: newSegments[0].end });
        } else {
          setSelectedSegmentId(null);
        }
      }
      return newSegments;
    });
  }, [selectedSegmentId]);

  const selectSegment = useCallback((id: string) => {
    const segment = segments.find(seg => seg.id === id);
    if (segment) {
      setSelectedSegmentId(id);
      setTrimPoints({ start: segment.start, end: segment.end });
      seekTo(segment.start);
    }
  }, [segments, seekTo]);

  // Phase 2+3: Split segment at playhead
  const splitSegmentAtPlayhead = useCallback(() => {
    if (!selectedSegmentId || !trimPoints) return;
    const currentPos = currentTime;
    if (currentPos <= trimPoints.start || currentPos >= trimPoints.end) return;

    const selectedSegment = segments.find(s => s.id === selectedSegmentId);
    if (!selectedSegment) return;

    // Create two new segments from the split
    const segment1: TimelineSegment = {
      ...selectedSegment,
      id: `segment-${Date.now()}-1`,
      end: currentPos,
    };

    const segment2: TimelineSegment = {
      ...selectedSegment,
      id: `segment-${Date.now()}-2`,
      start: currentPos,
    };

    setSegments(prev => {
      const index = prev.findIndex(s => s.id === selectedSegmentId);
      const newSegments = [...prev];
      newSegments.splice(index, 1, segment1, segment2);
      return newSegments;
    });

    setSelectedSegmentId(segment2.id);
    setTrimPoints({ start: segment2.start, end: segment2.end });
  }, [selectedSegmentId, trimPoints, currentTime, segments]);

  // Phase 2+3: Duplicate segment
  const duplicateSegment = useCallback((id: string) => {
    const segment = segments.find(s => s.id === id);
    if (!segment) return;

    const newSegment: TimelineSegment = {
      ...segment,
      id: `segment-${Date.now()}`,
    };

    setSegments(prev => {
      const index = prev.findIndex(s => s.id === id);
      const newSegments = [...prev];
      newSegments.splice(index + 1, 0, newSegment);
      return newSegments;
    });
  }, [segments]);

  // Phase 2+3: Reorder segments
  const reorderSegments = useCallback((draggedId: string, targetIndex: number) => {
    setSegments(prev => {
      const draggedIndex = prev.findIndex(s => s.id === draggedId);
      if (draggedIndex === -1 || draggedIndex === targetIndex) return prev;

      const newSegments = [...prev];
      const [draggedSegment] = newSegments.splice(draggedIndex, 1);
      newSegments.splice(targetIndex, 0, draggedSegment);
      return newSegments;
    });
  }, []);

  // Phase 2+3: Process export from queue
  const processExport = useCallback(async (queueItemId: string, preset: typeof EXPORT_PRESETS[0]) => {
    if (!source) return;

    try {
      setExportQueue(prev => prev.map(item =>
        item.id === queueItemId ? { ...item, status: 'processing' as const, progress: 5 } : item
      ));

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Use segments if available, otherwise fall back to single trim
      const exportTimeline = segments.length > 0 ? segments : (trimPoints ? [{
        id: `segment-${Date.now()}`,
        start: trimPoints.start,
        end: trimPoints.end,
      }] : []);

      if (exportTimeline.length === 0) {
        throw new Error('No clips to export');
      }

      setExportQueue(prev => prev.map(item =>
        item.id === queueItemId ? { ...item, progress: 10 } : item
      ));

      // Call export API with preset settings
      const uploadResponse = await fetch('/api/video-studio/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId || undefined,
          sourceUrl: source.url,
          sourceName: source.name,
          timeline: exportTimeline,
          format: preset.format,
          folder: source.folder || 'Videos',
          preset: {
            resolution: preset.resolution,
            aspectRatio: preset.aspectRatio,
            quality: preset.quality,
          },
          captions: captions.length > 0 ? captions : undefined,
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Export failed: ${uploadResponse.status} ${errorText}`);
      }

      const result = await uploadResponse.json();

      setExportQueue(prev => prev.map(item =>
        item.id === queueItemId ? { 
          ...item, 
          status: 'completed' as const, 
          progress: 100,
          outputUrl: result.outputUrl,
          updatedAt: new Date(),
        } : item
      ));

    } catch (error) {
      console.error('Export queue processing failed:', error);
      setExportQueue(prev => prev.map(item =>
        item.id === queueItemId ? { 
          ...item, 
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Export failed',
          updatedAt: new Date(),
        } : item
      ));
    }
  }, [source, segments, trimPoints, projectId]);

  // Phase 2+3: Add to export queue and process
  const addToExportQueue = useCallback(async (presetId: string) => {
    if (!source) return;

    const preset = EXPORT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const queueItemId = `export-${Date.now()}`;
    const queueItem: QueuedExport = {
      id: queueItemId,
      preset,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
    };

    setExportQueue(prev => [...prev, queueItem]);

    // Start export processing after a brief delay
    setTimeout(() => {
      processExport(queueItemId, preset);
    }, 100);
  }, [source, processExport]);

  // Phase 2+3: Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || showSourcePicker || showProjectPicker) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSaveProject();
          } else {
            e.preventDefault();
            splitSegmentAtPlayhead();
          }
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          seekTo(Math.max(0, currentTime - 1));
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          seekTo(Math.min(duration, currentTime + 1));
          break;
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          if (selectedSegmentId) {
            const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
            const speed = speeds[parseInt(e.key) - 1];
            if (speed) {
              updateSegment(selectedSegmentId, { speed });
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, showSourcePicker, showProjectPicker, togglePlayPause, splitSegmentAtPlayhead, handleSaveProject, seekTo, currentTime, duration, selectedSegmentId, updateSegment]);

  // Update selected segment when trim points change
  useEffect(() => {
    if (selectedSegmentId && trimPoints) {
      updateSegment(selectedSegmentId, { start: trimPoints.start, end: trimPoints.end });
    }
  }, [trimPoints?.start, trimPoints?.end, selectedSegmentId, updateSegment]);

  // Autosave effect
  useEffect(() => {
    if (!projectId || !source || !trimPoints) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for autosave (5 seconds after last edit)
    autosaveTimeoutRef.current = setTimeout(() => {
      console.log('[VideoStudio] Autosaving...');
      handleSaveProject(true);
    }, 5000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [trimPoints, projectName, exportFormat, projectId, source, handleSaveProject, segments]);

  const resetTrim = useCallback(() => {
    if (duration <= 0) return;

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
      try {
        videoRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setTrimPoints({ start: 0, end: duration });
  }, [duration]);

  // Modal sizing (match ImageGalleryModal pattern)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  if (!rndDefaultRef.current) {
    if (isMobile) {
      rndDefaultRef.current = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    } else if (isTablet) {
      rndDefaultRef.current = {
        x: 20,
        y: 20,
        width: window.innerWidth - 40,
        height: window.innerHeight - 40,
      };
    } else {
      const desktopWidth = 822.25;
      const desktopHeight = Math.min(window.innerHeight - 40, 750 * 1.25);
      rndDefaultRef.current = {
        x: window.innerWidth / 2 - desktopWidth / 2,
        y: window.innerHeight / 2 - desktopHeight / 2,
        width: desktopWidth,
        height: desktopHeight,
      };
    }
  }

  if (!isOpen) return null;

  const durationSafe = duration > 0 ? duration : 1;
  const fileDisplayName = source
    ? (() => {
        const name = source.name || 'video';
        const nameWithoutExt = name.replace(/\.[^/.]+$/, '');
        const ext = name.match(/\.[^/.]+$/)?.[0] || '';
        if (nameWithoutExt.length > 30) {
          return `${nameWithoutExt.slice(0, 15)}...${nameWithoutExt.slice(-10)}${ext}`;
        }
        return name;
      })()
    : '';

  const trimBar = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trim Points</label>
        <div className="flex items-center gap-2">
          {trimPoints ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {formatTime(trimPoints.start)} – {formatTime(trimPoints.end)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={resetTrim}
            disabled={!trimPoints || duration <= 0}
            aria-label="Reset trim points"
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-200/40 dark:hover:bg-gray-700/30 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Reset"
          >
            <ArrowPathIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className={`rounded-xl border border-gray-200/30 dark:border-gray-700/30 bg-white/35 dark:bg-gray-900/35 backdrop-blur-2xl shadow-sm ${isMobile ? 'px-2.5 py-2.5' : 'px-3 py-3'}`}>
        <div className="relative h-12 select-none">
          {/* Background track */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 rounded-full bg-linear-to-r from-gray-200/70 via-gray-200/50 to-gray-200/70 dark:from-gray-700/70 dark:via-gray-700/50 dark:to-gray-700/70" />

          {/* All segments (dimmed) */}
          {segments.map((segment) => (
            <div
              key={segment.id}
              className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-full transition-opacity ${
                selectedSegmentId === segment.id ? 'opacity-0' : 'opacity-40'
              }`}
              style={{
                left: `${(segment.start / durationSafe) * 100}%`,
                width: `${((segment.end - segment.start) / durationSafe) * 100}%`,
                backgroundColor: themeColors.cssVars.primary.base,
              }}
            />
          ))}

          {/* Selected region (current trim) */}
          {trimPoints && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full shadow-sm"
              style={{
                left: `${(trimPoints.start / durationSafe) * 100}%`,
                width: `${((trimPoints.end - trimPoints.start) / durationSafe) * 100}%`,
                backgroundColor: themeColors.cssVars.primary.base,
              }}
            />
          )}

          {/* Current time indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white shadow-lg"
            style={{ left: `${(currentTime / durationSafe) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/90 shadow"
            style={{ left: `${(currentTime / durationSafe) * 100}%` }}
          />

          {/* Start handle */}
          {trimPoints && (
            <div
              className={`group absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${isMobile ? 'w-4 h-10' : 'w-3.5 h-9'} rounded-md cursor-ew-resize shadow-lg ring-1 ring-white/40 dark:ring-white/10 touch-none`}
              style={{
                left: `${(trimPoints.start / durationSafe) * 100}%`,
                backgroundColor: themeColors.cssVars.primary.base,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const trackElement = e.currentTarget.parentElement;
                if (!trackElement) return;
                try {
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                } catch {
                  // ignore
                }

                const startDrag = (moveEvent: PointerEvent) => {
                  const rect = trackElement.getBoundingClientRect();
                  const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                  const newStart = Math.max(0, Math.min((x / rect.width) * durationSafe, trimPoints.end - 0.1));
                  setTrimPoints({ ...trimPoints, start: newStart });
                  seekTo(newStart);
                };
                const stopDrag = () => {
                  document.removeEventListener('pointermove', startDrag);
                  document.removeEventListener('pointerup', stopDrag);
                  document.removeEventListener('pointercancel', stopDrag);
                };
                document.addEventListener('pointermove', startDrag);
                document.addEventListener('pointerup', stopDrag);
                document.addEventListener('pointercancel', stopDrag);
              }}
            >
              <div className="absolute inset-0 rounded-md bg-linear-to-b from-white/25 via-white/0 to-black/10 opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-0.5">
                  <span className="w-0.5 h-4 rounded-full bg-white/80" />
                  <span className="w-0.5 h-4 rounded-full bg-white/80" />
                </div>
              </div>
            </div>
          )}

          {/* End handle */}
          {trimPoints && (
            <div
              className={`group absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${isMobile ? 'w-4 h-10' : 'w-3.5 h-9'} rounded-md cursor-ew-resize shadow-lg ring-1 ring-white/40 dark:ring-white/10 touch-none`}
              style={{
                left: `${(trimPoints.end / durationSafe) * 100}%`,
                backgroundColor: themeColors.cssVars.primary.base,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const trackElement = e.currentTarget.parentElement;
                if (!trackElement) return;
                try {
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                } catch {
                  // ignore
                }

                const startDrag = (moveEvent: PointerEvent) => {
                  const rect = trackElement.getBoundingClientRect();
                  const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                  const newEnd = Math.min(durationSafe, Math.max((x / rect.width) * durationSafe, trimPoints.start + 0.1));
                  setTrimPoints({ ...trimPoints, end: newEnd });
                };
                const stopDrag = () => {
                  document.removeEventListener('pointermove', startDrag);
                  document.removeEventListener('pointerup', stopDrag);
                  document.removeEventListener('pointercancel', stopDrag);
                };
                document.addEventListener('pointermove', startDrag);
                document.addEventListener('pointerup', stopDrag);
                document.addEventListener('pointercancel', stopDrag);
              }}
            >
              <div className="absolute inset-0 rounded-md bg-linear-to-b from-white/25 via-white/0 to-black/10 opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-0.5">
                  <span className="w-0.5 h-4 rounded-full bg-white/80" />
                  <span className="w-0.5 h-4 rounded-full bg-white/80" />
                </div>
              </div>
            </div>
          )}

          {/* Clickable track to seek */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const time = (x / rect.width) * durationSafe;
              seekTo(time);
            }}
          />
        </div>

        {trimPoints && (
          <div className={`mt-3 flex flex-wrap gap-3 text-sm ${isMobile ? 'justify-between' : ''}`}>
            <div>
              <label className="text-gray-600 dark:text-gray-400">Start:</label>
              <input
                type="number"
                min={0}
                max={trimPoints.end}
                step={0.1}
                value={trimPoints.start.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setTrimPoints({ ...trimPoints, start: Math.max(0, Math.min(val, trimPoints.end - 0.1)) });
                    seekTo(val);
                  }
                }}
                className={`ml-2 ${isMobile ? 'w-20' : 'w-24'} px-2 py-1 rounded-lg border border-gray-200/40 dark:border-gray-700/40 bg-white/35 dark:bg-gray-900/35 backdrop-blur-xl text-gray-900 dark:text-gray-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gray-400/40 dark:focus:ring-gray-500/40`}
              />
            </div>
            <div>
              <label className="text-gray-600 dark:text-gray-400">End:</label>
              <input
                type="number"
                min={trimPoints.start}
                max={durationSafe}
                step={0.1}
                value={trimPoints.end}
                onChange={(e) => setTrimPoints({ ...trimPoints, end: parseFloat(e.target.value) })}
                className={`ml-2 ${isMobile ? 'w-20' : 'w-24'} px-2 py-1 rounded-lg border border-gray-200/40 dark:border-gray-700/40 bg-white/35 dark:bg-gray-900/35 backdrop-blur-xl text-gray-900 dark:text-gray-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gray-400/40 dark:focus:ring-gray-500/40`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const videoPane = (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative group bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          src={source?.url}
          className="w-full h-full"
          crossOrigin="anonymous"
          onLoadedMetadata={handleVideoLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={handleVideoError}
          onClick={togglePlayPause}
        />

        {/* Center play/pause overlay (visible on hover, always visible when paused; always visible on mobile) */}
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className={
            `absolute inset-0 flex items-center justify-center transition-opacity ` +
            (isMobile || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
          }
        >
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
          </span>
        </button>

        {/* Time overlay */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Caption overlay */}
        {captions.length > 0 && (() => {
          const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);
          return activeCaption ? (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none">
              <div className="px-4 py-2 rounded-lg bg-black/80 text-white text-center backdrop-blur-sm max-w-[90%]">
                <p className="text-sm sm:text-base font-medium leading-tight">
                  {activeCaption.text}
                </p>
              </div>
            </div>
          ) : null;
        })()}

        {/* Audio controls (bottom-left) */}
        <div className={`absolute bottom-2 left-2 flex items-center gap-2 transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
              }
            }}
            className="p-1.5 rounded bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (videoRef.current) {
                videoRef.current.volume = newVolume;
              }
              if (newVolume > 0 && isMuted) {
                setIsMuted(false);
                if (videoRef.current) {
                  videoRef.current.muted = false;
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        {/* Filename (top-right; appears when hovering the corner / icon) */}
        <div
          className={
            `absolute top-2 right-2 flex items-center justify-end transition-opacity ` +
            (isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
          }
        >
          <div className="relative flex items-center">
            <button
              type="button"
              className={
                'peer w-7 h-7 rounded-lg border border-white/15 ' +
                'bg-black/35 backdrop-blur-2xl shadow-sm ' +
                'flex items-center justify-center transition-colors ' +
                'hover:bg-black/45'
              }
              aria-label="Show file name"
              title={source?.name || 'video'}
            >
              <DocumentTextIcon className="w-4 h-4 text-white/90" />
            </button>

            <div
              className={
                'pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 max-w-[70vw] sm:max-w-md ' +
                'px-2 py-1 rounded-lg border border-white/10 ' +
                'bg-black/35 backdrop-blur-2xl shadow-sm ' +
                'text-[11px] text-white/90 font-mono truncate ' +
                (isMobile ? 'opacity-100' : 'opacity-0 peer-hover:opacity-100')
              }
              title={source?.name || 'video'}
            >
              {fileDisplayName}
            </div>
          </div>
        </div>
      </div>

      {trimBar}
    </div>
  );

  const controlsPane = (
    <>
      {/* Project Info */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Project
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project name (optional)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
        />
        <button
          type="button"
          onClick={() => handleSaveProject()}
          disabled={isSavingProject || !source || !trimPoints}
          className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSavingProject ? 'Saving...' : projectId ? 'Update Project' : 'Save Project'}
        </button>
        {projectId && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ Project saved
          </p>
        )}
      </div>

      {/* Timeline Segments */}
      {segments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Timeline ({segments.length} {segments.length === 1 ? 'clip' : 'clips'})
            </label>
            <button
              type="button"
              onClick={addSegment}
              disabled={!trimPoints}
              className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className={`flex items-center gap-2 p-2 rounded transition-colors cursor-pointer ${
                  selectedSegmentId === segment.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => selectSegment(segment.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    Clip {index + 1}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(segment.start)} → {formatTime(segment.end)} ({formatTime(segment.end - segment.start)})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSegment(segment.id);
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  aria-label="Delete segment"
                >
                  <XMarkIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Settings */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Export Format
        </label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">Format conversion runs server-side.</p>
      </div>
    </>
  );

  const modalContent = (
    <>
      <div className="fixed inset-0 z-10006">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 dark:bg-black/40"
          onClick={handleClose}
        />

        <Rnd
          ref={rndRef as any}
          default={rndDefaultRef.current}
          minWidth={isMobile ? window.innerWidth : isTablet ? 600 : 700}
          minHeight={isMobile ? window.innerHeight : isTablet ? 500 : 600}
          bounds="window"
          dragHandleClassName="drag-handle"
          className="z-10007"
          disableDragging={isMobile}
          enableResizing={!isMobile}
          onDragStop={() => updateCurrentRectFromElement()}
          onResizeStop={() => updateCurrentRectFromElement()}
        >
          <div className={`h-full flex flex-col ${isMobile || isMaximized ? 'bg-white dark:bg-gray-900' : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl'} ${isMobile || isMaximized ? '' : 'rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50'} overflow-hidden`}>
            {/* Header */}
            <div className={`${isMobile ? '' : 'drag-handle cursor-move'} bg-linear-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border-b border-gray-200/30 dark:border-gray-700/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <ScissorsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Video Studio
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMaximize}
                  className="p-1.5 sm:p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  aria-label={isMaximized ? 'Restore size' : 'Full screen'}
                  type="button"
                >
                  {isMaximized ? (
                    <ArrowsPointingInIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  aria-label="Close"
                  type="button"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-auto ${showSourcePicker || showProjectPicker ? '' : 'p-4 sm:p-6'}`}>
              {/* Video Library Picker - Keep mounted to preserve state */}
              <div className={showSourcePicker ? 'h-full' : 'hidden'}>
                <R2VideoUpload
                  onSelectVideo={handleVideoSelected}
                  isWideLayout={isMaximized}
                />
              </div>

              {/* Project Picker */}
              {showProjectPicker && (
                <div className="h-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Load Project</h3>
                    <button
                      onClick={() => setShowProjectPicker(false)}
                      className="p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  {loadingProjects ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p>Loading projects...</p>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <FolderIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-auto max-h-[calc(100%-4rem)]">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleLoadProject(project)}
                          className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {project.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {project.source_video_name && `Source: ${project.source_video_name}`}
                            {project.updated_at && ` • Updated ${new Date(project.updated_at).toLocaleDateString()}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Video Editor View */}
              {!showSourcePicker && !showProjectPicker && source && (
                <div className="relative space-y-6">
                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200/30 dark:border-gray-700/30">
                    <div className="flex gap-1 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('trim')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'trim'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <ScissorsIcon className="w-4 h-4 inline mr-1" />
                        Trim
                      </button>
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'timeline'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <FilmIcon className="w-4 h-4 inline mr-1" />
                        Timeline
                      </button>
                      <button
                        onClick={() => setActiveTab('metadata')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'metadata'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <TagIcon className="w-4 h-4 inline mr-1" />
                        Metadata
                      </button>
                      <button
                        onClick={() => setActiveTab('captions')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'captions'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <LanguageIcon className="w-4 h-4 inline mr-1" />
                        Captions
                      </button>
                      <button
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'export'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <QueueListIcon className="w-4 h-4 inline mr-1" />
                        Export Queue
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'trim' && (
                    <div className="space-y-6">
                      {isMaximized ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                          <div className="w-full">{videoPane}</div>
                          <div className="w-full space-y-6">{controlsPane}</div>
                        </div>
                      ) : (
                        <>
                          {videoPane}
                          {controlsPane}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'timeline' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <TimelineEditor
                            segments={segments}
                            selectedSegmentId={selectedSegmentId}
                            currentTime={currentTime}
                            duration={duration}
                            isPlaying={isPlaying}
                            onSegmentsChange={setSegments}
                            onSelectSegment={selectSegment}
                            onSeek={seekTo}
                            onTogglePlay={togglePlayPause}
                            onSplitAtPlayhead={splitSegmentAtPlayhead}
                            onDuplicateSegment={duplicateSegment}
                            onDeleteSegment={deleteSegment}
                          />
                          {videoPane}
                        </div>
                        <div className="space-y-4">
                          {/* Project Info */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Project
                            </label>
                            <input
                              type="text"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              placeholder="Project name (optional)"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveProject()}
                              disabled={isSavingProject || !source}
                              className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSavingProject ? 'Saving...' : projectId ? 'Update Project' : 'Save Project'}
                            </button>
                          </div>

                          {/* Export Format */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Export Format
                            </label>
                            <select
                              value={exportFormat}
                              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            >
                              <option value="mp4">MP4</option>
                              <option value="webm">WebM</option>
                            </select>
                          </div>

                          {/* Segment Controls */}
                          {selectedSegmentId && (
                            <SegmentControls
                              segment={segments.find(s => s.id === selectedSegmentId)!}
                              onUpdate={(updates) => updateSegment(selectedSegmentId, updates)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'metadata' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>{videoPane}</div>
                        <div className="space-y-4">
                          <MetadataEditor
                            metadata={metadata}
                            duration={duration}
                            onUpdate={setMetadata}
                            onSeek={seekTo}
                          />
                          
                          {/* Export Format */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Export Format
                            </label>
                            <select
                              value={exportFormat}
                              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            >
                              <option value="mp4">MP4</option>
                              <option value="webm">WebM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'captions' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>{videoPane}</div>
                        <div className="space-y-4">
                          <CaptionEditor
                            captions={captions}
                            currentTime={currentTime}
                            onUpdate={setCaptions}
                            onSeek={seekTo}
                          />
                          
                          {/* Export Format */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Export Format
                            </label>
                            <select
                              value={exportFormat}
                              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            >
                              <option value="mp4">MP4</option>
                              <option value="webm">WebM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'export' && (
                    <div className="space-y-6">
                      <ExportQueue
                        queue={exportQueue}
                        onRetry={(id) => {
                          const item = exportQueue.find(q => q.id === id);
                          if (item?.preset) {
                            setExportQueue(prev => prev.map(q =>
                              q.id === id ? { ...q, status: 'queued' as const, error: undefined, progress: 0 } : q
                            ));
                            setTimeout(() => {
                              processExport(id, item.preset);
                            }, 100);
                          }
                        }}
                        onRemove={(id) => {
                          setExportQueue(prev => prev.filter(item => item.id !== id));
                        }}
                        onClear={() => {
                          setExportQueue([]);
                        }}
                      />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add to Queue</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {EXPORT_PRESETS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => addToExportQueue(preset.id)}
                              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">{preset.name}</div>
                              {preset.platform && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{preset.platform}</div>
                              )}
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {preset.resolution} • {preset.aspectRatio}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Share Modal */}
            {showShareModal && lastExportUrl && (
              <ShareModal
                videoUrl={lastExportUrl}
                onClose={() => setShowShareModal(false)}
              />
            )}

            {/* Footer */}
            {!showSourcePicker && source && (
              <div className="border-t border-gray-200/30 dark:border-gray-700/30 p-4 sm:p-6 bg-white/30 dark:bg-gray-800/30">
                <div className="flex gap-3 justify-end">
                  <Button onClick={handleClose} variant="secondary" disabled={isExporting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    style={{
                      backgroundColor: themeColors.cssVars.primary.base,
                    }}
                    className="hover:opacity-90"
                    disabled={isExporting || !trimPoints}
                  >
                    {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Export Clip'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Rnd>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
