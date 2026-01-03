/**
 * ExportQueue Component
 * 
 * Batch export queue with progress tracking.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import type { ExportPreset } from './types';

export interface QueuedExport {
  id: string;
  preset: ExportPreset;
  projectId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface ExportQueueProps {
  queue: QueuedExport[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onClear: () => void;
}

export default function ExportQueue({ queue, onRemove, onRetry, onClear }: ExportQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        No exports in queue
      </div>
    );
  }

  const processing = queue.filter(e => e.status === 'processing');
  const completed = queue.filter(e => e.status === 'completed');
  const failed = queue.filter(e => e.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            Total: <strong>{queue.length}</strong>
          </span>
          {processing.length > 0 && (
            <span className="text-blue-600 dark:text-blue-400">
              Processing: <strong>{processing.length}</strong>
            </span>
          )}
          {completed.length > 0 && (
            <span className="text-green-600 dark:text-green-400">
              Completed: <strong>{completed.length}</strong>
            </span>
          )}
          {failed.length > 0 && (
            <span className="text-red-600 dark:text-red-400">
              Failed: <strong>{failed.length}</strong>
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Queue Items */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {queue.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.status === 'completed' && (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  )}
                  {item.status === 'failed' && (
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  {item.status === 'processing' && (
                    <ArrowPathIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.preset.name}
                  </span>
                </div>

                {item.status === 'processing' && (
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {item.progress}%
                    </div>
                  </div>
                )}

                {item.status === 'completed' && item.outputUrl && (
                  <a
                    href={item.outputUrl}
                    download
                    className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-block"
                  >
                    Download
                  </a>
                )}

                {item.status === 'failed' && item.error && (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {item.error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {item.status === 'failed' && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Retry"
                  >
                    <ArrowPathIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                {item.status !== 'processing' && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Remove"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
