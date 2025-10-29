/**
 * UI Component Type Definitions
 * Types for UI components and interactions
 */

import { AIModel, AIModelType, AISelectedModel, AIModelFormData } from './model.types';

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Theme colors for consistent styling
 */
export interface AIThemeColors {
  base: string;
  light: string;
  lighter: string;
  hover?: string;
  dark?: string;
  darker?: string;
}

/**
 * Icon component props
 */
export interface AIIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Notification type
 */
export type AINotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification props
 */
export interface AINotificationProps {
  type: AINotificationType;
  message: string;
  onClose?: () => void;
  autoDismissDelay?: number;
  className?: string;
}

/**
 * Confirmation dialog props
 */
export interface AIConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Model card props
 */
export interface AIModelCardProps {
  model: AIModel;
  type: AIModelType;
  context: 'admin' | 'account';
  selectedModel?: AISelectedModel | null;
  primary?: AIThemeColors;
  onEdit?: (model: AIModel) => void;
  onDelete?: (id: number, name: string) => void;
  onToggleActive?: (id: number, isActive: boolean) => void;
  onSelect?: (modelId: number, type: AIModelType) => void;
  onOpenRoleModal?: (model: AIModel) => void;
  onOpenTaskModal?: (model: AIModel, mode: 'view' | 'add') => void;
  t?: any; // Translation object
}

/**
 * Loading skeleton props
 */
export interface AILoadingSkeletonProps {
  count?: number;
  context?: 'admin' | 'account';
  className?: string;
}

/**
 * Form field props
 */
export interface AIFormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'url' | 'textarea' | 'select';
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  options?: Array<{ label: string; value: any }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Model form props
 */
export interface AIModelFormProps {
  initialData?: Partial<AIModelFormData>;
  mode: 'create' | 'edit';
  onSubmit: (data: AIModelFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Confirmation dialog state
 */
export interface AIConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

/**
 * Modal state
 */
export interface AIModalState {
  isOpen: boolean;
  data?: any;
}
