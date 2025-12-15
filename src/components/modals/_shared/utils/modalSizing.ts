/**
 * Modal Sizing Utilities
 * 
 * Functions for calculating modal sizes and positions
 */

import { ModalSize, ModalDimensions, ModalPosition, ModalSizeConfig } from '../types';
import { MODAL_SIZE_PRESETS, MOBILE_BREAKPOINT } from './modalConstants';

/**
 * Check if current viewport is mobile
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Get size configuration for a modal size preset
 */
export const getModalSizeConfig = (size: ModalSize = 'large'): ModalSizeConfig => {
  return MODAL_SIZE_PRESETS[size] || MODAL_SIZE_PRESETS.large;
};

/**
 * Calculate centered position for a modal
 * For fixed positioning modals, always center in viewport (no scroll offset needed)
 */
export const getCenteredPosition = (dimensions: ModalDimensions, includeScrollOffset: boolean = false): ModalPosition => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  const x = Math.max(0, (window.innerWidth - dimensions.width) / 2);
  const y = Math.max(0, (window.innerHeight - dimensions.height) / 2);
  
  // Note: For fixed positioning (used in DraggableWrapper), scroll offset is NOT needed
  // because fixed elements are positioned relative to viewport, not document
  // The includeScrollOffset parameter is kept for backward compatibility but not used

  return { x, y };
};

/**
 * Get default position for modal based on size
 */
export const getDefaultPosition = (
  size: ModalSize = 'large',
  customDimensions?: ModalDimensions,
  includeScrollOffset: boolean = false
): ModalPosition => {
  const dimensions = customDimensions || getModalSizeConfig(size);
  return getCenteredPosition(dimensions, includeScrollOffset);
};

/**
 * Calculate responsive dimensions
 * Mobile: full viewport height with 10vh top margin
 * Desktop: preset dimensions
 */
export const getResponsiveDimensions = (
  size: ModalSize = 'large',
  customDimensions?: ModalDimensions
): ModalDimensions => {
  if (isMobileViewport()) {
    return {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight * 0.9 : 0,
    };
  }

  return customDimensions || getModalSizeConfig(size);
};

/**
 * Clamp dimensions to min/max constraints
 */
export const clampDimensions = (
  dimensions: ModalDimensions,
  minSize: ModalDimensions,
  maxSize?: ModalDimensions
): ModalDimensions => {
  let { width, height } = dimensions;

  // Apply minimum constraints
  width = Math.max(width, minSize.width);
  height = Math.max(height, minSize.height);

  // Apply maximum constraints if provided
  if (maxSize) {
    width = Math.min(width, maxSize.width);
    height = Math.min(height, maxSize.height);
  }

  return { width, height };
};

/**
 * Get bounds for draggable modal (keeps it within viewport)
 */
export const getDraggableBounds = (): string => {
  // Allow some overflow but keep header visible
  return 'parent';
};

/**
 * Calculate maximum size based on viewport
 */
export const getMaxModalSize = (): ModalDimensions => {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 };
  }

  return {
    width: window.innerWidth - 40, // 20px margin on each side
    height: window.innerHeight - 40,
  };
};
