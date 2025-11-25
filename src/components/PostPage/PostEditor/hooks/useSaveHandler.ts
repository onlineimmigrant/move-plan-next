import { Editor } from '@tiptap/react';
import { formatHTML } from '../utils';

export interface SaveHandler {
  handleSave: () => void;
}

export function useSaveHandler(
  editor: Editor | null,
  editorMode: string,
  markdownContent: string,
  htmlContent: string,
  indentType: 'spaces' | 'tabs',
  indentSize: number,
  lineEnding: 'LF' | 'CRLF',
  onContentChange?: (content: string, type: 'html' | 'markdown') => void
): SaveHandler {
  const handleSave = () => {
    let contentToSave: string;
    let contentType: 'html' | 'markdown';
    
    console.log('💾 [HANDLE SAVE] Called with editorMode:', editorMode);
    console.log('💾 [HANDLE SAVE] Current state:', {
      markdownContentLength: markdownContent.length,
      htmlContentLength: htmlContent.length,
      markdownPreview: markdownContent.substring(0, 100),
      htmlPreview: htmlContent.substring(0, 100)
    });
    
    if (editorMode === 'markdown') {
      // In Markdown mode, save the markdown content AS-IS
      // DO NOT process or modify - preserve all newlines and formatting
      contentToSave = markdownContent;
      contentType = 'markdown';
    } else if (editorMode === 'html') {
      // In HTML mode, save exactly what the user has typed (preserve their formatting)
      contentToSave = htmlContent;
      contentType = 'html';
      // DON'T update the visual editor when saving from code view
      // (TipTap strips comments and reformats, which we want to avoid)
    } else {
      // In visual mode, format the HTML from the editor
      if (!editor) return;
      const tables = editor.view.dom.querySelectorAll('.tiptap-table') as NodeListOf<HTMLElement>;
      tables.forEach((table) => {
        table.classList.remove('editing');
        const attrs = table.dataset;
        const borderStyle = attrs.borderStyle || 'solid';
        const borderWidth = attrs.borderWidth || '1px';
        const borderColor = attrs.borderColor || '#e5e7eb';
        const border = borderStyle === 'none' ? 'none' : `${borderStyle} ${borderWidth} ${borderColor}`;
        const cells = table.querySelectorAll('.tiptap-table-cell, .tiptap-table-header');
        cells.forEach((cell) => {
          (cell as HTMLElement).style.border = border;
        });
        const headers = table.querySelectorAll('.tiptap-table-header');
        headers.forEach((header) => {
          (header as HTMLElement).style.backgroundColor = attrs.backgroundColor || 'transparent';
        });
      });
      contentToSave = editor.getHTML();
      contentType = 'html';
      
      // Format HTML with proper indentation only when saving from visual mode
      const lowerCaseLineEnding = lineEnding === 'CRLF' ? 'crlf' : 'lf';
      contentToSave = formatHTML(contentToSave, indentType, indentSize as 2 | 4, lowerCaseLineEnding);
    }
    
    // Update parent component with the content (only once, right before saving)
    if (onContentChange) {
      onContentChange(contentToSave, contentType);
    }
  };

  return {
    handleSave,
  };
}
