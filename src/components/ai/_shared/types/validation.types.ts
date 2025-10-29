/**
 * Validation Type Definitions
 * Types for form validation and error handling
 */

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Field-level errors
 */
export interface AIFieldErrors {
  [key: string]: string;
}

/**
 * Track which fields have been touched/interacted with
 */
export interface AITouchedFields {
  [key: string]: boolean;
}

/**
 * Validation rule function type
 */
export type AIValidationRule = (value: any) => string | null;

/**
 * Validation rules for specific fields
 */
export interface AIValidationRules {
  [field: string]: AIValidationRule;
}

/**
 * Validation result
 */
export interface AIValidationResult {
  isValid: boolean;
  errors: AIFieldErrors;
}

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Form mode
 */
export type AIFormMode = 'add' | 'edit' | 'view';

/**
 * Form submission state
 */
export interface AIFormState {
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  fieldErrors: AIFieldErrors;
  touchedFields: AITouchedFields;
}
