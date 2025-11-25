import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

/**
 * Hook to handle touch scrolling for table wrappers in the editor
 * Enables smooth horizontal scrolling on touch devices
 */
export const useTouchScrolling = (editor: Editor | null) => {
  useEffect(() => {
    if (!editor) return;

    const handleTouchStart = (e: TouchEvent) => {
      const wrapper = (e.target as HTMLElement).closest('.table-wrapper') as HTMLElement;
      if (!wrapper) return;

      const startX = e.touches[0].clientX;
      const scrollStart = wrapper.scrollLeft;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        const currentX = moveEvent.touches[0].clientX;
        const deltaX = startX - currentX;
        wrapper.scrollLeft = scrollStart + deltaX;
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      editorDom.removeEventListener('touchstart', handleTouchStart);
    };
  }, [editor]);
};
