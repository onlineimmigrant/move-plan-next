import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface UseEditorKeyboardShortcutsProps {
  editor: Editor | null;
  isCodeView: boolean;
  showFindReplace: boolean;
  setShowFindReplace: (show: boolean) => void;
  handleSave: () => void;
  undoHtml: () => void;
  redoHtml: () => void;
}

/**
 * Hook to handle keyboard shortcuts in the editor
 */
export const useEditorKeyboardShortcuts = ({
  editor,
  isCodeView,
  showFindReplace,
  setShowFindReplace,
  handleSave,
  undoHtml,
  redoHtml,
}: UseEditorKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
      
      // Ctrl+F to toggle Find & Replace (in HTML editor only)
      if (isCodeView && (event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowFindReplace(!showFindReplace);
      }
      
      // Escape to close Find & Replace
      if (isCodeView && showFindReplace && event.key === 'Escape') {
        event.preventDefault();
        setShowFindReplace(false);
      }
      
      // Ctrl+Z to undo (in HTML editor only)
      if (isCodeView && (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoHtml();
      }
      
      // Ctrl+Shift+Z or Ctrl+Y to redo (in HTML editor only)
      if (isCodeView && ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') || 
          (isCodeView && (event.ctrlKey || event.metaKey) && event.key === 'y')) {
        event.preventDefault();
        redoHtml();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, showFindReplace, isCodeView, setShowFindReplace, handleSave, undoHtml, redoHtml]);
};
