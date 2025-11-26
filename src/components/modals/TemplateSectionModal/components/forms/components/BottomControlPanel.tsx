/**
 * BottomControlPanel - Fixed footer with navigation and save controls
 */

'use client';

import React from 'react';
import Button from '@/ui/Button';

interface BottomControlPanelProps {
  formId: string | null;
  dirty: boolean;
  formTitle: string;
  loading: boolean;
  onBack: (() => void) | null;
  onSave: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function BottomControlPanel({
  formId,
  dirty,
  formTitle,
  loading,
  onBack,
  onSave,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: BottomControlPanelProps) {
  const handleBack = () => {
    if (!onBack) return;
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    onBack();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 rounded-b-2xl">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Undo/Redo */}
        <div className="flex items-center gap-2">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (⌘Z)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}
          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (⌘⇧Z)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          )}
        </div>

        {/* Right: Save Button */}
        <Button onClick={onSave} disabled={!formTitle.trim() || loading} variant="primary" className="px-6 py-2">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
