/**
 * Modal Animation Utilities
 * 
 * Animation variants and transition configurations
 */

import { ANIMATION_DURATION } from './modalConstants';

/**
 * Framer Motion variants for modal backdrop
 */
export const backdropVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.fast / 1000,
    },
  },
} as const;

/**
 * Framer Motion variants for modal content (fade + scale)
 */
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: [0.4, 0, 0.2, 1], // easeOut cubic-bezier
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast / 1000,
      ease: [0.4, 0, 1, 1], // easeIn cubic-bezier
    },
  },
} as const;

/**
 * Framer Motion variants for modal content (slide from top)
 */
export const slideFromTopVariants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: [0.4, 0, 0.2, 1], // easeOut cubic-bezier
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: ANIMATION_DURATION.fast / 1000,
      ease: [0.4, 0, 1, 1], // easeIn cubic-bezier
    },
  },
} as const;

/**
 * Framer Motion variants for mobile modal (slide from bottom)
 */
export const mobileSlideVariants = {
  hidden: {
    opacity: 0,
    y: '100%',
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: [0.4, 0, 0.2, 1], // easeOut cubic-bezier
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: ANIMATION_DURATION.normal / 1000,
      ease: [0.4, 0, 1, 1], // easeIn cubic-bezier
    },
  },
} as const;

/**
 * CSS class for smooth transitions
 */
export const smoothTransition = 'transition-all duration-200 ease-in-out';

/**
 * Badge animation classes
 */
export const badgePulseAnimation = 'animate-pulse';
export const badgeScaleAnimation = 'hover:scale-110 transition-transform';
