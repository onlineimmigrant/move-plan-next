/**
 * Standard Modal Types
 * 
 * Core TypeScript interfaces for the standardized modal system
 */

import React from 'react';

/**
 * Modal size presets
 */
export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Modal position for initial rendering (desktop only)
 */
export interface ModalPosition {
  x: number;
  y: number;
}

/**
 * Modal dimensions
 */
export interface ModalDimensions {
  width: number;
  height: number;
}

/**
 * Modal size configuration
 */
export interface ModalSizeConfig extends ModalDimensions {
  minWidth: number;
  minHeight: number;
}

/**
 * Tab definition for modal navigation
 */
export interface ModalTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  disabled?: boolean;
  hidden?: boolean;
}

/**
 * Badge configuration
 */
export interface ModalBadge {
  id: string;
  count: number | string;
  color?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  position?: 'tab' | 'header' | 'top-right' | 'top-left';
  animate?: boolean;
}

/**
 * Action button configuration
 */
export interface ModalAction {
  label: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}

/**
 * Footer alignment options
 */
export type FooterAlignment = 'left' | 'center' | 'right' | 'between';

/**
 * Standard Modal Container Props
 */
export interface StandardModalContainerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal is closed */
  onClose: () => void;
  
  /** Modal content */
  children: React.ReactNode;
  
  /** Modal size preset */
  size?: ModalSize;
  
  /** Enable dragging (desktop only) */
  enableDrag?: boolean;
  
  /** Enable resizing (desktop only) */
  enableResize?: boolean;
  
  /** Default position (desktop only) */
  defaultPosition?: ModalPosition;
  
  /** Default dimensions (overrides size preset) */
  defaultSize?: ModalDimensions;
  
  /** Minimum dimensions for resizing */
  minSize?: ModalDimensions;
  
  /** Custom className for modal container */
  className?: string;
  
  /** Z-index override */
  zIndex?: number;
  
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  
  /** Close on Escape key */
  closeOnEscape?: boolean;
  
  /** ARIA label for the modal */
  ariaLabel?: string;
  
  /** ARIA labelledby ID */
  ariaLabelledBy?: string;
}

/**
 * Standard Modal Header Props
 */
export interface StandardModalHeaderProps {
  /** Modal title */
  title: string | React.ReactNode;
  
  /** Optional subtitle */
  subtitle?: string;
  
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Icon color (theme color or custom) */
  iconColor?: string;
  
  /** Navigation tabs */
  tabs?: ModalTab[];
  
  /** Current active tab ID */
  currentTab?: string;
  
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
  
  /** Badges to display */
  badges?: ModalBadge[];
  
  /** Close handler */
  onClose: () => void;
  
  /** Show close button */
  showCloseButton?: boolean;
  
  /** Additional header actions */
  headerActions?: React.ReactNode;
  
  /** Enable drag handle (desktop only) */
  enableDragHandle?: boolean;
  
  /** Is mobile viewport */
  isMobile?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Show border bottom */
  borderBottom?: boolean;
}

/**
 * Standard Modal Body Props
 */
export interface StandardModalBodyProps {
  /** Body content */
  children: React.ReactNode;
  
  /** Remove default padding */
  noPadding?: boolean;
  
  /** Enable scrolling */
  scrollable?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** Empty state */
  isEmpty?: boolean;
  
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  
  /** Custom error component */
  errorComponent?: React.ReactNode;
  
  /** Custom empty component */
  emptyComponent?: React.ReactNode;
}

/**
 * Standard Modal Footer Props
 */
export interface StandardModalFooterProps {
  /** Primary action button */
  primaryAction?: ModalAction;
  
  /** Secondary action button */
  secondaryAction?: ModalAction;
  
  /** Tertiary actions (additional buttons) */
  tertiaryActions?: ModalAction[];
  
  /** Footer content alignment */
  align?: FooterAlignment;
  
  /** Custom className */
  className?: string;
  
  /** Show border top */
  borderTop?: boolean;
  
  /** Custom footer content (replaces actions) */
  children?: React.ReactNode;
}

/**
 * Modal state hook return type
 */
export interface UseModalStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Modal keyboard hook return type
 */
export interface UseModalKeyboardReturn {
  handleKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Modal focus trap hook return type
 */
export interface UseModalFocusReturn {
  modalRef: React.RefObject<HTMLDivElement>;
  previousFocusRef: React.MutableRefObject<HTMLElement | null>;
  restoreFocus: () => void;
}
