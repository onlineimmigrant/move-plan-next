/**
 * Authentication hooks for LoginRegistration components
 */

export { useLogin } from './useLogin';
export { useRegistration } from './useRegistration';
export { useAuthValidation } from './useAuthValidation';
export { useLogout } from './useLogout';
export { useReturnUrl, saveReturnUrl, getReturnUrl, clearReturnUrl } from './useReturnUrl';
export type { LoginFormData } from './useLogin';
export type { AuthFormData, ValidationResult } from './useAuthValidation';
