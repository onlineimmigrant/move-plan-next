import { Editor } from '@tiptap/react';
import { EditorMode } from '../types';

// Import utility functions that need to be passed in or defined
interface EditorModeHandlersProps {
  editor: Editor | null;
  editorMode: EditorMode;
  postType: string;
  htmlContent: string;
  markdownContent: string;
  indentType: 'spaces' | 'tabs';
  indentSize: number;
  lineEnding: 'LF' | 'CRLF';
  setEditorMode: (mode: EditorMode) => void;
  setHtmlContent: (content: string) => void;
  setMarkdownContent: (content: string) => void;
  setPendingContentType: (type: 'html' | 'markdown' | null) => void;
  setShowContentTypeModal: (show: boolean) => void;
  onCodeViewChange?: (isCodeView: boolean) => void;
  onContentChange?: (content: string, type: 'html' | 'markdown') => void;
  // Utility functions passed from parent
  markdownToHtml: (markdown: string) => string;
  htmlToMarkdown: (html: string) => string;
  cleanHtml: (html: string) => string;
  unescapeMarkdown: (text: string) => string;
  formatHTML: (html: string, indentType: 'spaces' | 'tabs', indentSize: number, lineEnding: 'LF' | 'CRLF') => string;
  pendingContentType: 'html' | 'markdown' | null;
}

export interface EditorModeHandlers {
  switchEditorMode: (targetMode: EditorMode) => void;
  toggleCodeView: () => void;
  handleContentTypeChange: (newType: 'html' | 'markdown') => void;
  confirmContentTypeChange: () => void;
  cancelContentTypeChange: () => void;
}

export function useEditorModeHandlers({
  editor,
  editorMode,
  postType,
  htmlContent,
  markdownContent,
  indentType,
  indentSize,
  lineEnding,
  setEditorMode,
  setHtmlContent,
  setMarkdownContent,
  setPendingContentType,
  setShowContentTypeModal,
  onCodeViewChange,
  onContentChange,
  markdownToHtml,
  htmlToMarkdown,
  cleanHtml,
  unescapeMarkdown,
  formatHTML,
  pendingContentType,
}: EditorModeHandlersProps): EditorModeHandlers {
  const switchEditorMode = (targetMode: EditorMode) => {
    // Prevent switching to visual editor for landing pages
    if (postType === 'landing' && targetMode === 'visual') {
      alert('Visual Editor is disabled for Landing Page type.\n\nReason: Landing pages often contain complex HTML structures that may not be fully preserved in visual mode.\n\nTo enable Visual Editor:\n1. Change post type to "Default" or "Minimal"\n2. Be aware that some custom HTML/CSS may be simplified or removed');
      return;
    }
    
    if (targetMode === editorMode) return; // Already in this mode
    
    const currentMode = editorMode;
    
    // Handle content conversion when switching modes
    if (targetMode === 'visual') {
      // Switching to visual mode
      if (!editor) return;
      try {
        if (currentMode === 'html') {
          // HTML → Visual: Load HTML into TipTap
          editor.commands.setContent(htmlContent);
          if (onContentChange) {
            onContentChange(htmlContent, 'html');
          }
        } else if (currentMode === 'markdown') {
          // Markdown → Visual: Convert markdown to HTML first
          // This is CRITICAL - TipTap needs HTML, not raw markdown
          const htmlFromMarkdown = markdownToHtml(markdownContent);
          if (editor) {
            editor.commands.setContent(htmlFromMarkdown);
          }
        }
      } catch (error) {
        console.error('Error switching to visual mode:', error);
      }
    } else if (targetMode === 'html') {
      // Switching to HTML mode
      if (currentMode === 'visual') {
        // Visual → HTML: Get HTML from TipTap
        if (!editor) return;
        const editorHtml = editor.getHTML();
        if (!htmlContent || htmlContent.trim() === '') {
          const htmlToSet = formatHTML(editorHtml, indentType, indentSize, lineEnding);
          setHtmlContent(htmlToSet);
        }
        // Else preserve existing htmlContent
      } else if (currentMode === 'markdown') {
        // Markdown → HTML: Keep markdown as-is for editing
        // Don't convert - user can edit the raw markdown in HTML mode
        setHtmlContent(markdownContent);
      }
    } else if (targetMode === 'markdown') {
      // Switching to Markdown mode
      if (currentMode === 'visual') {
        // Visual → Markdown: Convert HTML to Markdown
        if (!editor) return;
        const editorHtml = cleanHtml(editor.getHTML());
        const markdown = htmlToMarkdown(editorHtml); // Already includes unescapeMarkdown
        setMarkdownContent(markdown);
      } else if (currentMode === 'html') {
        // HTML → Markdown: Only convert if it looks like HTML
        // Check if content starts with HTML tags
        const trimmedContent = htmlContent.trim();
        const looksLikeHtml = trimmedContent.startsWith('<') && trimmedContent.includes('>');
        
        if (looksLikeHtml) {
          // Convert HTML to Markdown
          const markdown = htmlToMarkdown(htmlContent); // Already includes unescapeMarkdown
          setMarkdownContent(markdown);
        } else {
          // Already markdown or plain text - don't convert, but clean escapes
          const cleaned = unescapeMarkdown(htmlContent);
          setMarkdownContent(cleaned);
        }
      }
    }
    
    setEditorMode(targetMode);
    
    // Notify parent component about code view state change
    // Code view is true for HTML mode, false for visual and markdown modes
    if (onCodeViewChange) {
      onCodeViewChange(targetMode === 'html');
    }
  };

  // Backward compatible toggle function
  const toggleCodeView = () => {
    if (editorMode === 'html') {
      switchEditorMode('visual');
    } else {
      switchEditorMode('html');
    }
  };

  // Handle content type change with confirmation
  const handleContentTypeChange = (newType: 'html' | 'markdown') => {
    const currentType = editorMode === 'markdown' ? 'markdown' : 'html';
    
    // If same type, do nothing
    if (newType === currentType) return;
    
    // Show confirmation modal
    setPendingContentType(newType);
    setShowContentTypeModal(true);
  };

  const confirmContentTypeChange = () => {
    if (!pendingContentType) return;
    
    // Switch to appropriate editor mode
    if (pendingContentType === 'markdown') {
      switchEditorMode('markdown');
    } else {
      // For HTML, default to visual mode if available
      if (postType !== 'landing') {
        switchEditorMode('visual');
      } else {
        switchEditorMode('html');
      }
    }
    
    // Get current content based on current mode
    const currentContent = editorMode === 'markdown' ? markdownContent : 
                          editorMode === 'html' ? htmlContent : 
                          editor?.getHTML() || '';
    
    // Notify parent via onContentChange with the new content type
    if (onContentChange) {
      onContentChange(currentContent, pendingContentType);
    }
    
    // Close modal and reset
    setShowContentTypeModal(false);
    setPendingContentType(null);
  };

  const cancelContentTypeChange = () => {
    setShowContentTypeModal(false);
    setPendingContentType(null);
  };

  return {
    switchEditorMode,
    toggleCodeView,
    handleContentTypeChange,
    confirmContentTypeChange,
    cancelContentTypeChange,
  };
}
