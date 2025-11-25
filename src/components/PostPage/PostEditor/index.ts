/**
 * PostEditor - Modular Rich Text Editor
 * 
 * This is a re-export of the main PostEditor component.
 * The component has been restructured for better maintainability:
 * 
 * - /extensions - Custom TipTap extensions
 * - /hooks - React hooks for state and logic
 * - /components - UI sub-components
 * - /utils - Utility functions
 * - /types - TypeScript type definitions
 */

export { default } from '../PostEditor';
export type { PostEditorProps, EditorMode } from './types';
