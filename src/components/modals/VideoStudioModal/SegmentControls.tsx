/**
 * SegmentControls Component
 * 
 * Per-segment controls for volume, fade, and speed adjustments.
 */

'use client';

import React from 'react';
import type { TimelineSegment } from './types';

interface SegmentControlsProps {
  segment: TimelineSegment;
  onUpdate: (updates: Partial<TimelineSegment>) => void;
}

export default function SegmentControls({ segment, onUpdate }: SegmentControlsProps) {
  const volume = segment.volume ?? 1;
  const fadeIn = segment.fadeIn ?? 0;
  const fadeOut = segment.fadeOut ?? 0;
  const speed = segment.speed ?? 1;

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Segment Settings</h4>

      {/* Volume */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Volume
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={volume}
          onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* Fade In */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Fade In
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {fadeIn.toFixed(1)}s
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={fadeIn}
          onChange={(e) => onUpdate({ fadeIn: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Fade Out */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Fade Out
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {fadeOut.toFixed(1)}s
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={fadeOut}
          onChange={(e) => onUpdate({ fadeOut: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Speed */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Speed
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {speed}x
          </span>
        </div>
        <div className="flex gap-2">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ speed: s })}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
