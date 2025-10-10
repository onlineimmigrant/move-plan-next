// modalHelpers.ts - Common utility functions for modals
'use client';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Generic form validator
 */
export type Validator<T> = (value: T) => string | undefined;

/**
 * Validate a form object with validators
 * 
 * @example
 * const validators = {
 *   email: (val) => !val ? 'Email required' : !val.includes('@') ? 'Invalid email' : undefined,
 *   name: (val) => !val ? 'Name required' : undefined
 * };
 * const result = validateForm({ email: '', name: 'John' }, validators);
 * // result.isValid = false
 * // result.errors = { email: 'Email required' }
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Partial<Record<keyof T, Validator<T[keyof T]>>>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const error = validator(data[field as keyof T]);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validators
 */
export const validators = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return undefined;
  },

  email: (value: string) => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email address';
    }
    return undefined;
  },

  minLength: (min: number, fieldName: string) => (value: string) => {
    if (!value) return undefined;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return undefined;
  },

  maxLength: (max: number, fieldName: string) => (value: string) => {
    if (!value) return undefined;
    if (value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return undefined;
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!value) return undefined;
    if (!regex.test(value)) {
      return message;
    }
    return undefined;
  },

  slug: (value: string) => {
    if (!value) return undefined;
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    return undefined;
  },

  url: (value: string) => {
    if (!value) return undefined;
    try {
      new URL(value);
      return undefined;
    } catch {
      return 'Invalid URL';
    }
  },

  number: (value: any) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return undefined;
  },

  min: (min: number, fieldName: string) => (value: number) => {
    if (value === undefined || value === null) return undefined;
    if (value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return undefined;
  },

  max: (max: number, fieldName: string) => (value: number) => {
    if (value === undefined || value === null) return undefined;
    if (value > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return undefined;
  },
};

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Debounce function for form inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Handle modal close with unsaved changes warning
 */
export function handleCloseWithWarning(
  hasChanges: boolean,
  onClose: () => void,
  message = 'You have unsaved changes. Are you sure you want to close?'
): void {
  if (hasChanges) {
    if (confirm(message)) {
      onClose();
    }
  } else {
    onClose();
  }
}

/**
 * Generic async handler with loading and error states
 */
export async function handleAsync<T>(
  asyncFn: () => Promise<T>,
  options: {
    onStart?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
  } = {}
): Promise<{ success: boolean; data?: T; error?: Error }> {
  const { onStart, onSuccess, onError, onFinally } = options;

  try {
    onStart?.();
    const result = await asyncFn();
    onSuccess?.(result);
    return { success: true, data: result };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    return { success: false, error: err };
  } finally {
    onFinally?.();
  }
}

/**
 * Check if two objects are deeply equal (for change detection)
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Detect changes between two objects
 */
export function hasChanges<T extends Record<string, any>>(
  original: T,
  current: T
): boolean {
  return !deepEqual(original, current);
}
