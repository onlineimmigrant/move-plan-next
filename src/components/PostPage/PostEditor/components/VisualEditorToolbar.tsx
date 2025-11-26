'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import Button from '@/ui/Button';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface VisualEditorToolbarProps {
  editor: Editor;
  applyStyle: (style: string) => void;
  setLink: () => void;
  handleUnlink: () => void;
  addImage: () => void;
  addVideo: () => void;
  addMediaCarousel: () => void;
  toggleHighlight: () => void;
  setShowTableSubmenu: (show: boolean) => void;
  showTableSubmenu: boolean;
  onAIEnhance?: () => void;
  hasSelection?: boolean;
}

export const VisualEditorToolbar: React.FC<VisualEditorToolbarProps> = ({
  editor,
  applyStyle,
  setLink,
  handleUnlink,
  addImage,
  addVideo,
  addMediaCarousel,
  toggleHighlight,
  setShowTableSubmenu,
  showTableSubmenu,
  onAIEnhance,
  hasSelection = false,
}) => {
  return (
    <div className="sticky top-[69px] z-40 px-4 py-2 backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border-b border-white/20 dark:border-gray-700/20">
      <div className="flex flex-wrap gap-1 items-center">
        {/* AI Enhancement Button - First position for visibility */}
        {onAIEnhance && (
          <>
            <Button
              size="sm"
              onClick={onAIEnhance}
              variant="outline"
              disabled={!hasSelection}
              title={hasSelection ? "Enhance selected text with AI" : "Select text to enhance with AI"}
              className="text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="w-4 h-4 mr-1" />
              AI Enhance
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
          </>
        )}
        
        {/* Text formatting */}
        <Button
          size="sm"
          onClick={() => applyStyle('bold')}
          variant={editor.isActive('bold') ? 'secondary' : 'outline'}
          className="font-bold"
          title="Bold (Ctrl+B)"
          aria-label="Toggle bold formatting"
          aria-pressed={editor.isActive('bold')}
        >
          B
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('italic')}
          variant={editor.isActive('italic') ? 'secondary' : 'outline'}
          className="italic"
          title="Italic (Ctrl+I)"
          aria-label="Toggle italic formatting"
          aria-pressed={editor.isActive('italic')}
        >
          I
        </Button>
        <Button
          size="sm"
          onClick={toggleHighlight}
          variant={editor.isActive('highlight') ? 'secondary' : 'outline'}
          title="Highlight"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* Container */}
        <Button
          size="sm"
          onClick={() => applyStyle('div')}
          variant={editor.isActive('div') ? 'secondary' : 'outline'}
          title="Div Container"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* Headings */}
        <Button
          size="sm"
          onClick={() => applyStyle('h1')}
          variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'outline'}
          title="Heading 1"
        >
          H1
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('h2')}
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'outline'}
          title="Heading 2"
        >
          H2
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('h3')}
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'outline'}
          title="Heading 3"
        >
          H3
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('h4')}
          variant={editor.isActive('heading', { level: 4 }) ? 'secondary' : 'outline'}
          title="Heading 4"
        >
          H4
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('h5')}
          variant={editor.isActive('heading', { level: 5 }) ? 'secondary' : 'outline'}
          title="Heading 5"
        >
          H5
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* Lists */}
        <Button
          size="sm"
          onClick={() => applyStyle('ul')}
          variant={editor.isActive('bulletList') ? 'secondary' : 'outline'}
          title="Bullet List"
        >
          •
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('ol')}
          variant={editor.isActive('orderedList') ? 'secondary' : 'outline'}
          title="Numbered List"
        >
          1.
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* Special formatting */}
        <Button
          size="sm"
          onClick={() => applyStyle('blockquote')}
          variant={editor.isActive('blockquote') ? 'secondary' : 'outline'}
          title="Quote"
        >
          "
        </Button>
        <Button
          size="sm"
          onClick={() => applyStyle('codeBlock')}
          variant={editor.isActive('codeBlock') ? 'secondary' : 'outline'}
          title="Code Block"
        >
          &lt;/&gt;
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* Insert elements */}
        <Button size="sm" onClick={setLink} variant="outline" title="Add/Edit Link">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </Button>
        {editor.isActive('link') && (
          <Button size="sm" onClick={handleUnlink} variant="outline" title="Remove Link" className="text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </Button>
        )}
        <Button size="sm" onClick={addImage} variant="outline" title="Add Image">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Button>
        <Button size="sm" onClick={addVideo} variant="outline" title="Add Video">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </Button>
        <Button size="sm" onClick={addMediaCarousel} variant="outline" title="Add Media Carousel">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        </Button>
        <Button
          size="sm"
          onClick={() => setShowTableSubmenu(!showTableSubmenu)}
          variant={showTableSubmenu ? 'secondary' : 'outline'}
          title="Table"
        >
          ⊞
        </Button>
      </div>
    </div>
  );
};
