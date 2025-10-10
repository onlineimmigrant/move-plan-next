// Shared Modal Utilities - Export all shared components and hooks

// Components
export { BaseModal } from './BaseModal';
export type { BaseModalProps } from './BaseModal';

// Hooks
export { useModalState } from './useModalState';
export type { UseModalStateOptions, UseModalStateReturn } from './useModalState';

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
