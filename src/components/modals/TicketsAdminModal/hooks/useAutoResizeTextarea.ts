import { useEffect, RefObject } from 'react';

/**
 * Custom hook to auto-resize a textarea based on its content
 * @param ref - Reference to the textarea element
 * @param value - The textarea value to watch for changes
 * @param maxHeight - Maximum height in pixels (default: 120)
 */
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement>,
  value: string,
  maxHeight: number = 120
): void {
  useEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [ref, value, maxHeight]);
}
