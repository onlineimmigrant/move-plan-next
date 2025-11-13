/**
 * Modal Constants
 * 
 * Centralized constants for modal system
 */

import { ModalSizeConfig } from '../types';

/**
 * Z-index values for modal system
 */
export const MODAL_Z_INDEX = {
  backdrop: 10000,
  modal: 10001,
  dropdown: 10002,
  tooltip: 10003,
} as const;

/**
 * Size presets for modals (matching MeetingsAdminModal standards)
 */
export const MODAL_SIZE_PRESETS: Record<string, ModalSizeConfig> = {
  small: {
    width: 480,
    height: 600,
    minWidth: 320,
    minHeight: 400,
  },
  medium: {
    width: 768,
    height: 700,
    minWidth: 480,
    minHeight: 500,
  },
  large: {
    width: 1120,
    height: 900,
    minWidth: 800,
    minHeight: 700,
  },
  xlarge: {
    width: 1400,
    height: 1000,
    minWidth: 800,
    minHeight: 700,
  },
} as const;

/**
 * Mobile breakpoint (matches Tailwind sm:)
 */
export const MOBILE_BREAKPOINT = 640;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

/**
 * Default modal spacing
 */
export const MODAL_SPACING = {
  headerPadding: '1rem 1.5rem',
  bodyPadding: '1.5rem',
  footerPadding: '1rem 1.5rem',
  mobileHeaderPadding: '0.75rem 1rem',
  mobileBodyPadding: '1rem',
  mobileFooterPadding: '0.75rem 1rem',
} as const;

/**
 * Glass morphism styles
 */
export const GLASS_MORPHISM_STYLES = {
  light: 'bg-white/50 backdrop-blur-2xl',
  dark: 'dark:bg-gray-900/50 dark:backdrop-blur-2xl',
  border: 'border border-white/20 dark:border-white/10',
  shadow: 'shadow-2xl',
  rounded: 'rounded-2xl',
} as const;

/**
 * Backdrop styles
 */
export const BACKDROP_STYLES = {
  base: 'bg-black/10 backdrop-blur-[2px]',
  animation: 'transition-opacity duration-200',
} as const;
