/**
 * Shared AI Model Validation Hook
 * Provides field-level and form-level validation state management
 */

import { useState, useCallback } from 'react';
import { AIFieldErrors, AITouchedFields, AIModelFormData } from '../types';
import { validateField, validateForm, isFormValid } from '../utils';

interface UseAIModelValidationOptions {
  formData: AIModelFormData;
  onValidationChange?: (isValid: boolean) => void;
}

export function useAIModelValidation({ formData, onValidationChange }: UseAIModelValidationOptions) {
  const [fieldErrors, setFieldErrors] = useState<AIFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<AITouchedFields>({});

  /**
   * Validate a single field and update errors
   */
  const validateSingleField = useCallback((fieldName: keyof AIModelFormData, value: any) => {
    const error = validateField(fieldName, value);
    
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });

    return error;
  }, []);

  /**
   * Validate all fields in the form
   */
  const validateAllFields = useCallback(() => {
    const errors = validateForm(formData);
    setFieldErrors(errors);
    
    const valid = isFormValid(errors);
    onValidationChange?.(valid);
    
    return errors;
  }, [formData, onValidationChange]);

  /**
   * Mark a field as touched (for blur events)
   */
  const markFieldTouched = useCallback((fieldName: keyof AIModelFormData) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  /**
   * Mark all fields as touched (for form submission)
   */
  const markAllFieldsTouched = useCallback(() => {
    const allFields: AITouchedFields = {
      name: true,
      api_key: true,
      endpoint: true,
      max_tokens: true,
      icon: true,
      system_message: true,
      role: true,
      task: true,
      is_active: true
    };
    setTouchedFields(allFields);
  }, []);

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    setFieldErrors({});
    setTouchedFields({});
  }, []);

  /**
   * Check if form is currently valid
   */
  const checkIsValid = useCallback(() => {
    return isFormValid(fieldErrors);
  }, [fieldErrors]);

  /**
   * Get error for specific field (only if touched)
   */
  const getFieldError = useCallback((fieldName: keyof AIModelFormData) => {
    return touchedFields[fieldName] ? fieldErrors[fieldName] : undefined;
  }, [fieldErrors, touchedFields]);

  return {
    fieldErrors,
    touchedFields,
    validateSingleField,
    validateAllFields,
    markFieldTouched,
    markAllFieldsTouched,
    resetValidation,
    checkIsValid,
    getFieldError
  };
}
