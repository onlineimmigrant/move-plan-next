// useModalForm.tsx - Hook for managing form state in modals
'use client';

import { useState, useCallback, useEffect } from 'react';
import { validateForm, ValidationResult, Validator } from './modalHelpers';

export interface UseModalFormOptions<T> {
  initialValues: T;
  validators?: Partial<Record<keyof T, Validator<T[keyof T]>>>;
  onSubmit: (values: T) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  validateOnChange?: boolean;
  resetOnSubmit?: boolean;
}

export interface UseModalFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  hasChanges: boolean;
  touched: Record<string, boolean>;
  
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  
  reset: () => void;
  validate: () => ValidationResult;
}

/**
 * Hook for managing form state in modals
 * Handles validation, submission, error states, and change tracking
 * 
 * @example
 * const form = useModalForm({
 *   initialValues: { title: '', slug: '' },
 *   validators: {
 *     title: validators.required('Title'),
 *     slug: validators.slug
 *   },
 *   onSubmit: async (values) => {
 *     await createPage(values);
 *   },
 *   onSuccess: () => closeModal()
 * });
 * 
 * // In JSX
 * <input
 *   value={form.values.title}
 *   onChange={form.handleChange('title')}
 *   onBlur={form.handleBlur('title')}
 * />
 * {form.errors.title && <span>{form.errors.title}</span>}
 * <button onClick={form.handleSubmit} disabled={form.isSubmitting}>
 *   Submit
 * </button>
 */
export function useModalForm<T extends Record<string, any>>({
  initialValues,
  validators = {},
  onSubmit,
  onSuccess,
  onError,
  validateOnChange = false,
  resetOnSubmit = false,
}: UseModalFormOptions<T>): UseModalFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalValues] = useState<T>(initialValues);

  // Check if form has changes
  const hasChanges = JSON.stringify(values) !== JSON.stringify(originalValues);

  // Reset form when initialValues change (e.g., when modal opens)
  useEffect(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
  }, [JSON.stringify(initialValues)]);

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if enabled
    if (validateOnChange && validators[field]) {
      const error = validators[field]!(value);
      if (error) {
        setErrors(prev => ({ ...prev, [field as string]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    }
  }, [validators, validateOnChange]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleChange = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value as T[keyof T];
      setValue(field, value);
    };
  }, [setValue]);

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(prev => ({ ...prev, [field as string]: true }));
      
      // Validate on blur
      if (validators[field]) {
        const error = validators[field]!(values[field]);
        if (error) {
          setErrors(prev => ({ ...prev, [field as string]: error }));
        } else {
          clearError(field as string);
        }
      }
    };
  }, [validators, values, clearError]);

  const validate = useCallback((): ValidationResult => {
    return validateForm(values, validators);
  }, [values, validators]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate all fields
    const validation = validate();
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(allTouched);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      onSuccess?.();
      
      if (resetOnSubmit) {
        reset();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, onSuccess, onError, resetOnSubmit]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    hasChanges,
    touched,
    
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    
    handleChange,
    handleBlur,
    handleSubmit,
    
    reset,
    validate,
  };
}
