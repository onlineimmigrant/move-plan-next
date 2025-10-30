/**
 * Type definitions for LoginRegistration components
 */

export interface LoginFormProps {
  onShowPrivacy?: () => void;
  onShowTerms?: () => void;
  onSuccess?: () => void;
  redirectUrl?: string;
  onRegisterClick?: () => void;
}

export interface RegisterFormProps {
  isFreeTrial?: boolean;
  onSuccess?: () => void;
  redirectUrl?: string;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export interface AuthCardProps {
  children: React.ReactNode;
  showLogo?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  title?: string;
  isWide?: boolean;
}

export interface PrivacyProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TermsProps {
  isOpen: boolean;
  onClose: () => void;
}
