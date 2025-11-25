import { Editor } from '@tiptap/react';
import type { MediaAlignment, MediaSize } from '../types';

/**
 * Type guard to check if editor instance exists and is ready
 * 
 * @example
 * ```tsx
 * if (isEditorReady(editor)) {
 *   editor.chain().focus().toggleBold().run();
 * }
 * ```
 */
export function isEditorReady(editor: Editor | null | undefined): editor is Editor {
  return editor !== null && editor !== undefined && !editor.isDestroyed;
}

/**
 * Type guard for MediaAlignment
 */
export function isMediaAlignment(value: unknown): value is MediaAlignment {
  return value === 'left' || value === 'center' || value === 'right';
}

/**
 * Type guard for MediaSize
 */
export function isMediaSize(value: unknown): value is MediaSize {
  const validSizes: MediaSize[] = ['33%', '50%', '75%', '100%', '400px', '560px', '600px', '800px'];
  return typeof value === 'string' && validSizes.includes(value as MediaSize);
}

/**
 * Type guard for content type
 */
export function isContentType(value: unknown): value is 'html' | 'markdown' {
  return value === 'html' || value === 'markdown';
}

/**
 * Type guard for editor mode
 */
export function isEditorMode(value: unknown): value is 'visual' | 'html' | 'markdown' | 'code' {
  return value === 'visual' || value === 'html' || value === 'markdown' || value === 'code';
}

/**
 * Safe editor command execution with type guard
 * 
 * @example
 * ```tsx
 * safeEditorCommand(editor, (ed) => {
 *   ed.chain().focus().toggleBold().run();
 * });
 * ```
 */
export function safeEditorCommand(
  editor: Editor | null | undefined,
  command: (editor: Editor) => void
): boolean {
  if (!isEditorReady(editor)) {
    console.warn('Editor not ready for command execution');
    return false;
  }
  
  try {
    command(editor);
    return true;
  } catch (error) {
    console.error('Editor command failed:', error);
    return false;
  }
}
