'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import Button from '../../ui/Button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageInsert?: () => void;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onImageInsert,
  placeholder = 'Start writing in Markdown...'
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<'split' | 'preview-only' | 'editor-only'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const insertText = (before: string, after: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = value.substring(0, start) + text + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertText('[', `](${url})`, 'link text');
    }
  };

  const insertImage = () => {
    if (onImageInsert) {
      onImageInsert();
    } else {
      const url = prompt('Enter image URL:');
      const alt = prompt('Enter alt text:', 'image');
      if (url) {
        insertAtCursor(`![${alt || 'image'}](${url})\n`);
      }
    }
  };

  const insertTable = () => {
    const table = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    insertAtCursor(table);
  };

  const insertCodeBlock = () => {
    const language = prompt('Enter language (optional):', 'javascript');
    insertText(`\`\`\`${language || ''}\n`, '\n```\n', 'your code here');
  };

  return (
    <div className="markdown-editor-container flex flex-col h-full">
      {/* Toolbar - Glassmorphic style matching Visual mode */}
      <div className="sticky top-0 z-40 px-4 py-2 backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border-b border-white/20 dark:border-gray-700/20">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Headers */}
          <div className="flex gap-0.5">
            <Button size="sm" variant="outline" onClick={() => insertText('# ', '', 'Heading 1')} title="Heading 1">
              H1
            </Button>
            <Button size="sm" variant="outline" onClick={() => insertText('## ', '', 'Heading 2')} title="Heading 2">
              H2
            </Button>
            <Button size="sm" variant="outline" onClick={() => insertText('### ', '', 'Heading 3')} title="Heading 3">
              H3
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* Text formatting */}
          <Button size="sm" variant="outline" onClick={() => insertText('**', '**', 'bold')} title="Bold" className="font-bold">
            B
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertText('*', '*', 'italic')} title="Italic" className="italic">
            I
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertText('~~', '~~', 'strikethrough')} title="Strikethrough">
            <s>S</s>
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertText('`', '`', 'code')} title="Inline Code">
            {'</>'}
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* Lists */}
          <Button size="sm" variant="outline" onClick={() => insertText('- ', '', 'list item')} title="Bullet List">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertText('1. ', '', 'list item')} title="Numbered List">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertText('- [ ] ', '', 'task')} title="Task List">
            ☑
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* Insert */}
          <Button size="sm" variant="outline" onClick={insertLink} title="Insert Link">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={insertImage} title="Insert Image">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={insertCodeBlock} title="Code Block">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={insertTable} title="Insert Table">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertText('> ', '', 'blockquote')} title="Blockquote">
            "
          </Button>
          <Button size="sm" variant="outline" onClick={() => insertAtCursor('\n---\n')} title="Horizontal Rule">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* Preview toggle */}
          <div className="flex gap-0.5">
            <Button 
              size="sm" 
              variant={previewMode === 'editor-only' ? 'secondary' : 'outline'}
              onClick={() => setPreviewMode('editor-only')}
              title="Editor Only"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button 
              size="sm" 
              variant={previewMode === 'split' ? 'secondary' : 'outline'}
              onClick={() => setPreviewMode('split')}
              title="Split View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16m6-16v16M4 9h16M4 15h16M4 20h16M4 4h16" />
              </svg>
            </Button>
            <Button 
              size="sm" 
              variant={previewMode === 'preview-only' ? 'secondary' : 'outline'}
              onClick={() => setPreviewMode('preview-only')}
              title="Preview Only"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
          </div>

          <div className="ml-auto text-xs text-gray-500">
            {value.length.toLocaleString()} chars
          </div>
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        {previewMode !== 'preview-only' && (
          <div className={`${previewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-200`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none"
              style={{ minHeight: '500px' }}
            />
          </div>
        )}

        {/* Preview Pane */}
        {previewMode !== 'editor-only' && (
          <div className={`${previewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto bg-gray-50`}>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none p-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {value || '*Preview will appear here...*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
