import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { EditorMode } from '../types';
import { getEditorModeLabel } from '../types';

interface EditorModeSwitchProps {
  editorMode: EditorMode;
  postType: 'default' | 'minimal' | 'landing' | 'doc_set';
  onModeChange: (mode: EditorMode) => void;
}

export function EditorModeSwitch({ editorMode, postType, onModeChange }: EditorModeSwitchProps) {
  const themeColors = useThemeColors();
  
  const modes: EditorMode[] = ['visual', 'markdown', 'html'];
  
  return (
    <div className="flex gap-0.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg p-0.5">
      {modes.map((mode) => {
        const isDisabled = mode === 'visual' && postType === 'landing';
        const isActive = editorMode === mode;
        
        return (
          <button
            key={mode}
            onClick={() => !isDisabled && onModeChange(mode)}
            disabled={isDisabled}
            title={
              mode === 'visual' && isDisabled
                ? 'Visual Editor disabled for Landing pages'
                : `${getEditorModeLabel(mode)} - ${mode === 'visual' ? '⌘1' : mode === 'markdown' ? '⌘2' : '⌘3'}`
            }
            aria-label={`Switch to ${getEditorModeLabel(mode)}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 relative ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={
              isActive
                ? {
                    '--tw-ring-color': themeColors.cssVars.primary.base
                  } as React.CSSProperties
                : undefined
            }
          >
            {getEditorModeLabel(mode)}
          </button>
        );
      })}
    </div>
  );
}
