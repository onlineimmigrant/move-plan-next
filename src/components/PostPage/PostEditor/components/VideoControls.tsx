'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import Button from '@/ui/Button';
import type { MediaAlignment, MediaSize } from '../types';

interface VideoControlsProps {
  editor: Editor;
  setVideoAlignment: (alignment: MediaAlignment) => void;
  setVideoSize: (size: MediaSize) => void;
}

/**
 * Video alignment and size controls
 * @performance Memoized to prevent re-renders when editor/props unchanged
 */
const VideoControlsComponent: React.FC<VideoControlsProps> = ({
  editor,
  setVideoAlignment,
  setVideoSize,
}) => {
  // Check if video wrapper is selected
  const isVideoWrapperSelected = (() => {
    const { selection } = editor.state;
    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'div' && node.attrs?.class === 'video-wrapper') {
        return true;
      }
    }
    return false;
  })();

  if (!isVideoWrapperSelected) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 bg-purple-50 dark:bg-purple-900/20 p-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">🎬 Video Controls:</span>
        
        {/* Alignment */}
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => setVideoAlignment('left')}
            variant="outline"
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </Button>
          <Button
            size="sm"
            onClick={() => setVideoAlignment('center')}
            variant="outline"
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </Button>
          <Button
            size="sm"
            onClick={() => setVideoAlignment('right')}
            variant="outline"
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
            </svg>
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* Size */}
        <div className="flex gap-1">
          <Button size="sm" onClick={() => setVideoSize('400px')} variant="outline" title="Small (400px)">
            S
          </Button>
          <Button size="sm" onClick={() => setVideoSize('560px')} variant="outline" title="Medium (560px)">
            M
          </Button>
          <Button size="sm" onClick={() => setVideoSize('800px')} variant="outline" title="Large (800px)">
            L
          </Button>
          <Button size="sm" onClick={() => setVideoSize('100%')} variant="outline" title="Full Width">
            Full
          </Button>
        </div>
      </div>
    </div>
  );
};

export const VideoControls = React.memo(VideoControlsComponent);
