/**
 * TimelineEditor Component
 * 
 * Visual timeline with draggable segments, zoom controls, and playhead.
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon, ScissorsIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import type { TimelineSegment } from './types';

interface TimelineEditorProps {
  segments: TimelineSegment[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedSegmentId: string | null;
  onSegmentsChange: (segments: TimelineSegment[]) => void;
  onSelectSegment: (id: string) => void;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onSplitAtPlayhead: () => void;
  onDuplicateSegment: (id: string) => void;
  onDeleteSegment: (id: string) => void;
}

export default function TimelineEditor({
  segments,
  duration,
  currentTime,
  isPlaying,
  selectedSegmentId,
  onSegmentsChange,
  onSelectSegment,
  onSeek,
  onTogglePlay,
  onSplitAtPlayhead,
  onDuplicateSegment,
  onDeleteSegment,
}: TimelineEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [draggedSegment, setDraggedSegment] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = duration * pixelsPerSecond;

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(time, duration)));
  };

  const handleSegmentDragStart = (e: React.MouseEvent, segment: TimelineSegment) => {
    e.stopPropagation();
    setDraggedSegment(segment.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset(e.clientX - rect.left);
  };

  const handleSegmentDrag = useCallback((e: MouseEvent) => {
    if (!draggedSegment || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset;
    const newStart = Math.max(0, Math.min((x / rect.width) * duration, duration));

    const segment = segments.find(s => s.id === draggedSegment);
    if (!segment) return;

    const segmentDuration = segment.end - segment.start;
    const newEnd = Math.min(newStart + segmentDuration, duration);

    const updatedSegments = segments.map(s =>
      s.id === draggedSegment
        ? { ...s, start: newStart, end: newEnd }
        : s
    );

    onSegmentsChange(updatedSegments);
  }, [draggedSegment, dragOffset, duration, segments, onSegmentsChange]);

  const handleSegmentDragEnd = useCallback(() => {
    setDraggedSegment(null);
    setDragOffset(0);
  }, []);

  useEffect(() => {
    if (draggedSegment) {
      document.addEventListener('mousemove', handleSegmentDrag);
      document.addEventListener('mouseup', handleSegmentDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleSegmentDrag);
        document.removeEventListener('mouseup', handleSegmentDragEnd);
      };
    }
  }, [draggedSegment, handleSegmentDrag, handleSegmentDragEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <PlayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSplitAtPlayhead}
            disabled={!selectedSegmentId}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Split at playhead (S)"
          >
            <ScissorsIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden" style={{ maxHeight: '200px' }}>
          <div
            ref={timelineRef}
            className="relative bg-gray-100 dark:bg-gray-900 cursor-pointer"
            style={{ width: `${timelineWidth}px`, minWidth: '100%', height: '120px' }}
            onClick={handleTimelineClick}
          >
            {/* Time markers */}
            <div className="absolute inset-x-0 top-0 h-6 border-b border-gray-300 dark:border-gray-600">
              {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => i).map((second) => (
                <div
                  key={second}
                  className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-600"
                  style={{ left: `${(second / duration) * 100}%` }}
                >
                  <span className="absolute top-0.5 left-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {formatTime(second)}
                  </span>
                </div>
              ))}
            </div>

            {/* Segments */}
            <div className="absolute inset-x-0 top-6 bottom-0">
              {segments.map((segment, index) => {
                const left = (segment.start / duration) * 100;
                const width = ((segment.end - segment.start) / duration) * 100;
                const isSelected = segment.id === selectedSegmentId;
                const isDragging = segment.id === draggedSegment;

                return (
                  <div
                    key={segment.id}
                    className={`absolute top-2 h-16 rounded cursor-move transition-all ${
                      isSelected
                        ? 'bg-blue-500 dark:bg-blue-600 ring-2 ring-blue-400 dark:ring-blue-500 z-10'
                        : 'bg-blue-400/70 dark:bg-blue-500/70 hover:bg-blue-500/90 dark:hover:bg-blue-600/90'
                    } ${isDragging ? 'opacity-70' : 'opacity-100'}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onMouseDown={(e) => handleSegmentDragStart(e, segment)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSegment(segment.id);
                    }}
                  >
                    <div className="h-full flex flex-col justify-between p-1.5 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">Clip {index + 1}</span>
                        <div className="flex gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateSegment(segment.id);
                            }}
                            className="p-0.5 hover:bg-white/20 rounded"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSegment(segment.id);
                            }}
                            className="p-0.5 hover:bg-red-500/50 rounded"
                            title="Delete"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-mono opacity-90">
                        {formatTime(segment.end - segment.start)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
