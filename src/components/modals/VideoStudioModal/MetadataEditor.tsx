/**
 * MetadataEditor Component
 * 
 * Edit video metadata: title, description, tags, thumbnail.
 */

'use client';

import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import type { ProjectMetadata } from './types';

interface MetadataEditorProps {
  metadata: ProjectMetadata;
  onUpdate: (metadata: ProjectMetadata) => void;
  duration: number;
  onSeek?: (time: number) => void;
}

export default function MetadataEditor({ metadata, onUpdate, duration, onSeek }: MetadataEditorProps) {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const tags = metadata.tags || [];
    if (!tags.includes(tagInput.trim())) {
      onUpdate({ ...metadata, tags: [...tags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    const tags = metadata.tags || [];
    onUpdate({ ...metadata, tags: tags.filter(t => t !== tag) });
  };

  const handleThumbnailTimeChange = (time: number) => {
    onUpdate({ ...metadata, thumbnailTime: time });
    if (onSeek) onSeek(time);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          value={metadata.title || ''}
          onChange={(e) => onUpdate({ ...metadata, title: e.target.value })}
          placeholder="Enter video title..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          value={metadata.description || ''}
          onChange={(e) => onUpdate({ ...metadata, description: e.target.value })}
          placeholder="Enter video description..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        {metadata.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Thumbnail Frame
          </label>
          <button
            onClick={() => handleThumbnailTimeChange(metadata.thumbnailTime || 0)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <PhotoIcon className="w-4 h-4 inline mr-1" />
            Preview
          </button>
        </div>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={metadata.thumbnailTime || 0}
          onChange={(e) => handleThumbnailTimeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0:00</span>
          <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}
