'use client';

import React from 'react';
import { EditorMode } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface EditorModeToggleProps {
  editorMode: EditorMode;
  postType: string;
  initialContentType?: 'html' | 'markdown';
  autoSaveIndicator?: 'saving' | 'saved' | 'idle' | null;
  switchEditorMode: (mode: EditorMode) => void;
  handleContentTypeChange: (type: 'html' | 'markdown') => void;
}

export const EditorModeToggle: React.FC<EditorModeToggleProps> = ({
  editorMode,
  postType,
  initialContentType,
  autoSaveIndicator,
  switchEditorMode,
  handleContentTypeChange,
}) => {
  const themeColors = useThemeColors();

  return (
    <div className="sticky top-0 z-40 border-b border-white/20 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md px-4 py-3">
      <div className="flex flex-col gap-3">
        {/* Row 1: Mode toggles and Content Type */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Mode Toggle Buttons - Premium Style */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-1">Mode:</span>
            <button
              onClick={() => switchEditorMode('visual')}
              disabled={postType === 'landing'}
              title={postType === 'landing' ? 'Visual Editor disabled for Landing pages' : 'Visual Editor (WYSIWYG) - ⌘1'}
              aria-label="Switch to Visual Editor"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 relative ${
                editorMode === 'visual'
                  ? 'bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-[1.02]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                ...(editorMode === 'visual' && {
                  boxShadow: `0 0 0 2px ${themeColors.cssVars.primary.base}20`,
                }),
                '--tw-ring-color': themeColors.cssVars.primary.base
              } as React.CSSProperties}
            >
              Visual
              <span className="ml-1.5 text-[10px] opacity-50">⌘1</span>
            </button>
            <button
              onClick={() => switchEditorMode('markdown')}
              title="Markdown Editor - ⌘2"
              aria-label="Switch to Markdown Editor"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 relative ${
                editorMode === 'markdown'
                  ? 'bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-[1.02]'
              }`}
              style={{
                ...(editorMode === 'markdown' && {
                  boxShadow: `0 0 0 2px ${themeColors.cssVars.primary.base}20`,
                }),
                '--tw-ring-color': themeColors.cssVars.primary.base
              } as React.CSSProperties}
            >
              Markdown
              <span className="ml-1.5 text-[10px] opacity-50">⌘2</span>
            </button>
            <button
              onClick={() => switchEditorMode('html')}
              title="HTML Source Editor - ⌘3"
              aria-label="Switch to HTML Editor"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 relative ${
                editorMode === 'html'
                  ? 'bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-[1.02]'
              }`}
              style={{
                ...(editorMode === 'html' && {
                  boxShadow: `0 0 0 2px ${themeColors.cssVars.primary.base}20`,
                }),
                '--tw-ring-color': themeColors.cssVars.primary.base
              } as React.CSSProperties}
            >
              HTML
              <span className="ml-1.5 text-[10px] opacity-50">⌘3</span>
              {autoSaveIndicator === 'saved' && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Content Type Radio Buttons - Premium Style */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Content Type:</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-[1.02]">
                <input
                  type="radio"
                  name="contentType"
                  value="html"
                  checked={(initialContentType || 'html') === 'html'}
                  onChange={() => handleContentTypeChange('html')}
                  className="w-3.5 h-3.5 border-gray-300 dark:border-gray-600 focus:ring-2"
                  style={{ 
                    accentColor: themeColors.cssVars.primary.base,
                    '--tw-ring-color': themeColors.cssVars.primary.base
                  } as React.CSSProperties}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">HTML</span>
              </label>
              <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-[1.02]">
                <input
                  type="radio"
                  name="contentType"
                  value="markdown"
                  checked={(initialContentType || 'html') === 'markdown'}
                  onChange={() => handleContentTypeChange('markdown')}
                  className="w-3.5 h-3.5 border-gray-300 dark:border-gray-600 focus:ring-2"
                  style={{ 
                    accentColor: themeColors.cssVars.primary.base,
                    '--tw-ring-color': themeColors.cssVars.primary.base
                  } as React.CSSProperties}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Markdown</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
