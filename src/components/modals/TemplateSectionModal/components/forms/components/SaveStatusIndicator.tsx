/**
 * SaveStatusIndicator - Floating chip showing autosave status
 */

'use client';

import React from 'react';

interface SaveStatusIndicatorProps {
  saveState: 'idle' | 'autosaving' | 'saved' | 'error';
  dirty: boolean;
}

export function SaveStatusIndicator({ saveState, dirty }: SaveStatusIndicatorProps) {
  if (saveState === 'idle' && !dirty) return null;
  if (saveState === 'autosaving') return null;

  return (
    <div className="fixed bottom-4 right-6 z-20">
      <div
        className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-md border ${
          saveState === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : saveState === 'saved'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-50 text-gray-600 border-gray-200'
        }`}
      >
        {saveState === 'saved' && 'Saved'}
        {saveState === 'error' && 'Save failed'}
        {saveState === 'idle' && dirty && 'Unsaved changes'}
      </div>
    </div>
  );
}
