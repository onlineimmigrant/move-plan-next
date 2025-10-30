import { useState } from 'react';
import { useAuthTranslations } from '@/components/authenticationTranslationLogic/useAuthTranslations';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AuthFormData {
  username: string;
  email: string;
  password: string;
}

export function useAuthValidation() {
  const t = useAuthTranslations();

  const validateRegistration = (data: AuthFormData): ValidationResult => {
    const errors: string[] = [];

    // Check required fields
    if (!data.username.trim()) {
      errors.push(t.fillAllFields);
    }

    if (!data.email.trim()) {
      errors.push(t.fillAllFields);
    }

    if (!data.password) {
      errors.push(t.fillAllFields);
    }

    // Username validation
    if (data.username && data.username.length < 3) {
      errors.push(t.usernameTooShort);
    }

    // Email validation
    if (data.email && !isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    if (data.password) {
      if (data.password.length < 8) {
        errors.push(t.passwordTooShort);
      }

      // Check for at least one uppercase letter
      if (!/[A-Z]/.test(data.password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      // Check for at least one lowercase letter
      if (!/[a-z]/.test(data.password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      // Check for at least one number
      if (!/\d/.test(data.password)) {
        errors.push('Password must contain at least one number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateLogin = (email: string, password: string): ValidationResult => {
    const errors: string[] = [];

    if (!email.trim() || !password) {
      errors.push(t.fillAllFields);
    }

    if (email && !isValidEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validatePasswordReset = (email: string): ValidationResult => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push(t.fillAllFields);
    }

    if (email && !isValidEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    validateRegistration,
    validateLogin,
    validatePasswordReset
  };
}

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
