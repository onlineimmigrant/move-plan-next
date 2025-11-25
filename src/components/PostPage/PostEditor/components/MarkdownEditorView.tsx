'use client';

import React from 'react';
import MarkdownEditor from '../ui/MarkdownEditor';

interface MarkdownEditorViewProps {
  markdownContent: string;
  setMarkdownContent: (value: string) => void;
  setShowImageGallery: (value: boolean) => void;
  onContentChange?: (content: string, contentType: 'html' | 'markdown') => void;
  onEditorChange?: () => void;
}

export const MarkdownEditorView: React.FC<MarkdownEditorViewProps> = ({
  markdownContent,
  setMarkdownContent,
  setShowImageGallery,
  onContentChange,
  onEditorChange,
}) => {
  return (
    <div className="markdown-editor-section">
      <MarkdownEditor
        value={markdownContent}
        onChange={(newValue) => {
          setMarkdownContent(newValue);
          // Notify parent immediately with the new value
          if (onContentChange) {
            onContentChange(newValue, 'markdown');
          }
          // Notify parent about editor changes
          if (onEditorChange) {
            onEditorChange();
          }
        }}
        onImageInsert={() => setShowImageGallery(true)}
        placeholder="Start writing your post in Markdown..."
      />
    </div>
  );
};
