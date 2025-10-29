/**
 * Validation Utilities
 * Shared validation functions for AI model forms
 */

import type { AIFieldErrors, AIModelFormData, AIModel } from '../types';

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a single field based on field name and value
 * @param field - Field name to validate
 * @param value - Value to validate
 * @returns Error message or null if valid
 */
export const validateField = (field: string, value: any): string | null => {
  switch(field) {
    case 'name':
      if (!value || !value.trim()) return 'Model name is required';
      if (value.trim().length < 2) return 'Model name must be at least 2 characters';
      if (value.trim().length > 100) return 'Model name must be less than 100 characters';
      return null;
    
    case 'api_key':
      if (!value || !value.trim()) return 'API key is required';
      if (value.trim().length < 10) return 'API key seems too short (minimum 10 characters)';
      return null;
    
    case 'endpoint':
      if (!value || !value.trim()) return 'Endpoint URL is required';
      if (!/^https?:\/\/.+/.test(value)) return 'Must be a valid URL (http:// or https://)';
      return null;
    
    case 'max_tokens':
      const num = parseInt(value);
      if (isNaN(num)) return 'Must be a number';
      if (num < 1) return 'Must be at least 1';
      if (num > 100000) return 'Maximum is 100,000 tokens';
      return null;
    
    case 'icon':
      if (value && value.trim()) {
        if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp|ico)(\?.*)?$/i.test(value)) {
          return 'Must be a valid image URL (.jpg, .png, .svg, etc.)';
        }
      }
      return null;
    
    case 'system_message':
      if (value && value.length > 5000) {
        return 'System message must be less than 5000 characters';
      }
      return null;
    
    case 'role':
      if (value && value.length > 100) {
        return 'Role must be less than 100 characters';
      }
      return null;
    
    default:
      return null;
  }
};

/**
 * Validate an entire form/model
 * @param data - Form data or model to validate
 * @returns Object containing validation errors
 */
export const validateForm = (data: Partial<AIModelFormData> | Partial<AIModel>): AIFieldErrors => {
  const errors: AIFieldErrors = {};
  
  // Required fields
  const requiredFields = ['name', 'api_key', 'endpoint', 'max_tokens'];
  
  requiredFields.forEach(field => {
    const error = validateField(field, data[field as keyof typeof data]);
    if (error) errors[field] = error;
  });
  
  // Optional fields
  const optionalFields = ['icon', 'system_message', 'role'];
  
  optionalFields.forEach(field => {
    const value = data[field as keyof typeof data];
    if (value) {
      const error = validateField(field, value);
      if (error) errors[field] = error;
    }
  });
  
  return errors;
};

/**
 * Check if form has any errors
 * @param errors - Field errors object
 * @returns True if there are any errors
 */
export const hasErrors = (errors: AIFieldErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Check if required fields are filled
 * @param data - Form data to check
 * @returns True if all required fields have values
 */
export const hasRequiredFields = (data: Partial<AIModelFormData>): boolean => {
  return !!(
    data.name?.trim() &&
    data.api_key?.trim() &&
    data.endpoint?.trim() &&
    data.max_tokens
  );
};

/**
 * Check if form is valid (has required fields and no errors)
 * @param data - Form data to validate
 * @returns True if form is valid
 */
export const isFormValid = (data: Partial<AIModelFormData>): boolean => {
  if (!hasRequiredFields(data)) return false;
  const errors = validateForm(data);
  return !hasErrors(errors);
};

/**
 * Sanitize form data before submission
 * @param data - Form data to sanitize
 * @returns Sanitized form data
 */
export const sanitizeFormData = (data: AIModelFormData): AIModelFormData => {
  return {
    ...data,
    name: data.name.trim(),
    api_key: data.api_key.trim(),
    endpoint: data.endpoint.trim(),
    system_message: data.system_message.trim(),
    icon: data.icon.trim() || '',
    role: data.role?.trim() || null,
  };
};
