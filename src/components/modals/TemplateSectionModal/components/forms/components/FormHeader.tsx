/**
 * FormHeader - Sticky header with publish controls
 */

'use client';

import React from 'react';

interface FormHeaderProps {
  published: boolean;
  questionCount: number;
  onTogglePublished: () => void;
  primaryColor?: string;
}

export function FormHeader({
  published,
  questionCount,
  onTogglePublished,
  primaryColor,
}: FormHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-6 px-6 py-3">
      <div className="flex items-center justify-end gap-3">
        {/* Publish status */}
        <button
          onClick={onTogglePublished}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            published
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
          style={{ color: published ? undefined : primaryColor }}
        >
          {published ? '✓ Published' : 'Draft'}
        </button>
      </div>
    </div>
  );
}
