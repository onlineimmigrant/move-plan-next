// Shared Modal Utilities - Export all shared components and hooks

// Legacy Components (to be deprecated)
export { BaseModal } from './BaseModal';
export type { BaseModalProps } from './BaseModal';

// Legacy Hooks (to be deprecated)
export { useModalForm } from './useModalForm';
export type { UseModalFormOptions, UseModalFormReturn } from './useModalForm';

// Context Factory
export { createModalContext } from './createModalContext';
export type { ModalContextValue, CreateModalContextOptions } from './createModalContext';

// Helpers
export {
  validateForm,
  validators,
  generateSlug,
  debounce,
  handleCloseWithWarning,
  handleAsync,
  deepEqual,
  hasChanges,
} from './modalHelpers';
export type { ValidationResult, Validator } from './modalHelpers';

// ============================================
// NEW STANDARDIZED MODAL SYSTEM
// ============================================

// Types
export * from './types';

// Utilities
export * from './utils';

// Hooks
export * from './hooks';

// Container Components
export * from './containers';

// Layout Components
export * from './layout';

// UI Components (Phase 2)
export * from './components';
